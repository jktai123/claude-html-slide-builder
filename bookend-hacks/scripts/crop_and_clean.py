#!/usr/bin/env python3
import sys
import argparse
from pathlib import Path
from PIL import Image

DARK_THRESHOLD = 45   # 亮度 < 此值 → 完全透明
FADE_THRESHOLD = 80   # 亮度介於 DARK~FADE → 漸變透明

def remove_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    data = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            lum = r * 0.299 + g * 0.587 + b * 0.114
            if lum < DARK_THRESHOLD:
                data[x, y] = (r, g, b, 0)
            elif lum < FADE_THRESHOLD:
                ratio = (lum - DARK_THRESHOLD) / (FADE_THRESHOLD - DARK_THRESHOLD)
                data[x, y] = (r, g, b, int(255 * ratio))
    return img

def crop_and_clean(image_path: Path, num_icons: int, icon_names: list, out_dir: Path) -> None:
    print(f"Loading {image_path.name}...")
    img = Image.open(image_path)
    W, H = img.size
    
    # 檢查是否有白色邊緣（有些生圖會有卡片效果的白框，我們要把白框切掉，只保留深色區域）
    # 這裡為求保險，先偵測主要的深色邊界
    # 比如在寬度 0.1W ~ 0.9W 之間，高度 0.2H ~ 0.8H 之間
    # 對於 icons_sheet2，從圖片中看，有很大一個白灰框在最外圍
    # 我們的深色背景主要集中在中間，我們可以通过掃描亮度來抓取深色方框
    # 但一般來說，如果是 nested card，深色方框大概在：
    # x: 0.08W 到 0.92W, y: 0.2H 到 0.8H (對於 1024x1024 而言)
    # 我們可以用一個自動檢測深色方框 (bbox) 的方法：
    # 找到所有 (r, g, b) 接近暗色的區域
    left_bound, top_bound, right_bound, bottom_bound = 0, 0, W, H
    
    # 簡易掃描深色區邊界：尋找亮度非常低的區域 (R, G, B < 40) 的最小/最大外包圍
    # 但注意：有些圖標是發光的，所以不能只找低亮度的像素，而是要排除外圍偏亮/灰白的背景。
    # 讓我們只在 Y 軸和 X 軸方向掃描，若某行的平均亮度低於 30，說明是在深色框內部。
    # 為了防呆，我們可以直接為 icons_sheet2 特殊處理裁切框：
    # 如果最外圍有白框，我們檢測白框的內側界線。
    # 其實最簡單的作法是：
    # 尋找第一個非白色的像素 (例如 R, G, B 都 < 220 且與周圍不同)
    # 或是直接針對 width/height 裁切。
    # 我們寫一個自動裁切黑底區域的邏輯：
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    
    # 尋找黑底框 (R<30, G<30, B<30) 的邊界
    dark_pixels = []
    for y in range(0, H, 4):
        for x in range(0, W, 4):
            r, g, b, a = pixels[x, y]
            # 接近深色背景 #0d1117 的色彩 (R<30, G<30, B<35)
            if r < 30 and g < 30 and b < 35:
                dark_pixels.append((x, y))
                
    if dark_pixels:
        min_x = min(p[0] for p in dark_pixels)
        max_x = max(p[0] for p in dark_pixels)
        min_y = min(p[1] for p in dark_pixels)
        max_y = max(p[1] for p in dark_pixels)
        
        # 為了不要切到 icon 本身，並且保持深色背景的完整性：
        # 加上一點 padding，但不可超出原圖
        left_bound = max(0, min_x - 10)
        right_bound = min(W, max_x + 10)
        top_bound = max(0, min_y - 10)
        bottom_bound = min(H, max_y + 10)
        
        print(f"Auto-detected dark content area: x=[{left_bound}, {right_bound}], y=[{top_bound}, {bottom_bound}]")
    else:
        print("Could not auto-detect dark area, using full image.")
        
    # 在偵測到的深色區域內進行 N 等分
    cropped_w = right_bound - left_bound
    cropped_h = bottom_bound - top_bound
    
    col_w = cropped_w / num_icons
    side = min(col_w, cropped_h)
    
    cy = top_bound + cropped_h / 2
    
    for i in range(num_icons):
        cx = left_bound + (i + 0.5) * col_w
        
        left = int(cx - side / 2)
        top = int(cy - side / 2)
        right = int(cx + side / 2)
        bottom = int(cy + side / 2)
        
        # 限制邊界以防越界
        left = max(left_bound, left)
        top = max(top_bound, top)
        right = min(right_bound, right)
        bottom = min(bottom_bound, bottom)
        
        print(f"Cropping icon {i+1}/{num_icons}: {icon_names[i]} at bbox [{left}, {top}, {right}, {bottom}]")
        
        icon_img = img.crop((left, top, right, bottom))
        
        # 亮度去背
        icon_img_clean = remove_bg(icon_img)
        
        # 存檔
        out_path = out_dir / f"{icon_names[i]}.png"
        icon_img_clean.save(out_path)
        print(f"Saved: {out_path.name}")

def main():
    parser = argparse.ArgumentParser(description="icons_sheet 裁切與亮度去背腳本")
    parser.add_argument("image_path", type=str, help="icons_sheet 圖片的路徑")
    parser.add_argument("num_icons", type=int, help="圖標數量")
    parser.add_argument("icon_names", nargs="+", help="裁切後的圖標檔名列表（不含 .png）")
    parser.add_argument("--out-dir", type=str, default="images", help="輸出目錄")
    args = parser.parse_args()
    
    image_path = Path(args.image_path)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if not image_path.exists():
        print(f"Error: {image_path} does not exist.")
        sys.exit(1)
        
    if len(args.icon_names) != args.num_icons:
        print(f"Error: The number of icon names ({len(args.icon_names)}) must match num_icons ({args.num_icons}).")
        sys.exit(1)
        
    crop_and_clean(image_path, args.num_icons, args.icon_names, out_dir)
    print("Crop and clean complete!")

if __name__ == "__main__":
    main()
