const formatTime = (value) => {
  if (!Number.isFinite(value)) {
    return "0:00";
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const initAudioPlayers = (scope = document) => {
  scope.querySelectorAll(".audio-player").forEach((player) => {
    if (player.dataset.audioReady === "true") {
      return;
    }

    const audio = player.querySelector(".audio-element");
    const toggle = player.querySelector(".audio-toggle");
    const bar = player.querySelector(".audio-bar");
    const fill = player.querySelector(".audio-bar-fill");
    const head = player.querySelector(".audio-bar-head");
    const time = player.querySelector(".audio-time");
    if (!audio || !toggle || !bar || !fill || !head || !time) {
      return;
    }

    player.dataset.audioReady = "true";

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
      bar.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      bar.setAttribute(
        "aria-valuetext",
        `${formatTime(current)} de ${formatTime(duration)}`
      );
    };

    const seekTo = (clientX) => {
      const rect = bar.getBoundingClientRect();
      if (!rect.width || !audio.duration) {
        return;
      }
      const position = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      audio.currentTime = (position / rect.width) * audio.duration;
      updateProgress();
    };

    let seeking = false;
    const stopSeeking = () => {
      seeking = false;
    };

    bar.addEventListener("pointerdown", (event) => {
      seeking = true;
      bar.setPointerCapture?.(event.pointerId);
      seekTo(event.clientX);
    });
    bar.addEventListener("pointermove", (event) => {
      if (seeking) {
        seekTo(event.clientX);
      }
    });
    ["pointerup", "pointerleave", "pointercancel", "lostpointercapture"].forEach(
      (eventName) => bar.addEventListener(eventName, stopSeeking)
    );
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

    toggle.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          updateButton();
        }
      } else {
        audio.pause();
      }
    });

    ["loadedmetadata", "durationchange", "timeupdate", "ended"].forEach(
      (eventName) => audio.addEventListener(eventName, updateProgress)
    );
    ["play", "pause", "ended"].forEach((eventName) =>
      audio.addEventListener(eventName, updateButton)
    );

    updateButton();
    updateProgress();
  });
};
