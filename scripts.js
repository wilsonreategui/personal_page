const updateMarquee = () => {
  document.querySelectorAll(".timeline-item summary").forEach((summary) => {
    const text = summary.querySelector(".summary-move");
    const fixed = summary.querySelector(".summary-fixed");
    const clip = summary.querySelector(".summary-clip");
    if (!text || !fixed || !clip) {
      return;
    }
    summary.classList.remove("is-overflow");
    text.style.removeProperty("--marquee-distance");
    const availableWidth = clip.clientWidth + 20;
    const overflow = text.scrollWidth - availableWidth;
    if (overflow > 0) {
      summary.classList.add("is-overflow");
      text.style.setProperty("--marquee-distance", `${overflow + 24}px`);
    }
  });
};

window.addEventListener("load", updateMarquee);
window.addEventListener("resize", updateMarquee);

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
    };

    let seeking = false;
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
    bar.addEventListener("pointerup", () => {
      seeking = false;
    });
    bar.addEventListener("pointerleave", () => {
      seeking = false;
    });
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
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", updateButton);
    audio.addEventListener("pause", updateButton);
    audio.addEventListener("ended", updateButton);

    updateButton();
    updateProgress();
  });
};

window.addEventListener("load", initAudioPlayers);
