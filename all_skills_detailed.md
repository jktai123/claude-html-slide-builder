# 您的所有 Antigravity 技能 (Skills) 詳細指南

此文件詳細列出您系統中已安裝的 **91 個** 技能（Skills），並根據其主要功能與應用範圍進行了分類整理。您隨時可以點選路徑直接打開對應的說明檔（`SKILL.md`）。

---

## 快速目錄索引

1. [Notion 與工作流整合](#1-notion-與工作流整合)
2. [社群媒體與內容發布 (WeChat, X, 微博, 小紅書)](#2-社群媒體與內容發布-wechat-x-微博-小紅書)
3. [AI 圖像生成、視覺與圖表設計](#3-ai-圖像生成視覺與圖表設計)
4. [互動簡報與 PPT 生成](#4-互動簡報與-ppt-生成)
5. [影片、YouTube 語音轉錄與多媒體](#5-影片youtube-語音轉錄與多媒體)
6. [Chrome 瀏覽器自動化與網頁除錯 (DevTools)](#6-chrome-瀏覽器自動化與網頁除錯-devtools)
7. [Firebase、Android 與行動端開發](#7-firebaseandroid-與行動端開發)
8. [Antigravity / Claude Code 設定與懶人包](#8-antigravity--claude-code-設定與懶人包)
9. [實用輔助工具 (翻譯、格式化、搜尋與抓取)](#9-實用輔助工具-翻譯格式化搜尋與抓取)

---

## 1. Notion 與工作流整合
這組技能主要用於管理 Notion 資料庫、記錄日記、會議記錄、研究摘要，以及從 Spec 規格書自動生成實作任務。

*   **Notion 日記**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-diary/SKILL.md)
    *   **觸發詞**: `Notion日記`
    *   **功能**: 自動在 Notion 資料庫建立/更新台北時間當天的日記（格式 `mm/dd/yyyy`），並支持資料的追加（Append），完成後提供 Notion 連結。
    *   **適用範圍**: 個人每日工作日誌與生活記錄。

*   **notion-cli**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-cli/SKILL.md)
    *   **觸發詞**: `notion-cli`, `ntn`
    *   **功能**: 調用 Notion CLI 工具 `ntn`，用以操作 Notion API、部署 Notion Worker 以及上傳檔案。

*   **notion-knowledge-capture**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-knowledge-capture/SKILL.md)
    *   **功能**: 將對話或討論內容結構化地捕獲，並直接存入 Notion wiki 或資料庫中，防止知識碎片化。

*   **notion-meeting-intelligence**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-meeting-intelligence/SKILL.md)
    *   **功能**: 收集 Notion 中的會議背景，經由 AI 提煉後，為內部生成 Pre-read（預讀材料），並為外部生成 Agenda（會議議程）儲存至 Notion。

*   **notion-research-documentation**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-research-documentation/SKILL.md)
    *   **功能**: 跨 Notion 多個頁面搜尋、綜合分析，最終生成帶有正確引用的綜合研究報告。

*   **notion-spec-to-implementation**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notion-spec-to-implementation/SKILL.md)
    *   **功能**: 將 Notion 上的產品或技術規格書（Spec）拆解成具體的實作任務（Tasks），以便於 Claude Code 直接執行與進度追蹤。

---

## 2. 社群媒體與內容發布 (WeChat, X, 微博, 小紅書)
這組技能專為內容創作者設計，支持將 Markdown/HTML 內容一鍵發布至各大主流社交平台，並自動生成配圖與視覺卡片。

*   **baoyu-post-to-wechat**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-post-to-wechat/SKILL.md)
    *   **觸發詞**: `发布公众号`, `post to wechat`, `微信公众号`
    *   **功能**: 通過 API 或 Chrome CDP 發布文章至微信公眾號，自動將外鏈轉換為微信友好的底部引用，並支持多圖文發布。

*   **baoyu-post-to-weibo**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-post-to-weibo/SKILL.md)
    *   **觸發詞**: `post to Weibo`, `发微博`, `微博头条文章`
    *   **功能**: 發布常規微博（文字/圖影）或長篇頭條文章（支持 Markdown 渲染）至新浪微博。

*   **baoyu-post-to-x**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-post-to-x/SKILL.md)
    *   **觸發詞**: `post to X`, `tweet`, `X Articles`
    *   **功能**: 發布推文、推特貼圖，或是長篇 X Articles (Markdown 格式)，支持 Chrome 插件或 CDP 模式。

