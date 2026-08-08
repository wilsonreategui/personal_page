const MARQUEE_GAP = 24;
// Desborde mínimo para que valga la pena mover el texto. Sin este margen, un
// par de píxeles de diferencia entre cómo mide el navegador la caja y cómo
// pinta el CSS su contenido bastaban para lanzar el marquee con todo visible.
const MARQUEE_MIN_OVERFLOW = 8;
// Duración a la que apunta cada sección al teclearse, sin importar su largo.
const TYPE_TARGET_MS = 900;
// Suelo para que un título corto siga viéndose teclear, y techo para que un
// bloque largo no se dispare.
const TYPE_MIN_CPS = 55;
const TYPE_MAX_CPS = 2200;
const TYPE_TICK_MS = 16;
// Contenedores que corren el marquee cuando su texto no entra. Cada uno debe
// tener dentro un .summary-clip que recorta y un .summary-move que se anima.
const MARQUEE_HOSTS = ".timeline-item summary, .text-index-control";
const GLITCH_CHARS = [
  "⟊",
  "⧖",
  "⧗",
  "⟡",
  "⋇",
  "⟜",
  "⧉",
  "⧠",
  "⥊",
  "⧙",
  "⋔",
  "⧜",
  "▚",
  "▞",
  "▟",
  "⟲",
  "⟿",
];
const GLITCH_STRINGS = [
  "⟊⧖⧗⟡ ⋇⟜⧉⧠⟜⋇ ⥊⧙⋔⧜ ⧖⟡",
  "⟜⋇⟜⧉⧠⟜⋇ ⥊",
  "[⋔⧜]",
  "▚▚▞▚▟▞▚▚▚▞▚▟",
  "⟜⧙⋔⧉ ⥊",
];

const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = () => Boolean(motionQuery?.matches);

let marqueeFrame = null;
let connectorFrame = null;
let glitchTimer = null;
let glitchActive = false;
let lastConnectorTarget = null;

const prepareMarqueeText = (text) => {
  if (text.dataset.prepared === "true") {
    return;
  }
  const content = document.createElement("span");
  content.className = "summary-content";
  content.innerHTML = text.innerHTML.trim();
  text.replaceChildren(content);
  text.dataset.prepared = "true";
};

// Las pausas de puntuación solo se aplican cuando el texto va letra a letra:
// en bloques largos se acumulaban y eran buena parte de la lentitud.
const punctuationPause = (character, charsPerSecond) => {
  if (charsPerSecond > 200) {
    return 0;
  }
  if (/[.!?]/.test(character)) {
    return 30;
  }
  return /[,;:]/.test(character) ? 15 : 0;
};

const updateMarquee = () => {
  document.querySelectorAll(MARQUEE_HOSTS).forEach((host) => {
    const text = host.querySelector(".summary-move");
    const clip = host.querySelector(".summary-clip");
    if (!text || !clip) {
      return;
    }

    prepareMarqueeText(text);
    const content = text.querySelector(".summary-content");
    if (!content) {
      return;
    }

    const overflow =
      content.getBoundingClientRect().width - clip.getBoundingClientRect().width;
    const isOverflowing = overflow > MARQUEE_MIN_OVERFLOW;
    host.classList.toggle("is-overflow", isOverflowing);
    if (isOverflowing) {
      text.style.setProperty(
        "--marquee-distance",
        `${overflow + MARQUEE_GAP}px`
      );
    } else {
      text.style.removeProperty("--marquee-distance");
    }
  });
};

export const requestMarqueeUpdate = () => {
  if (marqueeFrame !== null) {
    return;
  }
  marqueeFrame = window.requestAnimationFrame(() => {
    marqueeFrame = null;
    updateMarquee();
  });
};

const registerGlitchTargets = (scope = document) => {
  scope
    .querySelectorAll(".section-title, .arc, h1")
    .forEach((element) => element.classList.add("glitch-target"));
};

