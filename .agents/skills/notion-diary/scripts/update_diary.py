import os
import re
import sys
import time
import json
import urllib.request
import subprocess
from datetime import datetime, timezone, timedelta
import ssl
ssl_context = ssl._create_unverified_context()

def get_token():
    token = None
    env_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("NOTION_API_TOKEN="):
                    token = line.split("=", 1)[1].strip()
    if not token:
        token = os.environ.get("NOTION_API_TOKEN")
    if token:
        return token.strip('"').strip("'")
    return None

def query_or_create_page(token, db_id, date_str):
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    query_body = {
        "filter": {
            "property": "名稱",
            "title": {
                "equals": date_str
            }
        }
    }
    
    req = urllib.request.Request(
        url,
        method="POST",
        data=json.dumps(query_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"查詢資料庫失敗: {e}", file=sys.stderr)
        sys.exit(1)
        
    results = data.get("results", [])
    active_results = [p for p in results if not p.get("archived")]
    if active_results:
        page = active_results[0]
        # Retrieve existing value for '今天最重要要完成的任務'
        properties = page.get("properties", {})
        task_prop = properties.get("今天最重要要完成的任務", {}).get("rich_text", [])
        existing_task = "".join([t.get("text", {}).get("content", "") for t in task_prop]) if task_prop else ""
        return page.get("id"), page.get("url"), existing_task, False
    else:
        # Page does not exist, create it
        create_url = "https://api.notion.com/v1/pages"
        create_body = {
            "parent": { "database_id": db_id },
            "properties": {
                "名稱": {
                  "title": [
                    { "text": { "content": date_str } }
                  ]
                }
            }
        }
        
        create_req = urllib.request.Request(
            create_url,
            method="POST",
            data=json.dumps(create_body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {token}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            }
        )
        
        try:
            with urllib.request.urlopen(create_req, context=ssl_context, timeout=10) as response:
                new_page = json.loads(response.read().decode("utf-8"))
            return new_page.get("id"), new_page.get("url"), "", True
        except Exception as e:
            print(f"建立頁面失敗: {e}", file=sys.stderr)
            sys.exit(1)

def update_page_properties(token, page_id, task_summary):
    # Update page property '今天最重要要完成的任務'
    url = f"https://api.notion.com/v1/pages/{page_id}"
    patch_body = {
        "properties": {
            "今天最重要要完成的任務": {
                "rich_text": [
                    {
                        "text": {
                            "content": task_summary
                        }
                    }
                ]
            }
        }
    }
    
    req = urllib.request.Request(
        url,
        method="PATCH",
        data=json.dumps(patch_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            response.read() # read and discard
    except Exception as e:
        print(f"更新屬性失敗: {e}", file=sys.stderr)

def extract_summary(markdown_content):
    # Skip summary extraction if it's an automatically generated system log to prevent polluting the property
    if "## 🌐 Google Environment" in markdown_content or "## 🤖 Antigravity" in markdown_content or "📊 應用程式使用時數" in markdown_content:
        return ""

    # Extract clean short summary from markdown lines
    lines = markdown_content.strip().split('\n')
    summarized_items = []
    
    for line in lines:
        cleaned = line.strip().lstrip('-').lstrip('*').lstrip('#').strip()
        # Remove any inner formatting tags or backticks
        cleaned = cleaned.replace('`', '').strip()
        if cleaned:
            summarized_items.append(cleaned)
            
    if not summarized_items:
        return ""
        
    # Join with "、" and truncate if too long (max 100 chars)
    summary = "、".join(summarized_items)
    if len(summary) > 90:
        summary = summary[:87] + "..."
    return summary

def filter_out_system_sections(markdown_text):
    if not markdown_text:
        return ""
    lines = markdown_text.split('\n')
    filtered_lines = []
    
    in_system_section = False
    system_headers = [
        "## 🌐 Google Environment",
        "## 🤖 Antigravity",
        "## 📊 應用程式使用時數",
        "## 📚 今日知識摘要",
        "## 🌅 今日早安圖"
    ]
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## "):
            in_system_section = False
            for header in system_headers:
                if stripped.startswith(header):
                    in_system_section = True
                    break
        
        if stripped.startswith("# "):
            in_system_section = False
            
        if not in_system_section:
            filtered_lines.append(line)
            
    return "\n".join(filtered_lines).strip()

def delete_old_greetings(token, page_id):
    url = f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=40"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28"
        }
    )
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = data.get("results", [])
            
        blocks_to_delete = []
        found_heading = False
        image_count = 0
        
        for block in results:
            if block.get("archived"):
                continue
                
            b_id = block["id"]
            b_type = block["type"]
            
            if b_type == "heading_2":
                texts = block.get("heading_2", {}).get("rich_text", [])
                content = "".join([t.get("text", {}).get("content", "") for t in texts])
                if "🌅 今日早安圖" in content:
                    blocks_to_delete.append(b_id)
                    found_heading = True
                    image_count = 0
                    continue
            
            if found_heading:
                if b_type == "image" and image_count < 2:
                    blocks_to_delete.append(b_id)
                    image_count += 1
                elif b_type == "heading_2" or b_type == "heading_1":
                    break
                    
        for bid in blocks_to_delete:
            del_url = f"https://api.notion.com/v1/blocks/{bid}"
            del_req = urllib.request.Request(
                del_url,
                method="DELETE",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28"
                }
            )
            try:
                with urllib.request.urlopen(del_req, context=ssl_context, timeout=10) as response:
                    response.read()
                print(f"🗑️ 已成功刪除舊早安圖 Block: {bid}")
            except Exception as ex:
                print(f"刪除舊 Block 失敗: {ex}", file=sys.stderr)
                
    except Exception as e:
        print(f"尋找舊早安圖 Block 失敗: {e}", file=sys.stderr)

