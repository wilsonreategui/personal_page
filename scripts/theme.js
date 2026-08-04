const THEME_KEY = "personal-page-theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

const readSavedTheme = () => {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === LIGHT_THEME || saved === DARK_THEME ? saved : null;
  } catch {
    return null;
  }
};

const getPreferredTheme = () => {
  const saved = readSavedTheme();
  if (saved) {
    return saved;
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? LIGHT_THEME
    : DARK_THEME;
};

const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // La preferencia sigue funcionando durante la sesión si el navegador
    // bloquea el almacenamiento local.
  }
};

const applyTheme = (theme, toggle) => {
  const isLight = theme === LIGHT_THEME;
  document.documentElement.classList.toggle("theme-light", isLight);
  toggle.setAttribute("aria-pressed", String(isLight));
  toggle.setAttribute(
    "aria-label",
    isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"
  );

  const glyph = toggle.querySelector(".lamp-glyph");
  if (glyph) {
    glyph.textContent = isLight ? "O" : "-";
  }
};

export const initTheme = () => {
  const toggle = document.querySelector(".lamp-toggle");
  if (!toggle) {
    return;
  }

  let theme = getPreferredTheme();
  applyTheme(theme, toggle);

  toggle.addEventListener("click", () => {
    theme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    document.documentElement.classList.add("theme-transition");
    applyTheme(theme, toggle);
    saveTheme(theme);
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 360);
  });
};

export const initLampIndicator = () => {
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
  } else {
    window.addEventListener("load", turnOn, { once: true });
  }
};
