#!/usr/bin/env python3
"""Assets de tienda para Promptisma (sin dependencias):
- screenshot_template_1280x800.png : marco de marca con tarjeta blanca donde
  pegar la captura del navegador.
- promo_440x280.png : mosaico promocional pequeño con el logo "P".
"""
import os, struct, zlib
from math import hypot

C1 = (0x6D, 0x5E, 0xF8)
C2 = (0x8B, 0x5C, 0xF6)
FACET_HI = (255, 255, 255)
FACET_LO = (0xD7, 0xD0, 0xFB)
CREASE = (0xA9, 0x9B, 0xEC)
SS = 2

# Geometría del monograma "P" (normalizada 0..1 dentro de su caja)
STEM = dict(cx=0.355, cy=0.50, hx=0.062, hy=0.300, r=0.030)
BOWL = dict(cx=0.520, cy=0.380, ro=0.205, ri=0.095)
SPLIT_K = 0.90


def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))
def lerp(a, b, t): return a + (b - a) * t
def mix(c1, c2, t): return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


def rrect_sd(px, py, cx, cy, hx, hy, r):
    qx = abs(px - cx) - (hx - r)
    qy = abs(py - cy) - (hy - r)
    return (max(qx, 0.0) ** 2 + max(qy, 0.0) ** 2) ** 0.5 + min(max(qx, qy), 0.0) - r


def in_P(nx, ny):
    if not (0.0 <= nx <= 1.0 and 0.0 <= ny <= 1.0):
        return None
    stem = rrect_sd(nx, ny, STEM["cx"], STEM["cy"], STEM["hx"], STEM["hy"], STEM["r"]) <= 0
    r = hypot(nx - BOWL["cx"], ny - BOWL["cy"])
    bowl = BOWL["ri"] <= r <= BOWL["ro"]
    if not (stem or bowl):
        return None
    side = nx + ny - SPLIT_K
    if abs(side) / 1.41421 < 0.012:
        return CREASE
    return FACET_HI if side < 0 else FACET_LO


def sample(x, y, w, h, kind):
    nx, ny = x / w, y / h
    r, g, b = mix(C1, C2, clamp((nx + ny) / 2.0))

    if kind == "template":
        # Tarjeta blanca central donde se pega la captura
        mx, top, bot = 70, 120, 60
        cx, cy = w / 2.0, (top + (h - bot)) / 2.0
        hx, hy = (w - 2 * mx) / 2.0, ((h - bot) - top) / 2.0
        if rrect_sd(x, y, cx, cy, hx, hy, 18) <= 0:
            r, g, b = 245, 244, 252  # casi blanco (placeholder)
        # Logo "P" arriba a la izquierda
        L, ox, oy = 60, 46, 38
        col = in_P((x - ox) / L, (y - oy) / L)
        if col:
            r, g, b = col
    else:  # promo
        L = 150
        ox, oy = (w - L) / 2.0, (h - L) / 2.0 - 6
        col = in_P((x - ox) / L, (y - oy) / L)
        if col:
            r, g, b = col

    return (int(r), int(g), int(b))


def render(w, h, kind):
    s_w, s_h = w * SS, h * SS
    px = bytearray()
    for oy in range(h):
        px.append(0)
        for ox in range(w):
            ar = ag = ab = 0
            for sy in range(SS):
                for sx in range(SS):
                    rr, gg, bb = sample(ox * SS + sx + 0.5, oy * SS + sy + 0.5, s_w, s_h, kind)
                    ar += rr; ag += gg; ab += bb
            n = SS * SS
            px.extend((ar // n, ag // n, ab // n))
    return bytes(px)


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, w, h, kind):
    raw = render(w, h, kind)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))  # color type 2 = RGB
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)
    print("escrito", path, f"{w}x{h}")


def main():
    out = os.path.dirname(os.path.abspath(__file__))
    write_png(os.path.join(out, "screenshot_template_1280x800.png"), 1280, 800, "template")
    write_png(os.path.join(out, "promo_440x280.png"), 440, 280, "promo")


if __name__ == "__main__":
    main()
