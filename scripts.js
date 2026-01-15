const MARQUEE_GAP = (() => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--marquee-gap")
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 24;
})();
let marqueeRaf = null;
const GLITCH_STRINGS = [
  "⟊⧖⧗⟡ ⋇⟜⧉⧠⟜⋇ ⥊⧙⋔⧜ ⧖⟡",
  "⟜⋇⟜⧉⧠⟜⋇ ⥊",
  "[⋔⧜]",
  "▚▚▞▚▟▞▚▚▚▞▚▟",
  "⟜⧙⋔⧉ ⥊",
  "⟲⟲⟿⟿⟲ ⟿⟲ ⟿⟿⟲",
  "⟡9: ⧗:",
  "[In⧉ursi⧜n 1]",
];
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
const GLITCH_MIN_DELAY = 3000;
const GLITCH_MAX_DELAY = 15000;
const GLITCH_DURATION = 320;
const GLITCH_CHAR_DURATION = 700;
const GLITCH_INITIAL_DELAY = 0;
const GLITCH_CORRUPT_AFTER = 45000;
const GLITCH_CORRUPT_CHANCE = 0.12;
const GLITCH_CORRUPT_INTENSITY = 0.1;
let glitchActive = false;
let glitchEnabled = false;
const glitchStart = performance.now();

const registerTitleGlitches = () => {
  document
    .querySelectorAll(".section-title, .project-title, .arc, h1")
    .forEach((element) => {
      element.classList.add("glitch-target");
    });
};

const collectGlitchTargets = () => {
  const targets = [];
  document.querySelectorAll(".summary-move").forEach((text) => {
    prepareMarqueeText(text);
    const content = text.querySelector(".summary-content");
    const clip = text.closest(".summary-clip");
    if (content && clip) {
      targets.push({ overlay: clip, content });
    }
  });
  document.querySelectorAll(".glitch-target").forEach((element) => {
    targets.push({ overlay: element, content: element });
  });
  return targets;
};

const randomDelayMs = () => {
  const spread = GLITCH_MAX_DELAY - GLITCH_MIN_DELAY;
  const skew = Math.random() ** 2.2;
  const jitter = (Math.random() - 0.5) * 1400;
  return Math.max(800, GLITCH_MIN_DELAY + spread * skew + jitter);
};

const prepareMarqueeText = (text) => {
  if (text.dataset.prepared === "true") {
    return;
  }
  const html = text.innerHTML.trim();
  const content = document.createElement("span");
  content.className = "summary-content";
  content.innerHTML = html;
  text.textContent = "";
  text.append(content);
  text.dataset.prepared = "true";
};

const collectTypewriterItems = (root) => {
  const items = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          const closedDetails = parent.closest("details:not([open])");
          if (closedDetails && !parent.closest("summary")) {
            return NodeFilter.FILTER_REJECT;
          }
          const hiddenParent = parent.closest("[aria-hidden='true']");
          const revealParent = parent.closest("[data-typewriter-show]");
          if (
            hiddenParent &&
            !revealParent
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest("script, style, noscript")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.hasAttribute("data-typewriter-show")
        ) {
          const closedDetails = node.closest("details:not([open])");
          if (closedDetails && !node.closest("summary")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) {
      items.push({ type: "text", node, text: node.nodeValue });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      items.push({ type: "reveal", element: node });
    }
  }
  return items;
};

const collectTypewriterTargets = (items) =>
  items
    .filter((item) => item.type === "reveal")
    .map((item) => item.element);

const collectTypewriterSections = () => {
  const sections = Array.from(
    document.querySelectorAll("[data-typewriter-section]")
  );
  if (sections.length) {
    return sections;
  }
  const root = document.querySelector(".terminal");
  return root ? [root] : [];
};

