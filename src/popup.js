// Página de ajustes (script clásico). Usa los globales de styles.js y
// providers.js, y el shim cross-browser para storage.
const api = globalThis.browser || globalThis.chrome;
const { STYLES, DEFAULT_STYLE, DEFAULT_PROMPT_LANGUAGE } =
  globalThis.PromptOptimizerStyles;
const { PROVIDERS, DEFAULT_PROVIDER } = globalThis.PromptOptimizerProviders;
const Pro = globalThis.PromptOptimizerPro;

const $ = (id) => document.getElementById(id);

const providerSelect = $("provider");
const providerHint = $("providerHint");
const keyField = $("keyField");
const apiKeyInput = $("apiKey");
const keyLink = $("keyLink");
const keyHint = $("keyHint");
const modelSelect = $("model");
const styleSelect = $("style");
const styleHint = $("styleHint");
const promptLanguageSelect = $("promptLanguage");
const statusEl = $("status");
const proBadge = $("proBadge");
const proToggle = $("proToggle");
const historySection = $("historySection");
const historySearch = $("historySearch");
const historyList = $("historyList");

// Estado en memoria de las claves por proveedor (se persiste al guardar).
let keys = {};
let models = {};

function fillSelect(select, entries, selected) {
  select.innerHTML = "";
  for (const [value, label] of entries) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  }
  if (selected != null) select.value = selected;
}

function populateProviders() {
  fillSelect(
    providerSelect,
    Object.entries(PROVIDERS).map(([id, p]) => [
      id,
      p.free ? `${p.label} (gratis)` : p.label,
    ])
  );
}

function populateStyles() {
  fillSelect(
    styleSelect,
    Object.entries(STYLES).map(([id, s]) => [id, s.label])
  );
}

// Refresca modelo, clave y textos de ayuda al cambiar de proveedor.
function onProviderChange() {
  const id = providerSelect.value;
  const cfg = PROVIDERS[id];

  // Si el modelo guardado ya no existe (p. ej. fue retirado), usa el por defecto.
  const selectedModel = cfg.models.includes(models[id]) ? models[id] : cfg.models[0];
  models[id] = selectedModel;

  fillSelect(
    modelSelect,
    cfg.models.map((m) => [m, m]),
    selectedModel
  );

  const keyless = cfg.needsKey === false;
  keyField.style.display = keyless ? "none" : "";
  if (keyless) {
    apiKeyInput.value = "";
    keys[id] = "";
  } else {
    apiKeyInput.value = keys[id] || "";
    keyHint.textContent = cfg.keyHint;
    keyLink.href = cfg.keyUrl;
  }
  providerHint.textContent = keyless
    ? "Funciona sin clave. Servicio gratuito de terceros: calidad y disponibilidad variables."
    : cfg.free
    ? "Tiene capa gratuita: úsalo cuando se agote el saldo de otro proveedor."
    : "Requiere saldo de pago en tu cuenta.";
}

function updateStyleHint() {
  styleHint.textContent = STYLES[styleSelect.value]?.description || "";
}

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

async function renderHistory() {
  const all = await Pro.getHistory();
  const q = historySearch.value.trim().toLowerCase();
  const items = q
    ? all.filter(
        (h) =>
          (h.optimized || "").toLowerCase().includes(q) ||
          (h.original || "").toLowerCase().includes(q)
      )
    : all;

  historyList.textContent = "";
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = q ? "Sin coincidencias." : "Aún no hay prompts guardados.";
    historyList.appendChild(empty);
    return;
  }

  for (const h of items) {
    const card = document.createElement("div");
    card.className = "history-item";

    const opt = document.createElement("div");
    opt.className = "hi-optimized";
    opt.textContent = h.optimized || "";

    const meta = document.createElement("div");
    meta.className = "hi-meta";
    meta.textContent = `${h.style || ""} · ${fmtTime(h.ts)}`;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "link-btn";
    copy.textContent = "Copiar";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(h.optimized || "");
        copy.textContent = "Copiado ✓";
        setTimeout(() => (copy.textContent = "Copiar"), 1500);
      } catch {
        copy.textContent = "Error";
      }
    });

    card.appendChild(opt);
    card.appendChild(meta);
    card.appendChild(copy);
    historyList.appendChild(card);
  }
}

async function renderPro() {
  const pro = await Pro.isPro();
  proBadge.textContent = pro ? "Pro ✓" : "Free";
  proBadge.classList.toggle("on", pro);
  proToggle.checked = pro;
  historySection.hidden = !pro;
  if (pro) renderHistory();
}

function showStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
  if (message) {
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "status";
    }, 2500);
  }
}

async function load() {
  populateProviders();
  populateStyles();

  const stored = await api.storage.local.get([
    "provider",
    "style",
    "promptLanguage",
    "models",
    "keys",
  ]);
  keys = stored.keys || {};
  models = stored.models || {};

  providerSelect.value =
    stored.provider && PROVIDERS[stored.provider]
      ? stored.provider
      : DEFAULT_PROVIDER;
  styleSelect.value = stored.style || DEFAULT_STYLE;
  promptLanguageSelect.value = stored.promptLanguage || DEFAULT_PROMPT_LANGUAGE;

  onProviderChange();
  updateStyleHint();
  renderPro();
}

async function save() {
  const provider = providerSelect.value;
  const key = apiKeyInput.value.trim();

  if (provider === "openai" && key && !key.startsWith("sk-")) {
    showStatus("La API key de OpenAI suele empezar por 'sk-'. Revísala.", "err");
    return;
  }

  // Persiste la clave y el modelo del proveedor activo sin borrar los demás.
  keys[provider] = key;
  models[provider] = modelSelect.value;

  await api.storage.local.set({
    provider,
    style: styleSelect.value,
    promptLanguage: promptLanguageSelect.value,
    keys,
    models,
  });
  showStatus("Ajustes guardados ✓", "ok");
}

$("toggleKey").addEventListener("click", () => {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
});
providerSelect.addEventListener("change", onProviderChange);
modelSelect.addEventListener("change", () => {
  models[providerSelect.value] = modelSelect.value;
});
apiKeyInput.addEventListener("input", () => {
  keys[providerSelect.value] = apiKeyInput.value.trim();
});
styleSelect.addEventListener("change", updateStyleHint);
$("save").addEventListener("click", save);

proToggle.addEventListener("change", async () => {
  await Pro.setPro(proToggle.checked);
  renderPro();
});
$("upgrade").addEventListener("click", () => {
  // TODO ExtensionPay: aquí se abrirá la página de pago (extpay.openPaymentPage()).
  showStatus("La compra se habilitará al conectar ExtensionPay.", "ok");
});
$("clearHistory").addEventListener("click", async () => {
  await Pro.clearHistory();
  renderHistory();
});
historySearch.addEventListener("input", renderHistory);

load();
