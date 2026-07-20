---
name: html-slide-builder
description: |
  給定任何教材（文字、課程大綱、PDF、講義、口述主題），自動生成完整的 Reveal.js HTML 互動簡報並部署至 GitHub Pages。

  自動處理四大視覺/互動強化：
  1. AI 生成背景底圖（draw 技能，data-background-image）
  2. 扁平化圖標（draw 技能 + PIL 裁切去背，取代 emoji）
  3. Firebase 即時互動元件（文字雲、單選投票，Firestore 串接）
  4. 滑桿視覺化演示（clip-path 揭露，適合前後對比內容）

  當使用者說「幫我做 HTML 簡報」「把這份教材轉成互動簡報」「做 Reveal.js 簡報」「做成投影片」「做一份課程簡報」，或提供教材並要求轉成簡報格式時，務必使用此 Skill。即使使用者未明確說「互動」或「HTML」，只要目的是從教材產出可展示的簡報，也應觸發此 Skill。
---

# HTML 智慧簡報生成器

教材 → 分析 → 確認大綱 → 生成 Reveal.js 簡報 → 強化（底圖/圖標/互動/視覺化）→ GitHub Pages 部署

---

## 0. 讀取教材

接受任何形式的輸入：

- **文字 / Markdown**：直接分析
- **PDF**：用 Read 工具讀取（若有多頁先讀摘要頁）
- **口述主題**：自行根據標準教學邏輯設計（引言→概念→範例→互動→結論）

若教材資訊不足，不要詢問，直接用教學慣例補充。

---## 1. 分析大綱與美學設定（調色盤、視覺 Motif 與 Sandwich 結構）

分析教材後，**直接主動決定**哪些頁面要套用上述四大強化功能，並**主動為簡報挑選視覺風格**。**請勿詢問使用者要在哪裡加什麼或使用什麼主題，一切由你根據教材內容主動決定！**

你必須規劃：
1. **挑選主題調色盤 (Theme)**：從 10 款經典調色盤（見下方）挑選一款最切合教材主題的。
2. **選定視覺特徵 (Motif)**：挑選一個主要視覺特徵（圓底圖標 `motif-icon-circle`、左側彩色粗線 `motif-border-left` 或微光卡片 `motif-flat-card`）。
3. **規劃亮暗對比 (Sandwich)**：規劃是否採用 Sandwich 結構（封面、過渡頁、封底為 `[DARK]`，其餘一般內容頁為 `[LIGHT]`）或是全暗色簡報。

**輸出大綱格式如下：**

```
## 📋 簡報大綱草稿（共 N 頁）

| 頁碼 | 標題 | 內容摘要 | 頁面結構 | 功能標記 |
|------|------|----------|----------|----------|
| 1    | 封面 | 課程名稱、講師 | [DARK] | [BG] |
| 2    | 破冰提問 | 文字雲收集學員想法 | [LIGHT] | [INTERACT:wordcloud] |
| 3    | 三大重點 | 並列說明三個核心概念 | [LIGHT] | [ICON] |
| 4    | 章節過渡 | 第二部分開始 | [DARK] | [BG] |
| 5    | 前後對比 | A 方案 vs B 方案演進 | [LIGHT] | [VIZ] |
...

**🎨 簡報視覺風格設定**
- **主題調色盤 (Theme)**: Forest & Moss (森林與苔蘚) —— 適合生態與大自然主題
- **視覺特徵 (Motif)**: 圓底圖標 (motif-icon-circle) 搭配微光卡片 (motif-flat-card)
- **亮暗結構 (Sandwich)**: Sandwich 結構 (封面、章節過渡、封底為 dark-slide 搭配背景，其餘內容頁為亮色 light-slide)

**功能標記說明**
- [BG] 背景底圖（自動生成適合主題的 Prompt，暗色風格）
- [ICON] 扁平化圖標（使用 crop_and_clean 裁切去背）
- [INTERACT:wordcloud] Firebase 即時文字雲
- [INTERACT:poll] Firebase 單選投票
- [VIZ] 滑桿視覺化演示（clip-path）

大綱已規劃完成，請確認大綱，或說明要調整的地方。
```

