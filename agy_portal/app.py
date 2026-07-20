import os
import sys
import json
import socket
import email
import subprocess
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from datetime import datetime, timezone, timedelta

PORT = 8288

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

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
    
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode("utf-8"))
        
    results = data.get("results", [])
    active_results = [p for p in results if not p.get("archived")]
    if active_results:
        page = active_results[0]
        return page.get("id"), page.get("url")
    else:
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
        
        with urllib.request.urlopen(create_req, timeout=10) as response:
            new_page = json.loads(response.read().decode("utf-8"))
        return new_page.get("id"), new_page.get("url")

def append_notion_blocks(token, page_id, blocks):
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
        with urllib.request.urlopen(req, timeout=10) as response:
            response.read()
        return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"追加 Block 失敗: {e.code} - {error_body}")
        return False
    except Exception as e:
        print(f"追加 Block 失敗: {e}")
        return False

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return 'localhost'

def upload_to_catbox(file_bytes, filename):
    boundary = '----WebKitFormBoundaryCatboxUpload'
    body = []
    
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append('Content-Disposition: form-data; name="reqtype"'.encode('utf-8'))
    body.append(''.encode('utf-8'))
    body.append('fileupload'.encode('utf-8'))
    
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(f'Content-Disposition: form-data; name="fileToUpload"; filename="{filename}"'.encode('utf-8'))
    
    import mimetypes
    mime, _ = mimetypes.guess_type(filename)
    if not mime: 
        mime = 'application/octet-stream'
        
    body.append(f'Content-Type: {mime}'.encode('utf-8'))
    body.append(''.encode('utf-8'))
    body.append(file_bytes)
    
    body.append(f'--{boundary}--'.encode('utf-8'))
    body.append(''.encode('utf-8'))
    
    payload = b'\r\n'.join(body)
    
    req = urllib.request.Request(
        'https://catbox.moe/user/api.php',
        data=payload,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    )
    
    try:
        # 15 seconds timeout
        with urllib.request.urlopen(req, timeout=15) as response:
            url = response.read().decode('utf-8').strip()
            if url.startswith('https://files.catbox.moe/'):
                return url
    except Exception as e:
        print(f"⚠️  Catbox 上傳失敗: {e}，將降級為本地區網服務")
    return None

class PortalHTTPRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_GET(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        if self.path == "/" or self.path == "/index.html":
            file_path = os.path.join(current_dir, "index.html")
            content_type = "text/html"
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", f"{content_type}; charset=utf-8")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")
            return
            
        elif self.path == "/style.css":
            file_path = os.path.join(current_dir, "style.css")
            content_type = "text/css"
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", f"{content_type}; charset=utf-8")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")
            return
            
        # Serve uploaded static media files from local Wi-Fi LAN
        elif self.path.startswith("/uploads/"):
            clean_path = self.path.split('?', 1)[0].split('#', 1)[0]
            filename = clean_path.split("/uploads/", 1)[1]
            filename = "".join(c for c in filename if c.isalnum() or c in ['.', '_', '-']).strip()
            
            uploads_dir = "/Users/jktai/.gemini/antigravity/brain/952e3ed4-320c-4227-9034-7a8aea21001f/uploads"
            file_path = os.path.join(uploads_dir, filename)
            
            if not os.path.exists(file_path):
                print(f"⚠️  找不到請求的託管媒體檔案: {filename} (實體路徑: {file_path})")
                self.send_error(404, "File Not Found")
                return
                
            import mimetypes
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "application/octet-stream"
                
            try:
                with open(file_path, "rb") as f:
                    content_bytes = f.read()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(content_bytes)))
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                self.wfile.write(content_bytes)
            except Exception as e:
                self.send_error(500, f"Error serving file: {e}")
            return
            
        else:
            self.send_error(404, "File Not Found")
            return

    def do_POST(self):
        content_type = self.headers.get('Content-Type', '')
        
        # 1. Handle Multiple File Uploads (multipart/form-data)
        if content_type.startswith('multipart/form-data'):
            try:
                token = get_token()
                if not token:
                    self.send_json_response(500, {"success": False, "error": "NOTION_API_TOKEN is not set."})
                    return
                
                db_id = "19e5e6741c4d804a878ef15434268529"
                tpe_tz = timezone(timedelta(hours=8))
                tpe_now = datetime.now(timezone.utc).astimezone(tpe_tz)
                date_str = tpe_now.strftime("%m/%d/%Y")
                
                # Fetch or create today's page_id
                page_id, page_url = query_or_create_page(token, db_id, date_str)
                
                import cgi
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={
                        'REQUEST_METHOD': 'POST',
                        'CONTENT_TYPE': content_type,
                    }
                )
                
                files_to_upload = []
                for key in form.keys():
                    field_items = form[key]
                    if not isinstance(field_items, list):
                        field_items = [field_items]
                        
                    for field_item in field_items:
                        if field_item.filename:
                            file_data = field_item.file.read()
                            if file_data:
                                files_to_upload.append((field_item.filename, file_data))
                
                if not files_to_upload:
                    self.send_json_response(400, {"success": False, "error": "No files uploaded"})
                    return
                
                # Local hosting directory
                uploads_dir = "/Users/jktai/.gemini/antigravity/brain/952e3ed4-320c-4227-9034-7a8aea21001f/uploads"
                os.makedirs(uploads_dir, exist_ok=True)
                
                notion_blocks = []
                success_list = []
                local_ip = get_local_ip()
                
                print(f"開始批次處理上傳，共 {len(files_to_upload)} 個檔案...")
                
                for idx, (filename, file_data) in enumerate(files_to_upload, 1):
                    # Sanitize filename
                    ext = os.path.splitext(filename)[1].lower()
                    base = os.path.splitext(filename)[0]
                    clean_base = "".join(c for c in base if c.isalnum() or c in ['_', '-']).strip()
                    if not clean_base:
                        clean_base = f"upload_{idx}"
                    clean_filename = f"{clean_base}{ext}"
                    
                    # Save to local directory first
                    file_path = os.path.join(uploads_dir, clean_filename)
                    with open(file_path, "wb") as f:
                        f.write(file_data)
                    
                    is_image = ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
                    is_video = ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']
                    
                    target_url = None
                    upload_source = "本地託管"
                    
                    # If it's an image, attempt to upload to Catbox to get a public CDN URL for Notion to render successfully
                    if is_image:
                        print(f"[{idx}/{len(files_to_upload)}] 偵測到圖片 {clean_filename}，嘗試上傳至公網圖床 (Catbox)...")
                        public_url = upload_to_catbox(file_data, clean_filename)
                        if public_url:
                            target_url = public_url
                            upload_source = "公網圖床"
                            
                    # Fallback to local LAN URL if upload failed or it's a large video
                    if not target_url:
                        target_url = f"http://{local_ip}:{PORT}/uploads/{clean_filename}"
                    
                    print(f"[{idx}/{len(files_to_upload)}] 檔案 {clean_filename} 關聯網址 ({upload_source}): {target_url}")
                    
                    if is_image:
                        notion_blocks.append({
                            "object": "block",
                            "type": "image",
                            "image": {
                                "type": "external",
                                "external": {
                                    "url": target_url
                                }
                            }
                        })
                    elif is_video:
                        notion_blocks.append({
                            "object": "block",
                            "type": "video",
                            "video": {
                                "type": "external",
                                "external": {
                                    "url": target_url
                                }
                            }
                        })
                    else:
                        notion_blocks.append({
                            "object": "block",
                            "type": "file",
                            "file": {
                                "type": "external",
                                "external": {
                                    "url": target_url
                                }
                            }
                        })
                        
                    success_list.append(f"- {clean_filename} ➡️ [開啟媒體網址]({target_url}) ({upload_source})")
                
                # Append blocks directly to Notion Page children
                append_success = append_notion_blocks(token, page_id, notion_blocks)
                if not append_success:
                    self.send_json_response(500, {"success": False, "error": "檔案已成功儲存，但在寫入 Notion 頁面 Block 時失敗。"})
                    return
                
                # Update task summary with upload detail
                script_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-diary/scripts/update_diary.py"
                subprocess.run(
                    ["python3", script_path],
                    input=f"\n\n*(已於網頁端上傳 {len(notion_blocks)} 個媒體檔案)*",
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                success_msg = f"🎉 成功批次上傳與插入 {len(notion_blocks)} 個媒體檔案！\n\n" + "\n".join(success_list) + f"\n\n🔗 日記連結: [開啟 Notion日記]({page_url})"
                self.send_json_response(200, {"success": True, "output": success_msg})
                
            except Exception as e:
                self.send_json_response(500, {"success": False, "error": f"處理批次上傳失敗: {str(e)}"})
            return

        # 2. JSON API Routes
        if self.path == "/api/summary":
            try:
                res = subprocess.run(["/Users/jktai/.local/bin/agy-today", "--full"], capture_output=True, text=True, check=True)
                self.send_json_response(200, {"success": True, "output": res.stdout})
            except Exception as e:
                self.send_json_response(500, {"success": False, "error": str(e)})
                
        elif self.path == "/api/sync":
            try:
                res = subprocess.run(["/Users/jktai/.local/bin/agy-today", "--to-notion"], capture_output=True, text=True, check=True)
                self.send_json_response(200, {"success": True, "output": res.stdout})
            except Exception as e:
                self.send_json_response(500, {"success": False, "error": str(e)})
                
        elif self.path == "/api/write-diary":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                content = data.get("content", "").strip()
                if not content:
                    self.send_json_response(400, {"success": False, "error": "Content cannot be empty"})
                    return
                
                script_path = "/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-diary/scripts/update_diary.py"
                res = subprocess.run(["python3", script_path], input=content, capture_output=True, text=True, check=True)
                self.send_json_response(200, {"success": True, "output": res.stdout})
            except Exception as e:
                self.send_json_response(500, {"success": False, "error": str(e)})
        else:
            self.send_json_response(404, {"success": False, "error": "API Route Not Found"})

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

def run():
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingHTTPServer(server_address, PortalHTTPRequestHandler)
    local_ip = get_local_ip()
    
    print("\n" + "="*50)
    print("🚀 Antigravity Web UI Portal 已啟動！")
    print(f"🔗 本機連結  : http://localhost:{PORT}")
    print(f"📱 手機/iPad 連動網址: http://{local_ip}:{PORT}")
    print("="*50 + "\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 正在關閉伺服器...")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run()
