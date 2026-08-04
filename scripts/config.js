export const PAGE_MODULES = Object.freeze([
  {
    id: "archivos",
    label: "Relatos",
    path: "pages/archivos.html",
    isNew: true,
  },
  {
    id: "informacion",
    label: "Información",
    path: "pages/informacion.html",
  },
  // Para habilitar Música, agrega su entrada aquí. El menú y el router
  // se generan desde este único registro.
]);

export const DEFAULT_PAGE = "informacion";

export const getPageModule = (pageId) =>
  PAGE_MODULES.find((page) => page.id === pageId) || null;
