// Proveedores de modelos de IA. Script clásico: expone un global con el
// catálogo de proveedores y una función unificada para optimizar texto.
// Permite alternar de proveedor (p. ej. usar uno gratuito cuando se agota
// el saldo de OpenAI) sin cambiar el resto de la extensión.
(function (root) {
  const DEFAULT_PROVIDER = "pollinations";

  class LLMError extends Error {
    constructor(message, { status } = {}) {
      super(message);
      this.name = "LLMError";
      this.status = status;
    }
  }

  // Adaptador para APIs compatibles con el formato chat/completions de OpenAI
  // (OpenAI, Groq, OpenRouter y otros endpoints compatibles).
  function openAICompatible({ baseUrl, extraHeaders }) {
    return {
      buildRequest({ apiKey, model, systemPrompt, text }) {
        const headers = {
          "Content-Type": "application/json",
          ...(extraHeaders || {}),
        };
        // Algunos proveedores (p. ej. Pollinations) no requieren clave.
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        return {
          url: `${baseUrl}/chat/completions`,
          headers,
          body: {
            model,
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
          },
        };
      },
      parse(raw) {
        return JSON.parse(raw)?.choices?.[0]?.message?.content?.trim();
      },
    };
  }

  // Adaptador para Pollinations (gratis, sin clave). El endpoint "legacy"
  // acepta un cuerpo estilo OpenAI y devuelve TEXTO PLANO (no JSON).
  const pollinationsAdapter = {
    buildRequest({ model, systemPrompt, text }) {
      return {
        url: "https://text.pollinations.ai/",
        headers: { "Content-Type": "application/json" },
        body: {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
        },
      };
    },
    parse(raw) {
      return raw?.trim();
    },
  };

  // Adaptador para la API generateContent de Google Gemini.
  const geminiAdapter = {
    buildRequest({ apiKey, model, systemPrompt, text }) {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { temperature: 0.4 },
        },
      };
    },
    parse(raw) {
      return JSON.parse(raw)?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    },
  };

  const PROVIDERS = {
    pollinations: {
      label: "Pollinations",
      free: true,
      needsKey: false,
      keyHint: "No necesita clave.",
      keyUrl: "https://pollinations.ai",
      models: ["openai"],
      adapter: pollinationsAdapter,
    },
    openai: {
      label: "OpenAI",
      free: false,
      needsKey: true,
      keyHint: "Empieza por 'sk-'. Crea una en platform.openai.com/api-keys",
      keyUrl: "https://platform.openai.com/api-keys",
      models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
      adapter: openAICompatible({ baseUrl: "https://api.openai.com/v1" }),
    },
    gemini: {
      label: "Google Gemini",
      free: true,
      needsKey: true,
      keyHint: "API key gratuita en aistudio.google.com/apikey",
      keyUrl: "https://aistudio.google.com/apikey",
      models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
      adapter: geminiAdapter,
    },
    groq: {
      label: "Groq",
      free: true,
      needsKey: true,
      keyHint: "API key gratuita en console.groq.com/keys",
      keyUrl: "https://console.groq.com/keys",
      models: [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it",
      ],
      adapter: openAICompatible({ baseUrl: "https://api.groq.com/openai/v1" }),
    },
    openrouter: {
      label: "OpenRouter",
      free: true,
      needsKey: true,
      keyHint: "API key en openrouter.ai/keys (incluye modelos :free)",
      keyUrl: "https://openrouter.ai/keys",
      models: [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemini-2.0-flash-exp:free",
        "deepseek/deepseek-chat-v3-0324:free",
      ],
      adapter: openAICompatible({
        baseUrl: "https://openrouter.ai/api/v1",
        extraHeaders: {
          "HTTP-Referer": "https://github.com/Edhdez1/extensiones",
          "X-Title": "Promptisma",
        },
      }),
    },
  };

  async function callLLM({ provider, apiKey, model, systemPrompt, text }) {
    const cfg = PROVIDERS[provider];
    if (!cfg) throw new LLMError(`Proveedor desconocido: ${provider}`);

    const req = cfg.adapter.buildRequest({ apiKey, model, systemPrompt, text });

    let response;
    try {
      response = await fetch(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(req.body),
      });
    } catch {
      throw new LLMError(
        "No se pudo conectar con el proveedor. Revisa tu conexión a internet."
      );
    }

    // Los proveedores devuelven JSON, pero Pollinations responde texto plano:
    // leemos siempre como texto y cada adaptador lo interpreta.
    const raw = await response.text();

    if (!response.ok) {
      let detail = "";
      try {
        detail = JSON.parse(raw)?.error?.message || "";
      } catch {
        detail = raw && raw.length < 200 ? raw : "";
      }
      const keyless = cfg.needsKey === false;
      if (response.status === 401 || response.status === 403 || response.status === 402) {
        throw new LLMError(
          keyless
            ? `El servicio gratuito ${cfg.label} requiere clave o está restringido ahora. Prueba con otro proveedor en los ajustes.`
            : `API key inválida o sin permisos para ${cfg.label}. Revísala en los ajustes.`,
          { status: response.status }
        );
      }
      if (response.status === 429) {
        throw new LLMError(
          keyless
            ? `El servicio gratuito ${cfg.label} está saturado. Prueba de nuevo o cambia de proveedor en los ajustes.`
            : `Límite o saldo agotado en ${cfg.label}. Prueba con otro proveedor en los ajustes.`,
          { status: 429 }
        );
      }
      throw new LLMError(
        detail || `${cfg.label} respondió con un error (${response.status}).`,
        { status: response.status }
      );
    }

    let out;
    try {
      out = cfg.adapter.parse(raw);
    } catch {
      out = "";
    }
    if (!out) throw new LLMError(`${cfg.label} devolvió una respuesta vacía.`);
    return out;
  }

  root.PromptOptimizerProviders = {
    PROVIDERS,
    callLLM,
    LLMError,
    DEFAULT_PROVIDER,
  };
})(globalThis);
