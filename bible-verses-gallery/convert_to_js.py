import json

def convert():
    try:
        with open("data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # 寫成 data.js
        with open("data.js", "w", encoding="utf-8") as f:
            f.write("const BIBLE_DATA = ")
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write(";\n")
            
        print("Successfully converted data.json to data.js")
    except Exception as e:
        print(f"Error converting: {e}")

if __name__ == '__main__':
    convert()
