// Capa "Pro" (freemium): estado de licencia e historial local de prompts.
// El estado Pro se respaldará con ExtensionPay (ver openUpgrade en popup.js);
// por ahora usa un flag local (`proActive`) que el interruptor de pruebas activa.
(function (root) {
  const api = globalThis.browser || globalThis.chrome;
  const PRO_KEY = "proActive";
  const HISTORY_KEY = "history";
  const HISTORY_LIMIT = 100;

  async function isPro() {
    const data = await api.storage.local.get(PRO_KEY);
    return data[PRO_KEY] === true;
  }

  async function setPro(value) {
    await api.storage.local.set({ [PRO_KEY]: value === true });
  }

  // Guarda una optimización al inicio del historial (más reciente primero).
  async function addToHistory(entry) {
    const data = await api.storage.local.get(HISTORY_KEY);
    const history = Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
    history.unshift({
      original: entry.original,
      optimized: entry.optimized,
      style: entry.style || "",
      provider: entry.provider || "",
      ts: Date.now(),
    });
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
    await api.storage.local.set({ [HISTORY_KEY]: history });
  }

  async function getHistory() {
    const data = await api.storage.local.get(HISTORY_KEY);
    return Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
  }

  async function clearHistory() {
    await api.storage.local.set({ [HISTORY_KEY]: [] });
  }

  root.PromptOptimizerPro = {
    isPro,
    setPro,
    addToHistory,
    getHistory,
    clearHistory,
  };
})(globalThis);
