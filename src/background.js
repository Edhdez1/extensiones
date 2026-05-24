// Service worker (Chrome) / event page (Firefox). En Chrome carga sus
// dependencias con importScripts; en Firefox se cargan vía background.scripts.
if (typeof importScripts === "function") {
  importScripts("styles.js", "providers.js");
}

// Shim cross-browser: en Firefox `browser.*` es la API basada en promesas;
// en Chrome MV3 `chrome.*` también devuelve promesas para las APIs que usamos.
const api = globalThis.browser || globalThis.chrome;

const { buildSystemPrompt, DEFAULT_STYLE, DEFAULT_PROMPT_LANGUAGE } =
  globalThis.PromptOptimizerStyles;
const { callLLM, LLMError, PROVIDERS, DEFAULT_PROVIDER } =
  globalThis.PromptOptimizerProviders;

const MENU_ID = "optimize-prompt";

function createMenu() {
  api.contextMenus.removeAll(() => {
    api.contextMenus.create({
      id: MENU_ID,
      title: "✨ Optimizar como prompt",
      contexts: ["selection"],
    });
  });
}

api.runtime.onInstalled.addListener(createMenu);
api.runtime.onStartup.addListener(createMenu);

async function getSettings() {
  const { provider, style, promptLanguage, models, keys } =
    await api.storage.local.get([
      "provider",
      "style",
      "promptLanguage",
      "models",
      "keys",
    ]);
  const activeProvider = provider && PROVIDERS[provider] ? provider : DEFAULT_PROVIDER;
  const cfg = PROVIDERS[activeProvider];
  const storedModel = models && models[activeProvider];
  return {
    provider: activeProvider,
    model: cfg.models.includes(storedModel) ? storedModel : cfg.models[0],
    apiKey: (keys && keys[activeProvider]) || "",
    style: style || DEFAULT_STYLE,
    promptLanguage: promptLanguage || DEFAULT_PROMPT_LANGUAGE,
  };
}

async function sendToTab(tabId, message) {
  try {
    await api.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    return false;
  }
}

function notify(message) {
  api.notifications.create({
    type: "basic",
    iconUrl: api.runtime.getURL("icons/icon128.png"),
    title: "Prompt Optimizer",
    message,
  });
}

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  const text = (info.selectionText || "").trim();
  if (!text) return;

  const reachable = await sendToTab(tab.id, { type: "show-loading" });
  if (!reachable) {
    notify(
      "Recarga la página para activar Prompt Optimizer y vuelve a intentarlo."
    );
    return;
  }

  const { provider, model, apiKey, style, promptLanguage } = await getSettings();
  if (!apiKey) {
    await sendToTab(tab.id, {
      type: "show-error",
      message: `Falta la API key de ${PROVIDERS[provider].label}. Abre los ajustes de la extensión para configurarla.`,
    });
    return;
  }

  try {
    const optimized = await callLLM({
      provider,
      apiKey,
      model,
      systemPrompt: buildSystemPrompt(style, promptLanguage),
      text,
    });
    await sendToTab(tab.id, { type: "show-result", original: text, optimized });
  } catch (err) {
    const message =
      err instanceof LLMError
        ? err.message
        : "Ocurrió un error inesperado al optimizar el texto.";
    await sendToTab(tab.id, { type: "show-error", message });
  }
});

api.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "open-options") {
    api.runtime.openOptionsPage();
  }
});