*   **baoyu-xhs-images (小紅書圖片卡片)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-xhs-images/SKILL.md)
    *   **觸發詞**: `小红书图片`, `小红书种草`, `圖片卡片`
    *   **功能**: 將一段文章內容拆解，並生成 1-10 張適合小紅書/微信圖文的精美視覺卡片。支持 12 種視覺風格、8 種版面配置與 3 種配色方案。

*   **content-creation-publisher**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/content-creation-publisher/SKILL.md)
    *   **功能**: 整合網頁採集、Markdown 格式化、智能配圖、多平台發布的「全流程一站式解決方案」。

*   **baoyu-wechat-summary**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-wechat-summary/SKILL.md)
    *   **觸發詞**: `总结群聊`, `微信群聊摘要`
    *   **功能**: 利用本地 `wx-cli` 工具，導出微信群聊紀錄並生成結構化的精華摘要，包含普通版與「毒舌吐槽版」（Roast），並維持群聊歷史、使用者畫像與群組事實記憶。

---

## 3. AI 圖像生成、視覺與圖表設計
此分類涵蓋所有 AI 繪圖與圖表工具，能生成插圖、封面圖、架構圖、心智圖以及簡報視覺配圖。

*   **baoyu-image-gen**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-image-gen/SKILL.md)
    *   **功能**: 呼叫各類 AI 繪圖 API（GPT Image 2, Google, Replicate 等）進行單張或批量生圖，支持參考圖和寬高比設定。

*   **cc-draw**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/cc-draw/SKILL.md)
    *   **觸發詞**: `安裝生圖`, `畫圖`, `生圖`
    *   **功能**: 為 Claude Code 安裝基於 `gpt-image-2` 的生圖擴充。

*   **baoyu-cover-image (文章封面生成)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-cover-image/SKILL.md)
    *   **觸發詞**: `generate cover image`, `create article cover`
    *   **功能**: 結合 11 種調色盤、7 種渲染風格，自訂生成比例為電影寬螢幕 (2.35:1)、寬螢幕 (16:9) 或正方形 (1:1) 的高品質文章封面。

*   **baoyu-article-illustrator (文章插圖大師)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-article-illustrator/SKILL.md)
    *   **觸發詞**: `illustrate article`, `为文章配图`
    *   **功能**: 分析文章結構，找出最需要視覺輔助的段落，並利用「類型 × 風格 × 調色盤」三維模型為文章自動生成整套插圖。

*   **baoyu-comic (知識漫畫創作)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-comic/SKILL.md)
    *   **觸發詞**: `知识漫画`, `tutorial comic`
    *   **功能**: 創作教育型漫畫（類似 Logicomix 風格），自動生成分鏡腳本並批量繪製漫畫格圖像。

*   **baoyu-diagram (SVG 圖表生成)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-diagram/SKILL.md)
    *   **觸發詞**: `画個圖`, `diagram`, `flowchart`
    *   **功能**: 自動繪製並輸出精美的深色主題 SVG 流程圖、架構圖、時序圖或心智圖，不依賴第三方渲染器。

*   **drawio-skill**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/drawio-skill/SKILL.md)
    *   **功能**: 生成 `.drawio` XML 圖表檔，並調用本地 draw.io 桌面 CLI 自動將其導出為 PNG、SVG 或 PDF，特別適合架構圖與複雜流程圖。

