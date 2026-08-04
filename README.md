# A render loop nobody's guard catches

**Live demos: <https://vdustr.github.io/demo-render-loop-starvation/>**

One line in a small floating widget starts a self-sustaining re-render loop, paced by
`requestAnimationFrame`. Every renderer tested runs it happily — no error, no jank, and, measured,
**no warning from any framework**: none of their runaway-update guards is looking for a loop that
only turns once per frame.

What it costs depends entirely on the renderer underneath:

| Renderer | Consequence |
| --- | --- |
| Vue 3, Svelte 5, React in legacy sync mode | wasted work — ~60 renders a second, forever, and nothing breaks |
| React with `createRoot` (concurrent) | a screen **deadlocks permanently**: spinner forever, idle network tab, no error, reload is the only escape |

So this is not "a React bug with a React fix". It is an ordinary feedback-loop defect whose blast
radius happens to be enormous on a preemptive scheduler — and React is the one shipping preemptive
scheduling in production today, which is why the demos lean on it.

The pattern is de-identified from a production single-page app, where it arrived as user reports of
"the page just keeps loading" on deep links. Everything below is measured, not argued.

## How the waste turns into a deadlock

1. A positioning controller wants to re-render its consumer when the element it tracks changes.
   It decides "changed" by comparing the value its `ref` callback was called with, and it answers
   by forcing a render (through `requestAnimationFrame`).
2. Component libraries compose refs and create a fresh ref callback on every render. React then
   behaves exactly as specified: when a ref callback's identity changes, it calls the old one with
   `null` and the new one with the node. So the ref is re-attached on **every commit**, even though
   the DOM node never changed.
3. Both legs of that re-attach (`null`, then the same node) miss the identity guard, so every
   commit schedules another render, which produces another commit. `requestAnimationFrame` does
   not break the loop — it only paces it at one render per frame, which is why it looks harmless.
4. Now suppose any `Suspense` boundary suspends **before its first commit** (a deep link that
   renders a data-gated screen immediately). When its promise resolves, React schedules a *retry*
   render. Retry is the lowest priority React has, and React deliberately does not expire it, so
   it has no starvation escape hatch.
5. Every retry render is interrupted by the next frame's update and restarted from the root. If
   the subtree takes longer to render than the gap between updates, it never finishes.
6. The subtree therefore never commits, so **its effects never run**. Anything that starts in an
   effect never starts — including data fetching in libraries that subscribe on mount (React
   Query subscribes its observer in a commit effect). The screen sits on a spinner with **zero
   requests in flight** and no error, and only a reload recovers.

The missing request is a *consequence*, not the cause. That inverted intuition is most of why
this is hard to find.

## Why it is hard to catch

- One tiny render per frame: no dropped frames, no visible CPU burn.
- **No framework says anything.** Measured: 0 warnings and 0 errors in every case below.
- No error, no rejected promise, no failed request — nothing to search for.
- The network tab is idle, which reads as "a request is hanging", but nothing was ever sent.
- The promise the boundary suspended on has already resolved; the data is sitting in the cache.
- It is a race, so it reproduces intermittently — roughly 1 in 2 to 1 in 4 loads in the original
  app, and only on direct/deep-link loads. Navigating to the same screen by clicking never
  reproduced it, because then the boundary is not suspending during the initial mount storm.
- **A background tab cannot reproduce it.** Hidden tabs get no `requestAnimationFrame`, so the
  loop simply stops. Measure in a foreground tab only — this bit us three times.

## Layout

| App | Port | What it is for |
| --- | --- | --- |
| `apps/react19` | 5180 | The bug, the fix, and a control where the update stream is a plain `setState` loop instead of the ref bug |
| `apps/react18` | 5181 | Same thing on React 18, with a switch between `createRoot` and legacy `ReactDOM.render` |
| `apps/vue3` | 5182 | Same update stream, Vue's async `setup` under `<Suspense>` |
| `apps/svelte5` | 5183 | Same update stream, Svelte's `{#await}` gate |

```sh
pnpm install
pnpm dev:react19   # or dev:react18 / dev:vue3 / dev:svelte5
```

