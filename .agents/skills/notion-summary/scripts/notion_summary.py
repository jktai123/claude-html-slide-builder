import os
import sys
import json
import urllib.request
import ssl
from datetime import datetime, timezone, timedelta
import subprocess

def upload_to_catbox(file_path):
    import uuid
    try:
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        filename = os.path.basename(file_path)
        
        with open(file_path, "rb") as f:
            file_data = f.read()
            
        parts = []
        parts.append(f"--{boundary}".encode())
        parts.append(b'Content-Disposition: form-data; name="reqtype"')
        parts.append(b'')
        parts.append(b'fileupload')
        
        parts.append(f"--{boundary}".encode())
        parts.append(f'Content-Disposition: form-data; name="fileToUpload"; filename="{filename}"'.encode())
        parts.append(b'Content-Type: image/jpeg')
        parts.append(b'')
        parts.append(file_data)
        
        parts.append(f"--{boundary}--".encode())
        parts.append(b'')
        
        body = b'\r\n'.join(parts)
        
        req = urllib.request.Request(
            "https://catbox.moe/user/api.php",
            method="POST",
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(body))
            }
        )
        
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context, timeout=30) as response:
            url = response.read().decode("utf-8").strip()
            if url.startswith("http"):
                return url
    except Exception as e:
        print(f"上傳 Catbox 失敗: {e}", file=sys.stderr)
    return None

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

def parse_date(date_str=None):
    tpe_tz = timezone(timedelta(hours=8))
    tpe_now = datetime.now(timezone.utc).astimezone(tpe_tz)
    return tpe_now.strftime("%Y-%m-%d")