def parse_markdown_links_to_rich_text(text):
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    last_idx = 0
    rich_text = []
    
    for match in re.finditer(pattern, text):
        start, end = match.span()
        if start > last_idx:
            rich_text.append({
                "type": "text",
                "text": {"content": text[last_idx:start]}
            })
        rich_text.append({
            "type": "text",
            "text": {
                "content": match.group(1),
                "link": {"url": match.group(2)}
            }
        })
        last_idx = end
        
    if last_idx < len(text):
        rich_text.append({
            "type": "text",
            "text": {"content": text[last_idx:]}
        })
        
    if not rich_text:
        rich_text.append({
            "type": "text",
            "text": {"content": text}
        })
        
    return rich_text

def markdown_to_notion_blocks(markdown_text):
    blocks = []
    lines = markdown_text.strip().split('\n')
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        if stripped.startswith("## "):
            content = stripped[3:].strip()
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": content}}]
                }
            })
        elif stripped.startswith("- ") or stripped.startswith("* "):
            content = stripped[2:].strip()
            rich_text = parse_markdown_links_to_rich_text(content)
            blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": rich_text
                }
            })
        else:
            rich_text = parse_markdown_links_to_rich_text(stripped)
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": rich_text
                }
            })
            
    return blocks

def delete_old_system_logs(token, page_id):
    url = f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=100"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28"
        }
    )
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = data.get("results", [])
            
        blocks_to_delete = []
        in_system_section = False
        system_headers = [
            "🌐 Google Environment",
            "🤖 Antigravity",
            "📊 應用程式使用時數",
            "📚 今日知識摘要"
        ]
        
        for block in results:
            if block.get("archived"):
                continue
                
            b_id = block["id"]
            b_type = block["type"]
            
            if b_type == "heading_2":
                texts = block.get("heading_2", {}).get("rich_text", [])
                content = "".join([t.get("text", {}).get("content", "") for t in texts])
                
                is_system = False
                for header in system_headers:
                    if content.startswith(header):
                        is_system = True
                        break
                        
                if is_system:
                    blocks_to_delete.append(b_id)
                    in_system_section = True
                else:
                    in_system_section = False
            elif b_type == "heading_1":
                in_system_section = False
            else:
                if in_system_section:
                    blocks_to_delete.append(b_id)
                    
        for bid in blocks_to_delete:
            del_url = f"https://api.notion.com/v1/blocks/{bid}"
            del_req = urllib.request.Request(
                del_url,
                method="DELETE",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28"
                }
            )
            try:
                with urllib.request.urlopen(del_req, context=ssl_context, timeout=10) as response:
                    response.read()
                print(f"🗑️ 已成功刪除舊系統日誌 Block: {bid}")
            except Exception as ex:
                print(f"刪除舊系統日誌 Block 失敗: {ex}", file=sys.stderr)
                
    except Exception as e:
        print(f"尋找舊系統日誌 Block 失敗: {e}", file=sys.stderr)

