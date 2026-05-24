// Estilos de optimización (meta-prompts). Script clásico: expone un global
// para que lo usen tanto el service worker como la página de ajustes.
(function (root) {
  const DEFAULT_STYLE = "clarity";

  const BASE_RULES = `Eres un ingeniero de prompts experto. Recibes un texto crudo, confuso o fragmentado que un usuario escribió y debes reescribirlo como un prompt claro, estructurado y listo para enviar a cualquier modelo de IA.

Reglas:
- Conserva la intención y todos los datos concretos del texto original (nombres, cifras, restricciones).
- No inventes requisitos que el usuario no expresó ni respondas la petición: solo reescribe el prompt.
- Da contexto, define el objetivo (resultado esperado), los criterios de éxito cuando sean relevantes y, si procede, el formato de salida esperado.
- No añadas instrucciones de razonamiento paso a paso (como «think step by step» o «piensa paso a paso») a menos que el usuario las haya expresado; los modelos modernos con razonamiento nativo las procesan internamente sin necesidad de indicación explícita.
- Usa un lenguaje preciso y sin ambigüedades. Mantén el mismo idioma del texto original.
- Devuelve ÚNICAMENTE el prompt optimizado, sin comillas, sin explicaciones ni encabezados como "Prompt:".`;

  const STYLES = {
    clarity: {
      label: "Claridad",
      description:
        "Reescribe el texto para que sea claro, ordenado y sin ambigüedades.",
      system: `${BASE_RULES}

Prioriza la CLARIDAD: estructura la petición en pasos o secciones lógicas, elimina ambigüedades y redundancias, y explicita cualquier supuesto implícito.`,
    },
    technical: {
      label: "Precisión técnica",
      description:
        "Optimiza para tareas técnicas con requisitos y restricciones explícitos.",
      system: `${BASE_RULES}

Prioriza la PRECISIÓN TÉCNICA: define entradas, salidas, restricciones, criterios de aceptación y el resultado concreto esperado (outcome). Usa terminología exacta, enumera requisitos verificables y especifica cómo se evaluará el éxito de la solución.`,
    },
    creative: {
      label: "Creatividad",
      description:
        "Optimiza para tareas creativas dando tono, estilo y libertad guiada.",
      system: `${BASE_RULES}

Prioriza la CREATIVIDAD: especifica tono, estilo, público y ejemplos de referencia, dejando espacio para la exploración pero manteniendo el objetivo claro.`,
    },
  };

  function getStyle(id) {
    return STYLES[id] || STYLES[DEFAULT_STYLE];
  }

  root.PromptOptimizerStyles = { STYLES, getStyle, DEFAULT_STYLE };
})(globalThis);
