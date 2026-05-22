import { optimizePrompt, OpenAIError } from "./openai.js";
import { getStyle, DEFAULT_MODEL, DEFAULT_STYLE } from "./styles.js";

const MENU_ID = "optimize-prompt";

function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "✨ Optimizar como prompt",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);

async function getSettings() {
  const { apiKey, model, style } = await chrome.storage.local.get([
    "apiKey",
    "model",
    "style",
  ]);
  return {
    apiKey: apiKey || "",
    model: model || DEFAULT_MODEL,
    style: style || DEFAULT_STYLE,
  };
}

// Envía un mensaje al content script de la pestaña. Devuelve false si no hay
// receptor (la página se cargó antes de instalar la extensión, o es restringida).
async function sendToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    return false;
  }
}

function notify(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "Prompt Optimizer",
    message,
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
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

  const { apiKey, model, style } = await getSettings();
  if (!apiKey) {
    await sendToTab(tab.id, {
      type: "show-error",
      message:
        "Falta tu API key de OpenAI. Ábre los ajustes de la extensión para configurarla.",
    });
    return;
  }

  try {
    const optimized = await optimizePrompt({
      apiKey,
      model,
      systemPrompt: getStyle(style).system,
      text,
    });
    await sendToTab(tab.id, {
      type: "show-result",
      original: text,
      optimized,
    });
  } catch (err) {
    const message =
      err instanceof OpenAIError
        ? err.message
        : "Ocurrió un error inesperado al optimizar el texto.";
    await sendToTab(tab.id, { type: "show-error", message });
  }
});

// Permite abrir la página de ajustes desde el panel flotante.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "open-options") {
    chrome.runtime.openOptionsPage();
  }
});
