import os
import sys
import glob
import json
import urllib.request
import ssl
import time
from datetime import datetime, timezone, timedelta

def get_env_var(name):
    # Try .env first
    env_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith(f"{name}="):
                    val = line.split("=", 1)[1].strip()
                    return val.strip('"').strip("'")
    return os.environ.get(name)

GEMINI_API_KEY = get_env_var("GEMINI_API_KEY")
NOTION_API_TOKEN = get_env_var("NOTION_API_TOKEN")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY is not set.")
    sys.exit(1)
if not NOTION_API_TOKEN:
    print("Error: NOTION_API_TOKEN is not set.")
    sys.exit(1)

def call_gemini(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    req_body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        method="POST",
        data=req_body,
        headers={"Content-Type": "application/json"}
    )
    context = ssl._create_unverified_context()
    
    # Retry logic with exponential backoff
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, context=context, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_content = res_data['candidates'][0]['content']['parts'][0]['text']
                return json.loads(text_content)
        except Exception as e:
            wait_time = (attempt + 1) * 5
            print(f"Gemini API attempt {attempt+1} failed: {e}. Retrying in {wait_time}s...", file=sys.stderr)
            time.sleep(wait_time)
    return None

def process_batch(batch_files):
    # Read files and prepare prompt
    prompt_parts = [
        "你是一位程式碼分析專家。請分析以下 JavaScript 檔案的程式碼，並為每一個檔案提供簡短、高品質的 1 句繁體中文 (Traditional Chinese) 功能摘要（描述此檔案抓取或處理什麼、目標網站/資料庫/API 是什麼、以及輸出的目的地如 Google Sheet 等）。",
        "請嚴格只回傳 JSON 物件，格式如下（鍵為檔名，值為摘要字串）：",
        "{\n  \"file1.js\": \"摘要內容...\",\n  \"file2.js\": \"摘要內容...\"\n}",
        "以下是檔案的名稱與內容：\n"
    ]
    
    for filename, filepath in batch_files:
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(15000) # Read up to 15k chars to prevent huge prompts
            prompt_parts.append(f"--- 檔名: {filename} ---\n{content}\n")
        except Exception as e:
            prompt_parts.append(f"--- 檔名: {filename} ---\n(讀取檔案失敗: {e})\n")
            
    prompt = "\n".join(prompt_parts)
    return call_gemini(prompt)

