import { initAudioPlayers } from "./audio-player.js";
import {
  enhancePage,
  initEffects,
  requestConnectorUpdate,
} from "./effects.js";
import { initNavigation } from "./navigation.js";
import { createPageRouter } from "./router.js";
import { initLampIndicator, initTheme } from "./theme.js";

const initApp = () => {
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