const startTypewriter = () => {
  const sections = collectTypewriterSections();
  if (!sections.length) {
    return null;
  }
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    sections.forEach((section) => {
      section.classList.remove("is-typing");
      section.classList.add("is-loaded");
    });
    return null;
  }

  document.querySelectorAll(".summary-move").forEach((text) => {
    prepareMarqueeText(text);
  });

  document.documentElement.classList.add("typewriter-ready");
  const sectionQueue = sections
    .map((section) => {
      const items = collectTypewriterItems(section);
      if (!items.length) {
        return null;
      }
      const textItems = items.filter((item) => item.type === "text");
      const targets = collectTypewriterTargets(items);
      targets.forEach((target) => {
        target.classList.add("typewriter-hidden");
      });
      textItems.forEach((item) => {
        item.node.nodeValue = "";
      });
      const totalChars = textItems.reduce(
        (sum, item) => sum + item.text.length,
        0
      );
      return {
        element: section,
        items,
        textItems,
        targets,
        totalChars,
      };
    })
    .filter(Boolean);
  if (!sectionQueue.length) {
    return null;
  }

  sections.forEach((section) => {
    section.classList.remove("is-typing", "is-loaded");
  });
  const getDelayRange = (totalChars) => {
    const targetDurationMs = 2200;
    const baseDelay = Math.min(
      10,
      Math.max(2, Math.round(targetDurationMs / Math.max(totalChars, 1)))
    );
    const minDelay = Math.max(1, Math.round(baseDelay * 0.3));
    const maxDelay = Math.max(minDelay + 1, Math.round(baseDelay * 1.2));
    return { minDelay, maxDelay };
  };
  const heavyPunctuation = new Set([".", "!", "?"]);
  const mediumPunctuation = new Set([",", ";", ":"]);
  const whitespaceChars = new Set([" ", "\n", "\t"]);
  const sectionPauseMs = 120;

  let sectionIndex = 0;
  let itemIndex = 0;
  let charIndex = 0;
  let minDelay = 0;
  let maxDelay = 0;
  let timerId = null;
  let resolveDone = null;
  let finished = false;

  const donePromise = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const cleanup = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    document.removeEventListener("keydown", skipTyping);
    document.removeEventListener("pointerdown", skipTyping);
    if (resolveDone) {
      resolveDone();
    }
  };

  const finishTyping = () => {
    if (finished) {
      return;
    }
    finished = true;
    cleanup();
  };

  const completeAll = () => {
    sectionQueue.forEach((section) => {
      section.textItems.forEach((item) => {
        item.node.nodeValue = item.text;
      });
      section.targets.forEach((target) => {
        target.classList.remove("typewriter-hidden");
      });
      section.element.classList.remove("is-typing");
      section.element.classList.add("is-loaded");
    });
    scheduleMarqueeUpdate();
    finishTyping();
  };

  const skipTyping = () => {
    completeAll();
  };

  const startSection = () => {
    if (sectionIndex >= sectionQueue.length) {
      finishTyping();
      return;
    }
    const section = sectionQueue[sectionIndex];
    section.element.classList.remove("is-loaded");
    section.element.classList.add("is-typing");
    const delayRange = getDelayRange(section.totalChars);
    minDelay = delayRange.minDelay;
    maxDelay = delayRange.maxDelay;
    itemIndex = 0;
    charIndex = 0;
    timerId = window.setTimeout(nextChar, 120);
  };

  const finishSection = () => {
    const section = sectionQueue[sectionIndex];
    if (section) {
      section.element.classList.remove("is-typing");
      section.element.classList.add("is-loaded");
    }
    scheduleMarqueeUpdate();
    sectionIndex += 1;
    if (sectionIndex >= sectionQueue.length) {
      finishTyping();
      return;
    }
    timerId = window.setTimeout(startSection, sectionPauseMs);
  };

  const nextChar = () => {
    const section = sectionQueue[sectionIndex];
    if (!section) {
      finishTyping();
      return;
    }
    let item = section.items[itemIndex];
    while (item && item.type === "reveal") {
      item.element.classList.remove("typewriter-hidden");
      itemIndex += 1;
      item = section.items[itemIndex];
    }
    if (!item) {
      finishSection();
      return;
    }
    const char = item.text.charAt(charIndex);
    item.node.nodeValue += char;
    charIndex += 1;
    if (charIndex >= item.text.length) {
      itemIndex += 1;
      charIndex = 0;
    }
    let delay = minDelay + Math.random() * (maxDelay - minDelay);
    if (whitespaceChars.has(char)) {
      delay = Math.max(2, minDelay * 0.3);
    } else if (heavyPunctuation.has(char)) {
      delay += 20 + Math.random() * 40;
    } else if (mediumPunctuation.has(char)) {
      delay += 12 + Math.random() * 22;
    } else if (Math.random() < 0.01) {
      delay += 20 + Math.random() * 40;
    }
    timerId = window.setTimeout(nextChar, delay);
  };

  document.addEventListener("keydown", skipTyping);
  document.addEventListener("pointerdown", skipTyping);

  startSection();
  return donePromise;
};

const applyGlitchChars = (root, intensity = 0.15) => {
  const originals = new Map();
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue;
    const chars = value.split("");
    const indices = [];
    const maxChanges = Math.max(1, Math.floor(chars.length * intensity));
    while (indices.length < maxChanges) {
      const idx = Math.floor(Math.random() * chars.length);
      if (chars[idx] === " " || indices.includes(idx)) {
        continue;
      }
      indices.push(idx);
      chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
    originals.set(node, value);
    node.nodeValue = chars.join("");
  }
  return () => {
    originals.forEach((value, node) => {
      node.nodeValue = value;
    });
  };
};

