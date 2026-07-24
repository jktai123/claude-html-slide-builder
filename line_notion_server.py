#!/usr/bin/env python3
"""
LINE Official Account (Channel 2007061990) -> Gemini 2.5 Flash Multimodal AI Summarizer -> Notion Summary Server
Supports: Text, URLs, Audio (NotebookLM/Gemini), Images (OCR & Vision)
"""
import os
import sys
import json
import re
import base64
import urllib.request
import subprocess
import requests
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    Configuration, ApiClient, MessagingApi, MessagingApiBlob, 
    ReplyMessageRequest, FlexMessage, FlexContainer
)

load_dotenv()
load_dotenv("/Users/jktai/.zshrc")

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_ACCESS_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
NOTEBOOKLM_ID = os.getenv("NOTEBOOKLM_ID", "b3003300-d4c7-4c0f-8fc9-7dffa8d3e877")
NOTION_SCRIPT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), ".agents/skills/notion-summary/scripts/notion_summary.py")
)

app = FastAPI(title="LINE Notion NotebookLM & Multimodal AI Server")
configuration = Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

def fetch_url_content(url: str) -> str:
    """Fetch raw webpage text content with redirect support & clean formatting."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, allow_redirects=True, timeout=12)
        if resp.status_code == 200:
            html = resp.text
            clean_text = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL)
            clean_text = re.sub(r'<style.*?>.*?</style>', '', clean_text, flags=re.DOTALL)
            clean_text = re.sub(r'<.*?>', ' ', clean_text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            return clean_text[:4000]
    except Exception as e:
        print(f"Error fetching URL content for {url}: {e}", flush=True)
    return ""

def summarize_with_gemini(raw_text: str = "", source_url: str = "", msg_type: str = "text", image_bytes: bytes = None) -> dict:
    """Call Gemini 2.5 Flash API to produce full structured Notion JSON for text, URL, audio, or image."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set. Using fallback payload.", flush=True)
        return {
            "Title": (raw_text.split("\n")[0][:30] if raw_text else "LINE 多模隨手記"),
            "日期": today_str,
            "URL": source_url,
            "摘要": raw_text[:90] if raw_text else "收到圖片/多媒體訊息",
            "category": "生活",
            "tags": ["LINE", msg_type],
            "importance": "中",
            "content": raw_text or "多媒體內容",
            "mindmap": "mindmap\n  root((LINE筆記))\n    內容解析",
            "transcript": "",
            "images": []
        }
        
    api_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    parts = []
    if image_bytes:
        b64_str = base64.b64encode(image_bytes).decode("utf-8")
        parts.append({
            "inlineData": {
                "mimeType": "image/jpeg",
                "data": b64_str
            }
        })
        prompt = f"""你是一位專業圖像分析與視覺歸檔專家。請詳細分析這張圖片（包含圖中文字 OCR 辨識、視覺重點、圖表或照片主題），進行深入解析與摘要，並嚴格只輸出 JSON 物件：
{{
  "Title": "圖片主題與文字(OCR)精確繁體中文標題",
  "日期": "{today_str}",
  "URL": "",
  "摘要": "使用繁體中文，100 字以內精煉圖片內容與 OCR 重點摘要",
  "category": "科技/投資/教會/生活 中選擇最符合的一項",
  "tags": ["圖片", "OCR", "標籤3", "標籤4", "標籤5"] (最多 5 個相關繁體中文標籤),
  "importance": "高/中/低",
  "content": "### 圖片視覺與 OCR 辨識解析\\n\\n1. **辨識出的完整文字 (OCR)**\\n2. **圖片視覺與主題重點**\\n3. **關鍵總結**",
  "mindmap": "Mermaid mindmap 語法",
  "transcript": "",
  "images": []
}}
"""
    else:
        prompt = f"""你是一位專業內容分類與摘要專家。請針對以下提供的訊息或文章內容進行深入解析與摘要，並嚴格只輸出 JSON 物件：
{{
  "Title": "繁體中文文章/內容完整標題 (避免廣泛通稱，需精確表達核心議題)",
  "日期": "{today_str}",
  "URL": "{source_url}",
  "摘要": "使用繁體中文，100 字以內精煉摘要",
  "category": "科技/投資/教會/生活 中選擇最符合的一項",
  "tags": ["標籤1","標籤2","標籤3","標籤4","標籤5"] (最多 5 個相關繁體中文標籤),
  "importance": "高/中/低",
  "content": "詳細重點摘要與核心文稿內容 (用於寫入 Notion 頁面內部)",
  "mindmap": "Mermaid mindmap 語法",
  "transcript": "",
  "images": []
}}

輸入內容：
{raw_text[:3500]}
"""

    parts.append({"text": prompt})
    req_body = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    try:
        req = urllib.request.Request(
            api_endpoint, 
            method="POST", 
            data=json.dumps(req_body).encode("utf-8"), 
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            ai_json_str = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed_payload = json.loads(ai_json_str)
            if source_url:
                parsed_payload["URL"] = source_url  # Ensure correct URL
            return parsed_payload
    except Exception as e:
        print(f"Gemini API Error: {e}, falling back.", flush=True)
        return {
            "Title": "LINE 隨手記",
            "日期": today_str,
            "URL": source_url,
            "摘要": raw_text[:90] if raw_text else "圖片分析處理中",
            "category": "生活",
            "tags": ["LINE", msg_type],
            "importance": "中",
            "content": raw_text or "圖片內容",
            "mindmap": "mindmap\n  root((LINE筆記))",
            "transcript": "",
            "images": []
        }

def transcribe_with_notebooklm(audio_path: str) -> str:
    """Upload audio to NotebookLM via nlm CLI and get full transcript."""
    print(f"Uploading {audio_path} to NotebookLM (ID: {NOTEBOOKLM_ID})...", flush=True)
    cmd_upload = ["nlm", "source", "add", NOTEBOOKLM_ID, "--file", audio_path, "--wait", "--wait-timeout", "600"]
    res = subprocess.run(cmd_upload, capture_output=True, text=True)
    
    source_id = None
    for line in res.stdout.split("\n"):
        if "Source ID:" in line:
            source_id = line.split("Source ID:")[-1].strip()
            break
            
    if not source_id:
        raise Exception(f"NotebookLM Upload/Transcription failed: {res.stderr or res.stdout}")
    
    temp_txt = f"{audio_path}.txt"
    subprocess.run(["nlm", "content", "source", source_id, "-o", temp_txt], check=True)
    with open(temp_txt, "r", encoding="utf-8") as f:
        transcript = f.read()
    if os.path.exists(temp_txt):
        os.remove(temp_txt)
    return transcript

def send_to_notion_summary(payload: dict) -> str:
    """Send structured payload to notion_summary.py script and return pure Notion Page URL."""
    print(f"Calling notion_summary.py script with Title: '{payload.get('Title')}'...", flush=True)
    proc = subprocess.Popen(
        [sys.executable, NOTION_SCRIPT_PATH],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = proc.communicate(input=json.dumps(payload, ensure_ascii=False))
    print(f"notion_summary.py exit code: {proc.returncode}", flush=True)
    print(f"notion_summary.py stdout: {stdout}", flush=True)
    if stderr:
        print(f"notion_summary.py stderr: {stderr}", flush=True)
        
    if proc.returncode != 0:
        raise Exception(f"notion_summary.py failed: {stderr}")
        
    # Strictly extract clean URL
    for line in stdout.split("\n"):
        match = re.search(r'https?://[^\s]+', line)
        if match:
            return match.group(0)
    return ""

def process_line_event(event: dict):
    """Process incoming LINE Event in background task."""
    reply_token = event.get("replyToken")
    msg = event.get("message", {})
    msg_type = msg.get("type")
    msg_id = msg.get("id")
    
    print(f"Received LINE Event: type={msg_type}, id={msg_id}", flush=True)

    with ApiClient(configuration) as api_client:
        line_bot_api = MessagingApi(api_client)
        line_blob_api = MessagingApiBlob(api_client)

        try:
            raw_text = ""
            source_url = ""
            image_bytes = None

            if msg_type == "image":
                print(f"Downloading Image message ID: {msg_id}", flush=True)
                image_bytes = line_blob_api.get_message_content(msg_id)
                print(f"Image downloaded successfully ({len(image_bytes)} bytes). Analyzing with Gemini 2.5 Flash Vision...", flush=True)
                ai_payload = summarize_with_gemini(raw_text="", source_url="", msg_type="image", image_bytes=image_bytes)

            elif msg_type == "audio":
                print(f"Downloading Audio file message ID: {msg_id}", flush=True)
                audio_bytes = line_blob_api.get_message_content(msg_id)
                local_audio = f"/tmp/line_audio_{msg_id}.m4a"
                with open(local_audio, "wb") as f:
                    f.write(audio_bytes)
                
                print("Transcribing with NotebookLM...", flush=True)
                transcript = transcribe_with_notebooklm(local_audio)
                raw_text = transcript
                if os.path.exists(local_audio):
                    os.remove(local_audio)
                ai_payload = summarize_with_gemini(raw_text=raw_text, source_url="", msg_type="audio")
                ai_payload["transcript"] = raw_text

            elif msg_type == "text":
                text_content = msg.get("text", "").strip()
                # Check for URL anywhere in the message text
                url_match = re.search(r'https?://[^\s]+', text_content)
                if url_match:
                    source_url = url_match.group(0)
                    print(f"Detected URL in text message: {source_url}", flush=True)
                    fetched_text = fetch_url_content(source_url)
                    if fetched_text:
                        raw_text = f"{text_content}\n\n[網頁內容]\n{fetched_text}"
                    else:
                        raw_text = text_content
                else:
                    raw_text = text_content
                ai_payload = summarize_with_gemini(raw_text=raw_text, source_url=source_url, msg_type="text")

            print(f"AI Payload Generated: Title='{ai_payload.get('Title')}', Category='{ai_payload.get('category')}', Tags={ai_payload.get('tags')}", flush=True)

            notion_url = send_to_notion_summary(ai_payload)
            page_title = ai_payload.get("Title", "LINE 筆記")
            summary_text = ai_payload.get("摘要", "")
            
            clean_notion_url = notion_url if notion_url.startswith("http") else "https://notion.so"
            reply_text = f"📌 已成功寫入 Notion！\n標題：{page_title}\n🔗 連結：{clean_notion_url}"
            print(f"Success! Notion URL: {clean_notion_url}", flush=True)

        except Exception as e:
            reply_text = f"❌ 處理失敗: {str(e)}"
            print(f"Error handling event: {e}", flush=True)
            page_title = "處理失敗"
            summary_text = str(e)
            clean_notion_url = "https://notion.so"

        # Send Flex Message back to LINE
        if reply_token and reply_token != "dummy_token":
            flex_json = {
                "type": "bubble",
                "size": "mega",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        { "type": "text", "text": "📌 Notion 自動歸檔成功 (Gemini AI 視覺與摘要)", "weight": "bold", "color": "#1DB446", "size": "sm" },
                        { "type": "text", "text": page_title[:30], "weight": "bold", "size": "lg", "margin": "xs", "wrap": True }
                    ]
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        { "type": "text", "text": f"摘要：{summary_text[:100]}", "size": "sm", "color": "#666666", "wrap": True }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "action": {
                                "type": "uri",
                                "label": "開啟 Notion 筆記",
                                "uri": clean_notion_url
                            },
                            "style": "primary",
                            "color": "#000000"
                        }
                    ]
                }
            }

            try:
                line_bot_api.reply_message(
                    ReplyMessageRequest(
                        reply_token=reply_token,
                        messages=[FlexMessage(alt_text=f"Notion: {page_title}", contents=FlexContainer.from_dict(flex_json))]
                    )
                )
                print("Flex reply sent successfully!", flush=True)
            except Exception as err:
                print(f"Flex message failed, falling back to text reply: {err}", flush=True)
                line_bot_api.reply_message(
                    ReplyMessageRequest(
                        reply_token=reply_token,
                        messages=[{"type": "text", "text": reply_text}]
                    )
                )

@app.get("/")
async def root_get():
    return {"status": "ok", "message": "LINE Notion Server is running 24/7 with Multimodal Gemini AI!"}

@app.post("/")
@app.post("/callback")
async def callback(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    try:
        data = json.loads(body.decode("utf-8"))
        events = data.get("events", [])
        for ev in events:
            background_tasks.add_task(process_line_event, ev)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return "OK"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
