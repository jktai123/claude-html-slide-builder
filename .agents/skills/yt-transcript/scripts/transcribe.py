#!/usr/bin/env python3
import sys
import os
import json
import time
import tempfile
import subprocess
import requests
import glob
import re

def print_err(msg):
    print(msg, file=sys.stderr, flush=True)

def get_api_auth(api_key):
    headers = {}
    params = {}
    if api_key.startswith("AIzaSy"):
        params["key"] = api_key
    else:
        # 處理 AQ. 開頭的 Google 內部 OAuth / Access Token
        headers["Authorization"] = f"Bearer {api_key}"
    return headers, params

def parse_vtt(vtt_path):
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    parsed = []
    # 正則表達式匹配時間戳記：如 00:00:01.891 --> 00:00:04.881
    time_pattern = re.compile(r'^(\d{2}:\d{2}:\d{2})')
    
    current_time = None
    for line in lines:
        line = line.strip()
        if not line:
            continue
        match = time_pattern.match(line)
        if match:
            current_time = match.group(1)
        elif current_time and not line.startswith('WEBVTT') and not line.startswith('Kind:') and not line.startswith('Language:'):
            # 移除 VTT 格式的 HTML 標籤
            cleaned = re.sub(r'<[^>]+>', '', line).strip()
            if cleaned:
                # 避免相鄰 cue 完全重複
                if not parsed or parsed[-1]['text'] != cleaned or parsed[-1]['time'] != current_time:
                    parsed.append({'time': current_time, 'text': cleaned})
                    
    # 將解析結果合併為 [hh:mm:ss] text
    result_lines = []
    for item in parsed:
        result_lines.append(f"[{item['time']}] {item['text']}")
    return "\n".join(result_lines)

def format_with_gemini(raw_text, api_key):
    headers, params = get_api_auth(api_key)
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    prompt = (
        "以下是從 YouTube 影片提取出的原始字幕文字（含有時間戳記，且因語音辨識原因可能包含大量重複或斷句碎片）。"
        "請協助將其整理成一份連貫流暢、格式精美的繁體中文會議/教學逐字稿。請遵守以下規則：\n"
        "1. 合併過於碎片化的短句，並根據說話者的語氣與內容脈絡，自動將對話劃分段落、標上說話者（例如：說話者 A、說話者 B）。\n"
        "2. 每段話前保留代表性時間軸（格式如 [hh:mm:ss]）。\n"
        "3. 去除所有不必要的重複詞彙、口頭禪與語音辨識產生的重疊重複句子。\n"
        "4. 絕對不可修改或虛構影片的原始語意與關鍵詞。"
    )
    
    for model in models_to_try:
        gen_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": raw_text},
                        {"text": prompt}
                    ]
                }
            ]
        }
        try:
            res = requests.post(gen_url, json=payload, headers=headers, params=params, timeout=300)
            res.raise_for_status()
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                return "".join([part.get("text", "") for part in parts])
        except Exception as e:
            print_err(f"使用 {model} 整理字幕失敗: {e}")
    return None

def generate_summary_file(transcript, summary_file, api_key):
    headers, params = get_api_auth(api_key)
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    summary_prompt = "請根據這份逐字稿，產出結構清晰、重點分明的繁體中文內容摘要。"
    for model in models_to_try:
        gen_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": transcript},
                        {"text": summary_prompt}
                    ]
                }
            ]
        }
        try:
            res = requests.post(gen_url, json=payload, headers=headers, params=params, timeout=300)
            res.raise_for_status()
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                summary_text = "".join([part.get("text", "") for part in parts])
                with open(summary_file, "w", encoding="utf-8") as out_sum:
                    out_sum.write(summary_text)
                print(f"摘要已儲存至: {summary_file}", flush=True)
                return
        except Exception as e:
            print_err(f"警告: 生成摘要失敗 ({model}): {e}")