const applyPermanentGlitchChars = (root, intensity = 0.1) => {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue;
    const chars = value.split("");
    const indices = [];
    const maxChanges = Math.max(1, Math.floor(chars.length * intensity));
    while (indices.length < maxChanges) {
      const idx = Math.floor(Math.random() * chars.length);
      if (chars[idx] === " " || indices.includes(idx)) {
        continue;
      }
      indices.push(idx);
      chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
    node.nodeValue = chars.join("");
  }
};

const scheduleRandomGlitch = () => {
  const delay = Math.floor(randomDelayMs());
  setTimeout(() => {
    if (!glitchEnabled) {
      scheduleRandomGlitch();
      return;
    }
    if (glitchActive) {
      scheduleRandomGlitch();
      return;
    }
    const targets = collectGlitchTargets();
    if (!targets.length) {
      scheduleRandomGlitch();
      return;
    }
    const { overlay, content } =
      targets[Math.floor(Math.random() * targets.length)];
    const shouldCorrupt =
      glitchEnabled &&
      performance.now() - glitchStart >= GLITCH_CORRUPT_AFTER &&
      Math.random() < GLITCH_CORRUPT_CHANCE;
    glitchActive = true;
    overlay.dataset.glitch =
      GLITCH_STRINGS[Math.floor(Math.random() * GLITCH_STRINGS.length)];
    overlay.classList.add("glitch-on");
    const restore = applyGlitchChars(content, 0.06);
    setTimeout(() => {
      overlay.classList.remove("glitch-on");
    }, GLITCH_DURATION);
    setTimeout(() => {
      restore();
      if (shouldCorrupt) {
        applyPermanentGlitchChars(content, GLITCH_CORRUPT_INTENSITY);
      }
      glitchActive = false;
      scheduleRandomGlitch();
    }, GLITCH_CHAR_DURATION);
  }, delay);
};

const updateMarquee = () => {
  document.querySelectorAll(".timeline-item summary").forEach((summary) => {
    const text = summary.querySelector(".summary-move");
    const fixed = summary.querySelector(".summary-fixed");
    const clip = summary.querySelector(".summary-clip");
    if (!text || !fixed || !clip) {
      return;
    }
    prepareMarqueeText(text);
    const content = text.querySelector(".summary-content");
    if (!content) {
      return;
    }
    const availableWidth = clip.getBoundingClientRect().width;
    const contentWidth = content.getBoundingClientRect().width;
    const overflow = contentWidth - availableWidth;
    if (overflow > 0) {
      summary.classList.add("is-overflow");
      text.style.setProperty(
        "--marquee-distance",
        `${overflow + MARQUEE_GAP}px`
      );
    } else {
      summary.classList.remove("is-overflow");
      text.style.removeProperty("--marquee-distance");
    }
  });
};

const requestMarqueeUpdate = () => {
  if (marqueeRaf !== null) {
    return;
  }
  marqueeRaf = requestAnimationFrame(() => {
    marqueeRaf = null;
    updateMarquee();
  });
};

let connectorRaf = null;
const updateMenuConnectors = () => {
  const container = document.querySelector(".terminal");
  const menuItems = Array.from(
    document.querySelectorAll(".name-menu__item:not(.lamp-icon)")
  );
  const target = document.querySelector(
    "[data-connector-target='archivos']"
  );
  const svg = document.querySelector(".menu-connector");
  if (!container || !menuItems.length || !target || !svg) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetTitle =
    target.querySelector(".section-title") || target;
  const targetRect = targetTitle.getBoundingClientRect();
  if (!containerRect.width || !targetRect.width) {
    svg.replaceChildren();
    return;
  }

  const round = (value) => Math.round(value);
  const endX = round(
    targetRect.left + targetRect.width / 2 - containerRect.left
  );
  const endY = round(
    targetRect.top + targetRect.height / 2 - containerRect.top - 14
  );

  const activeItems = menuItems.filter((item) =>
    item.classList.contains("is-active")
  );
  const itemsToDraw = activeItems.length ? activeItems : menuItems;
  const paths = [];
  itemsToDraw.forEach((item) => {
    const sourceRect = item.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height) {
      return;
    }
    const startX = round(
      sourceRect.left + sourceRect.width / 2 - containerRect.left
    );
    const startY = round(sourceRect.bottom - containerRect.top + 6);
    const deltaY = endY - startY;
    const firstDrop = Math.max(12, Math.min(34, Math.abs(deltaY) * 0.4));
    const midY = round(startY + Math.sign(deltaY || 1) * firstDrop);

    paths.push(`M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`);
  });

  svg.setAttribute(
    "viewBox",
    `0 0 ${Math.round(containerRect.width)} ${Math.round(containerRect.height)}`
  );
  svg.setAttribute("width", Math.round(containerRect.width));
  svg.setAttribute("height", Math.round(containerRect.height));

  svg.replaceChildren();
  paths.forEach((pathData) => {
    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path.setAttribute("d", pathData);
    svg.appendChild(path);
  });
};