const collectGlitchTargets = () => {
  const targets = [];
  document.querySelectorAll(".summary-move").forEach((text) => {
    prepareMarqueeText(text);
    const content = text.querySelector(".summary-content");
    const overlay = text.closest(".summary-clip");
    if (content && overlay) {
      targets.push({ content, overlay });
    }
  });
  document.querySelectorAll(".glitch-target").forEach((element) => {
    targets.push({ content: element, overlay: element });
  });
  return targets;
};

const applyTemporaryGlitch = (root, intensity = 0.06) => {
  const originals = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const original = node.nodeValue;
    const characters = original.split("");
    const candidates = characters
      .map((character, index) => (character.trim() ? index : -1))
      .filter((index) => index >= 0);
    const changes = Math.min(
      candidates.length,
      Math.max(1, Math.floor(characters.length * intensity))
    );

    for (let index = 0; index < changes; index += 1) {
      const candidateIndex = Math.floor(Math.random() * candidates.length);
      const characterIndex = candidates.splice(candidateIndex, 1)[0];
      characters[characterIndex] =
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }

    originals.set(node, original);
    node.nodeValue = characters.join("");
  }

  return () => {
    originals.forEach((value, node) => {
      if (node.isConnected) {
        node.nodeValue = value;
      }
    });
  };
};

const scheduleGlitch = () => {
  window.clearTimeout(glitchTimer);
  if (prefersReducedMotion()) {
    glitchTimer = null;
    return;
  }

  const delay = 3000 + Math.random() ** 2.2 * 12000;
  glitchTimer = window.setTimeout(() => {
    const targets = collectGlitchTargets();
    if (!targets.length || glitchActive) {
      scheduleGlitch();
      return;
    }

    const { content, overlay } =
      targets[Math.floor(Math.random() * targets.length)];
    glitchActive = true;
    overlay.dataset.glitch =
      GLITCH_STRINGS[Math.floor(Math.random() * GLITCH_STRINGS.length)];
    overlay.classList.add("glitch-on");
    const restore = applyTemporaryGlitch(content);

    window.setTimeout(() => overlay.classList.remove("glitch-on"), 320);
    window.setTimeout(() => {
      restore();
      glitchActive = false;
      scheduleGlitch();
    }, 700);
  }, delay);
};

const collectTypewriterItems = (root) => {
  const items = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!node.nodeValue?.trim() || !node.parentElement) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (
            parent.closest("script, style, noscript") ||
            parent.closest("[hidden]") ||
            parent.closest("[data-typewriter-skip]") ||
            (parent.closest("details:not([open])") &&
              !parent.closest("summary")) ||
            (parent.closest("[aria-hidden='true']") &&
              !parent.closest("[data-typewriter-show]"))
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }

        if (node.nodeType === Node.ELEMENT_NODE && node.closest("[hidden]")) {
          return NodeFilter.FILTER_REJECT;
        }

        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.hasAttribute("data-typewriter-show")
        ) {
          const closedDetails = node.closest("details:not([open])");
          return closedDetails && !node.closest("summary")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) {
      items.push({ type: "text", node, text: node.nodeValue });
    } else {
      items.push({ type: "reveal", element: node });
    }
  }
  return items;
};

