#!/usr/bin/env python3
"""Icono de marca 'Promptisma': una pirámide de cristal facetada sobre fondo
negro. Sin dependencias externas. Antialiasing por supersampling.
Salida: brand/promptisma_icon_{N}.png
"""
import os, struct, zlib
from math import hypot

SS = 3  # supersampling

# Fondo (negro con leve degradado para dar profundidad)
BG_TOP = (0x16, 0x16, 0x20)
BG_BOT = (0x05, 0x05, 0x08)

# Caras del cristal (cara izq. iluminada, cara der. en sombra)
LF_TOP, LF_BOT = (0xEC, 0xE9, 0xFF), (0xB7, 0xA6, 0xFF)   # izquierda (clara)
RF_TOP, RF_BOT = (0x9C, 0x88, 0xF2), (0x63, 0x53, 0xEF)   # derecha (violeta)
EDGE = (0xFF, 0xFF, 0xFF)                                  # aristas brillantes

# Geometría normalizada (0..1)
A = (0.50, 0.21)   # ápice
B = (0.24, 0.76)   # base izquierda
C = (0.76, 0.76)   # base derecha
M = (0.50, 0.76)   # punto medio de la base (arista central)
TOP_Y, BOT_Y = A[1], B[1]


def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))
def mix(c1, c2, t): return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


def rounded_box_sd(px, py, cx, cy, half, r):
    qx = abs(px - cx) - (half - r)
    qy = abs(py - cy) - (half - r)
    return (max(qx, 0.0) ** 2 + max(qy, 0.0) ** 2) ** 0.5 + min(max(qx, qy), 0.0) - r


def in_tri(p, a, b, c):
    def sg(p, u, v): return (p[0]-v[0])*(u[1]-v[1]) - (u[0]-v[0])*(p[1]-v[1])
    d1, d2, d3 = sg(p, a, b), sg(p, b, c), sg(p, c, a)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))


def dist_seg(p, a, b):
    vx, vy = b[0]-a[0], b[1]-a[1]
    wx, wy = p[0]-a[0], p[1]-a[1]
    den = vx*vx + vy*vy
    t = clamp((wx*vx + wy*vy)/den) if den else 0.0
    return hypot(p[0]-(a[0]+t*vx), p[1]-(a[1]+t*vy))


def sample(x, y, s):
    cx = cy = s/2.0
    radius = s*0.22
    if rounded_box_sd(x, y, cx, cy, s/2.0 - 0.5, radius) > 0:
        return (0, 0, 0, 0)
    nx, ny = x/s, y/s

    # Fondo
    r, g, b = mix(BG_TOP, BG_BOT, clamp(ny))

    # Pirámide
    Ap, Bp, Cp, Mp = (A[0]*s, A[1]*s), (B[0]*s, B[1]*s), (C[0]*s, C[1]*s), (M[0]*s, M[1]*s)
    if in_tri((x, y), Ap, Bp, Cp):
        ty = clamp((ny - TOP_Y) / (BOT_Y - TOP_Y))
        if nx < 0.5:
            r, g, b = mix(LF_TOP, LF_BOT, ty)     # cara izquierda (clara)
        else:
            r, g, b = mix(RF_TOP, RF_BOT, ty)     # cara derecha (sombra)

        # Aristas brillantes (contorno + arista central)
        w = 0.014 * s
        de = min(dist_seg((x, y), Ap, Bp), dist_seg((x, y), Ap, Cp))
        dc = dist_seg((x, y), Ap, Mp)
        edge = max(clamp(1.0 - de / w), clamp(1.0 - dc / (w * 0.8)) * 0.85)
        if edge > 0:
            r, g, b = mix((r, g, b), EDGE, edge)

        # Destello sutil cerca del ápice
        gl = clamp(1.0 - hypot(x - Ap[0], y - Ap[1]) / (0.10 * s)) * 0.5
        r, g, b = mix((r, g, b), (255, 255, 255), gl)

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
            if out_a > 0:
                r, g, b = ar/aa, ag/aa, ab/aa
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
