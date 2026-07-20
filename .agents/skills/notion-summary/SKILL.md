---
name: Notion摘要
description: >-
  將網頁連結或長文章內容進行 AI 摘要與分類，並存入指定 Notion Database 
  (https://app.notion.com/p/3285e6741c4d8084a436d6c081642c73?v=3285e6741c4d806084dd000c8aaadf4c&source=copy_link)
---

# Notion 摘要技能 (Notion摘要)

此技能用於抓取網頁或讀取長文字，並使用 AI 進行摘要分類，最後存入使用者的 Notion 資料庫中。

## ⚙️ 核心流程

當使用者要求將特定網頁或文章「摘要儲存至 Notion」時，請執行以下步驟：

1. **獲取內容**：
   - **網址情境**：若使用者提供的是 URL，請使用 `read_url_content` 工具獲取該網頁的內容。此時 JSON 的 `URL` 欄位為該網址，`content` 欄位存放網頁的主要文章內容。
   - **純文字情境**：若使用者直接提供文章內容，則直接使用該內容。此時 JSON 的 `URL` 欄位為空字串 `""`，`content` 欄位存放使用者提供的完整文章內容。

2. **AI 分類與摘要**：
   - 使用以下 System Prompt 讓 Model 進行處理，並產生 JSON（注意額外包含 `content` 欄位以便將內文寫入 Notion Page 內）：
   
   ```text
   你是一位專業內容分類與摘要專家。請嚴格只輸出以下 JSON 格式，勿添加任何額外文字、Markdown、程式碼區塊或前後空白，直接給純 JSON 物件：
   絕對禁止輸出任何前綴、後綴、說明文字、表情符號、Markdown、換行或額外字元。
   輸出必須從第一個字元就是 '{'，最後一個字元就是 '}'，文字內容本身不能含有雙引號 ",且為完全有效的 JSON。
   {
     "Title": "名稱",
     "日期": "今天日期 (格式為 YYYY-MM-DD，腳本寫入時會一律強制設為今天)",
     "URL": "來源 URL",
     "摘要": "使用繁體中文，100 字以內摘要",
     "category": "科技/投資/教會/生活 中選擇最符合的一項",
     "tags": ["標籤1","標籤2","標籤3"] (最多 5 個相關繁體中文標籤),
     "importance": "高/中/低",
     "content": "詳細摘要或擷取出的文章主要段落，用於寫入 Notion 頁面內部",
     "mindmap": "以 Mermaid 語法（例如 mindmap\n  root((主題))\n    分支1\n    分支2）繪製的內容心智圖，用於在 Notion 中以 Mermaid Code Block 方式渲染",
     "images": ["/absolute/path/to/img.jpg"] (若使用者上傳了圖片，請填入該圖片之本地絕對路徑清單；無圖片則填入空陣列 [])
   }
   ```

3. **寫入 Notion**：
   - 將產生的 JSON 字串作為 `stdin`，呼叫 Python 輔助腳本寫入 Notion：
   
   ```bash
   echo '<JSON_STRING>' | python3 .agents/skills/notion-summary/scripts/notion_summary.py
   ```
   
4. **回報結果**：
   - 將 Python 腳本輸出的「Notion 連結」回報給使用者。
