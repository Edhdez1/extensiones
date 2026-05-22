import { STYLES, DEFAULT_MODEL, DEFAULT_STYLE } from "./styles.js";

const $ = (id) => document.getElementById(id);

const apiKeyInput = $("apiKey");
const modelSelect = $("model");
const styleSelect = $("style");
const styleHint = $("styleHint");
const statusEl = $("status");

function populateStyles() {
  for (const [id, style] of Object.entries(STYLES)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = style.label;
    styleSelect.appendChild(opt);
  }
}

function updateStyleHint() {
  styleHint.textContent = STYLES[styleSelect.value]?.description || "";
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
  populateStyles();
  const { apiKey, model, style } = await chrome.storage.local.get([
    "apiKey",
    "model",
    "style",
  ]);
  apiKeyInput.value = apiKey || "";
  modelSelect.value = model || DEFAULT_MODEL;
  styleSelect.value = style || DEFAULT_STYLE;
  updateStyleHint();
}

async function save() {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey && !apiKey.startsWith("sk-")) {
    showStatus("La API key suele empezar por 'sk-'. Revísala.", "err");
    return;
  }
  await chrome.storage.local.set({
    apiKey,
    model: modelSelect.value,
    style: styleSelect.value,
  });
  showStatus("Ajustes guardados ✓", "ok");
}

$("toggleKey").addEventListener("click", () => {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
});
styleSelect.addEventListener("change", updateStyleHint);
$("save").addEventListener("click", save);

load();
