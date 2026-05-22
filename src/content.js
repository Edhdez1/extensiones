// Content script: muestra un panel flotante aislado (Shadow DOM) con el
// resultado de la optimización y copia el prompt al portapapeles.

(() => {
  const api = globalThis.browser || globalThis.chrome;
  const HOST_ID = "prompt-optimizer-host";
  let refs = null;

  const STYLES = `
    :host { all: initial; }
    .panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 380px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      background: #ffffff;
      color: #1f2330;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(20, 16, 60, 0.28);
      z-index: 2147483647;
      overflow: hidden;
      animation: po-in 140ms ease-out;
    }
    @keyframes po-in {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      background: linear-gradient(135deg, #6d5ef8, #8b5cf6);
      color: #fff;
      cursor: grab;
      user-select: none;
    }
    .header:active { cursor: grabbing; }
    .header .title { font-weight: 600; font-size: 14px; flex: 1; }
    .header .spark { font-size: 16px; }
    .close {
      border: none;
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      width: 26px;
      height: 26px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      display: grid;
      place-items: center;
    }
    .close:hover { background: rgba(255, 255, 255, 0.32); }
    .body { padding: 14px; overflow-y: auto; }
    .loading { display: flex; align-items: center; gap: 10px; color: #5b5f6e; padding: 6px 0; }
    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid #d9d6f5;
      border-top-color: #6d5ef8;
      border-radius: 50%;
      animation: po-spin 700ms linear infinite;
    }
    @keyframes po-spin { to { transform: rotate(360deg); } }
    .result {
      white-space: pre-wrap;
      word-break: break-word;
      background: #f6f5fe;
      border: 1px solid #e7e4fb;
      border-radius: 10px;
      padding: 12px;
      max-height: 320px;
      overflow-y: auto;
    }
    .error {
      background: #fdecec;
      border: 1px solid #f6c9c9;
      color: #9a2424;
      border-radius: 10px;
      padding: 12px;
    }
    .original {
      margin-top: 10px;
      color: #6b6f7d;
      font-size: 13px;
    }
    .original summary { cursor: pointer; user-select: none; }
    .original .text {
      margin-top: 6px;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f3f3f6;
      border-radius: 8px;
      padding: 10px;
    }
    .footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid #eeedf5;
    }
    .btn {
      border: none;
      border-radius: 9px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary { background: #6d5ef8; color: #fff; }
    .btn-primary:hover { background: #5b4cf0; }
    .btn-ghost { background: #f0eefb; color: #5b4cf0; }
    .btn-ghost:hover { background: #e5e1fa; }
    .status { font-size: 12px; color: #38a169; flex: 1; opacity: 0; transition: opacity 120ms; }
    .status.show { opacity: 1; }
  `;

  function ensurePanel() {
    if (refs) return refs;

    const host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="header" data-drag>
        <span class="spark">✨</span>
        <span class="title">Prompt optimizado</span>
        <button class="close" title="Cerrar" data-close>×</button>
      </div>
      <div class="body" data-body></div>
      <div class="footer" data-footer hidden>
        <span class="status" data-status>Copiado al portapapeles</span>
        <button class="btn btn-ghost" data-copy>Copiar</button>
      </div>
    `;
    shadow.appendChild(panel);
    document.documentElement.appendChild(host);

    refs = {
      host,
      panel,
      body: panel.querySelector("[data-body]"),
      footer: panel.querySelector("[data-footer]"),
      status: panel.querySelector("[data-status]"),
      copyBtn: panel.querySelector("[data-copy]"),
      header: panel.querySelector("[data-drag]"),
    };

    panel.querySelector("[data-close]").addEventListener("click", remove);
    enableDrag(refs.header, panel);
    return refs;
  }

  function remove() {
    if (refs?.host?.parentNode) refs.host.parentNode.removeChild(refs.host);
    refs = null;
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape") remove();
  }

  function enableDrag(handle, panel) {
    let startX, startY, originLeft, originTop;
    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("[data-close]")) return;
      const rect = panel.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      panel.style.right = "auto";
      panel.style.left = `${originLeft}px`;
      panel.style.top = `${originTop}px`;
      const onMove = (ev) => {
        panel.style.left = `${originLeft + ev.clientX - startX}px`;
        panel.style.top = `${originTop + ev.clientY - startY}px`;
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      e.preventDefault();
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function flashStatus() {
    if (!refs) return;
    refs.status.classList.add("show");
    setTimeout(() => refs?.status.classList.remove("show"), 1800);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function showLoading() {
    const r = ensurePanel();
    r.footer.hidden = true;
    r.body.innerHTML = `
      <div class="loading">
        <span class="spinner"></span>
        <span>Optimizando tu texto…</span>
      </div>`;
    document.addEventListener("keydown", onKeydown);
  }

  async function showResult(original, optimized) {
    const r = ensurePanel();
    r.body.innerHTML = `
      <div class="result" data-result></div>
      <details class="original">
        <summary>Ver texto original</summary>
        <div class="text"></div>
      </details>`;
    r.body.querySelector("[data-result]").textContent = optimized;
    r.body.querySelector(".original .text").textContent = original;
    r.footer.hidden = false;

    r.copyBtn.onclick = async () => {
      if (await copyText(optimized)) flashStatus();
    };

    // Intento de copia automática (puede fallar si el navegador exige gesto reciente).
    if (await copyText(optimized)) flashStatus();
  }

  function showError(message) {
    const r = ensurePanel();
    r.footer.hidden = true;
    r.body.innerHTML = `
      <div class="error">${escapeHtml(message)}</div>
      <div class="footer-actions" style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn-primary" data-options>Abrir ajustes</button>
      </div>`;
    const optBtn = r.body.querySelector("[data-options]");
    if (optBtn) {
      optBtn.onclick = () => api.runtime.sendMessage({ type: "open-options" });
    }
    document.addEventListener("keydown", onKeydown);
  }

  api.runtime.onMessage.addListener((msg) => {
    if (!msg?.type) return;
    if (msg.type === "show-loading") showLoading();
    else if (msg.type === "show-result") showResult(msg.original, msg.optimized);
    else if (msg.type === "show-error") showError(msg.message);
  });
})();
