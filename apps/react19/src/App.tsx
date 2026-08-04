import { Suspense } from "react";

import { Fab } from "./components/Fab";
import { RafStorm } from "./components/RafStorm";
import { Panel } from "./components/Panel";
import { config } from "./lib/config";

const combinations: Array<{ label: string; storm: boolean; fix: boolean; expect: string }> = [
  { label: "loop on, unfixed", storm: true, fix: false, expect: "stalls (usually forever)" },
  { label: "loop on, fixed", storm: true, fix: true, expect: "healthy" },
  { label: "loop off, unfixed", storm: false, fix: false, expect: "healthy" },
];

const Links: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
    {combinations.map((combination) => {
      const active = combination.storm === config.storm && combination.fix === config.fix;
      const href = `?storm=${combination.storm ? "on" : "off"}&fix=${
        combination.fix ? "on" : "off"
      }&nodes=${config.nodes}`;
      return (
        <a
          key={combination.label}
          href={href}
          style={{
            font: "13px/1.4 system-ui, sans-serif",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #d9d9d9",
            background: active ? "#1677ff" : "#fff",
            color: active ? "#fff" : "#000",
            textDecoration: "none",
          }}
        >
          {combination.label} → {combination.expect}
        </a>
      );
    })}
  </div>
);

const App: React.FC = () => (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
    <h1 style={{ font: "700 20px/1.4 system-ui, sans-serif" }}>
      A 60fps render loop starves React&apos;s Suspense retry
    </h1>
    <p style={{ font: "14px/1.7 system-ui, sans-serif", maxWidth: 680 }}>
      Each link is a fresh load, because the deadlock needs a boundary that suspends before its
      first commit. Watch <code>panel commits</code> and{" "}
      <code>request started in effect</code>.
    </p>
    <Links />
    <Suspense
      fallback={
        <div
          style={{
            padding: 24,
            border: "1px dashed #d9d9d9",
            borderRadius: 8,
            font: "14px/1.6 system-ui, sans-serif",
          }}
        >
          Loading the panel… (this is the boundary&apos;s fallback)
        </div>
      }
    >
      <Panel />
    </Suspense>
    {!config.storm ? null : config.stormKind === "raf" ? <RafStorm /> : <Fab />}
  </div>
);

export { App };