def main():
    if len(sys.argv) < 2:
        print_err("使用方法: python3 transcribe.py <YouTube_URL> [輸出檔名.txt]")
        sys.exit(1)

    url = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "transcript.txt"

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print_err("錯誤: 請先設定 GEMINI_API_KEY 環境變數。")
        sys.exit(1)

    # 嘗試直接獲取 YouTube 字幕檔
    print("嘗試檢查該 YouTube 影片是否有可用字幕檔...", flush=True)
    temp_dir = tempfile.gettempdir()
    temp_sub_prefix = os.path.join(temp_dir, f"yt_sub_{int(time.time())}")
    
    yt_sub_cmd = [
        "yt-dlp",
        "--skip-download",
        "--write-subs",
        "--write-auto-subs",
        "--sub-lang", "zh-Hant,zh-TW,zh-Hans,zh,en",
        "--sub-format", "vtt",
        "-o", f"{temp_sub_prefix}",
        url
    ]
    
    try:
        subprocess.run(yt_sub_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        vtt_files = glob.glob(f"{temp_sub_prefix}.*.vtt")
        if vtt_files:
            preferred_langs = ['zh-TW', 'zh-Hant', 'zh-Hans', 'zh', 'en']
            best_vtt = None
            for lang in preferred_langs:
                matched = [f for f in vtt_files if f.endswith(f".{lang}.vtt")]
                if matched:
                    best_vtt = matched[0]
                    break
            if not best_vtt:
                best_vtt = vtt_files[0]
            
            print(f"找到可用字幕檔: {best_vtt}，開始解析...", flush=True)
            raw_transcript_text = parse_vtt(best_vtt)
            
            # 使用 Gemini 進行格式化與說話者標記
            print("正在使用 Gemini 將字幕整理為連貫的繁體中文逐字稿 (含說話者與時間軸)...", flush=True)
            formatted_transcript = format_with_gemini(raw_transcript_text, api_key)
            
            if not formatted_transcript:
                print("警告: 呼叫 Gemini 整理字幕失敗（可能是 API Key 過期或無權限）。將直接使用原始字幕存檔！", flush=True)
                formatted_transcript = raw_transcript_text
            
            with open(output_file, "w", encoding="utf-8") as out:
                out.write(formatted_transcript)
            print(f"\n轉錄完成 (字幕版)！已儲存至: {output_file}", flush=True)
            
            # 產生重點摘要
            print("正在使用 Gemini 生成重點摘要...", flush=True)
            summary_file = output_file.replace(".txt", "_summary.txt") if output_file.endswith(".txt") else output_file + "_summary.txt"
            generate_summary_file(formatted_transcript, summary_file, api_key)
            
            # 清理字幕暫存
            for f in vtt_files:
                try:
                    os.remove(f)
                except:
                    pass
            sys.exit(0)
    except Exception as e:
        print(f"嘗試獲取字幕失敗或發生錯誤，將改用音訊轉錄流程。詳細原因: {e}", flush=True)
        # 清理可能下載了一半的字幕
        for f in glob.glob(f"{temp_sub_prefix}.*"):
            try:
                os.remove(f)
            except:
                pass

    # 將暫存音訊存放在系統臨時目錄（通常是高速的本機 SSD），避免外部硬碟 I/O 瓶頸
    temp_audio = os.path.join(temp_dir, f"yt_audio_{int(time.time())}.mp3")

    # 1. 使用 yt-dlp 下載音訊
    print("正在下載 YouTube 影片音訊 (將於本機臨時目錄處理，品質 24k)...", flush=True)
    yt_dlp_cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "24K",
        "-o", temp_audio.replace(".mp3", ".%(ext)s"),
        url
    ]
    try:
        subprocess.run(yt_dlp_cmd, check=True)
    except subprocess.CalledProcessError as e:
        print_err(f"錯誤: yt-dlp 下載失敗: {e}")
        sys.exit(1)

    if not os.path.exists(temp_audio):
        print_err("錯誤: 未找到下載後的音訊檔案。")
        sys.exit(1)

    file_size = os.path.getsize(temp_audio)
    print(f"下載與轉碼完成，音訊大小: {file_size / (1024*1024):.2f} MB", flush=True)

    # 設定 API 驗證資訊
    headers, params = get_api_auth(api_key)

    # 2. 上傳至 Gemini File API
    print("正在上傳音訊至 Gemini API...", flush=True)
    upload_url = "https://generativelanguage.googleapis.com/upload/v1beta/files"
    metadata = {
        "file": {
            "display_name": "YT_Audio_Temp"
        }
    }
    
    try:
        with open(temp_audio, "rb") as f:
            files = {
                "file": (os.path.basename(temp_audio), f, "audio/mp3")
            }
            data = {
                "metadata": json.dumps(metadata)
            }
            response = requests.post(upload_url, files=files, data=data, headers=headers, params=params, timeout=300)
            response.raise_for_status()
            res_json = response.json()
    except Exception as e:
        print_err(f"錯誤: 上傳至 Gemini API 失敗: {e}")
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
        sys.exit(1)

    file_info = res_json.get("file", {})
    file_name = file_info.get("name")
    file_uri = file_info.get("uri")
    
    if not file_name or not file_uri:
        print_err(f"錯誤: API 未返回有效的檔案資訊。回應: {res_json}")
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
        sys.exit(1)

    print(f"上傳成功。檔案名稱: {file_name}", flush=True)

    # 3. 等待 API 處理音訊完成
    print("等待 Gemini 處理音訊檔案...", flush=True)
    status_url = f"https://generativelanguage.googleapis.com/v1beta/{file_name}"
    while True:
        try:
            status_res = requests.get(status_url, headers=headers, params=params, timeout=30).json()
            state = status_res.get("state")
            print(f"當前狀態: {state}", flush=True)
            if state == "ACTIVE":
                break
            elif state == "FAILED":
                print_err("錯誤: Gemini 處理音訊失敗。")
                clean_up(api_key, file_name, temp_audio)
                sys.exit(1)
        except Exception as e:
            print_err(f"取得檔案狀態時發生錯誤: {e}")
        time.sleep(5)

    # 4. 呼叫 Gemini 進行語音轉文字
    print("正在使用 Gemini 生成繁體中文逐字稿...", flush=True)
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    prompt = (
        "請為這段中文音訊產出完整的繁體中文逐字稿。如果是訪談、演講或多人對談，"
        "請務必自動標註說話者（例如：說話者 A、說話者 B）並加上時間軸（格式如 [hh:mm:ss]）。"
    )
    
    transcript = None
    success = False

    for model in models_to_try:
        if success:
            break
        print(f"嘗試使用模型: {model}", flush=True)
        gen_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"file_data": {"mime_type": "audio/mp3", "file_uri": file_uri}},
                        {"text": prompt}
                    ]
                }
            ]
        }

        for attempt in range(3):
            try:
                gen_res = requests.post(gen_url, json=payload, headers=headers, params=params, timeout=300)
                if gen_res.status_code == 503:
                    print(f"伺服器忙碌 (503)，等待 10 秒後進行第 {attempt+1}/3 次重試...", flush=True)
                    time.sleep(10)
                    continue
                gen_res.raise_for_status()
                gen_json = gen_res.json()
                
                candidates = gen_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    transcript = "".join([part.get("text", "") for part in parts])
                    success = True
                    break
                else:
                    print_err(f"警告: API 未能產生候選內容。回應: {gen_json}")
            except Exception as e:
                print_err(f"呼叫模型 {model} 失敗: {e}")
                time.sleep(10)

    if success and transcript:
        with open(output_file, "w", encoding="utf-8") as out:
            out.write(transcript)
        print(f"\n轉錄完成！逐字稿已儲存至: {output_file}", flush=True)

        # 5. 自動產生重點摘要
        print("正在使用 Gemini 生成重點摘要...", flush=True)
        summary_file = output_file.replace(".txt", "_summary.txt") if output_file.endswith(".txt") else output_file + "_summary.txt"
        summary_prompt = "請根據這份逐字稿，產出結構清晰、重點分明的繁體中文內容摘要。"
        
        for model in models_to_try:
            sum_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload_summary = {
                "contents": [
                    {
                        "parts": [
                            {"text": transcript},
                            {"text": summary_prompt}
                        ]
                    }
                ]
            }
            try:
                sum_res = requests.post(sum_url, json=payload_summary, headers=headers, params=params, timeout=300)
                if sum_res.status_code == 503:
                    time.sleep(5)
                    continue
                sum_res.raise_for_status()
                sum_json = sum_res.json()
                sum_candidates = sum_json.get("candidates", [])
                if sum_candidates:
                    sum_parts = sum_candidates[0].get("content", {}).get("parts", [])
                    summary_text = "".join([part.get("text", "") for part in sum_parts])
                    with open(summary_file, "w", encoding="utf-8") as out_sum:
                        out_sum.write(summary_text)
                    print(f"摘要已儲存至: {summary_file}", flush=True)
                    break
            except Exception as e:
                print_err(f"警告: 生成摘要失敗 ({model}): {e}")
    else:
        print_err("錯誤: 所有模型均未能成功轉錄此音訊。")

    # 6. 清理資源
    clean_up(api_key, file_name, temp_audio)

def clean_up(api_key, file_name, temp_audio):
    print("清理暫存檔案與 API 資源...", flush=True)
    if os.path.exists(temp_audio):
        os.remove(temp_audio)
    
    delete_url = f"https://generativelanguage.googleapis.com/v1beta/{file_name}"
    headers, params = get_api_auth(api_key)
    try:
        res = requests.delete(delete_url, headers=headers, params=params, timeout=30)
        if res.status_code == 200:
            print("API 暫存音訊刪除成功。", flush=True)
    except Exception as e:
        print_err(f"警告: 刪除 API 暫存檔案失敗: {e}")

if __name__ == "__main__":
    main()
