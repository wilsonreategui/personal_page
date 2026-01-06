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
    const availableWidth = Math.max(0, summary.clientWidth - fixed.offsetWidth - 12);
    clip.style.setProperty("--clip-width", `${availableWidth}px`);
    const overflow = text.scrollWidth - availableWidth;
    if (overflow > 0) {
      summary.classList.add("is-overflow");
      text.style.setProperty("--marquee-distance", `${overflow + 24}px`);
    }
  });
};

window.addEventListener("load", updateMarquee);
window.addEventListener("resize", updateMarquee);
