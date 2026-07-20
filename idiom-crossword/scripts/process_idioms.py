import json
import os
import zhconv
import pypinyin
from collections import Counter

def convert_pinyin_to_zhuyin(word):
    zy_list = pypinyin.pinyin(word, style=pypinyin.Style.BOPOMOFO)
    return " ".join([z[0] for z in zy_list])

def convert_pinyin_tone(word):
    py_list = pypinyin.pinyin(word, style=pypinyin.Style.TONE)
    return " ".join([p[0] for p in py_list])

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, "idiom.json")
    output_path = os.path.join(script_dir, "idioms_zh_tw.json")
    
    if not os.path.exists(input_path):
        print(f"找不到輸入檔案: {input_path}")
        return

    print("讀取原始成語庫...")
    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
        
    print(f"原始成語數量: {len(raw_data)}")
    
    # 1. 篩選有實際例句、且長度為 4 的成語
    valid_idioms = []
    char_counter = Counter()
    
    for item in raw_data:
        word = item.get("word", "")
        example = item.get("example", "")
        explanation = item.get("explanation", "")
        
        if len(word) != 4:
            continue
        if not example or example == "无":
            continue
        if not explanation or len(explanation) < 5:
            continue
            
        valid_idioms.append(item)
        for char in word:
            char_counter[char] += 1
            
    print(f"有例句的 4 字成語數量: {len(valid_idioms)}")
    
    # 2. 統計高頻漢字，取前 1800 個最常用字（排除生僻字）
    common_chars = set([char for char, count in char_counter.most_common(1800)])
    print(f"已建立包含 {len(common_chars)} 個高頻漢字的常用字庫")
    
    # 3. 篩選出只包含常用字的成語
    filtered_idioms = []
    for item in valid_idioms:
        word = item["word"]
        # 如果成語的 4 個字都在常用字庫中，則保留
        if all(char in common_chars for char in word):
            filtered_idioms.append(item)
            
    print(f"篩選出只含常用字的成語數量: {len(filtered_idioms)}")
    
    # 4. 繁體轉換與音效標註
    processed_idioms = []
    for item in filtered_idioms:
        word = item["word"]
        explanation = item["explanation"]
        
        word_tw = zhconv.convert(word, 'zh-hant')
        explanation_tw = zhconv.convert(explanation, 'zh-hant')
        derivation_tw = zhconv.convert(item.get("derivation", ""), 'zh-hant')
        
        if any(c in word_tw for c in ["①", "②", "③", "“", "”", "●"]):
            continue
            
        pinyin = convert_pinyin_tone(word_tw)
        zhuyin = convert_pinyin_to_zhuyin(word_tw)
        
        processed_idioms.append({
            "word": word_tw,
            "pinyin": pinyin,
            "zhuyin": zhuyin,
            "explanation": explanation_tw,
            "derivation": derivation_tw
        })
        
    print(f"最終輸出常用繁體成語數量: {len(processed_idioms)}")
    
    # 寫入繁體成語 JSON 檔
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(processed_idioms, f, ensure_ascii=False, indent=4)
        
    print(f"已成功寫入至: {output_path}")

if __name__ == "__main__":
    main()
