---
name: Notion日記
description: >-
  Create/Update record of https://app.notion.com/p/19e5e6741c4d804a878ef15434268529?v=1de5e6741c4d806eaa10000c28f5df4c&source=copy_link.
  若當天(TPE time)未Create any record 新建 Record 名稱為 mm/dd/yyyy。
  將要寫入的資料更新(Append) 放到對應的Record 內 後，顯示對應的Notion 連結。
---

# Notion 日記技能 (Notion日記)

此技能用於快速將工作摘要或進度更新（Append）至使用者的 Notion 日記資料庫中。

## ⚙️ 核心邏輯
- 自動檢查台北時間 (TPE time) 當天是否已存在對應的日記頁面 (格式：`MM/DD/YYYY`，如 `07/01/2026`)。
- 若不存在，則自動在日記資料庫中建立該日期頁面。
- 讀取傳入的 Markdown 內容，與既有日記的 body 內容進行合併 (Append)，並自動寫回 Notion。
- 自動返回該日記頁面的 Notion 連結。

## 🛠️ 使用方式

直接將欲更新的 Markdown 內容透過 `stdin` 傳入底下的 Python 輔助腳本即可：

```bash
# 範例 1：直接透過 echo 傳送內容
echo "## 🎨 新增的工作進度\n1. 完成 A 模組的優化\n2. 調整版面大小" | python3 .agents/skills/notion-diary/scripts/update_diary.py

# 範例 2：從暫存檔案寫入
python3 .agents/skills/notion-diary/scripts/update_diary.py < /path/to/progress.md
```

## 📝 執行後輸出
腳本執行成功後會直接輸出 Notion 頁面的更新結果與連結：
```text
🎉 日記更新成功！
🔗 Notion 連結: https://www.notion.so/07-01-2026-3905e6741c4d8130a7b4d89fb21566ec
```
請將該連結直接回報給使用者。
