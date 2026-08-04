import type { Ref } from "react";

/**
 * Mimics what component libraries do when they merge a forwarded ref with an
 * internal one (antd does this through `rc-util`'s `composeRef`): the composed
 * callback is created fresh on every render.
 *
 * That is legal, and React then behaves exactly as specified — when a ref
 * callback's identity changes, it calls the previous one with `null` and the new
 * one with the node. So a component like this re-attaches its ref on *every*
 * commit, even though the DOM node never changed.
 *
 * Not memoizing is the point of this file. Wrapping it in `useCallback` would
 * hide the bug this repo is about, and would not match real libraries.
 */
function composeRef<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

export { composeRef };