### 功能標記的決策原則

| 標記 | 觸發條件 | 每份簡報目標數量 |
|------|----------|-----------------|
| [BG] | 封面、封底、章節轉換、高衝擊結論頁面 | 3–5 頁 |
| [ICON] | 頁面有 3–6 個並列項目（優缺點、四步驟、核心特性等） | 1–3 頁 |
| [INTERACT:wordcloud] | 開場破冰、先備知識調查、課尾反思 | 1 頁（通常第 2 頁） |
| [INTERACT:poll] | 概念確認、隨堂測試、意見調查 | 0–1 頁 |
| [VIZ] | 有「前後對比」「格式轉換」「A 到 B 的演進」等內容 | 0–1 頁 |

### 官方 10 款主題調色盤參考
- **theme-midnight**: Midnight Executive (午夜商務) —— 主色深藍 (`1E2761`)、輔色冰藍 (`CADCFC`)、白 (`FFFFFF`)
- **theme-forest**: Forest & Moss (森林與苔蘚) —— 主色森林綠 (`2C5F2D`)、輔色苔蘚綠 (`97BC62`)、乳白 (`F5F5F5`)
- **theme-coral**: Coral Energy (珊瑚活力) —— 主色珊瑚紅 (`F96167`)、輔色金黃 (`F9E795`)、海軍藍 (`2F3C7E`)
- **theme-terracotta**: Warm Terracotta (溫暖陶土) —— 主色陶土紅 (`B85042`)、輔色沙色 (`E7E8D1`)、鼠尾草綠 (`A7BEAE`)
- **theme-ocean**: Ocean Gradient (海洋漸層) —— 主色深藍 (`065A82`)、輔色青綠 (`1C7293`)、午夜藍 (`21295C`)
- **theme-charcoal**: Charcoal Minimal (木炭極簡) —— 主色木炭灰 (`36454F`)、輔色灰白 (`F2F2F2`)、黑 (`212121`)
- **theme-teal**: Teal Trust (信賴青綠) —— 主色青綠 (`028090`)、輔色海泡綠 (`00A896`)、薄荷綠 (`02C39A`)
- **theme-berry**: Berry & Cream (莓果奶油) —— 主色莓果紅 (`6D2E46`)、輔色粉黛色 (`A26769`)、乳白色 (`ECE2D0`)
- **theme-sage**: Sage Calm (平靜鼠尾草) —— 主色鼠尾草綠 (`84B59F`)、輔色尤加利綠 (`69A297`)、板岩灰 (`50808E`)
- **theme-cherry**: Cherry Bold (櫻桃亮紅) —— 主色櫻桃紅 (`990011`)、輔色灰白 (`FCF6F5`)、海軍藍 (`2F3C7E`)

---

## 2. 建立專案目錄與基礎 HTML

使用者確認後：

1. 建立專案目錄：`<當前工作目錄>/<簡報英文短名>/`
2. 建立 `images/` 子目錄
3. 生成 `index.html`（完整 Reveal.js 骨架）

讀取 `references/reveal-template.md` 獲得：完整 CSS 變數、元件樣式、Reveal.js 初始化程式碼。

**命名規則：**
- 專案目錄：kebab-case 英文（`ai-course`、`math-lesson`）
- Firestore 集合：`<slug>_wordcloud`、`<slug>_poll`（避免不同簡報資料混用）

**美學設定與 HTML 結構結合方式：**
- **套用主題**：在 `index.html` 中，將選定的主題 Class（如 `theme-forest`）加到 `<body>` 標籤：`<body class="theme-forest">`。
- **亮暗頁面標記 (Sandwich 結構)**：
  - 如果該頁為 `[DARK]` (如封面、過渡頁、封底)：
    加上 `class="dark-slide"` 且 `data-background-color="var(--bg-dark)"`。
  - 如果該頁為 `[LIGHT]` (一般內容頁)：
    加上 `class="light-slide"` 且 `data-background-color="var(--bg-light)"`。
