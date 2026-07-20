---
name: yt-transcript
description: 下載並轉錄沒有字幕的 YouTube 影片為中文逐字稿，內含時間戳記與說話者標記。
---

# yt-transcript Skill

這是一個用來下載 YouTube 影片音訊，並使用 Gemini API 自動轉錄成繁體中文逐字稿的 Skill。

## 依賴需求

1. 系統必須安裝 `yt-dlp` 與 `ffmpeg`。
2. 環境變數必須包含 `GEMINI_API_KEY`。

## 使用方式

這個 Skill 支援兩種轉錄管道：

### 1. 雲端轉錄 (使用 Gemini API)
執行以下指令，或直接在對話中要求 Agent 使用此 Skill 幫您轉錄：
```bash
python3 .agents/skills/yt-transcript/scripts/transcribe.py "<YouTube_URL>" "[輸出檔案.txt]"
```

### 2. 本地轉錄 (使用 whisper-cpp，免 API Key 且支援 Apple Silicon)
如果 API Key 限制或沒有網路，可以使用本地轉錄功能：
```bash
# 需先安裝 whisper-cpp：brew install whisper-cpp
python3 .agents/skills/yt-transcript/scripts/transcribe_local.py "<YouTube_URL>" "[輸出檔案.txt]"
```

## 功能特點

1. 即使 YouTube 影片本身沒有提供任何字幕，亦可透過語音辨識抓出完整內容。
2. 自動標記說話者（說話者 A、說話者 B...）。
3. 自動加上時間軸（例如 `[00:01:23]`）。
4. 匯出為精準的繁體中文。
