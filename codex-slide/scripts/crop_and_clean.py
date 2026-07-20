#!/usr/bin/env python3
import sys
import os
from PIL import Image

def main():
    if len(sys.argv) < 4:
        print("Usage: python crop_and_clean.py <sheet_path> <num_icons> <name1> <name2> ...")
        sys.exit(1)

    sheet_path = sys.argv[1]
    num_icons = int(sys.argv[2])
    names = sys.argv[3:]

    if len(names) != num_icons:
        print(f"Error: Expected {num_icons} names, but got {len(names)}.")
        sys.exit(1)

    if not os.path.exists(sheet_path):
        print(f"Error: File not found {sheet_path}")
        sys.exit(1)

    # Open image
    img = Image.open(sheet_path).convert("RGBA")
    w, h = img.size
    col_width = w / num_icons

    print(f"Processing sheet: {w}x{h}, icons: {num_icons}, col_width: {col_width:.1f}")

    DARK_THRESHOLD = 45
    FADE_THRESHOLD = 80

    out_dir = os.path.dirname(sheet_path)
    if not out_dir:
        out_dir = "."

    for i in range(num_icons):
        name = names[i]
        # Calculate bounding box of the i-th column
        left = int(i * col_width)
        right = int((i + 1) * col_width)
        top = 0
        bottom = h

        # Crop the column
        cropped = img.crop((left, top, right, bottom))
        
        # Center-crop a square of size min(col_width, h)
        cw, ch = cropped.size
        side = min(cw, ch)
        cx = cw // 2
        cy = ch // 2
        
        square = cropped.crop((cx - side//2, cy - side//2, cx + side//2, cy + side//2))
        
        # Make background transparent based on luminance
        data = square.load()
        sw, sh = square.size
        for y in range(sh):
            for x in range(sw):
                r, g, b, a = data[x, y]
                lum = r * 0.299 + g * 0.587 + b * 0.114
                if lum < DARK_THRESHOLD:
                    data[x, y] = (r, g, b, 0)
                elif lum < FADE_THRESHOLD:
                    ratio = (lum - DARK_THRESHOLD) / (FADE_THRESHOLD - DARK_THRESHOLD)
                    data[x, y] = (r, g, b, int(255 * ratio))

        out_path = os.path.join(out_dir, f"{name}.png")
        square.save(out_path)
        print(f"  Saved icon: {out_path}")

    print("Crop and clean finished successfully!")

if __name__ == "__main__":
    main()