- **套用視覺 Motif**：
  - 若有並列特點，使用包含 `motif-icon-circle` 的優勢卡排版。
  - 亦可對特點區塊或文字卡加上 `motif-flat-card`（浮雕卡片）與 `motif-border-left`（左側彩色粗線裝飾），提升細節美感。
- **使用雙欄佈局 (`two-col-grid`)**：
  - 當需要「文字與圖片/圖表並列」時，使用 `<div class="two-col-grid">` 將內容分為兩欄。

---
---

## 3. 生成背景底圖 [BG]

針對標記為 `[BG]` 的頁面，你可以透過以下兩種方式之一來生成圖片：

### 方式 A：使用 Antigravity 內建的 `generate_image` 工具（推薦）
在 Antigravity 代理對話中，直接調用 `generate_image` 工具：
- `Prompt`: 請根據底圖設計原則撰寫，例如：`"deep navy background, glowing neural network nodes and light trails, no text, abstract tech art"`
- `ImageName`: `cover_slide` (全部小寫，用底線連接，長度不超過 3 個單字)

> 💡 **關鍵步驟**：因為 `generate_image` 會將產出的圖片儲存在對話的 Artifact 目錄下（例如 `/Users/jktai/.gemini/antigravity/brain/<conversation-id>/cover_slide.png`），你**必須**使用 `run_command` 將該圖片拷貝到簡報專案的 `images` 目錄下：
> ```bash
> cp "/Users/jktai/.gemini/antigravity/brain/<conversation-id>/cover_slide.png" "<專案目錄>/images/<slide-slug>.png"
> ```

### 方式 B：使用 CLI `draw` 腳本（當無內建工具時）
呼叫全域安裝的生圖腳本：
```bash
python "{{DRAW_SKILL_PATH}}" \
  "<底圖 prompt>" \
  --size 1536x1024 --quality low \
  --name <slide-slug> \
  --outdir "<專案目錄>/images"
```

**底圖 Prompt 設計原則：**
- 深暗色系（deep navy、dark space、#0d1117 背景）
- 無文字
- 與投影片主題有關但抽象（概念視覺化，非字面圖示）
- 霓虹/發光效果，配合主題色
- 例：AI 課程封面 → `"deep navy background, glowing neural network nodes and light trails, cinematic wide, no text, abstract tech art"`

在 HTML section 加上：
```html
<section data-background-image="images/<slug>.png"
         data-background-opacity="0.3"
         data-background-size="cover">
```

透明度建議：封面 0.3–0.4；一般頁 0.12–0.18。

---

## 4. 圖標系統 [ICON]

### 4-1 生成圖標總表（一次生成所有頁面需要的圖標）

使用與生成底圖相同的工具（`generate_image` 或 `draw.py`）生成一張包含所有圖標的總表。

生圖 Prompt 設計：
```
A clean icon sheet with exactly N flat neon icons in a single horizontal row on pure dark navy (#0d1117) background. [從左到右描述每個圖標，例如：a gear, a chart, a lightbulb]. Each icon large, bold, centered in equal column, no text.
```
- 檔名（ImageName 或 `--name`）：`icons_sheet`

> 💡 **Antigravity 拷貝提示**：若使用 `generate_image` 生圖，記得將 `icons_sheet.png` 從 Artifacts 目錄複製到專案目錄的 `images/` 下。

### 4-2 裁切 + 亮度去背

將 `scripts/crop_and_clean.py` 拷貝至專案目錄的 `scripts/` 下（或直接在 Skill 中執行本機腳本），並執行以下指令，將橫排總表自動裁切成個別正方形圖標，並將其暗色背景去背設為透明：

```bash
python scripts/crop_and_clean.py images/icons_sheet.png <圖標數量> <圖標名稱1> <圖標名稱2> ...
```

範例：
```bash
python scripts/crop_and_clean.py images/icons_sheet.png 3 icon_gear icon_chart icon_lightbulb
```
執行後，將在 `images/` 目錄下產生去背後的 `icon_gear.png`, `icon_chart.png`, `icon_lightbulb.png`。

