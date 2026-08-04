import { initAudioPlayers } from "./audio-player.js";
import {
  enhancePage,
  initEffects,
  requestConnectorUpdate,
} from "./effects.js";
import { initNavigation } from "./navigation.js";
import { createPageRouter } from "./router.js";
import { initLampIndicator, initTheme } from "./theme.js";

const initCurrentDate = () => {
  const dateElement = document.querySelector("[data-current-date]");
  if (!dateElement) {
    return;
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  dateElement.textContent = `${day}/${month}/${year}`;
  dateElement.dateTime = `${year}-${month}-${day}`;
};

const initApp = () => {
  initCurrentDate();
  initLampIndicator();
  initTheme();
  initEffects();
  enhancePage(document);

  const router = createPageRouter({
    onPageReady: (container) => {
      initAudioPlayers(container);
      enhancePage(container);
    },
  });

  initNavigation({
    onNavigate: (pageId) => {
      router.load(pageId);
      requestConnectorUpdate();
    },
  });
};

if (typeof document !== "undefined") {
  initApp();
}