const startTypewriter = (scope = document) => {
  const sections = Array.from(
    scope.querySelectorAll("[data-typewriter-section]")
  );
  if (!sections.length) {
    return Promise.resolve();
  }

  if (prefersReducedMotion()) {
    sections.forEach((section) => section.classList.add("is-loaded"));
    return Promise.resolve();
  }

  document.documentElement.classList.add("typewriter-ready");
  const queue = sections
    .map((section) => {
      const items = collectTypewriterItems(section);
      const textItems = items.filter((item) => item.type === "text");
      const revealItems = items.filter((item) => item.type === "reveal");
      if (!textItems.length) {
        return null;
      }
      revealItems.forEach((item) =>
        item.element.classList.add("typewriter-hidden")
      );
      textItems.forEach((item) => {
        item.node.nodeValue = "";
      });
      const totalChars = textItems.reduce(
        (sum, item) => sum + item.text.length,
        0
      );
      return {
        section,
        items,
        textItems,
        revealItems,
        totalChars,
        // El conector apunta al centro del título, que se mueve mientras se
        // escribe: esta sección lo redibuja en cada tick para que aparezca con
        // la primera letra en vez de al final del render.
        hasConnector: Boolean(section.querySelector("[data-connector-target]")),
        // Todas las secciones apuntan a la misma duración, así que la velocidad
        // se deduce de su largo en vez de ser fija por carácter.
        charsPerSecond: Math.min(
          TYPE_MAX_CPS,
          Math.max(TYPE_MIN_CPS, (totalChars * 1000) / TYPE_TARGET_MS)
        ),
      };
    })
    .filter(Boolean);

  if (!queue.length) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let sectionIndex = 0;
    let itemIndex = 0;
    let charIndex = 0;
    let timer = null;
    let finished = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", completeAll);
      document.removeEventListener("pointerdown", completeAll);
    };

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      cleanup();
      resolve();
    };

    function completeAll() {
      queue.forEach((entry) => {
        entry.textItems.forEach((item) => {
          item.node.nodeValue = item.text;
        });
        entry.revealItems.forEach((item) =>
          item.element.classList.remove("typewriter-hidden")
        );
        entry.section.classList.remove("is-typing");
        entry.section.classList.add("is-loaded");
      });
      requestConnectorUpdate();
      finish();
    }

    const startSection = () => {
      const entry = queue[sectionIndex];
      if (!entry) {
        finish();
        return;
      }
      entry.section.classList.add("is-typing");
      itemIndex = 0;
      charIndex = 0;
      timer = window.setTimeout(typeNext, 120);
    };

    const finishSection = () => {
      const entry = queue[sectionIndex];
      entry.section.classList.remove("is-typing");
      entry.section.classList.add("is-loaded");
      sectionIndex += 1;
      if (sectionIndex >= queue.length) {
        finish();
      } else {
        timer = window.setTimeout(startSection, 120);
      }
    };

    const typeNext = () => {
      const entry = queue[sectionIndex];
      if (!entry) {
        finish();
        return;
      }

      // Los temporizadores del navegador no bajan de ~4ms, así que a una letra
      // por tick el texto largo se arrastraba. Se escriben tantas letras por
      // tick como haga falta para sostener el ritmo, y el intervalo se
      // recalcula a partir de ese lote para no desviarse.
      const perTick = Math.max(
        1,
        Math.round((entry.charsPerSecond * TYPE_TICK_MS) / 1000)
      );
      let pause = 0;

      for (let typed = 0; typed < perTick; typed += 1) {
        let item = entry.items[itemIndex];
        while (item?.type === "reveal") {
          item.element.classList.remove("typewriter-hidden");
          itemIndex += 1;
          item = entry.items[itemIndex];
        }
        if (!item) {
          finishSection();
          return;
        }

        const character = item.text.charAt(charIndex);
        item.node.nodeValue += character;
        charIndex += 1;
        if (charIndex >= item.text.length) {
          itemIndex += 1;
          charIndex = 0;
        }

        pause += punctuationPause(character, entry.charsPerSecond);
      }

      if (entry.hasConnector) {
        requestConnectorUpdate();
      }

      const interval = Math.round((perTick * 1000) / entry.charsPerSecond);
      // El titubeo solo se nota cuando va letra a letra; en lotes estorba.
      const jitter = perTick === 1 ? 0.75 + Math.random() * 0.5 : 1;
      timer = window.setTimeout(
        typeNext,
        Math.max(8, Math.round(interval * jitter)) + pause
      );
    };

    document.addEventListener("keydown", completeAll);
    document.addEventListener("pointerdown", completeAll);
    startSection();
  });
};