### 4-3 嵌入 HTML

- 使用 `<img src="images/icon_name.png">` 取代 emoji。
- 優勢卡元件樣式：
  ```html
  <div class="adv-card">
    <div class="adv-icon">
      <img src="images/icon_gear.png" style="filter: drop-shadow(0 0 10px rgba(79,195,247,0.6));">
    </div>
    <div class="adv-title">系統設定</div>
    <div class="adv-desc">說明文字...</div>
  </div>
  ```

---

## 5. 互動元件 [INTERACT]

詳見 `references/firebase-config.md`，含完整的文字雲和投票 HTML 程式碼片段。

**通用原則：**
- 互動 section 加 `id="slide-<slug>"`
- 使用 `Reveal.on('slidechanged', e => { if (e.currentSlide?.id === '...') { /* 重繪 */ }})` 確保切頁後正確渲染
- Firestore 集合：`<簡報slug>_wordcloud` / `<簡報slug>_poll`（每份簡報獨立集合）
- 樣式：配合暗色主題，輸入框 `background: rgba(255,255,255,0.08)`

---

## 6. 視覺化演示 [VIZ]

clip-path 滑桿揭露效果，適合「格式轉換」「前後對比」「A→B 演進」。

**核心 CSS/JS 邏輯：**
```html
<div style="position:relative; height:390px; border-radius:12px; overflow:hidden;">
  <div id="viz-before" style="position:absolute;inset:0;..."></div>
  <div id="viz-after" style="position:absolute;inset:0;clip-path:inset(0 100% 0 0);"></div>
  <div id="viz-divider" style="position:absolute;top:0;left:0;width:3px;height:100%;
    background:linear-gradient(to bottom,transparent,#4fc3f7,transparent);
    box-shadow:0 0 12px #4fc3f7;pointer-events:none;"></div>
</div>
<input id="viz-slider" type="range" min="0" max="100" value="0">
<script>
document.getElementById('viz-slider').addEventListener('input', function() {
  const v = +this.value;
  document.getElementById('viz-after').style.clipPath = `inset(0 ${100-v}% 0 0)`;
  document.getElementById('viz-divider').style.left = v + '%';
});
</script>
```

左右各加標籤（`position:absolute; top:8px`），接近邊界時用 JS 淡出。

---

## 7. 部署到 GitHub Pages

```bash
cd "<專案目錄>"
git init
git config user.email "<你的 GitHub email>"
git config user.name "<你的 GitHub 帳號>"
git add .
git commit -m "初始化：<簡報名稱>"
gh repo create <帳號>/<repo-name> --public --source=. --push \
  --description "<簡報一句話描述>"
# 用實際分支名開 Pages（新版 git 預設 main、舊版 master），避免寫死失敗
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh api repos/<帳號>/<repo-name>/pages \
  --method POST -f "source[branch]=$BRANCH" -f "source[path]=/"
```

回傳給使用者：
```
✅ 簡報已部署！
🔗 GitHub Pages：https://<帳號>.github.io/<repo-name>/
（首次約 1–3 分鐘生效）
📦 原始碼：https://github.com/<帳號>/<repo-name>
```

---

## 執行順序與平行化建議

```
Phase 0: 讀取教材
Phase 1: 輸出大綱 → 等待確認 ← 必須停在這裡
Phase 2: 生成 HTML 骨架
Phase 3+4+5: 可平行（底圖生成 + 圖標生成同時跑）
Phase 6: VIZ 寫入 HTML
Phase 7: 確認一切完成後才 push
```

---

## 參考資源

| 檔案 | 用途 |
|------|------|
| `references/reveal-template.md` | Reveal.js HTML 完整模板、CSS 元件庫 |
| `references/firebase-config.md` | 文字雲、投票完整程式碼片段 |
| `scripts/crop_and_clean.py` | 圖標總表裁切與去背整合腳本 |
| `scripts/remove_bg.py` | PIL 亮度去背腳本（對 icon_*.png 執行去背） |
