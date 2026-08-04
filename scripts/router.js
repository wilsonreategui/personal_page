import { getPageModule } from "./config.js";

const pageCache = new Map();

const createErrorState = (pageId, retry) => {
  const wrapper = document.createElement("section");
  wrapper.className = "page-status";
  wrapper.setAttribute("role", "alert");

  const message = document.createElement("p");
  message.textContent = "No pude cargar esta sección.";

  const button = document.createElement("button");
  button.className = "page-status__action";
  button.type = "button";
  button.textContent = "Reintentar";
  button.addEventListener("click", () => retry(pageId));

  wrapper.append(message, button);
  return wrapper;
};

const fetchPage = async (page, signal) => {
  if (pageCache.has(page.id)) {
    return pageCache.get(page.id);
  }

  const response = await fetch(page.path, {
    cache: "default",
    signal,
  });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${page.id}: ${response.status}`);
  }

  const html = await response.text();
  pageCache.set(page.id, html);
  return html;
};

export const createPageRouter = ({ onPageReady } = {}) => {
  const container = document.querySelector("[data-page-container]");
  const status = document.querySelector("[data-route-status]");
  let currentPage = null;
  let requestController = null;
  let requestId = 0;

  const announce = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const load = async (pageId, { force = false } = {}) => {
    const page = getPageModule(pageId);
    if (!container || !page) {
      return;
    }
    if (!force && currentPage === page.id && container.childElementCount) {
      return;
    }

    requestController?.abort();
    requestController = new AbortController();
    const activeRequest = ++requestId;
    container.setAttribute("aria-busy", "true");
    announce(`Cargando ${page.label}`);

    if (force) {
      pageCache.delete(page.id);
    }

    try {
      const html = await fetchPage(page, requestController.signal);
      if (activeRequest !== requestId) {
        return;
      }

      await document.fonts?.ready;
      if (activeRequest !== requestId) {
        return;
      }

      const template = document.createElement("template");
      template.innerHTML = html.trim();
      container.replaceChildren(template.content);
      container.querySelectorAll(".page-section").forEach((section) => {
        section.classList.toggle(
          "is-active-page",
          section.dataset.page === page.id
        );
      });

      currentPage = page.id;
      announce(`${page.label} cargado`);
      onPageReady?.(container, page);
    } catch (error) {
      if (error.name === "AbortError" || activeRequest !== requestId) {
        return;
      }
      console.error(error);
      container.replaceChildren(
        createErrorState(page.id, (id) => load(id, { force: true }))
      );
      announce(`No se pudo cargar ${page.label}`);
    } finally {
      if (activeRequest === requestId) {
        container.setAttribute("aria-busy", "false");
      }
    }
  };

  return { load };
};
