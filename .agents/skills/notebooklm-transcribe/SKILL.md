---
name: notebooklm-transcribe
description: 上傳任何音檔至 NotebookLM 轉成逐字稿並存入 Obsidian Clipping 筆記中。
---

# NotebookLM 語音轉錄 Obsidian 技能

本技能使用 `notebooklm-mcp-cli` 工具，將指定的本地音檔上傳至 NotebookLM 進行轉錄，並自動將轉出的語音逐字稿寫入 Obsidian 的 `Clippings/` 目錄下。

## 觸發條件
當使用者提到：
- 「將音檔/錄音上傳至 NotebookLM 轉錄」
- 「把這段音訊轉成逐字稿並存進 Obsidian」
- 「nlm 轉錄音檔」
- 「NotebookLM 轉逐字稿」

## 執行流程

1. **檢查 `nlm` 工具是否可用**：
   執行 `nlm doctor` 確認已安裝且已登入 Google 帳號。
   
2. **自動執行轉錄腳本**：
   在工作區根目錄執行以下腳本：
   ```bash
   ./.agents/skills/notebooklm-transcribe/scripts/transcribe_to_obsidian.py <音檔路徑>
   ```

3. **回報結果**：
   告之使用者上傳與轉錄進度，並提供產出的 Obsidian Clipping 檔案連結。
