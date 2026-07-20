import os
import sys
import json
import urllib.request
import ssl
from datetime import datetime, timezone, timedelta

def get_env_var(name):
    env_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith(f"{name}="):
                    val = line.split("=", 1)[1].strip()
                    return val.strip('"').strip("'")
    return os.environ.get(name)

NOTION_API_TOKEN = get_env_var("NOTION_API_TOKEN")
if not NOTION_API_TOKEN:
    print("Error: NOTION_API_TOKEN is not set.")
    sys.exit(1)

def main():
    md_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/scrape_js_summary.md"
    if not os.path.exists(md_path):
        print(f"Error: {md_path} does not exist.")
        sys.exit(1)
        
    summaries = []
    with open(md_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("- **"):
                parts = line[4:].split("**: ", 1)
                if len(parts) == 2:
                    summaries.append((parts[0], parts[1]))
                    
    print(f"從 markdown 檔案中解析出 {len(summaries)} 個檔案摘要。")
    
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
            "rich_text": [{"text": {"content": f"列出 /Volumes/1T_HDD_2/Scrape 中 {len(summaries)} 個 JS 檔案的功能摘要。"}}]
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
        "paragraph": {"rich_text": [{"type": "text", "text": {"content": f"此專案位於 /Volumes/1T_HDD_2/Scrape，共包含 {len(summaries)} 個 JavaScript 檔案。"}}]}
    })
    blocks.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [{"type": "text", "text": {"content": "檔案清單與功能說明"}}]}
    })
    
    for filename, summary in summaries:
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
                        "text": {"content": f": {summary}"}
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
        print("正在向 Notion 創建頁面...")
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
