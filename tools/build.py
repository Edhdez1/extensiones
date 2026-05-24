#!/usr/bin/env python3
"""Genera paquetes de distribución por tienda desde una sola base de código.
- Chrome: background usa solo `service_worker` (MV3 de Chrome).
- Firefox: background usa solo `scripts` (MV3 de Firefox; evita el aviso de
  `service_worker` no soportado).
El manifest.json del repo conserva ambas claves para poder cargar la extensión
sin empaquetar (load unpacked) en los dos navegadores durante el desarrollo.
"""
import json, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = [
    "src/styles.js", "src/providers.js", "src/pro.js", "src/background.js",
    "src/content.js", "src/popup.html", "src/popup.css", "src/popup.js",
]
ICONS = ["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"]


def build(target, manifest):
    name = f"promptisma-{target}-{manifest['version']}.zip"
    path = os.path.join(ROOT, name)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for f in SRC + ICONS:
            z.write(os.path.join(ROOT, f), f)
    print("generado", name)


def main():
    base = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))

    chrome = json.loads(json.dumps(base))
    chrome["background"] = {"service_worker": "src/background.js"}

    firefox = json.loads(json.dumps(base))
    firefox["background"] = {"scripts": ["src/styles.js", "src/providers.js", "src/pro.js", "src/background.js"]}

    build("chrome", chrome)
    build("firefox", firefox)


if __name__ == "__main__":
    main()
