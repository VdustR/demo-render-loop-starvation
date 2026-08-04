import { createApp } from "vue";

import App from "./App.vue";
import { mountStatsPanel } from "./lib/statsPanel";

const statsContainer = document.getElementById("stats");
if (!statsContainer) throw new Error("#stats is missing");
mountStatsPanel(statsContainer);

createApp(App).mount("#app");
