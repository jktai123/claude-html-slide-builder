"""
台灣教育部成語典資料處理器
來源：教育部《成語典》官方 CSV（dict_idioms.csv，由萌典開源專案提供）
規則：
  1. 僅保留 4 字成語
  2. 成語四字均需為 CJK 漢字（Unicode 4E00-9FFF），排除罕見或特殊符號
  3. 僅保留在官方辭典中「有收錄使用例句」者，此為教育部認定的常用成語
     （example 欄位非空），以確保題目中只出現臺灣通用、真實常用的成語
"""

import csv
import json
import os
import re


def clean_zhuyin(zy: str) -> str:
    if not zy:
        return ""
    zy = re.sub(r'\s+', ' ', zy).strip()
    if "（變）" in zy:
        zy = zy.split("（變）")[0].strip()
    zy = zy.replace("　", " ")
    zy = re.sub(r'\s+', ' ', zy).strip()
    return zy


def clean_pinyin(py: str) -> str:
    if not py:
        return ""
    py = re.sub(r'\s+', ' ', py).strip()
    if "（變）" in py:
        py = py.split("（變）")[0].strip()
    py = py.replace("　", " ")
    py = re.sub(r'\s+', ' ', py).strip()
    return py


def is_all_cjk(word: str) -> bool:
    """確認四個字均為常見 CJK 漢字（排除罕用字、表意文字擴充區等）"""
    for char in word:
        cp = ord(char)
        # 只接受基本 CJK 區 (4E00-9FFF)
        if not (0x4E00 <= cp <= 0x9FFF):
            return False
    return True


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, "dict_idioms.csv")
    output_path = os.path.join(script_dir, "idioms_zh_tw.json")

    if not os.path.exists(input_path):
        print(f"找不到輸入檔案: {input_path}")
        return

    print("開始讀取教育部成語典 CSV 資料...")

    all_4char = []
    with_example = []

    with open(input_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"CSV Header: {header}")

        for row in reader:
            if len(row) < 13:
                continue

            word        = row[1].strip()
            zhuyin      = row[2].strip()
            pinyin      = row[3].strip()
            explanation = row[4].strip()
            derivation  = row[6].strip()
            example     = row[12].strip()  # 用法-例句

            # 僅保留 4 字成語
            if len(word) != 4:
                continue

            # 四字均須為 CJK 基本漢字
            if not is_all_cjk(word):
                continue

            # 釋義不能過短（過短代表資料不完整）
            if len(explanation) < 5:
                continue

            entry = {
                "word":        word,
                "zhuyin":      clean_zhuyin(zhuyin),
                "pinyin":      clean_pinyin(pinyin),
                "explanation": explanation,
                "derivation":  derivation,
                "has_example": bool(example)
            }

            all_4char.append(entry)
            if example:
                with_example.append(entry)

    print(f"教育部成語典 4 字成語總數：{len(all_4char)}")
    print(f"其中「有用法例句」（常用）者：{len(with_example)}")

    # 以「有例句」作為常用成語的基準，這是教育部官方認定的通用成語
    # 若數量不足 1500 則退而求其次，把有完整釋義者也納入（但目前通常 > 2000）
    if len(with_example) >= 1500:
        final = with_example
        print("使用策略：只保留有例句的常用教育部成語")
    else:
        final = all_4char
        print("警告：有例句者不足 1500，改用全部 4 字成語")

    # 去掉 has_example 這個輔助欄位，寫入最終 JSON
    output = []
    for item in final:
        output.append({
            "word":        item["word"],
            "zhuyin":      item["zhuyin"],
            "pinyin":      item["pinyin"],
            "explanation": item["explanation"],
            "derivation":  item["derivation"]
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=4)

    print(f"完成！共 {len(output)} 個臺灣常用成語已寫入：{output_path}")


if __name__ == "__main__":
    main()
