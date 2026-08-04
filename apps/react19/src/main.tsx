import { createRoot } from "react-dom/client";

import { App } from "./App";
import { mountStatsPanel } from "./lib/statsPanel";

const statsContainer = document.getElementById("stats");
if (!statsContainer) throw new Error("#stats is missing");
mountStatsPanel(statsContainer);

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing");
// No StrictMode: its double-invoked renders would only add noise to the counters.
createRoot(container).render(<App />);
