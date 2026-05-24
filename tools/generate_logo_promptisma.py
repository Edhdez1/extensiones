#!/usr/bin/env python3
"""Logo original de 'Promptisma': monograma 'P' tallado como cristal (dos
facetas con arista de corte y un destello), sobre el degradado violeta de
marca. Geometría propia (sin tipografía ni plantillas). Sin dependencias.
Salida: brand/promptisma_logo_{N}.png
"""
import os, struct, zlib
from math import hypot

SS = 3
C1 = (0x6D, 0x5E, 0xF8)   # violeta (marca)
C2 = (0x8B, 0x5C, 0xF6)   # púrpura
FACET_HI = (255, 255, 255)        # faceta iluminada
FACET_LO = (0xD7, 0xD0, 0xFB)     # faceta en penumbra (lavanda)
CREASE   = (0xA9, 0x9B, 0xEC)     # arista de corte (violeta suave)

# Monograma "P" (coords normalizadas 0..1)
STEM = dict(cx=0.355, cy=0.50, hx=0.062, hy=0.300, r=0.030)   # asta vertical
BOWL = dict(cx=0.520, cy=0.380, ro=0.205, ri=0.095)           # bucle (anillo)
SPLIT_K = 0.90            # línea de faceta: nx+ny = K
GLINT_A, GLINT_B = (0.44, 0.235), (0.565, 0.30)   # destello en el borde superior


def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))
def mix(c1, c2, t): return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


def rrect_sd(px, py, cx, cy, hx, hy, r):
    qx = abs(px - cx) - (hx - r)
    qy = abs(py - cy) - (hy - r)
    return (max(qx, 0.0) ** 2 + max(qy, 0.0) ** 2) ** 0.5 + min(max(qx, qy), 0.0) - r


def dist_seg(p, a, b):
    vx, vy = b[0]-a[0], b[1]-a[1]
    wx, wy = p[0]-a[0], p[1]-a[1]
    den = vx*vx + vy*vy
    t = clamp((wx*vx + wy*vy)/den) if den else 0.0
    return hypot(p[0]-(a[0]+t*vx), p[1]-(a[1]+t*vy))


def in_P(nx, ny):
    stem = rrect_sd(nx, ny, STEM["cx"], STEM["cy"], STEM["hx"], STEM["hy"], STEM["r"]) <= 0
    r = hypot(nx - BOWL["cx"], ny - BOWL["cy"])
    bowl = BOWL["ri"] <= r <= BOWL["ro"]
    return stem or bowl


def sample(x, y, s):
    cx = cy = s/2.0
    if rrect_sd(x, y, cx, cy, s/2.0 - 0.5, s/2.0 - 0.5, s*0.22) > 0:
        return (0, 0, 0, 0)
    nx, ny = x/s, y/s
    # Fondo: degradado violeta diagonal
    t = clamp((nx + ny)/2.0)
    r, g, b = mix(C1, C2, t)

    if in_P(nx, ny):
        # Faceta por lado de la línea de corte
        side = nx + ny - SPLIT_K
        r, g, b = (FACET_HI if side < 0 else FACET_LO)
        # Arista de corte (cresta del cristal)
        if abs(side) / 1.41421 < 0.012:
            r, g, b = CREASE
        # Destello (glint) en el borde superior del bucle
        if dist_seg((nx, ny), GLINT_A, GLINT_B) < 0.014:
            r, g, b = (255, 255, 255)
    return (int(r), int(g), int(b), 255)


def render(size):
    s = size * SS
    px = bytearray()
    for oy in range(size):
        px.append(0)
        for ox in range(size):
            ar = ag = ab = aa = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    rr, gg, bb, a = sample(ox*SS+sx+0.5, oy*SS+sy+0.5, s)
                    af = a/255.0
                    ar += rr*af; ag += gg*af; ab += bb*af; aa += af
            n = SS*SS
            out_a = aa/n
            r, g, b = (ar/aa, ag/aa, ab/aa) if out_a > 0 else (0, 0, 0)
            px.extend((int(round(r)), int(round(g)), int(round(b)), int(round(out_a*255))))
    return bytes(px)


def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))


def write_png(path, size):
    raw = render(size)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)
    print("escrito", path, f"{size}x{size}")


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "brand")
    os.makedirs(out, exist_ok=True)
    for n in (16, 48, 128, 512):
        write_png(os.path.join(out, f"promptisma_logo_{n}.png"), n)


if __name__ == "__main__":
    main()
