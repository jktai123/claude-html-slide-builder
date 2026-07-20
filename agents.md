# 20260625_html簡報（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
自動化將教材與大綱生成為 Reveal.js HTML 互動簡報並部署至 GitHub Pages，包含 AI 底圖、扁平圖標、Firebase 即時互動、心智圖與視覺化組件。

## 關鍵時程
- 專案建立：2026-06-25
- 跨電腦技能導入：2026-07-20

## 目標與路線圖
- [x] 基礎 HTML 簡報生成與視覺增強模組
- [x] 跨電腦專案管理技能 (`project-init`, `startup`, `shutdown`) 整合
- [ ] 整合最新 Reveal.js 互動組件與自動部署流程

## 資料夾結構
- `.agents/skills/`：AI Agent 專屬技能庫（含 cross-device 技能、html-slide-builder 等）
- `ai-class-simulator/`：AI 課堂模擬互動組件
- `antigravity-voice-cloning/`：語音複製演示模組
- `sanguo-poem-battle/`：三國詩詞對決互動遊戲簡報

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（GDrive） | `agents.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | `mathruffian-dot/claude-html-slide-builder` | 指定時 |
| L3 | Obsidian | `20260625_html簡報/專案工作流程.md` | 有需要時 |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構