const requestMenuConnectorUpdate = () => {
  if (connectorRaf !== null) {
    return;
  }
  connectorRaf = requestAnimationFrame(() => {
    connectorRaf = null;
    updateMenuConnectors();
  });
};

const initMenuConnectorResizeObserver = () => {
  const container = document.querySelector(".terminal");
  if (!container) {
    return;
  }
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      requestMenuConnectorUpdate();
    });
    observer.observe(container);
  } else {
    document.querySelectorAll("details").forEach((detail) => {
      detail.addEventListener("toggle", requestMenuConnectorUpdate);
    });
  }
};

const scheduleMarqueeUpdate = () => {
  updateMarquee();
  requestMarqueeUpdate();
  setTimeout(updateMarquee, 150);
};

const initLampIndicator = () => {
  const lamp = document.querySelector(".lamp-icon");
  if (!lamp) {
    return;
  }
  const turnOn = () => {
    lamp.classList.remove("is-loading");
    lamp.classList.add("is-on");
  };
  lamp.classList.add("is-loading");
  if (document.readyState === "complete") {
    turnOn();
    return;
  }
  window.addEventListener("load", turnOn, { once: true });
};

const startVisuals = () => {
  registerTitleGlitches();
  const typewriterDone = startTypewriter();
  const finalizeVisuals = () => {
    scheduleMarqueeUpdate();
    requestMenuConnectorUpdate();
  };
  if (typewriterDone) {
    typewriterDone.then(() => {
      finalizeVisuals();
    });
  } else {
    finalizeVisuals();
  }
  window.addEventListener("resize", () => {
    requestMarqueeUpdate();
    requestMenuConnectorUpdate();
  });
  setTimeout(() => {
    glitchEnabled = true;
    scheduleRandomGlitch();
  }, GLITCH_INITIAL_DELAY);
};

initLampIndicator();
initMenuConnectorResizeObserver();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    startVisuals();
    requestMarqueeUpdate();
    requestMenuConnectorUpdate();
  });
} else {
  startVisuals();
  requestMenuConnectorUpdate();
}

const formatTime = (value) => {
  if (!Number.isFinite(value)) {
    return "0:00";
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const initAudioPlayers = () => {
  document.querySelectorAll(".audio-player").forEach((player) => {
    const audio = player.querySelector(".audio-element");
    const toggle = player.querySelector(".audio-toggle");
    const bar = player.querySelector(".audio-bar");
    const fill = player.querySelector(".audio-bar-fill");
    const head = player.querySelector(".audio-bar-head");
    const time = player.querySelector(".audio-time");
    if (!audio || !toggle || !bar || !fill || !head || !time) {
      return;
    }

    const updateButton = () => {
      const playing = !audio.paused;
      toggle.dataset.state = playing ? "pause" : "play";
      toggle.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    };

    const updateProgress = () => {
      const duration = audio.duration || 0;
      const current = audio.currentTime || 0;
      const ratio = duration ? current / duration : 0;
      fill.style.transform = `scaleX(${ratio})`;
      head.style.left = `${ratio * 100}%`;
      time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      bar.setAttribute("aria-valuenow", Math.round(ratio * 100));
    };

    const seekTo = (clientX) => {
      const rect = bar.getBoundingClientRect();
      if (!rect.width || !audio.duration) {
        return;
      }
      const clamped = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      audio.currentTime = (clamped / rect.width) * audio.duration;
      updateProgress();
    };

    let seeking = false;
    const stopSeeking = () => {
      seeking = false;
    };
    bar.addEventListener("pointerdown", (event) => {
      seeking = true;
      if (bar.setPointerCapture) {
        bar.setPointerCapture(event.pointerId);
      }
      seekTo(event.clientX);
    });
    bar.addEventListener("pointermove", (event) => {
      if (!seeking) {
        return;
      }
      seekTo(event.clientX);
    });
    bar.addEventListener("pointerup", stopSeeking);
    bar.addEventListener("pointerleave", stopSeeking);
    bar.addEventListener("pointercancel", stopSeeking);
    bar.addEventListener("lostpointercapture", stopSeeking);
    bar.addEventListener("keydown", (event) => {
      if (!audio.duration) {
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const delta = event.key === "ArrowLeft" ? -5 : 5;
        audio.currentTime = Math.min(
          Math.max(audio.currentTime + delta, 0),
          audio.duration
        );
        updateProgress();
      }
    });

    toggle.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("durationchange", updateProgress);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", updateButton);
    audio.addEventListener("pause", updateButton);
    audio.addEventListener("ended", updateButton);
    audio.addEventListener("ended", updateProgress);

    updateButton();
    updateProgress();
  });
};

window.addEventListener("load", initAudioPlayers);
