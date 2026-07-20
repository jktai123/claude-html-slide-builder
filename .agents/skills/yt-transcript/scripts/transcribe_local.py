#!/usr/bin/env python3
import sys
import os
import time
import tempfile
import subprocess
import shutil

def print_err(msg):
    print(msg, file=sys.stderr, flush=True)

def main():
    if len(sys.argv) < 2:
        print_err("使用方法: python3 transcribe_local.py <YouTube_URL> [輸出檔名.txt]")
        sys.exit(1)

    url = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "transcript.txt"

    # 1. 定位 whisper 命令列執行檔 (新版 Homebrew 稱為 whisper-cli，舊版稱為 whisper-cpp)
    whisper_bin = (
        shutil.which("whisper-cli") or 
        shutil.which("whisper-cpp") or
        shutil.which("/opt/homebrew/bin/whisper-cli") or
        shutil.which("/opt/homebrew/bin/whisper-cpp")
    )
    
    # 額外手動檢查 fallback 絕對路徑
    if not whisper_bin:
        for path in ["/opt/homebrew/bin/whisper-cli", "/opt/homebrew/bin/whisper-cpp", "/usr/local/bin/whisper-cli"]:
            if os.path.exists(path):
                whisper_bin = path
                break

    if not whisper_bin:
        print_err("錯誤: 找不到 whisper-cli 或 whisper-cpp。請先執行以下指令安裝：")
        print_err("brew install whisper-cpp")
        sys.exit(1)

    print(f"找到轉錄工具: {whisper_bin}", flush=True)

    if not shutil.which("yt-dlp"):
        print_err("錯誤: 找不到 yt-dlp。請先安裝它。")
        sys.exit(1)

    if not shutil.which("ffmpeg"):
        print_err("錯誤: 找不到 ffmpeg。")
        sys.exit(1)

    # 2. 檢查/下載模型
    model_dir = os.path.expanduser("~/.whisper")
    model_path = os.path.join(model_dir, "ggml-base.bin")
    if not os.path.exists(model_path):
        os.makedirs(model_dir, exist_ok=True)
        print("未在 ~/.whisper 找到 base 模型，正在從 Hugging Face 下載...", flush=True)
        download_cmd = [
            "curl", "-L",
            "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
            "-o", model_path
        ]
        try:
            subprocess.run(download_cmd, check=True)
        except subprocess.CalledProcessError as e:
            print_err(f"錯誤: 模型下載失敗: {e}")
            sys.exit(1)

    # 3. 下載 YouTube 音訊並轉為 16kHz Mono Wav，全部使用系統 /tmp 臨時目錄避開磁碟 I/O 瓶頸
    print("正在下載 YouTube 影片音訊 (將於本地高速臨時目錄處理)...", flush=True)
    
    temp_dir = tempfile.gettempdir()
    temp_raw = os.path.join(temp_dir, f"temp_raw_{int(time.time())}.wav")
    temp_16k = os.path.join(temp_dir, f"temp_16k_{int(time.time())}.wav")

    # 用 yt-dlp 先拉下 wav
    yt_dlp_cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "wav",
        "-o", temp_raw.replace(".wav", ".%(ext)s"),
        url
    ]
    try:
        subprocess.run(yt_dlp_cmd, check=True)
    except subprocess.CalledProcessError as e:
        print_err(f"錯誤: yt-dlp 下載失敗: {e}")
        sys.exit(1)

    # 因為副檔名可能會變，動態找一下下載後的檔案
    actual_raw = temp_raw
    if not os.path.exists(temp_raw):
        temp_base = os.path.basename(temp_raw).split('.')[0]
        found = False
        for file in os.listdir(temp_dir):
            if file.startswith(temp_base):
                actual_raw = os.path.join(temp_dir, file)
                found = True
                break
        if not found:
            print_err("錯誤: 未找到下載後的原始音訊檔案。")
            sys.exit(1)

    print("正在轉換音訊為 16kHz 單聲道 WAV 格式...", flush=True)
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", actual_raw,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        temp_16k
    ]

    try:
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except subprocess.CalledProcessError as e:
        print_err(f"錯誤: ffmpeg 音訊轉碼失敗: {e}")
        if os.path.exists(actual_raw): os.remove(actual_raw)
        sys.exit(1)

    # 4. 使用 whisper-cli 進行本地轉錄
    print("正在使用本地 whisper-cli 進行轉錄 (這需要 1~2 分鐘，請稍候)...", flush=True)
    
    temp_txt_out = os.path.join(temp_dir, f"whisper_out_{int(time.time())}")
    
    whisper_cmd = [
        whisper_bin,
        "-m", model_path,
        "-f", temp_16k,
        "-otxt",
        "-of", temp_txt_out,
        "-l", "zh"
    ]
    try:
        subprocess.run(whisper_cmd, check=True)
        
        gen_txt = temp_txt_out + ".txt"
        if os.path.exists(gen_txt):
            shutil.copyfile(gen_txt, output_file)
            print(f"\n本地轉錄完成！已儲存至: {output_file}", flush=True)
            
            # 使用環境變數的 GEMINI_API_KEY 嘗試自動生成摘要
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                print("正在透過 Gemini 產生摘要...", flush=True)
                summary_file = output_file.replace(".txt", "_summary.txt") if output_file.endswith(".txt") else output_file + "_summary.txt"
                
                headers = {}
                params = {}
                if api_key.startswith("AIzaSy"):
                    params["key"] = api_key
                else:
                    headers["Authorization"] = f"Bearer {api_key}"
                
                with open(output_file, "r", encoding="utf-8") as f:
                    transcript = f.read()

                models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
                summary_prompt = "請根據這份逐字稿，產出結構清晰、重點分明的繁體中文內容摘要。"
                
                success_summary = False
                for model in models_to_try:
                    if success_summary: break
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
                        sum_res = requests.post(sum_url, json=payload_summary, headers=headers, params=params, timeout=120)
                        sum_res.raise_for_status()
                        sum_json = sum_res.json()
                        sum_candidates = sum_json.get("candidates", [])
                        if sum_candidates:
                            sum_parts = sum_candidates[0].get("content", {}).get("parts", [])
                            summary_text = "".join([part.get("text", "") for part in sum_parts])
                            with open(summary_file, "w", encoding="utf-8") as out_sum:
                                out_sum.write(summary_text)
                            print(f"摘要已儲存至: {summary_file}", flush=True)
                            success_summary = True
                    except Exception as e:
                        pass
        else:
            print_err("錯誤: 未能生成本地轉錄檔案。")
    except subprocess.CalledProcessError as e:
        print_err(f"錯誤: whisper-cli 轉錄失敗: {e}")

    # 清理 /tmp 暫存
    for f in [actual_raw, temp_16k, temp_txt_out + ".txt"]:
        if os.path.exists(f):
            os.remove(f)

if __name__ == "__main__":
    main()
