# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
1. **台股背離自動掃描工具 (`stock-scanner`)**：
   - 完成全台股 (上市 1052 檔 + 上櫃 891 檔) MACD + KD 雙指標背離演算法。
   - 同時支援 **底背離 (抄底轉折)** 與 **頭背離 (避險/警訊轉折)** 自動篩選。
   - 自動將數據格式化寫入指定的 Google Sheet 兩大獨立工作表 (`底背離` 與 `頭背離`，`code` 強制 `'` 文字格式)。
   - 自動將互動 HTML 報表發佈至 GitHub Pages：[https://svn12.github.io/Gemini/stock-scanner/](https://svn12.github.io/Gemini/stock-scanner/)。
2. **Notion 摘要與 agy-today 工具鏈**：
   - 運作穩定。

## 🚦 目前狀態
台股背離自動掃描工具開發、Google Sheet 雙 Sheet 同步與 GitHub Pages 自動發佈流程均已 100% 部署完畢，驗證完全成功。

## ➡️ 下一步
- 每日收盤後 (14:00 後) 使用對話指令：**「幫我跑台股背離掃描並發佈」**，即可自動掃描上市櫃 1900+ 檔股票並同步更新至 Google Sheet 與 GitHub Pages 報表。

## ⚠️ 注意事項
- 掃描腳本路徑：`/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/stock-scanner/scanner.py`
- Google Sheet 連結：[https://docs.google.com/spreadsheets/d/1jx9hL4CZuyET00_6LYbcz4d23WLv7iMsLbcPR3xqGbo/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1jx9hL4CZuyET00_6LYbcz4d23WLv7iMsLbcPR3xqGbo/edit?usp=sharing)

## 🕐 最後更新
- 時間：2026-07-22 16:55 (TPE)
- 更新者：Antigravity @ mac
- Git push：Done (85d7c7c)
