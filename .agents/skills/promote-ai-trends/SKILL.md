---
name: promote-ai-trends
description: |
  用於收集、整理與推廣最新的 AI 趨勢及工具教學影片。當使用者提到「推廣最近的 AI 影片」、「整理最新的 AI 工具教學」、「分享熱門 AI 影片」或需要將 AI 影片清單製作成 Obsidian 筆記、簡報大綱或社群貼文時，啟用此技能。
---

# 推廣最新 AI 趨勢教學影片技能 (promote-ai-trends)

本技能旨在將最近熱門的 AI 工具與趨勢教學影片進行結構化整理，並自動化生成多管道的推廣與學習內容。

---

## 1. 資訊收集與篩選 (Collect & Filter)

### 1.1 搜尋方式
* 如果使用者未提供影片清單，則使用 `search_web` 搜尋 YouTube 上最近一個月內熱門的 AI 教學影片。
* 建議關鍵字組合：
  - `"AI工具教學" OR "AI教學 2026" OR "ChatGPT教學 2026"`
  - 依據當前年份（例如 2026 年）動態搜尋最新發布的熱門影片。

### 1.2 結構化欄位
無論是搜尋取得或由使用者提供，皆須整理成以下五大必備欄位：
1. **影片標題 (Title)**：完整 YouTube 影片標題。
2. **頻道名稱 (Channel)**：發布該影片的 YouTube 頻道。
3. **影片連結 (Link)**：`https://www.youtube.com/watch?v=...` 格式之連結。
4. **一句話摘要 (Summary)**：精煉出該影片的核心教學重點或最值得看的亮點。
5. **觀看人數 (Views)**：以觀看次數排序（若有數據）。

---

## 2. 產出 1：Obsidian 知識/創作庫筆記 (Obsidian Note)

依據專案第二大腦規則，將整理好的影片清單存入 Obsidian 創作庫：

### 2.1 儲存路徑
1. **Obsidian Vault 目錄**：`/Users/jktai/Library/Mobile Documents/iCloud~md~obsidian/Documents/secondbrain/創作庫/`
2. **專案備份目錄**：同時在專案根目錄 `/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/` 下儲存一份複本，檔名為 `ai_trends_promotion_{yyyyMMdd}.md`。

### 2.2 筆記格式
必須包含完整 Frontmatter 以及結構化表格：

```markdown
---
title: 2026最新AI趨勢與熱門工具教學影片推薦
date: yyyy-MM-dd
tags: [AI, 趨勢, 影片推薦, 創作庫]
---

# 2026最新AI趨勢與熱門工具教學影片推薦

本篇整理了近期最受關注的 AI 教學影片，涵蓋工具更新、實戰工作流與教學應用。

| 標題 | 頻道 | 連結 | 一句話摘要 | 觀看次數 |
| :--- | :--- | :--- | :--- | :--- |
| 影片1 | 頻道A | [Link](url) | 摘要 | X 次 |
...
```

---

## 3. 產出 2：Reveal.js HTML 簡報大綱 (HTML Slide Outline)

針對本專案的 `html-slide-builder` 技能，自動規劃一份 **HTML 互動簡報大綱草稿**。

### 3.1 簡報大綱架構
* **頁數**：約 8-10 頁。
* **亮暗結構 (Sandwich)**：封面 [DARK]、過渡/結論頁 [DARK]、一般內容頁 [LIGHT]。
* **視覺強化規劃**：
  - **[BG]** 封面與封底配圖。
  - **[ICON]** 3-4 個並列項目使用去背扁平化圖標。
  - **[INTERACT:wordcloud]** 開場詢問學員最常使用的 AI 工具。
  - **[VIZ:mindmap]** 結尾心智圖，整合今日介紹的工具關係。

### 3.2 簡報大綱輸出格式
直接生成符合 `html-slide-builder` 規格的 Markdown 大綱，供後續一鍵生成簡報：

```markdown
## 📋 簡報大綱草稿：AI 趨勢教學影片推廣

| 頁碼 | 標題 | 內容摘要 | 頁面結構 | 功能標記 |
|---|---|---|---|---|
| 1 | 封面 | 2026 熱門 AI 工具與工作流推薦 | [DARK] | [BG] |
| 2 | 破冰提問 | 你目前最想學哪種 AI 工具？ | [LIGHT] | [INTERACT:wordcloud] |
...
```

---

## 4. 產出 3：社群平台推廣草稿 (Social Media Drafts)

為多個社群平台客製化宣傳文案：

### 4.1 X / Twitter 貼文線 (Thread)
* 格式：3-4 則推文組成的 Thread。
* 風格：節奏快、亮點明確、附帶表情符號與 Hashtags `#AI` `#ChatGPT`。
* 內容：
  - 推文 1：高吸引力 Hooks（例如：「2026 年只剩下這 5 個 AI 工具值得你花時間...」）。
  - 推文 2：精選前 3 名影片的快速亮點。
  - 推文 3：呼籲行動（CTA）與完整清單/影片連結。

### 4.2 微信公眾號文章草稿 (WeChat Article)
* 格式：適合長文閱讀的 Markdown。
* 風格：親切、乾貨滿滿、結構清晰。
* 排版優化：
  - 標題使用 `###` 並以粗體標示。
  - 影片連結在底部統一列出為「參考文獻/引用連結」，符合微信不支援外鏈的閱讀習慣。
