#!/usr/bin/env python3
"""Genera los iconos PNG de la extensión sin dependencias externas.

Dibuja una "chispa" (estrella de 4 puntas) blanca sobre un degradado violeta
con esquinas redondeadas. Ejecuta: python3 tools/generate_icons.py
"""
import os
import struct
import zlib

C1 = (0x6D, 0x5E, 0xF8)  # violeta
C2 = (0x8B, 0x5C, 0xF6)  # púrpura


def lerp(a, b, t):
    return a + (b - a) * t


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def rounded_box_sd(px, py, cx, cy, half, r):
    """Distancia con signo a una caja con esquinas redondeadas (negativa = dentro)."""
    qx = abs(px - cx) - (half - r)
    qy = abs(py - cy) - (half - r)
    outside = (max(qx, 0.0) ** 2 + max(qy, 0.0) ** 2) ** 0.5
    inside = min(max(qx, qy), 0.0)
    return outside + inside - r


def render(size):
    cx = cy = size / 2.0
    half = size / 2.0
    radius = size * 0.22
    spark_r = size * 0.36
    pixels = bytearray()
    for y in range(size):
        pixels.append(0)  # byte de filtro por scanline
        for x in range(size):
            px, py = x + 0.5, y + 0.5

            # Máscara de la tarjeta redondeada (con antialias de ~1px).
            d = rounded_box_sd(px, py, cx, cy, half - 0.5, radius)
            bg_alpha = clamp(0.5 - d)

            # Degradado diagonal.
            t = clamp(((px / size) + (py / size)) / 2.0)
            r = lerp(C1[0], C2[0], t)
            g = lerp(C1[1], C2[1], t)
            b = lerp(C1[2], C2[2], t)

            # Chispa (astroide de 4 puntas) centrada.
            u = (px - cx) / spark_r
            v = (py - cy) / spark_r
            f = abs(u) ** 0.55 + abs(v) ** 0.55
            spark = clamp((1.0 - f) / 0.10)

            r = lerp(r, 255, spark)
            g = lerp(g, 255, spark)
            b = lerp(b, 255, spark)

            a = bg_alpha
            pixels.extend(
                (int(round(r)), int(round(g)), int(round(b)), int(round(a * 255)))
            )
    return bytes(pixels)


def chunk(tag, data):
    out = struct.pack(">I", len(data)) + tag + data
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return out + struct.pack(">I", crc)


def write_png(path, size):
    raw = render(size)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as fh:
        fh.write(png)
    print(f"escrito {path} ({size}x{size})")


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(out_dir, exist_ok=True)
    for s in (16, 48, 128):
        write_png(os.path.join(out_dir, f"icon{s}.png"), s)


if __name__ == "__main__":
    main()