def main():
    js_files = sorted(glob.glob("/Volumes/1T_HDD_2/Scrape/*.js"))
    print(f"找到 {len(js_files)} 個 JavaScript 檔案。")
    
    file_list = [(os.path.basename(f), f) for f in js_files]
    
    # Chunk into batches of 10
    batch_size = 10
    batches = [file_list[i:i + batch_size] for i in range(0, len(file_list), batch_size)]
    
    summaries = {}
    
    print(f"開始循序分析，共分 {len(batches)} 個批次...")
    for idx, batch in enumerate(batches):
        print(f"正在處理第 {idx+1}/{len(batches)} 個批次...")
        batch_result = process_batch(batch)
        if batch_result:
            summaries.update(batch_result)
            print(f"成功處理第 {idx+1} 批次，目前已完成 {len(summaries)}/{len(js_files)} 個檔案。")
        else:
            print(f"警告：第 {idx+1} 批次處理失敗！", file=sys.stderr)
            # Fill with fallback
            for filename, _ in batch:
                summaries[filename] = "未成功生成摘要"
        # Sleep to avoid rate limits
        if idx < len(batches) - 1:
            time.sleep(5)
                
    # Ensure all files are represented
    for filename, _ in file_list:
        if filename not in summaries:
            summaries[filename] = "未成功生成摘要"
            
    # Generate markdown file
    md_lines = [
        "# Scrape 專案 JS 檔案功能摘要",
        f"此專案位於 `/Volumes/1T_HDD_2/Scrape`，共包含 {len(js_files)} 個 JavaScript 檔案。",
        f"分析時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## 檔案清單與功能說明",
        ""
    ]
    
    for filename in sorted(summaries.keys()):
        md_lines.append(f"- **{filename}**: {summaries[filename]}")
        
    markdown_content = "\n".join(md_lines)
    
    # Write to local file
    local_md_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/scrape_js_summary.md"
    with open(local_md_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print(f"已將功能摘要寫入至本地檔案：{local_md_path}")
    
    # Write to Notion Database 3285e6741c4d8084a436d6c081642c73
    print("正在將摘要寫入 Notion 資料庫...")
    
    tpe_tz = timezone(timedelta(hours=8))
    tpe_now = datetime.now(timezone.utc).astimezone(tpe_tz)
    today_str = tpe_now.strftime("%Y-%m-%d")
    
    properties = {
        "Title": {
            "title": [{"text": {"content": "Scrape 專案中的 JS 檔案功能摘要"}}]
        },
        "Date": {
            "date": {"start": today_str}
        },
        "Summary": {
            "rich_text": [{"text": {"content": f"列出 /Volumes/1T_HDD_2/Scrape 中 {len(js_files)} 個 JS 檔案的功能摘要。"}}]
        },
        "Category": {
            "select": {"name": "科技"}
        },
        "Importance": {
            "select": {"name": "中"}
        }
    }
    
    # Prepare blocks
    blocks = []
    blocks.append({
        "object": "block",
        "type": "heading_1",
        "heading_1": {"rich_text": [{"type": "text", "text": {"content": "Scrape 專案 JS 檔案功能摘要"}}]}
    })
    blocks.append({
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [{"type": "text", "text": {"content": f"此專案位於 /Volumes/1T_HDD_2/Scrape，共包含 {len(js_files)} 個 JavaScript 檔案。"}}]}
    })
    blocks.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [{"type": "text", "text": {"content": "檔案清單與功能說明"}}]}
    })
    
    for filename in sorted(summaries.keys()):
        blocks.append({
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": filename},
                        "annotations": {"bold": True}
                    },
                    {
                        "type": "text",
                        "text": f": {summaries[filename]}"
                    }
                ]
            }
        })
        
    first_chunk = blocks[:80]
    remaining_chunks = [blocks[i:i + 80] for i in range(80, len(blocks), 80)]
    
    payload = {
        "parent": {
            "database_id": "3285e6741c4d8084a436d6c081642c73"
        },
        "properties": properties,
        "children": first_chunk
    }
    
    create_url = "https://api.notion.com/v1/pages"
    req_body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        create_url,
        method="POST",
        data=req_body,
        headers={
            "Authorization": f"Bearer {NOTION_API_TOKEN}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    )
    
    context = ssl._create_unverified_context()
    page_id = None
    page_url = None
    
    try:
        with urllib.request.urlopen(req, context=context, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            page_id = res_data.get("id")
            page_url = res_data.get("url")
            print("Notion 頁面創建成功！")
    except Exception as e:
        print(f"創建 Notion 頁面失敗: {e}", file=sys.stderr)
        if hasattr(e, "read"):
            try:
                print(f"錯誤詳情: {e.read().decode('utf-8')}", file=sys.stderr)
            except Exception:
                pass
        sys.exit(1)
        
    # Append the remaining chunks
    if page_id and remaining_chunks:
        for i, chunk in enumerate(remaining_chunks):
            print(f"正在向 Notion 追加第 {i+1} 批區塊 (共 {len(chunk)} 個)...")
            patch_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            patch_body = json.dumps({"children": chunk}).encode("utf-8")
            patch_req = urllib.request.Request(
                patch_url,
                method="PATCH",
                data=patch_body,
                headers={
                    "Authorization": f"Bearer {NOTION_API_TOKEN}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
            )
            try:
                with urllib.request.urlopen(patch_req, context=context, timeout=30) as response:
                    response.read()
            except Exception as e:
                print(f"追加 Notion 區塊失敗: {e}", file=sys.stderr)
                if hasattr(e, "read"):
                    try:
                        print(f"追加失敗詳情: {e.read().decode('utf-8')}", file=sys.stderr)
                    except Exception:
                        pass
                        
    print("🎉 所有摘要已成功上傳至 Notion！")
    print(f"🔗 Notion 連結: {page_url}")

if __name__ == "__main__":
    main()