*   **ai-infographic-master** & **chalkboard-infographic** & **s-summary-designer**
    *   **路徑**: [ai-infographic-master](file:///Users/jktai/.gemini/config/skills/ai-infographic-master/SKILL.md) | [chalkboard-infographic](file:///Users/jktai/.gemini/config/skills/chalkboard-infographic/SKILL.md) | [s-summary-designer](file:///Users/jktai/.gemini/config/skills/s-summary-designer/SKILL.md)
    *   **功能**: 用於設計專業、資訊密度高、適合手機閱讀（9:16）的黑板風格或現代風格資訊圖卡。

*   **baoyu-infographic**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-infographic/SKILL.md)
    *   **觸發詞**: `infographic`, `信息图`, `visual summary`
    *   **功能**: 分析文字內容，選擇 21 種版面與 22 種視覺風格之一，生成適合出版的高品質資訊圖表。

---

## 4. 互動簡報與 PPT 生成
將文字、講義或教材直接生成可互動的網頁簡報（Reveal.js）或標準 PPT 檔案，並進行視覺美化。

*   **html-slide-builder (HTML 互動簡報生成器)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/html-slide-builder/SKILL.md)
    *   **觸發詞**: `做 Reveal.js 簡報`, `把教材轉成互動簡報`, `做成投影片`
    *   **功能**: 自動將文字、PDF 或教材轉為完整的 Reveal.js 互動簡報。會自動加入 **AI 背景圖**、**SVG 扁平化圖標**、**Firebase 即時互動投票/文字雲**、**滑桿視覺化對比**與 **CSS 互動式心智圖（每份簡報必含 1 頁）**，並可自動部署至 GitHub Pages。

*   **ppt-generator**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/ppt-generator/SKILL.md)
    *   **功能**: 基於七大角色協同機制，完成主題規劃、模板推薦、內容填充與 AI 配圖，生成標準的 `.pptx` 簡報檔案。

*   **nanobanana-ppt-visualizer**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/nanobanana-ppt-visualizer/SKILL.md)
    *   **功能**: PPT 視覺增強工具，提供多風格渲染、網頁播放器生成與 PPT 轉影片合成。

---

## 5. 影片、YouTube 語音轉錄與多媒體
下載影片、轉錄字幕、提取音訊，以及基於 AI 進行影片的二次創作。

*   **yt-transcript**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/yt-transcript/SKILL.md)
    *   **觸發詞**: `YouTube字幕`, `轉錄`, `逐字稿`
    *   **功能**: 下載並轉錄無字幕的 YouTube 影片為中文逐字稿，自動標記時間戳記與說話者。

*   **baoyu-youtube-transcript**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-youtube-transcript/SKILL.md)
    *   **觸發詞**: `get YouTube transcript`, `YouTube封面`
    *   **功能**: 提取 YouTube 影片字幕（支援多語系與翻譯），下載影片封面圖，並將字幕整理成按章節劃分的乾淨文本。

*   **video-transcript-downloader**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/video-transcript-downloader/SKILL.md)
    *   **功能**: 基於 `yt-dlp` 下載任何網站的影片、音訊與字幕，並將其格式化為段落分明的文字檔。

*   **notebooklm-transcribe**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/notebooklm-transcribe/SKILL.md)
    *   **功能**: 將本機音檔上傳至 NotebookLM 轉錄為逐字稿，並自動存入 Obsidian Clipping 筆記中。

*   **video-creation-suite** & **video-recreation**
    *   **路徑**: [video-creation-suite](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/video-creation-suite/SKILL.md) | [video-recreation](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/video-recreation/SKILL.md)
    *   **功能**: 完整的影片創作與「二次創作」套件。整合了 Coze API（視覺分析）、Edge-TTS（配音）與 Suno API（背景音樂），自動生成腳本、配音、字幕，最終合成新影片。

---

## 6. Chrome 瀏覽器自動化與網頁除錯 (DevTools)
使用 Chrome 開發者工具 MCP 對網頁進行自動化操作、無障礙空間審查、效能調優與記憶體洩漏分析。

