#!/usr/bin/env python3
"""
crop_and_clean.py — 圖示裁切與亮度去背整合腳本

用法：
  1. 裁切並去背總表：
     python crop_and_clean.py images/icon_sheet.png 4 icon_a icon_b icon_c icon_d
  2. 單一檔案直接去背：
     python crop_and_clean.py images/single_icon.png
"""
import sys
import os
from pathlib import Path
from PIL import Image

DARK_THRESHOLD = 45   # 亮度 < 45 -> 完全透明
FADE_THRESHOLD = 80   # 亮度 45~80 -> 漸變透明


def clean_image(img: Image.Image) -> Image.Image:
    """套用亮度去背演算法"""
    img = img.convert("RGBA")
    data = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            # 使用 ITU-R BT.601 亮度公式
            lum = r * 0.299 + g * 0.587 + b * 0.114
            if lum < DARK_THRESHOLD:
                data[x, y] = (r, g, b, 0)
            elif lum < FADE_THRESHOLD:
                ratio = (lum - DARK_THRESHOLD) / (FADE_THRESHOLD - DARK_THRESHOLD)
                data[x, y] = (r, g, b, int(a * ratio))
    return img


def process_sheet(sheet_path: Path, num_icons: int, output_names: list) -> None:
    if not sheet_path.exists():
        print(f"錯誤：找不到圖片檔案 {sheet_path}")
        sys.exit(1)

    img = Image.open(sheet_path).convert("RGBA")
    w, h = img.size

    print(f"正在處理總表 {sheet_path.name}，預計裁切為 {num_icons} 個圖標並去背...")
    
    for i, name in enumerate(output_names):
        # 計算 X 軸範圍
        x0 = i * (w // num_icons)
        x1 = (i + 1) * (w // num_icons) if i < num_icons - 1 else w
        col_w = x1 - x0
        
        # 以中間正方形進行裁切
        sq = min(col_w, h)
        cx, cy = x0 + col_w // 2, h // 2
        crop_box = (cx - sq // 2, cy - sq // 2, cx + sq // 2, cy + sq // 2)
        
        crop = img.crop(crop_box)
        # 縮放到 256x256
        crop = crop.resize((256, 256), Image.Resampling.LANCZOS)
        
        # 去背
        cleaned = clean_image(crop)
        
        # 儲存
        # 如果檔名沒有後綴，自動加上 .png
        out_name = name if name.lower().endswith(".png") else f"{name}.png"
        out_path = sheet_path.parent / out_name
        cleaned.save(out_path)
        print(f"  ✔ 已產生去背圖標：{out_path.name}")


def process_single(file_path: Path) -> None:
    if not file_path.exists():
        print(f"錯誤：找不到圖片檔案 {file_path}")
        sys.exit(1)

    print(f"正在對單一圖片進行亮度去背：{file_path.name}...")
    img = Image.open(file_path)
    cleaned = clean_image(img)
    cleaned.save(file_path)
    print(f"  ✔ 去背完成並已覆蓋：{file_path.name}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    target_path = Path(sys.argv[1])
    
    # 情況 1: 只有一個參數，表示單一檔案去背
    if len(sys.argv) == 2:
        process_single(target_path)
        return

    # 情況 2: 有複數個參數
    # sys.argv[2] 應該是數量
    try:
        num_icons = int(sys.argv[2])
    except ValueError:
        print(f"錯誤：第二個參數 '{sys.argv[2]}' 必須是整數（圖標數量）")
        sys.exit(1)

    output_names = sys.argv[3:]
    
    if len(output_names) != num_icons:
        print(f"警告：指定的輸出名稱數量 ({len(output_names)}) 與圖標數量 ({num_icons}) 不符，將自動調整。")
        if len(output_names) < num_icons:
            # 補齊名稱
            for i in range(len(output_names), num_icons):
                output_names.append(f"icon_{i+1}")
        else:
            output_names = output_names[:num_icons]

    process_sheet(target_path, num_icons, output_names)


if __name__ == "__main__":
    main()
