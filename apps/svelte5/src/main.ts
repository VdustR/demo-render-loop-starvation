import { mount } from "svelte";

import App from "./App.svelte";
import { mountStatsPanel } from "./lib/statsPanel";

const statsContainer = document.getElementById("stats");
if (!statsContainer) throw new Error("#stats is missing");
mountStatsPanel(statsContainer);

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing");
mount(App, { target: container });