*   **chrome-devtools**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/chrome-devtools-plugin/skills/chrome-devtools/SKILL.md)
    *   **功能**: 通過 MCP 控制 Chrome 瀏覽器，執行點擊、輸入、截圖、提取 DOM 樹等自動化除錯任務。

*   **a11y-debugging**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/chrome-devtools-plugin/skills/a11y-debugging/SKILL.md)
    *   **功能**: 依據 web.dev 指南審查網頁無障礙設計（Semantic HTML, ARIA 標籤, 焦點狀態, 色彩對比度等）。

*   **debug-optimize-lcp**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/chrome-devtools-plugin/skills/debug-optimize-lcp/SKILL.md)
    *   **功能**: 檢測與調優網頁 LCP（最大內容繪製時間）指標，優化 Core Web Vitals 載入速度。

*   **memory-leak-debugging**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/chrome-devtools-plugin/skills/memory-leak-debugging/SKILL.md)
    *   **功能**: 診斷 JS/Node.js 的記憶體洩漏，分析 Heap Snapshot (堆疊快照) 效能。

*   **troubleshooting**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/chrome-devtools-plugin/skills/troubleshooting/SKILL.md)
    *   **功能**: 用於排除 Chrome CDP 連線異常與 Target 遺失等環境問題。

---

## 7. Firebase、Android 與行動端開發
Firebase CLI 整合與行動端開發環境配置。

*   **firebase-basics** & **firebase-firestore**
    *   **路徑**: [firebase-basics](file:///Users/jktai/.gemini/config/plugins/firebase/skills/firebase_basics/SKILL.md) | [firebase-firestore](file:///Users/jktai/.gemini/config/plugins/firebase/skills/firebase_firestore/SKILL.md)
    *   **功能**: Firebase 環境初始化，以及 Firestore 資料庫的新增、管理、安全性規則審查與 SDK 程式碼生成。

*   **firebase-auth-basics** & **firebase-hosting-basics** & **firebase-app-hosting-basics**
    *   **路徑**: [firebase-auth](file:///Users/jktai/.gemini/config/plugins/firebase/skills/firebase_auth_basics/SKILL.md) | [firebase-hosting](file:///Users/jktai/.gemini/config/plugins/firebase/skills/firebase_hosting_basics/SKILL.md) | [firebase-app-hosting](file:///Users/jktai/.gemini/config/plugins/firebase/skills/firebase_app_hosting_basics/SKILL.md)
    *   **功能**: 整合 Firebase 會員驗證（Auth）、靜態託管（Hosting）或 Next.js 全端託管（App Hosting）。

*   **firebase-remote-config-basics** & **firebase-crashlytics** & **firebase-data-connect** & **firebase-security-rules-auditor** & **firebase-ai-logic-basics**
    *   **功能**: 涵蓋 Firebase Remote Config (功能開關)、Crashlytics (閃退監控)、Data Connect (PostgreSQL 資料庫連結)、安全性規則自動審查與 Firebase AI Logic (Gemini API 整合)。

*   **android-cli**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/android-cli-plugin/skills/SKILL.md)
    *   **功能**: 使用 Android SDK 進行專案創建、編譯、真機/模擬器部署與診斷。

*   **xcode-project-setup**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/plugins/firebase/skills/xcode_project_setup/SKILL.md)
    *   **功能**: 修改 iOS Xcode 專案檔 (`.pbxproj`)，自動引入 Swift Packages (如 Firebase SDK) 並設定編譯連結。

---

## 8. Antigravity / Claude Code 設定與懶人包
此分類包含所有用於擴充、設定 Claude Code 與 Antigravity 框架的技能。

*   **antigravity-guide**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/antigravity/builtin/skills/antigravity_guide/SKILL.md)
    *   **功能**: Google Antigravity (AGY) 框架的官方使用指南，包含 CLI 指令、SDK 套件用法與 Customization 指引。

*   **claude-code-lazy-packs (懶人包全集)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/claude-code-lazy-packs/SKILL.md)
    *   **觸發詞**: `Claude Code 懶人包`, `安裝懶人包`
    *   **功能**: 一鍵安裝與設定開發環境、MCP 串接與輔助 Skill。

