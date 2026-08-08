export const PAGE_MODULES = Object.freeze([
  {
    id: "inicio",
    label: "Inicio",
    path: "pages/inicio.html",
  },
  {
    id: "entradas",
    label: "Entradas",
    path: "pages/entradas.html",
  },
  {
    id: "archivos",
    label: "Textos",
    path: "pages/archivos.html",
  },
  {
    id: "proyectos-musicales",
    label: "Sonidos",
    path: "pages/proyectos-musicales.html",
  },
  {
    id: "informacion",
    label: "Información",
    path: "pages/informacion.html",
  },
]);

export const DEFAULT_PAGE = "inicio";

export const getPageModule = (pageId) =>
  PAGE_MODULES.find((page) => page.id === pageId) || null;
