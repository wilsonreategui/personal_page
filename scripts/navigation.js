import { DEFAULT_PAGE, PAGE_MODULES, getPageModule } from "./config.js";

export const parseHashRoute = (hash = "") => {
  const hashValue = hash.startsWith("#") ? hash.slice(1) : hash;
  let decodedHash = "";
  try {
    decodedHash = decodeURIComponent(hashValue);
  } catch {
    decodedHash = hashValue;
  }

  const [pageId, ...routeParts] = decodedHash.split("/");
  const requestedPage = getPageModule(pageId);
  const page =
    requestedPage || getPageModule(DEFAULT_PAGE) || PAGE_MODULES[0];

  return {
    page,
    viewId: requestedPage && routeParts.length ? routeParts.join("/") : null,
  };
};

const getRouteFromHash = () => parseHashRoute(window.location.hash);

const createMenuItem = (page) => {
  const item = document.createElement("a");
  item.className = "name-menu__item";
  item.href = page.indexed ? `#${page.id}/indice` : `#${page.id}`;
  item.dataset.page = page.id;
  item.textContent = page.label;

  if (page.isNew) {
    const flag = document.createElement("span");
    flag.className = "new-flag";
    flag.setAttribute("aria-label", "Nuevo");
    flag.textContent = "!";
    item.append(flag);
  }
  return item;
};

export const initNavigation = ({ onNavigate, onReset } = {}) => {
  const menu = document.querySelector(".name-menu__items");
  const toggle = document.querySelector(".menu-toggle");
  if (!menu || !toggle) {
    return;
  }

  const items = PAGE_MODULES.map(createMenuItem);
  menu.replaceChildren(...items);

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const activate = () => {
    const { page, viewId } = getRouteFromHash();
    if (!page) {
      return;
    }

    document.documentElement.dataset.activePage = page.id;
    document.documentElement.dataset.layout = page.indexed
      ? "indexed"
      : "flow";
    items.forEach((item) => {
      const isActive = item.dataset.page === page.id;
      item.classList.toggle("is-active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
    closeMenu();
    onNavigate?.(page.id, viewId);
  };

  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    const item = event.target.closest("a[data-page]");
    if (!item) {
      return;
    }

    const isActive =
      document.documentElement.dataset.activePage === item.dataset.page;
    if (!isActive) {
      return;
    }

    const href = item.getAttribute("href");
    if (href && window.location.hash !== href) {
      return;
    }

    event.preventDefault();
    closeMenu();
    onReset?.(item.dataset.page);
  });

  window.addEventListener("hashchange", activate);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      closeMenu();
    }
  });

  activate();
};