*   **cc-env-setup** & **cc-github** & **cc-firebase** & **cc-gemini** & **cc-supabase** & **cc-obsidian** & **cc-notebooklm** & **cc-ollama**
    *   **功能**: 快速為 Claude Code 串接 GitHub CLI、Firebase、Gemini 免費 API、Supabase、Obsidian Vault、NotebookLM 或本地 AI (Ollama) 的環境部署包。

*   **cc-second-brain** (第二大腦)
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/cc-second-brain/SKILL.md)
    *   **觸發詞**: `建立第二大腦`
    *   **功能**: 部署與設定 Obsidian 的三層大腦結構。

*   **cc-workspace** & **cc-install-all**
    *   **功能**: 初始化專案工作目錄與自動安裝所有的 Claude Code 懶人包插件。

---

## 9. 實用輔助工具 (翻譯、格式化、搜尋與抓取)
此類技能包含各種日常開發與寫作的輔助工具。

*   **baoyu-translate (精細翻譯)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-translate/SKILL.md)
    *   **觸發詞**: `translate`, `翻譯`, `精翻`, `本地化`
    *   **功能**: 提供快速、正常或精細三種翻譯模式，支持術語庫（Glossary），適合文章、代碼或文件的在地化。

*   **baoyu-url-to-markdown (網頁轉 Markdown)**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-url-to-markdown/SKILL.md)
    *   **觸發詞**: `url to markdown`, `保存网页`
    *   **功能**: 通過 `baoyu-fetch` CLI（無頭 Chrome CDP 渲染）抓取任何網頁（包含推特、YouTube 等），繞過登入/驗證碼並精確轉為 Markdown。

*   **baoyu-compress-image**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-compress-image/SKILL.md)
    *   **觸發詞**: `compress image`, `convert to webp`
    *   **功能**: 自動將指定圖片壓縮並轉為 WebP 或 PNG，優化檔案大小。

*   **baoyu-format-markdown**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-format-markdown/SKILL.md)
    *   **觸發詞**: `format markdown`, `beautify article`
    *   **功能**: 排版、美化 Markdown 文件，自動整理標題、程式碼區塊、粗體與 YAML 檔頭，輸出為 `{filename}-formatted.md`。

*   **baoyu-electron-extract**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/baoyu-electron-extract/SKILL.md)
    *   **觸發詞**: `decompile Electron`, `提取 .asar`
    *   **功能**: 解包 Electron 應用程式的 `.asar` 封裝，還原 JavaScript 源碼，若有 Source Map 會自動重組混淆過的程式碼。

*   **file-organizer**
    *   **路徑**: [SKILL.md](file:///Volumes/1T_HDD_2/Antigravity/20260625_html簡報/.agents/skills/file-organizer/SKILL.md)
    *   **功能**: 根據檔案內容自動分類、重命名與整理硬碟中的雜亂檔案。

*   **smart-search**
    *   **路徑**: [SKILL.md](file:///Users/jktai/.gemini/config/skills/smart-search/SKILL.md)
    *   **功能**: 基於 `opencli` 的智能搜尋路由，當需要從社群媒體、技術論壇、購物或求職網搜尋資訊時，會自動調配最優的搜尋方式。

*   **summary-master** & **detail-master** & **tldr-summarizer**
    *   **路徑**: [summary-master](file:///Users/jktai/.gemini/config/skills/summary-master/SKILL.md) | [detail-master](file:///Users/jktai/.gemini/config/skills/detail-master/SKILL.md) | [tldr-summarizer](file:///Users/jktai/.gemini/config/skills/tldr-summarizer/SKILL.md)
    *   **功能**: 專業內容解析工具，將網頁、長文或 YouTube 字幕轉化為高教學價值的結構化大腦地圖、細節清單或一頁紙 TL;DR。

---

*若要查閱上述任一技能的詳細操作細則與進階指令，請點選該技能對應的路徑連結直接打開原始 Markdown 說明。*
