import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { config } from "./lib/config";
import { mountStatsPanel } from "./lib/statsPanel";

const statsContainer = document.getElementById("stats");
if (!statsContainer) throw new Error("#stats is missing");
mountStatsPanel(statsContainer);

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing");

// No StrictMode: its double-invoked renders would only add noise to the counters.
if (config.legacy) {
  // The pre-concurrent renderer: no lanes, no priorities, and no render that can
  // be thrown away and restarted. This is the control for "does the deadlock
  // require concurrent rendering?".
  ReactDOM.render(<App />, container);
} else {
  createRoot(container).render(<App />);
}