Every app paints its own counters at the top of the page (plain DOM, see below) and exposes them
on `window.__stats`. Each link in a page is a fresh load, because the deadlock needs a boundary
that suspends before its first commit.

## What is React's, and what is not

All measured on the same machine, Chrome, **foreground tab**, `nodes=8000`. "Storm" is the
permanent ~60 Hz update stream. "Commits" is whether the data-gated subtree ever committed.

| Renderer | Storm running | Update stream source | Subtree commits | Follow-up request | Warnings |
| --- | --- | --- | --- | --- | --- |
| React 19 `createRoot` | 60/s | ref re-attach (the real bug) | **0 of 504 attempts** | **NEVER ISSUED** | 0 / 0 |
| React 19 `createRoot` | 60/s | plain `setState` per frame | **0 of 471 attempts** | **NEVER ISSUED** | 0 / 0 |
| React 19 `createRoot`, loop fixed | 0/s | — | 1 of 3 attempts | 589 ms | 0 / 0 |
| React 19 `createRoot`, no loop | 0/s | — | 1 of 3 attempts | 535 ms | 0 / 0 |
| React 18 `createRoot` | 60/s | ref re-attach | **0 of 462 attempts** | **NEVER ISSUED** | 0 / 0 |
| React 18 `ReactDOM.render` (legacy sync) | 60/s | ref re-attach | 1 of 2 attempts | 550 ms | 0 / 0 |
| Vue 3, async `setup` + `<Suspense>` | 60/s | reactive write per frame | 1 of 1 | 810 ms | 0 / 0 |
| Svelte 5, `{#await}` | 60/s | `$state` write per frame | 1 of 1 | 570 ms | 0 / 0 |

> The table above was measured on **development** builds at `nodes=8000` with cheap leaves. The
> deployed site defaults to `nodes=4000&work=4000` instead, because a production build renders far
> faster per component and needs a heavier subtree to lose the race. Same outcomes, re-verified on
> the production build: React 19 and React 18 `createRoot` deadlock, React 18 `ReactDOM.render`,
> Vue 3 and Svelte 5 stay healthy while running the identical 60Hz stream.


Three things fall out of that table.

**The loop is not React's.** "Respond to a lifecycle callback by triggering the same lifecycle"
is a universal feedback-loop bug. Vue and Svelte reproduce the 60 Hz waste happily.

Read the Vue and Svelte rows carefully, though: **nothing went wrong there.** The screen painted,
the follow-up request went out, and the only cost was wasted work. That is not those renderers
handling the bug better — they did not notice it either (0 warnings, same as React). They simply
have no lowest-priority retry lane for the update stream to starve, so the same defect can only
express itself as burnt CPU. Which is exactly why a bug like this survives in production: without
a Suspense boundary to trip over, it is invisible.

Two caveats on how fair that comparison is. The Vue and Svelte apps run the *plain `setState` per
frame* variant, so they test the **consequence** (does a 60 Hz stream break an async-gated screen?)
and not whether the original ref misuse is even expressible there. Vue re-invokes function refs
when their identity changes, so it probably is; Svelte's actions and `bind:this` do not churn per
render, so it probably is not — neither claim is measured here. And nothing in this repo quantifies
the waste itself: no CPU, no input latency, no battery. The storm component here is deliberately
tiny, while the one in the original app re-rendered a button, a badge, a wave animation and a
CSS-in-JS style computation every frame.

**The deadlock is concurrent React's.** Same loop, same version, same app — `createRoot` deadlocks
and `ReactDOM.render` does not. The ingredients are: priority lanes, renders that get thrown away
and restarted from the root, a retry lane that sits at the bottom and never expires, and a data
layer that only starts fetching once a commit runs an effect. Remove any one and the symptom
degrades from "stuck forever, no network activity" to "wastes a render every frame".

**The ref bug is not required.** Swapping it for a plain `setState` in a `requestAnimationFrame`
loop deadlocks identically. Any unstoppable ~60 Hz default-priority update does it.

## Nobody's circuit breaker fires

Several renderers ship a guard for runaway updates:

