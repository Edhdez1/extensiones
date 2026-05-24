// Estilos de optimización (meta-prompts). Script clásico: expone un global
// para que lo usen tanto el service worker como la página de ajustes.
(function (root) {
  const DEFAULT_STYLE = "clarity";
  // Por defecto el prompt se genera en inglés (muchos modelos rinden mejor),
  // indicando que la respuesta debe darse en el idioma del texto original.
  const DEFAULT_PROMPT_LANGUAGE = "english";

  function languageClause(mode) {
    if (mode === "source") {
      return "- Escribe el prompt optimizado en el MISMO idioma del texto original.";
    }
    // mode === "english"
    return `- Escribe el prompt optimizado en INGLÉS, sin importar el idioma del texto original (muchos modelos de IA rinden mejor en inglés).
- Detecta el idioma del texto original e incluye DENTRO del prompt una instrucción explícita de que la respuesta del modelo debe darse en ese idioma. Por ejemplo, si el original está en español añade "Respond in Spanish."; si está en chino, "Respond in Chinese.".`;
  }

  function buildBaseRules(mode) {
    return `Eres un ingeniero de prompts experto. Recibes un texto crudo, confuso o fragmentado que un usuario escribió y debes reescribirlo como un prompt claro, estructurado y listo para enviar a cualquier modelo de IA.

Reglas:
- Conserva la intención y todos los datos concretos del texto original (nombres, cifras, restricciones).
- No inventes requisitos que el usuario no expresó ni respondas la petición: solo reescribe el prompt.
- Da contexto al inicio del prompt optimizado, define el objetivo principal y, cuando aporte, especifica el formato de salida.
${languageClause(mode)}
- Usa un lenguaje preciso y sin ambigüedades.
- Devuelve ÚNICAMENTE el prompt optimizado: sin comillas, sin explicaciones, sin encabezados.`;
  }

  // Cada estilo aporta un énfasis que se concatena a las reglas base.
  const STYLES = {
    clarity: {
      label: "Claridad",
      description:
        "Reescribe el texto para que sea claro, ordenado y sin ambigüedades.",
      emphasis:
        "Prioriza la CLARIDAD: sé directo y explícito, estructura la petición en pasos o secciones lógicas, elimina ambigüedades y redundancias, y explicita cualquier supuesto implícito.",
    },
    technical: {
      label: "Precisión técnica",
      description:
        "Optimiza para tareas técnicas con requisitos y restricciones explícitos.",
      emphasis:
        "Prioriza la PRECISIÓN TÉCNICA: define entradas, salidas, restricciones y criterios de aceptación. Usa terminología exacta y enumera requisitos verificables.",
    },
    creative: {
      label: "Creatividad",
      description:
        "Optimiza para tareas creativas dando tono, estilo y libertad guiada.",
      emphasis:
        "Prioriza la CREATIVIDAD: especifica tono, estilo, público y ejemplos de referencia, dejando espacio para la exploración pero manteniendo el objetivo claro.",
    },
  };

  // Compone el system prompt final a partir del estilo y el modo de idioma.
  function buildSystemPrompt(styleId, promptLanguage) {
    const style = STYLES[styleId] || STYLES[DEFAULT_STYLE];
    const mode = promptLanguage === "source" ? "source" : "english";
    return `${buildBaseRules(mode)}\n\n${style.emphasis}`;
  }

  root.PromptOptimizerStyles = {
    STYLES,
    buildSystemPrompt,
    DEFAULT_STYLE,
    DEFAULT_PROMPT_LANGUAGE,
  };
})(globalThis);
