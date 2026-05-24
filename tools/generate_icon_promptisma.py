#!/usr/bin/env python3
"""Genera el icono de marca 'Promptisma': un prisma que refracta un rayo
de luz en un espectro (prompt + prisma). Sin dependencias externas.
Usa supersampling para antialiasing. Salida: brand/promptisma_icon_{N}.png
"""
import os, struct, zlib
from math import hypot

C1 = (0x6D, 0x5E, 0xF8)   # violeta (marca)
C2 = (0x8B, 0x5C, 0xF6)   # púrpura
SS = 3                    # supersampling

# Geometría normalizada (0..1)
TRI = [(0.50, 0.25), (0.30, 0.71), (0.70, 0.71)]   # prisma (triángulo)
IN_P0, IN_P1 = (0.09, 0.49), (0.42, 0.49)          # rayo entrante (izq)
EXIT = (0.605, 0.49)                                # punto de salida (cara derecha)
SPECTRUM = [
    ((0.93, 0.34), (0xEC, 0x3F, 0x3F)),  # rojo
    ((0.94, 0.42), (0xF5, 0x9E, 0x42)),  # naranja
    ((0.94, 0.50), (0xF5, 0xD6, 0x42)),  # amarillo
    ((0.94, 0.58), (0x34, 0xA8, 0x53)),  # verde
    ((0.93, 0.66), (0x42, 0x85, 0xF4)),  # azul
]


def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))


def rounded_box_sd(px, py, cx, cy, half, r):
    qx = abs(px - cx) - (half - r)
    qy = abs(py - cy) - (half - r)
    return (max(qx, 0.0) ** 2 + max(qy, 0.0) ** 2) ** 0.5 + min(max(qx, qy), 0.0) - r


def in_tri(p, a, b, c):
    def sg(p, u, v): return (p[0]-v[0])*(u[1]-v[1]) - (u[0]-v[0])*(p[1]-v[1])
    d1, d2, d3 = sg(p, a, b), sg(p, b, c), sg(p, c, a)
    neg = d1 < 0 or d2 < 0 or d3 < 0
    pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (neg and pos)


def dist_seg(p, a, b):
    vx, vy = b[0]-a[0], b[1]-a[1]
    wx, wy = p[0]-a[0], p[1]-a[1]
    den = vx*vx + vy*vy
    t = clamp((wx*vx + wy*vy)/den) if den else 0.0
    return hypot(p[0]-(a[0]+t*vx), p[1]-(a[1]+t*vy))


def sample(x, y, s):
    """Color (r,g,b,a) en coords de pixel para un subsample."""
    cx = cy = s/2.0
    radius = s*0.22
    d = rounded_box_sd(x, y, cx, cy, s/2.0 - 0.5, radius)
    if d > 0:
        return (0, 0, 0, 0)
    nx, ny = x/s, y/s
    t = clamp((nx + ny)/2.0)
    r, g, b = lerp(C1[0], C2[0], t), lerp(C1[1], C2[1], t), lerp(C1[2], C2[2], t)

    # Espectro de salida (a la derecha del prisma)
    E = (EXIT[0]*s, EXIT[1]*s)
    for (end, col) in SPECTRUM:
        if dist_seg((x, y), E, (end[0]*s, end[1]*s)) <= 0.024*s:
            r, g, b = col

    # Prisma (triángulo blanco)
    A = (TRI[0][0]*s, TRI[0][1]*s)
    B = (TRI[1][0]*s, TRI[1][1]*s)
    Cc = (TRI[2][0]*s, TRI[2][1]*s)
    if in_tri((x, y), A, B, Cc):
        r, g, b = 255, 255, 255

    # Rayo entrante blanco (izquierda)
    if dist_seg((x, y), (IN_P0[0]*s, IN_P0[1]*s), (IN_P1[0]*s, IN_P1[1]*s)) <= 0.022*s:
        r, g, b = 255, 255, 255

    return (r, g, b, 255)


def render(size):
    s = size * SS
    px = bytearray()
    for oy in range(size):
        px.append(0)  # filtro PNG
        for ox in range(size):
            ar = ag = ab = aa = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    r, g, b, a = sample(ox*SS+sx+0.5, oy*SS+sy+0.5, s)
                    af = a/255.0
                    ar += r*af; ag += g*af; ab += b*af; aa += af
            n = SS*SS
            out_a = aa/n
            if out_a > 0:
                r = ar/aa; g = ag/aa; b = ab/aa
            else:
                r = g = b = 0
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
        write_png(os.path.join(out, f"promptisma_icon_{n}.png"), n)


if __name__ == "__main__":
    main()
