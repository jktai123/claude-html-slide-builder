---
name: sync-project-workflow
description: 自動掃描當前專案目錄 (Workspace) 底下的所有 Antigravity 歷史對話動作摘要，並自動彙整填入 Obsidian 筆記庫中對應專案資料夾下的 專案工作流程.md 檔案的更動紀錄表格中。當使用者說「將動作摘要寫入Obsidian流程」、「更新專案工作流程」、「同步對話摘要到Obsidian」、「專案工作流程」、「更新工作流程筆記」時啟用此 Skill。
---

# 🔄 專案工作流程動作摘要同步技能 (sync-project-workflow)

本 Skill 旨在實現跨對話、跨 Session 的專案歷史動作摘要自動追蹤與備份。它會自動識別目前所在的專案目錄，掃描所有曾經在此專案中發生的 Agent 對話紀錄，並將主題、日期與對話 ID 格式化為 Markdown 表格，精確回填至 Obsidian 第二大腦中該專案對應的 `專案工作流程.md` 筆記中。

## 🎯 觸發時機
當使用者發出以下類型請求時自動啟用：
- 「將這個路徑的所有動作摘要，放入 Obsidian 對應的流程裡面」
- 「更新專案工作流程筆記」
- 「同步對話摘要到 Obsidian」
- 「將動作摘要寫入 Obsidian 流程」
- 「專案工作流程」

## 🚀 執行方式

你可以直接運行 Skill 內建的 Python 腳本來完成同步：

```bash
/usr/bin/python3 .agents/skills/sync-project-workflow/scripts/sync_workflow.py
```

### 支援參數：
- **指定路徑**：`/usr/bin/python3 .agents/skills/sync-project-workflow/scripts/sync_workflow.py --path /Volumes/1T_HDD_2/Antigravity/20260625_html簡報`
- **預設行為**：若未帶參數，腳本會自動抓取當前的工作目錄 (CWD) 作為目標專案。

## 📋 運作原理
1. **目錄辨識**：解析傳入或本機 CWD 路徑，提取專案 basename（如 `20260625_html簡報`）。
2. **對話日誌掃描**：讀取 `~/.gemini/antigravity/brain/` 所有 `transcript.jsonl` 檔案，尋找與目標專案匹配的 Workspace 記錄。
3. **資料解析與去重**：提取每筆對話的第一個 USER Request 標題、最終時間戳與對話 ID，進行同標題去重與倒序排列。
4. **Obsidian 定點覆蓋追加**：
   - 尋找 iCloud 及 Google Drive 上的 Obsidian 筆記庫路徑：
     - `iCloud~md~obsidian/Documents/secondbrain/{專案名稱}/專案工作流程.md`
     - `GoogleDrive/我的雲端硬碟/secondbrain/{專案名稱}/專案工作流程.md`
   - 若檔案不存在則自動依範本創建。
   - 定向替換/更新 `## 🗓️ 更動與初始化紀錄` 下的表格數據。
