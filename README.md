# Prompt Optimizer

Extensión de navegador (Chrome / Edge, Manifest V3) que convierte texto
seleccionado en cualquier página en un **prompt optimizado y estructurado**
con un clic derecho, usando la API de OpenAI.

> Selecciona texto → clic derecho → **✨ Optimizar como prompt** → el resultado
> aparece en un panel flotante y se copia al portapapeles.

## Características (MVP — Fase 1)

- Optimización mediante menú contextual (clic derecho) sobre cualquier selección.
- Panel flotante aislado (Shadow DOM) con el prompt resultante, opción de ver el
  texto original y botón de copiar.
- Copia automática al portapapeles.
- Llamada a la API de OpenAI con tu propia API key.
- Ajustes simples: API key, modelo y estilo de optimización (claridad, precisión
  técnica, creatividad).

## Instalación (modo desarrollador)

1. Clona o descarga este repositorio.
2. (Opcional) Regenera los iconos: `python3 tools/generate_icons.py`.
3. Abre `chrome://extensions` (o `edge://extensions`).
4. Activa el **Modo de desarrollador** (arriba a la derecha).
5. Pulsa **Cargar descomprimida** y selecciona la carpeta del proyecto.
6. Abre los ajustes de la extensión (icono ✨ en la barra) y pega tu
   **API key de OpenAI** (`sk-…`). Se guarda solo en este navegador.

> Si la extensión no responde en una pestaña ya abierta, recárgala: los content
> scripts se inyectan al cargar la página.

## Uso

1. Selecciona el texto que quieres mejorar.
2. Clic derecho → **✨ Optimizar como prompt**.
3. El prompt optimizado aparece en el panel flotante y se copia automáticamente.

## Estructura del proyecto

```
manifest.json            Configuración de la extensión (MV3)
src/
  background.js          Service worker: menú contextual y orquestación
  openai.js              Cliente de la API de OpenAI
  styles.js              Estilos de optimización (meta-prompts)
  content.js             Panel flotante (Shadow DOM)
  popup.html/.css/.js    Página de ajustes (API key, modelo, estilo)
icons/                   Iconos de la extensión
tools/generate_icons.py  Generador de iconos PNG (sin dependencias)
```

## Privacidad

La API key y los ajustes se almacenan localmente con `chrome.storage.local`.
El texto seleccionado se envía únicamente a `https://api.openai.com` para su
optimización. La extensión no usa servidores propios ni envía datos a terceros.

## Roadmap (fases posteriores)

- Historial local de prompts con búsqueda.
- Comparación lado a lado original vs. optimizado.
- Integración con otros modelos (Claude, Gemini).
- Puntuación de calidad del prompt y templates reutilizables.