def create_notion_page(token, db_id, data):
    url = "https://api.notion.com/v1/pages"
    
    title = data.get("Title", "未命名").strip()
    date_val = parse_date(data.get("日期"))
    url_val = data.get("URL", "").strip()
    summary = data.get("摘要", "").strip()
    category = data.get("category", "").strip()
    tags = data.get("tags", [])
    importance = data.get("importance", "").strip()
    content = data.get("content", "").strip()
    mindmap = data.get("mindmap", "").strip()
    images = data.get("images", [])
    
    if importance not in ("高", "中", "低"):
        if "高" in importance:
            importance = "高"
        elif "中" in importance:
            importance = "中"
        elif "低" in importance:
            importance = "低"
        else:
            importance = "中"
            
    category_map = {
        "科技": "科技",
        "投資": "投資",
        "教會": "教會",
        "生活": "生活",
        "政治": "政治",
        "健康": "健康",
        "日常生活": "日常生活",
        "休閒": "休閒與文化",
        "文化": "休閒與文化"
    }
    mapped_category = "生活"
    for k, v in category_map.items():
        if k in category:
            mapped_category = v
            break

    properties = {
        "Title": {
            "title": [
                {
                    "text": {
                        "content": title
                    }
                }
            ]
        },
        "Date": {
            "date": {
                "start": date_val
            }
        },
        "Summary": {
            "rich_text": [
                {
                    "text": {
                        "content": summary[:2000]
                    }
                }
            ]
        },
        "Category": {
            "select": {
                "name": mapped_category
            }
        },
        "Importance": {
            "select": {
                "name": importance
            }
        }
    }
    
    if url_val:
        properties["URL"] = {
            "url": url_val
        }
        
    if isinstance(tags, list):
        formatted_tags = [t.strip() for t in tags if isinstance(t, str) and t.strip()]
        properties["Tags"] = {
            "multi_select": [{"name": t[:100]} for t in formatted_tags[:5]]
        }
        
    simple_children = []
    complex_children = []
    
    if mindmap:
        mermaid_code = mindmap.strip()
        if mermaid_code.startswith("mermaid"):
            lines = mermaid_code.split("\n")
            if lines[0].strip() == "mermaid":
                mermaid_code = "\n".join(lines[1:]).strip()
        
        if "mindmap" not in mermaid_code:
            mermaid_code = f"mindmap\n{mermaid_code}"
            
        complex_children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": "🧠 知識心智圖"
                        }
                    }
                ]
            }
        })
        
        complex_children.append({
            "object": "block",
            "type": "code",
            "code": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": mermaid_code
                        }
                    }
                ],
                "language": "mermaid"
            }
        })

    if content:
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        for line in lines[:100]:
            block_type = "paragraph"
            content_text = line
            
            if line.startswith("# "):
                block_type = "heading_1"
                content_text = line[2:]
            elif line.startswith("## "):
                block_type = "heading_2"
                content_text = line[3:]
            elif line.startswith("### "):
                block_type = "heading_3"
                content_text = line[4:]
            elif line.startswith("- ") or line.startswith("* "):
                block_type = "bulleted_list_item"
                content_text = line[2:]
            elif line.startswith("> "):
                block_type = "quote"
                content_text = line[2:]
            elif line.strip().split('.')[0].isdigit() and (line.startswith(line.split('.')[0] + ". ") or line.startswith(line.split('.')[0] + ".\t")):
                block_type = "numbered_list_item"
                prefix_len = len(line.split('.')[0]) + 2
                content_text = line[prefix_len:]
                
            simple_children.append({
                "object": "block",
                "type": block_type,
                block_type: {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": content_text[:2000]
                            }
                        }
                    ]
                }
            })
            
    payload = {
        "parent": {
            "database_id": db_id
        },
        "properties": properties
    }
    
    if simple_children:
        payload["children"] = simple_children
        
    req_body = json.dumps(payload).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        method="POST",
        data=req_body,
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    )
    
    context = ssl._create_unverified_context()
    page_id = None
    page_url = None
    
    try:
        with urllib.request.urlopen(req, context=context, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            page_id = res_data.get("id")
            page_url = res_data.get("url")
    except Exception as e:
        print(f"呼叫 Notion API 失敗: {e}", file=sys.stderr)
        if hasattr(e, "read"):
            try:
                err_detail = e.read().decode("utf-8")
                print(f"錯誤詳情: {err_detail}", file=sys.stderr)
            except Exception:
                pass
        sys.exit(1)
        
    # Lazy image uploading & complex children patching after page is created
    if page_id:
        if isinstance(images, list) and images:
            for img_path in images:
                if img_path and os.path.exists(img_path):
                    print(f"正在上傳圖片至 Catbox: {img_path} ...", file=sys.stderr)
                    img_url = upload_to_catbox(img_path)
                    if img_url:
                        print(f"上傳成功: {img_url}", file=sys.stderr)
                        complex_children.append({
                            "object": "block",
                            "type": "image",
                            "image": {
                                "type": "external",
                                "external": {
                                    "url": img_url
                                }
                            }
                        })
                        
        if complex_children:
            patch_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            patch_body = json.dumps({"children": complex_children}).encode("utf-8")
            patch_req = urllib.request.Request(
                patch_url,
                method="PATCH",
                data=patch_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
            )
            try:
                with urllib.request.urlopen(patch_req, context=context, timeout=15) as response:
                    response.read()
                print("🎉 複雜內容 (圖片/心智圖) 已成功追加至頁面中！", file=sys.stderr)
            except Exception as e:
                print(f"追加複雜內容失敗: {e}", file=sys.stderr)
                if hasattr(e, "read"):
                    try:
                        print(f"追加失敗詳情: {e.read().decode('utf-8')}", file=sys.stderr)
                    except Exception:
                        pass
                        
    return page_url

def main():
    token = get_token()
    if not token:
        print("錯誤: 未能取得 NOTION_API_TOKEN，請檢查專案目錄下的 .env 檔案或環境變數。", file=sys.stderr)
        sys.exit(1)
        
    db_id = "3285e6741c4d8084a436d6c081642c73"
    
    try:
        input_data = sys.stdin.read().strip()
        if not input_data:
            print("錯誤: stdin 沒有輸入內容", file=sys.stderr)
            sys.exit(1)
            
        data = json.loads(input_data)
    except json.JSONDecodeError as e:
        print(f"錯誤: 輸入內容非合法的 JSON 格式。{e}", file=sys.stderr)
        print(f"輸入內容為: {input_data}", file=sys.stderr)
        sys.exit(1)
        
    page_url = create_notion_page(token, db_id, data)
    if page_url:
        print(f"🎉 摘要成功儲存至 Notion！")
        print(f"🔗 Notion 連結: {page_url}")
    else:
        print("錯誤: 建立頁面後未能取得 URL", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
