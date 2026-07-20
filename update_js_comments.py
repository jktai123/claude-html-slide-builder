import os
import sys
import re

def main():
    md_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/scrape_js_summary.md"
    scrape_dir = "/Volumes/1T_HDD_2/Scrape"
    
    if not os.path.exists(md_path):
        print(f"Error: {md_path} does not exist.")
        sys.exit(1)
        
    summaries = {}
    with open(md_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("- **"):
                parts = line[4:].split("**: ", 1)
                if len(parts) == 2:
                    summaries[parts[0]] = parts[1]
                    
    print(f"從 markdown 檔案中解析出 {len(summaries)} 個檔案的摘要資訊。")
    
    # Regex to match existing "功能摘要" comment block at the very start of the file
    comment_pattern = re.compile(r'^/\*\*?\s*\n\s*\*\s*功能摘要[：:].*?\*/\s*\n*', re.DOTALL)
    
    success_count = 0
    fail_count = 0
    
    for filename, summary in summaries.items():
        filepath = os.path.join(scrape_dir, filename)
        if not os.path.exists(filepath):
            print(f"警告：檔案 {filepath} 不存在，跳過。")
            fail_count += 1
            continue
            
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                
            # Remove existing "功能摘要" comment block if present
            cleaned_content = comment_pattern.sub("", content)
            
            # Construct the new comment block
            new_comment = f"/**\n * 功能摘要：{summary}\n */\n\n"
            
            # Write back to file
            new_content = new_comment + cleaned_content
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            success_count += 1
        except Exception as e:
            print(f"錯誤：更新 {filename} 失敗: {e}")
            fail_count += 1
            
    print(f"更新完成！成功：{success_count}，失敗：{fail_count}")

if __name__ == "__main__":
    main()
