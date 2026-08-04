import { initAudioPlayers } from "./audio-player.js";
import {
  enhancePage,
  initEffects,
  requestConnectorUpdate,
  requestMarqueeUpdate,
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

const initTextIndex = (scope) => {
  const select = scope.querySelector(".text-index-select");
  const index = scope.querySelector(".text-index-list");
  const scrollViewport = scope.querySelector(".text-content-scroll");
  const views = Array.from(scope.querySelectorAll("[data-text-view]"));
  if (!select || !index || !scrollViewport || !views.length) {
    return;
  }

  const scrollbar = scope.querySelector(".text-scrollbar");
  const scrollTrack = scrollbar?.querySelector(".text-scrollbar__track");
  const scrollThumb = scrollbar?.querySelector(".text-scrollbar__thumb");
  const scrollUp = scrollbar?.querySelector(".text-scrollbar__button--up");
  const scrollDown = scrollbar?.querySelector(".text-scrollbar__button--down");
  let thumbHeight = 0;

  const updateScrollbar = () => {
    if (!scrollbar || !scrollTrack || !scrollThumb) {
      return;
    }

    const scopeRect = scope.getBoundingClientRect();
    const viewportRect = scrollViewport.getBoundingClientRect();
    const viewportHeight = scrollViewport.clientHeight;
    let maxScroll = scrollViewport.scrollHeight - viewportHeight;
    const hasScrollbar = maxScroll > 1;

    scrollbar.style.top = `${viewportRect.top - scopeRect.top}px`;
    scrollbar.style.height = `${viewportHeight}px`;
    scrollViewport.classList.toggle("has-scrollbar", hasScrollbar);
    scrollbar.hidden = !hasScrollbar;
    if (scrollbar.hidden) {
      return;
    }

    maxScroll = scrollViewport.scrollHeight - viewportHeight;

    if (scrollUp && scrollDown) {
      scrollUp.disabled = scrollViewport.scrollTop <= 1;
      scrollDown.disabled = scrollViewport.scrollTop >= maxScroll - 1;
    }

    const trackHeight = scrollTrack.clientHeight;
    thumbHeight = Math.min(
      trackHeight,
      Math.max(
        28,
        Math.round((viewportHeight / scrollViewport.scrollHeight) * trackHeight)
      )
    );
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const thumbTop = maxScroll
      ? (scrollViewport.scrollTop / maxScroll) * maxThumbTop
      : 0;

    scrollThumb.style.height = `${thumbHeight}px`;
    scrollThumb.style.transform = `translateY(${thumbTop}px)`;
    scrollTrack.setAttribute(
      "aria-valuenow",
      String(Math.round((scrollViewport.scrollTop / maxScroll) * 100))
    );
  };

  scrollViewport.addEventListener("scroll", updateScrollbar, { passive: true });
  scope.addEventListener(
    "toggle",
    () => window.requestAnimationFrame(updateScrollbar),
    true
  );

  if (scrollbar && scrollTrack && scrollThumb) {
    let pointerStart = 0;
    let scrollStart = 0;

    scrollThumb.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerStart = event.clientY;
      scrollStart = scrollViewport.scrollTop;
      scrollThumb.setPointerCapture(event.pointerId);
    });

    scrollThumb.addEventListener("pointermove", (event) => {
      if (!scrollThumb.hasPointerCapture(event.pointerId)) {
        return;
      }
      const maxScroll = scrollViewport.scrollHeight - scrollViewport.clientHeight;
      const maxThumbTop = scrollTrack.clientHeight - thumbHeight;
      if (maxThumbTop <= 0) {
        return;
      }
      scrollViewport.scrollTop =
        scrollStart + ((event.clientY - pointerStart) / maxThumbTop) * maxScroll;
    });

    scrollTrack.addEventListener("pointerdown", (event) => {
      if (event.target === scrollThumb) {
        return;
      }
      const trackRect = scrollTrack.getBoundingClientRect();
      const maxThumbTop = scrollTrack.clientHeight - thumbHeight;
      if (maxThumbTop <= 0) {
        return;
      }
      const ratio = Math.max(
        0,
        Math.min(1, (event.clientY - trackRect.top - thumbHeight / 2) / maxThumbTop)
      );
      scrollViewport.scrollTop =
        ratio * (scrollViewport.scrollHeight - scrollViewport.clientHeight);
    });

    scrollTrack.addEventListener("keydown", (event) => {
      const scrollStep = 48;
      const pageStep = scrollViewport.clientHeight * 0.85;
      const positions = {
        ArrowUp: scrollViewport.scrollTop - scrollStep,
        ArrowDown: scrollViewport.scrollTop + scrollStep,
        PageUp: scrollViewport.scrollTop - pageStep,
        PageDown: scrollViewport.scrollTop + pageStep,
        Home: 0,
        End: scrollViewport.scrollHeight,
      };
      if (event.key in positions) {
        event.preventDefault();
        scrollViewport.scrollTop = positions[event.key];
      }
    });

    scrollUp?.addEventListener("click", () => {
      scrollViewport.scrollBy({ top: -48 });
    });

    scrollDown?.addEventListener("click", () => {
      scrollViewport.scrollBy({ top: 48 });
    });
  }

  const resizeObserver = new ResizeObserver(updateScrollbar);
  resizeObserver.observe(scrollViewport);

  const scrollTo = (target) => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    scrollViewport.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    target?.focus?.({ preventScroll: true });
  };

  const showView = (value, { move = true } = {}) => {
    const isIndex = value === "indice";
    index.hidden = !isIndex;
    views.forEach((view) => {
      view.hidden = view.dataset.textView !== value;
    });
    select.value = value;

    const target = isIndex
      ? index
      : scope.querySelector(`[data-text-heading='${value}']`);
    window.requestAnimationFrame(() => {
      requestMarqueeUpdate();
      requestConnectorUpdate();
      updateScrollbar();
      if (move) {
        scrollTo(target);
      }
    });
  };

  index.addEventListener("click", (event) => {
    const item = event.target.closest("[data-text-value]");
    if (item) {
      showView(item.dataset.textValue);
    }
  });

  select.addEventListener("change", () => {
    showView(select.value);
  });

  showView(select.value, { move: false });
};

const initSectionReset = (scope) => {
  const title = scope.querySelector(
    "[data-connector-target] .section-title"
  );
  if (!title) {
    return;
  }

  title.classList.add("section-title--reset");
  title.setAttribute("role", "button");
  title.setAttribute("tabindex", "0");
  title.setAttribute(
    "aria-label",
    `Volver a la vista inicial de ${title.textContent.trim()}`
  );

  const resetView = () => {
    const select = scope.querySelector(".text-index-select");
    if (select) {
      select.value = "indice";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  title.addEventListener("click", resetView);
  title.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetView();
    }
  });
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
      initTextIndex(container);
      initSectionReset(container);
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
