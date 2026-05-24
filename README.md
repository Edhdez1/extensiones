# Prompt Optimizer

Extensión de navegador (**Firefox**, Chrome y Edge — Manifest V3) que convierte
texto seleccionado en cualquier página en un **prompt optimizado y estructurado**
con un clic derecho, usando el proveedor de IA que elijas.

> Selecciona texto → clic derecho → **✨ Optimizar como prompt** → el resultado
> aparece en un panel flotante y se copia al portapapeles.

## Características (MVP — Fase 1)

- Optimización mediante menú contextual (clic derecho) sobre cualquier selección.
- Panel flotante aislado (Shadow DOM) con el prompt resultante, opción de ver el
  texto original, copia automática al portapapeles y botones **Copiar** y
  **Reemplazar**.
- **Reemplazar in situ**: sustituye el texto seleccionado por el prompt
  optimizado sin copiar ni pegar (cuando la selección está en un campo editable;
  el botón se oculta en páginas de solo lectura).
- **Prompt en inglés con respuesta en tu idioma** (configurable): el prompt se
  genera en inglés —donde muchos modelos rinden mejor— e incluye la instrucción
  de responder en el idioma en que escribiste.
- **Multi-proveedor**: alterna entre varias APIs y usa una gratuita cuando se
  agote el saldo de otra.
- Compatible con **Firefox y Chrome/Edge** con un único código base.
- Ajustes simples: proveedor, API key (por proveedor), modelo, estilo de
  optimización (claridad, precisión técnica, creatividad, alta precisión) e
  idioma del prompt.

## Proveedores soportados

| Proveedor | Capa gratuita | Clave |
|---|---|---|
| **Pollinations** (por defecto) | **Sí — sin clave** | No requiere |
| OpenAI | No (de pago) | platform.openai.com/api-keys |
| Google Gemini | **Sí** | aistudio.google.com/apikey |
| Groq | **Sí** | console.groq.com/keys |
| OpenRouter | **Sí** (modelos `:free`) | openrouter.ai/keys |

**Funciona sin configurar nada**: por defecto usa **Pollinations**, un servicio
gratuito que no requiere clave, así que la extensión optimiza desde el primer
momento. Es un servicio de terceros, por lo que la calidad y disponibilidad
pueden variar; para mayor calidad/control, configura otro proveedor en los
ajustes (cada uno guarda su propia clave y puedes alternar entre ellos).

## Instalación

Primero (opcional) regenera los iconos: `python3 tools/generate_icons.py`.

### Firefox

1. Abre `about:debugging#/runtime/this-firefox`.
2. **Cargar complemento temporal…** y selecciona el archivo `manifest.json`.
3. ¡Listo! Funciona sin clave (proveedor Pollinations por defecto). Para usar
   otro proveedor, abre los ajustes, elígelo y pega su API key.

> La carga temporal se borra al cerrar Firefox. Para una instalación
> permanente hay que empaquetar y firmar el complemento en addons.mozilla.org.

### Chrome / Edge

1. Abre `chrome://extensions` (o `edge://extensions`).
2. Activa el **Modo de desarrollador**.
3. **Cargar descomprimida** y selecciona la carpeta del proyecto.
4. ¡Listo! Funciona sin clave por defecto. Para otro proveedor, abre los
   ajustes (icono ✨), elígelo y pega su API key.

> Si la extensión no responde en una pestaña ya abierta, recárgala: los content
> scripts se inyectan al cargar la página.

## Uso

1. Selecciona el texto que quieres mejorar.
2. Clic derecho → **✨ Optimizar como prompt**.
3. El prompt optimizado aparece en el panel flotante y se copia automáticamente.

## Estructura del proyecto

```
manifest.json            Configuración MV3 (background dual: service_worker + scripts)
src/
  background.js          Service worker / event page: menú contextual y orquestación
  providers.js           Catálogo de proveedores (OpenAI, Gemini, Groq, OpenRouter)
  styles.js              Estilos de optimización (meta-prompts)
  content.js             Panel flotante (Shadow DOM)
  popup.html/.css/.js    Página de ajustes (proveedor, API key, modelo, estilo)
icons/                   Iconos de la extensión
tools/generate_icons.py  Generador de iconos PNG (sin dependencias)
```

### Compatibilidad cross-browser

El `background` declara `service_worker` (Chrome) y `scripts` (Firefox); cada
navegador ignora la clave del otro (Chrome 121+ / Firefox 121+). El código usa
scripts clásicos con globales y un shim `globalThis.browser || globalThis.chrome`
para funcionar con la API basada en promesas en ambos navegadores.

## Privacidad

Las claves y los ajustes se almacenan localmente con `storage.local`. El texto
seleccionado se envía únicamente al proveedor de IA que tengas activo. La
extensión no usa servidores propios ni envía datos a terceros.

## Roadmap (fases posteriores)

- Historial local de prompts con búsqueda.
- Comparación lado a lado original vs. optimizado.
- Endpoint personalizado compatible con OpenAI (LLMs locales, etc.).
- Puntuación de calidad del prompt y templates reutilizables.
```