def append_new_logs(token, page_id, new_content):
    blocks = markdown_to_notion_blocks(new_content)
    if not blocks:
        return
        
    url = f"https://api.notion.com/v1/blocks/{page_id}/children"
    body = {
        "children": blocks
    }
    
    req = urllib.request.Request(
        url,
        method="PATCH",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            response.read()
        print("🎉 最新系統活動日誌已成功追加到日記！")
    except Exception as e:
        print(f"追加最新系統活動日誌失敗: {e}", file=sys.stderr)

def main():
    token = get_token()
    if not token:
        print("Error: NOTION_API_TOKEN is not set.", file=sys.stderr)
        sys.exit(1)
        
    db_id = "19e5e6741c4d804a878ef15434268529"
    
    # Get TPE time today (supports TARGET_DATE override for historical syncs)
    tpe_tz = timezone(timedelta(hours=8))
    target_date_env = os.environ.get("TARGET_DATE")
    if target_date_env:
        try:
            base_t = datetime.strptime(target_date_env, "%Y-%m-%d")
            tpe_now = datetime(base_t.year, base_t.month, base_t.day, 23, 59, 59, tzinfo=tpe_tz)
        except Exception:
            tpe_now = datetime.now(timezone.utc).astimezone(tpe_tz)
    else:
        tpe_now = datetime.now(timezone.utc).astimezone(tpe_tz)
    date_str = tpe_now.strftime("%m/%d/%Y")
    
    # Query or create record
    page_id, page_url, existing_task, is_new = query_or_create_page(token, db_id, date_str)
    
    # Read append content from stdin
    new_content = sys.stdin.read().strip()
    if not new_content:
        print("警告: 沒有提供要寫入的內容。", file=sys.stderr)
        print(f"對應的 Notion 連結: {page_url}")
        sys.exit(0)
        
    # Extract summary of new content
    new_summary = extract_summary(new_content)
    
    # Calculate updated task property
    updated_task = ""
    if new_summary:
        if existing_task:
            # Check if this new summary is already in existing_task to avoid duplicates
            if new_summary not in existing_task:
                updated_task = f"{existing_task}、{new_summary}"
            else:
                updated_task = existing_task
        else:
            updated_task = new_summary
            
        # Update property
        if updated_task and updated_task != existing_task:
            update_page_properties(token, page_id, updated_task)
        
    try:
        # 1. Clean up old morning greetings to prevent duplicate block stacks / empty photo frames
        delete_old_greetings(token, page_id)
        
        # 2. Clean up old system logs (if page is not brand new)
        if not is_new:
            delete_old_system_logs(token, page_id)
        else:
            # If it's a brand new page, add the main heading block first
            heading_block = [{
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": f"Antigravity 工作摘要 - {tpe_now.strftime('%Y-%m-%d')}"}}]
                }
            }]
            heading_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            heading_req = urllib.request.Request(
                heading_url,
                method="PATCH",
                data=json.dumps({"children": heading_block}).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
            )
            try:
                with urllib.request.urlopen(heading_req, context=ssl_context, timeout=10) as response:
                    response.read()
            except Exception as ex:
                print(f"追加新頁面主標題失敗: {ex}", file=sys.stderr)

        # 3. Append the newest activity logs
        append_new_logs(token, page_id, new_content)
            
        # 🌅 Append morning greeting images if their file IDs are provided in environment variables
        faith_fid = os.environ.get("GREETING_FAITH_FILE_ID")
        morning_fid = os.environ.get("GREETING_MORNING_FILE_ID")
        
        if faith_fid or morning_fid:
            # Sleep 1 second to let Notion process the page deletion/updates from 'ntn pages edit'
            time.sleep(1.0)
            
            # Query existing blocks to find the new first block ID (top of page)
            query_url = f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=20"
            query_req = urllib.request.Request(
                query_url,
                method="GET",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28"
                }
            )
            
            first_block_id = None
            try:
                with urllib.request.urlopen(query_req, context=ssl_context, timeout=10) as response:
                    blocks_data = json.loads(response.read().decode("utf-8"))
                    results = blocks_data.get("results", [])
                    active_blocks = [b for b in results if not b.get("archived")]
                    if active_blocks:
                        # Find the first active block (typically heading_1 "Antigravity 工作摘要...")
                        for block in active_blocks:
                            if block.get("type") == "heading_1":
                                first_block_id = block["id"]
                                break
                        # Fallback to the very first block if no heading_1 found
                        if not first_block_id:
                            first_block_id = active_blocks[0]["id"]
            except Exception as e:
                print(f"查詢現有 Block 失敗，將預設追加至尾部: {e}", file=sys.stderr)
                
            greeting_blocks = []
            greeting_blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": "🌅 今日早安圖"
                            }
                        }
                    ]
                }
            })
            
            if faith_fid:
                greeting_blocks.append({
                    "object": "block",
                    "type": "image",
                    "image": {
                        "type": "file_upload",
                        "file_upload": {
                            "id": faith_fid
                        }
                    }
                })
                
            if morning_fid:
                greeting_blocks.append({
                    "object": "block",
                    "type": "image",
                    "image": {
                        "type": "file_upload",
                        "file_upload": {
                            "id": morning_fid
                        }
                    }
                })
                
            # Append blocks using Notion Children PATCH API
            append_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            append_body = {
                "children": greeting_blocks
            }
            # Insert at the very top (after the main heading block) if first_block_id is found
            if first_block_id:
                append_body["after"] = first_block_id
            
            append_req = urllib.request.Request(
                append_url,
                method="PATCH",
                data=json.dumps(append_body).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
            )
            
            try:
                with urllib.request.urlopen(append_req, context=ssl_context, timeout=10) as response:
                    response.read()
                print("🌅 早安圖官方託管 Block 已成功置頂追加到日記！")
            except Exception as e:
                print(f"追加早安圖 Block 失敗: {e}", file=sys.stderr)

        print(f"🎉 日記更新成功！")
        print(f"🔗 Notion 連結: {page_url}")
    except Exception as e:
        print(f"寫入頁面失敗: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
