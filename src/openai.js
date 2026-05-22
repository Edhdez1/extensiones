// Cliente mínimo para la API de chat completions de OpenAI.

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export class OpenAIError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = "OpenAIError";
    this.status = status;
  }
}

// Reescribe `text` como un prompt optimizado usando el meta-prompt `systemPrompt`.
export async function optimizePrompt({ apiKey, model, systemPrompt, text }) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });
  } catch (err) {
    throw new OpenAIError(
      "No se pudo conectar con OpenAI. Revisa tu conexión a internet."
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error?.message || "";
    } catch {
      // respuesta sin cuerpo JSON
    }
    if (response.status === 401) {
      throw new OpenAIError(
        "API key inválida. Revisa tu clave en los ajustes de la extensión.",
        { status: 401 }
      );
    }
    if (response.status === 429) {
      throw new OpenAIError(
        "Límite o saldo de OpenAI agotado. Inténtalo más tarde.",
        { status: 429 }
      );
    }
    throw new OpenAIError(
      detail || `OpenAI respondió con un error (${response.status}).`,
      { status: response.status }
    );
  }

  const data = await response.json();
  const optimized = data?.choices?.[0]?.message?.content?.trim();
  if (!optimized) {
    throw new OpenAIError("OpenAI devolvió una respuesta vacía.");
  }
  return optimized;
}