| Renderer | Guard | Fired here? |
| --- | --- | --- |
| React | `Too many re-renders` | No — it only covers synchronous render-phase update loops |
| Vue 3 | `Maximum recursive updates exceeded` (~100 recursive updates in one flush) | No |
| Svelte 5 | `effect_update_depth_exceeded` | No |
| Browser | `ResizeObserver loop completed with undelivered notifications` | Not applicable |

They all detect *recursion inside one tick*. A loop paced by `requestAnimationFrame` is not
recursion: each turn is one legitimate update, one frame apart, and every guard is happy. That is
the gap this bug lives in, and it is a gap in all of them — not a React-specific omission.

Angular is the obvious missing row. Its zone-based change detection is patched into `rAF`, so the
same loop would run change detection every frame; whether its dev-mode
`ExpressionChangedAfterItHasBeenChecked` check notices is untested here, and its async-gating
story (`@defer`, resolvers) does not map as directly. It was left out for toolchain weight, not
because the answer is known.

## The fix

```diff
   function scheduleNotify() {
     cancelAnimationFrame(rafId);
     rafId = requestAnimationFrame(() => {
+      // A ref re-attach detaches and re-attaches within one frame, so by the time
+      // this callback runs the target is back to what we last notified about.
+      // Only a real change gets through.
+      if (elState.target === notifiedTarget) return;
+      notifiedTarget = elState.target;
       notify?.();
     });
   }
```

`requestAnimationFrame` was already there, but it was only a pacer. This turns it into a real
debounce: coalesce everything that happened during the frame, then compare against what was last
announced. Genuine element changes still notify; a detach/attach pair does not.

In the original app this took commits from 115 per 2 s down to 5 per 2 s, and the stall went from
"1 in 2 loads" to 10 clean loads out of 10 with the suspense code untouched.

## Who is to blame

- **React** — behaving to spec. A ref callback whose identity changes is a new ref: detach the
  old, attach the new. Nothing to fix here.
- **The component library** — creating a new composed ref callback per render is wasteful but
  legal, and long-standing. It cannot know that a consumer will re-render in response to being
  re-attached.
- **The controller (this bug)** — two mistakes stacked:
  1. treating "my ref was called with a different value" as "the element changed"; a detach and
     re-attach of the same node is not a change;
  2. answering a ref call with a *render*, so the answer recreates the question.

So it is not merely a design conflict. Any code that re-renders in response to a ref attach must
be idempotent with respect to re-attaches, and this was not.

The second-order lesson is about the Suspense side: a subtree whose first paint depends on a
suspense-style hook has only the lowest-priority lane to get itself committed. That is fine in a
quiet app and fatal next to a permanent update stream. Gating a screen on non-suspense queries
(render nothing until the data is there) removes the dependency on that lane, and is worth
considering as defense in depth even after the loop is fixed.

## Evidence from the original app

Measured in a foreground tab, production build, real backend:

| Observation | Value |
| --- | --- |
| React commits during the stall | 115 per 2 s, median gap **16.7 ms** (one animation frame) |
| `ref` calls | 150 `null` / 150 node, strictly alternating, one pair per commit |
| Suspended subtree | **3268 render attempts, 0 effects** — never committed |
| The two queries it suspended on | `success`, data present, promises resolved 6.8 s earlier |
| Queries pending, fetching, or in flight | **0** |
| Main thread | idle; `setTimeout(0)` latency 16 ms |
| Duration | 33 s / 56 s / 65 s / 78 s in repeat runs; 5 min in the first sighting, ended only by reload |
| Ablation: remove the suspense queries | 7/7 loads clean |
| Ablation: keep them, fix the rAF loop | **10/10 loads clean** |

## Notes on the instrumentation

The counters are painted with plain DOM, outside the framework, in every app. An earlier version
of the panel was a React component that re-rendered twice a second — and that alone starved a
heavy retry render. It is a good demonstration of the bug and a terrible measuring instrument.

`&nodes=N` sizes the data-gated subtree. The deadlock needs one retry render to outlast the gap
between the loop's updates (~16.7 ms); 8000 leaf nodes is comfortably past that, and it is not a
contrivance — any real screen with a header, a list and a form is well past React's ~5 ms yield
budget. Push it far higher (say 20000) and the page becomes so heavy that the loop starves itself
too, which is its own kind of interesting.
