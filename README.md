# Personal page

Página personal minimalista construida con HTML, CSS y JavaScript nativo. No
requiere compilación ni dependencias para publicarse en un servidor estático.

## Ejecutar localmente

Los módulos de contenido se cargan con `fetch`, por lo que la página debe abrirse
desde un servidor HTTP y no directamente con `file://`.

Por ejemplo:

```sh
npx serve .
```

## Estructura

```text
index.html                 Estructura principal
styles.css                 Sistema visual y componentes
scripts/app.js             Inicio de la aplicación
scripts/config.js          Registro único de secciones
scripts/navigation.js      Menú y estado activo
scripts/router.js          Carga, caché y errores de contenido
scripts/effects.js         Typewriter, glitch, marquee y conectores
scripts/theme.js           Tema claro/oscuro persistente
scripts/audio-player.js    Reproductores accesibles
pages/                     Contenido HTML de cada sección
photos/                    Imágenes optimizadas para la página
audio/                     Archivos de audio
```

## Agregar una sección

1. Crea su fragmento HTML dentro de `pages/`.
2. Agrega una entrada a `PAGE_MODULES` en `scripts/config.js`.
3. Usa el mismo `id` en `data-page` y `data-connector-target` dentro del
   fragmento.

El menú se genera automáticamente desde ese registro; no es necesario modificar
`index.html`, el router ni los eventos de navegación.

Ejemplo:

```js
{
  id: "proyectos-musicales",
  label: "Música",
  path: "pages/proyectos-musicales.html",
  isNew: true,
}
```

## Convenciones

- Mantener cada sección como contenido semántico y no como lógica JavaScript.
- Inicializar interacciones reutilizables desde `app.js`.
- Respetar `prefers-reduced-motion` al agregar animaciones.
- Usar imágenes optimizadas para web dentro de `photos/`.

