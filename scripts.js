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
const GLITCH_MIN_DELAY = 3500;
const GLITCH_MAX_DELAY = 22000;
const GLITCH_DURATION = 240;
const GLITCH_CHAR_DURATION = 1000;
const GLITCH_INITIAL_DELAY = 90000;
let glitchActive = false;
let glitchEnabled = false;

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

const bindGlitch = (text, clip) => {
  if (text.dataset.glitchBound === "true") {
    return;
  }
  text.dataset.glitchCount = "0";
  text.addEventListener("animationiteration", () => {
    if (!glitchEnabled) {
      return;
    }
    const count = Number(text.dataset.glitchCount || "0") + 1;
    text.dataset.glitchCount = String(count);
    if (Math.random() > 0.6) {
      return;
    }
    const glitch =
      GLITCH_STRINGS[Math.floor(Math.random() * GLITCH_STRINGS.length)];
    clip.dataset.glitch = glitch;
    clip.classList.add("glitch-on");
    const content = text.querySelector(".summary-content");
    const restore = content ? applyGlitchChars(content, 0.15) : null;
    setTimeout(() => {
      clip.classList.remove("glitch-on");
    }, GLITCH_DURATION);
    setTimeout(() => {
      if (restore) {
        restore();
      }
    }, GLITCH_CHAR_DURATION);
  });
  text.dataset.glitchBound = "true";
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
    bindGlitch(text, clip);
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

const scheduleMarqueeUpdate = () => {
  updateMarquee();
  requestMarqueeUpdate();
  setTimeout(updateMarquee, 150);
};

registerTitleGlitches();
scheduleMarqueeUpdate();
window.addEventListener("resize", requestMarqueeUpdate);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(requestMarqueeUpdate);
}
setTimeout(() => {
  glitchEnabled = true;
  scheduleRandomGlitch();
}, GLITCH_INITIAL_DELAY);

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