const updateMenuConnector = () => {
  const container = document.querySelector(".terminal-body");
  const svg = document.querySelector(".menu-connector");
  const pageContainer = document.querySelector("[data-page-container]");
  if (!container || !svg || !pageContainer) {
    return;
  }

  const activePage = document.documentElement.dataset.activePage;
  const target =
    pageContainer.querySelector(
      `[data-connector-target='${CSS.escape(activePage || "")}']`
    ) || pageContainer.querySelector("[data-connector-target]");
  if (!target) {
    svg.replaceChildren();
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetRect = (
    target.querySelector(".section-title") || target
  ).getBoundingClientRect();
  if (!containerRect.width) {
    return;
  }

  const targetKey = target.dataset.connectorTarget || activePage || "";
  let endX;
  let endY;
  if (targetRect.width && targetRect.height) {
    endX = Math.round(
      targetRect.left + targetRect.width / 2 - containerRect.left
    );
    endY = Math.round(
      targetRect.top + targetRect.height / 2 - containerRect.top - 14
    );
    lastConnectorTarget = { endX, endY, page: targetKey };
  } else if (lastConnectorTarget?.page === targetKey) {
    ({ endX, endY } = lastConnectorTarget);
  } else {
    svg.replaceChildren();
    return;
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const toggleRect = menuToggle?.getBoundingClientRect();
  const source =
    toggleRect?.width && toggleRect?.height
      ? menuToggle
      : document.querySelector(".name-menu__item.is-active");
  const sourceRect = source?.getBoundingClientRect();
  if (!sourceRect?.width || !sourceRect?.height) {
    svg.replaceChildren();
    return;
  }

  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  let pathData;

  if (isMobile) {
    const startX = Math.round(sourceRect.left - containerRect.left - 6);
    const startY = Math.round(
      sourceRect.top + sourceRect.height / 2 - containerRect.top
    );
    pathData = `M ${startX} ${startY} H ${endX} V ${endY}`;
  } else {
    const startX = Math.round(
      sourceRect.left + sourceRect.width / 2 - containerRect.left
    );
    const startY = Math.round(sourceRect.bottom - containerRect.top + 6);
    const deltaY = endY - startY;
    const drop = Math.max(12, Math.min(34, Math.abs(deltaY) * 0.4));
    const middleY = Math.round(startY + Math.sign(deltaY || 1) * drop);
    pathData = `M ${startX} ${startY} V ${middleY} H ${endX} V ${endY}`;
  }

  svg.setAttribute(
    "viewBox",
    `0 0 ${Math.round(containerRect.width)} ${Math.round(containerRect.height)}`
  );
  svg.replaceChildren();
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.append(path);
};

export const requestConnectorUpdate = () => {
  if (connectorFrame !== null) {
    return;
  }
  connectorFrame = window.requestAnimationFrame(() => {
    connectorFrame = null;
    updateMenuConnector();
  });
};

export const enhancePage = async (scope = document) => {
  registerGlitchTargets(scope);
  scope.querySelectorAll(".summary-move").forEach(prepareMarqueeText);
  // Se pide antes y después: el tecleo lo va corrigiendo tick a tick, pero si
  // no hay nada que escribir (movimiento reducido) esta es la única pasada.
  requestConnectorUpdate();
  await startTypewriter(scope);
  requestMarqueeUpdate();
  requestConnectorUpdate();
};

export const initEffects = () => {
  const terminalBody = document.querySelector(".terminal-body");
  if (terminalBody && window.ResizeObserver) {
    new ResizeObserver(requestConnectorUpdate).observe(terminalBody);
  }

  window.addEventListener("resize", () => {
    requestMarqueeUpdate();
    requestConnectorUpdate();
  });
  motionQuery?.addEventListener?.("change", scheduleGlitch);
  scheduleGlitch();
};
