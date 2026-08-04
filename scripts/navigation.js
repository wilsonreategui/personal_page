import { DEFAULT_PAGE, PAGE_MODULES, getPageModule } from "./config.js";

const getPageFromHash = () => {
  const pageId = decodeURIComponent(window.location.hash.slice(1));
  return getPageModule(pageId) || getPageModule(DEFAULT_PAGE) || PAGE_MODULES[0];
};

const createMenuItem = (page) => {
  const item = document.createElement("a");
  item.className = "name-menu__item";
  item.href = `#${page.id}`;
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

export const initNavigation = ({ onNavigate } = {}) => {
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
    const page = getPageFromHash();
    if (!page) {
      return;
    }

    document.documentElement.dataset.activePage = page.id;
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
    onNavigate?.(page.id);
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
    if (window.location.hash === item.getAttribute("href")) {
      event.preventDefault();
      activate();
    }
  });

  window.addEventListener("hashchange", activate);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      closeMenu();
    }
  });

  activate();
};
