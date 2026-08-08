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
  // `indexed`: páginas con selector de vistas y scroll interno. Decide la ruta
  // por defecto del menú, el layout de alto fijo en CSS y el scrollbar propio.
  {
    id: "archivos",
    label: "Textos",
    path: "pages/archivos.html",
    indexed: true,
  },
  {
    id: "proyectos-musicales",
    label: "Sonidos",
    path: "pages/proyectos-musicales.html",
    indexed: true,
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
