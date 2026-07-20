# Reveal.js HTML 基礎模板

## 完整 HTML 骨架

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- 簡報標題 --></title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/night.css" />
  <!-- 若有文字雲，加這行 -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js"></script> -->
  <style>
    /* === 全域變數與 10 大主題調色盤 === */
    :root {
      /* 預設：Midnight Executive */
      --bg-dark: #0d1127;
      --bg-light: #f4f7fc;
      --text-dark: #ffffff;
      --text-light: #1e2761;
      --accent: #1e2761;
      --accent2: #cadcfc;
      --accent-alt: #4fc3f7;
      --success: #81c784;
      --warn:    #ffb74d;
    }

    /* 1. Midnight Executive (午夜商務) */
    .theme-midnight {
      --bg-dark: #0d1127;
      --bg-light: #f4f7fc;
      --text-dark: #ffffff;
      --text-light: #1e2761;
      --accent: #1e2761;
      --accent2: #cadcfc;
      --accent-alt: #4fc3f7;
    }
    /* 2. Forest & Moss (森林與苔蘚) */
    .theme-forest {
      --bg-dark: #142215;
      --bg-light: #f5f8f5;
      --text-dark: #ffffff;
      --text-light: #2c5f2d;
      --accent: #2c5f2d;
      --accent2: #97bc62;
      --accent-alt: #81c784;
    }
    /* 3. Coral Energy (珊瑚活力) */
    .theme-coral {
      --bg-dark: #131936;
      --bg-light: #fffbf5;
      --text-dark: #ffffff;
      --text-light: #2f3c7e;
      --accent: #f96167;
      --accent2: #f9e795;
      --accent-alt: #2f3c7e;
    }
    /* 4. Warm Terracotta (溫暖陶土) */
    .theme-terracotta {
      --bg-dark: #2b1411;
      --bg-light: #f9f9f5;
      --text-dark: #ffffff;
      --text-light: #3e221c;
      --accent: #b85042;
      --accent2: #a7beae;
      --accent-alt: #e7e8d1;
    }
    /* 5. Ocean Gradient (海洋漸層) */
    .theme-ocean {
      --bg-dark: #0c1024;
      --bg-light: #f0f5f8;
      --text-dark: #ffffff;
      --text-light: #21295c;
      --accent: #065a82;
      --accent2: #1c7293;
      --accent-alt: #4fc3f7;
    }
    /* 6. Charcoal Minimal (木炭極簡) */
    .theme-charcoal {
      --bg-dark: #1a1a1a;
      --bg-light: #f7f7f7;
      --text-dark: #ffffff;
      --text-light: #212121;
      --accent: #36454f;
      --accent2: #888888;
      --accent-alt: #212121;
    }
    /* 7. Teal Trust (信賴青綠) */
    .theme-teal {
      --bg-dark: #03171a;
      --bg-light: #f3fafb;
      --text-dark: #ffffff;
      --text-light: #028090;
      --accent: #028090;
      --accent2: #00a896;
      --accent-alt: #02c39a;
    }
    /* 8. Berry & Cream (莓果奶油) */
    .theme-berry {
      --bg-dark: #2d101b;
      --bg-light: #faf6f4;
      --text-dark: #ffffff;
      --text-light: #6d2e46;
      --accent: #6d2e46;
      --accent2: #a26769;
      --accent-alt: #ece2d0;
    }
    /* 9. Sage Calm (平靜鼠尾草) */
    .theme-sage {
      --bg-dark: #1b2623;
      --bg-light: #f4f7f6;
      --text-dark: #ffffff;
      --text-light: #3a4f48;
      --accent: #84b59f;
      --accent2: #69a297;
      --accent-alt: #50808e;
    }
    /* 10. Cherry Bold (櫻桃亮紅) */
    .theme-cherry {
      --bg-dark: #1a0305;
      --bg-light: #fefbfb;
      --text-dark: #ffffff;
      --text-light: #2f3c7e;
      --accent: #990011;
      --accent2: #2f3c7e;
      --accent-alt: #ffb74d;
    }

    /* === Reveal.js 基礎複寫 === */
    .reveal {
      font-family: 'Segoe UI', 'Noto Sans TC', sans-serif;
    }
    .reveal h1, .reveal h2, .reveal h3 {
      font-family: 'Segoe UI', 'Noto Sans TC', sans-serif;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .reveal h1 { font-size: 2.2em; }
    .reveal h2 { font-size: 1.5em; }
    .reveal .progress { color: var(--accent); }
    .reveal .fragment { opacity: 0.2; }
    .reveal .fragment.visible { opacity: 1; }

    /* === 亮暗投影片 (Sandwich 結構) 狀態控制 === */
    .reveal section.dark-slide {
      --text-primary: var(--text-dark);
      --text-muted: rgba(255, 255, 255, 0.7);
      --bg-card: rgba(255, 255, 255, 0.07);
      --border-card: rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
    }
    .reveal section.dark-slide h1,
    .reveal section.dark-slide h3,
    .reveal section.dark-slide p,
    .reveal section.dark-slide li {
      color: var(--text-primary);
    }
    .reveal section.dark-slide h2 {
      color: var(--accent2);
    }

    .reveal section.light-slide {
      --text-primary: var(--text-light);
      --text-muted: rgba(0, 0, 0, 0.6);
      --bg-card: rgba(0, 0, 0, 0.04);
      --border-card: rgba(0, 0, 0, 0.08);
      color: var(--text-primary);
    }
    .reveal section.light-slide h1,
    .reveal section.light-slide h3,
    .reveal section.light-slide p,
    .reveal section.light-slide li {
      color: var(--text-primary);
    }
    .reveal section.light-slide h2 {
      color: var(--accent);
    }

    /* === 視覺 Motif 類別 === */
    /* 左側彩色粗線裝飾 */
    .motif-border-left {
      border-left: 6px solid var(--accent);
      padding-left: 18px;
      text-align: left;
    }
    .reveal section.dark-slide .motif-border-left {
      border-left-color: var(--accent2);
    }
    
    /* 圓形彩底圖標 */
    .motif-icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px auto;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    .reveal section.dark-slide .motif-icon-circle {
      background: var(--accent2);
    }
    .motif-icon-circle img {
      width: 42px;
      height: 42px;
      object-fit: contain;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1)) !important;
    }
    .reveal section.dark-slide .motif-icon-circle img {
      filter: brightness(0) !important; /* 暗色底下的圖標轉全黑，與圓底對比 */
    }

    /* 微光/平版卡片 */
    .motif-flat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }
    .reveal section.dark-slide .motif-flat-card:hover {
      border-color: var(--accent2);
      box-shadow: 0 0 15px rgba(79, 195, 247, 0.2);
    }
    .reveal section.light-slide .motif-flat-card:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    /* === 封面 === */
    .title-slide { text-align: center; }
    .title-slide .tag {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.55em;
      letter-spacing: 0.08em;
      margin-bottom: 0.8em;
      font-weight: 600;
    }
    .theme-midnight .title-slide .tag, .theme-ocean .title-slide .tag {
      background: var(--accent-alt); /* 特殊主題的 tag 用 accent-alt 增加對比 */
    }
    .title-slide .subtitle { font-size: 0.75em; color: var(--text-muted); margin-top: 0.5em; }
    .title-slide .author   { margin-top: 2em; font-size: 0.5em; color: var(--text-muted); }

    /* === 統計數字卡 === */
    .stat-row { display: flex; gap: 20px; justify-content: center; margin-top: 1em; }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 20px 26px;
      text-align: center;
      flex: 1;
    }
    .stat-card .num   { font-size: 1.8em; font-weight: 800; color: var(--accent); line-height: 1; }
    .reveal section.dark-slide .stat-card .num { color: var(--accent2); }
    .stat-card .label { font-size: 0.42em; color: var(--text-muted); margin-top: 6px; }

    /* === 優勢卡（並列特點）=== */
    .adv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 0.6em; }
    .adv-card {
      background: var(--bg-card);
      border-top: 4px solid var(--accent);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .reveal section.dark-slide .adv-card {
      border-top-color: var(--accent2);
    }
    .adv-card .adv-icon { margin-bottom: 8px; }
    .adv-card .adv-icon img {
      width: 56px; height: 56px; object-fit: contain;
      display: block; margin: 0 auto;
      filter: drop-shadow(0 0 10px rgba(79,195,247,0.6));
    }
    .reveal section.light-slide .adv-card .adv-icon img {
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1));
    }
    .adv-card .adv-title { font-size: 0.5em; font-weight: 700; color: var(--accent); margin-bottom: 6px; }
    .reveal section.dark-slide .adv-card .adv-title { color: var(--accent2); }
    .adv-card .adv-desc  { font-size: 0.4em; color: var(--text-muted); line-height: 1.6; }

    /* === 雙欄排版 === */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      align-items: center;
      text-align: left;
    }
    .two-col-grid .col-text { font-size: 0.45em; line-height: 1.7; }
    .two-col-grid .col-visual { text-align: center; }

    /* === VS 對比 === */
    .vs-grid { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 0; align-items: stretch; margin-top: 0.6em; }
    .vs-col { background: var(--bg-card); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; }
    .vs-col.left-col  { border-top: 4px solid var(--accent); }
    .vs-col.right-col { border-top: 4px solid var(--accent-alt); }
    .vs-label { font-size: 0.7em; font-weight: 700; margin-bottom: 10px; letter-spacing: 0.05em; }
    .vs-label.left  { color: var(--accent); }
    .vs-label.right { color: var(--accent-alt); }
    .vs-center { display: flex; align-items: center; justify-content: center; font-size: 1.4em; font-weight: 900; color: var(--text-muted); }
    .vs-col ul { font-size: 0.42em; list-style: none; padding: 0; margin: 0; }
    .vs-col ul li { padding: 5px 0; border-bottom: 1px solid var(--border-card); }
    .vs-col ul li:last-child { border-bottom: none; }
    .vs-col ul li::before { content: "✦ "; opacity: 0.5; }

    /* === 時間軸 === */
    .timeline { position: relative; padding-left: 36px; margin-top: 0.8em; }
    .timeline::before {
      content: ''; position: absolute; left: 14px; top: 4px; bottom: 4px;
      width: 2px; background: var(--border-card);
    }
    .timeline-item { position: relative; margin-bottom: 18px; font-size: 0.46em; text-align: left; }
    .timeline-item::before {
      content: ''; position: absolute; left: -28px; top: 4px;
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--accent); border: 2px solid var(--bg-dark);
    }
    .reveal section.dark-slide .timeline-item::before {
      background: var(--accent2);
    }
    .timeline-item .ti-date { color: var(--accent); font-weight: 700; font-size: 1.1em; margin-bottom: 2px; }
    .reveal section.dark-slide .timeline-item .ti-date { color: var(--accent2); }
    .timeline-item .ti-text { color: var(--text-muted); }

    /* === 引用 === */
    .quote-box {
      background: var(--bg-card);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      padding: 20px 24px;
      margin: 0.8em 0;
      font-size: 0.55em;
      color: var(--text-primary);
      font-style: italic;
      line-height: 1.7;
    }
    .reveal section.dark-slide .quote-box { border-left-color: var(--accent2); }
    .quote-author { font-size: 0.4em; color: var(--text-muted); text-align: right; margin-top: 8px; font-style: normal; }

    /* === 結論卡 === */
    .conclusion-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 0.8em; }
    .conclusion-card { border-radius: 10px; padding: 18px; font-size: 0.44em; }
    .conclusion-card.positive {
      background: rgba(129, 199, 132, 0.1);
      border: 1px solid rgba(129, 199, 132, 0.3);
    }
    .conclusion-card.caution {
      background: rgba(255, 183, 77, 0.1);
      border: 1px solid rgba(255, 183, 77, 0.3);
    }
    .conclusion-card .cc-title { font-size: 1.3em; font-weight: 700; margin-bottom: 8px; }
    .conclusion-card.positive .cc-title { color: var(--success); }
    .conclusion-card.caution  .cc-title { color: var(--warn); }
    .conclusion-card ul { list-style: none; padding: 0; margin: 0; color: var(--text-muted); line-height: 1.8; }
    .conclusion-card ul li::before { content: "→ "; opacity: 0.6; }

    /* === 封底 === */
    .end-slide { text-align: center; }
    .end-slide .big { font-size: 3em; margin-bottom: 0.2em; }
    .end-slide .tagline { font-size: 0.65em; color: var(--text-muted); }

    /* === LIVE 動畫 === */
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    /* === 手機版 (Mobile Portrait) RWD 最佳化 === */
    @media (max-width: 560px), (max-device-width: 560px) and (orientation: portrait) {
      .reveal { font-size: 1.65em !important; }
      .reveal h1 { font-size: 1.8em !important; line-height: 1.2 !important; }
      .reveal h2 { font-size: 1.45em !important; }
      .reveal h3 { font-size: 1.1em !important; }
      .reveal p, .reveal li { font-size: 0.95em !important; line-height: 1.6 !important; }
      
      /* 全面大幅度部增強各組件字型尺寸，最小接受字型為 h2 大小 */
      .two-col-grid .col-text { font-size: 0.95em !important; }
      .adv-card .adv-title { font-size: 1.05em !important; }
      .adv-card .adv-desc { font-size: 0.95em !important; }
      .timeline-item { font-size: 0.95em !important; }
      .quote-box { font-size: 1.05em !important; }
      .conclusion-card { font-size: 0.95em !important; }
      .stat-card .num { font-size: 2.3em !important; }
      .stat-card .label { font-size: 0.95em !important; }
      .vs-col ul { font-size: 0.95em !important; }
      .vs-label { font-size: 1.1em !important; }
      .mindmap-container { font-size: 0.85em !important; }
      .title-slide .subtitle { font-size: 0.95em !important; opacity: 1 !important; color: rgba(255, 255, 255, 0.9) !important; }
      .title-slide .author { font-size: 0.85em !important; }

      /* 強制增大所有卡片與圖框內之行內字體 */
      .motif-flat-card div[style*="font-size"],
      .motif-flat-card[style*="font-size"] {
        font-size: 0.95em !important;
      }
      /* 微調卡片標題為較大字級 */
      .motif-flat-card div[style*="font-size:0.55em"],
      .motif-flat-card div[style*="font-size:0.5em"],
      .motif-flat-card div[style*="font-size:0.6em"],
      .motif-flat-card div[style*="font-size: 0.55em"],
      .motif-flat-card div[style*="font-size: 0.5em"],
      .motif-flat-card div[style*="font-size: 0.6em"] {
        font-size: 1.1em !important;
      }
      /* 例外排除大尺寸裝飾元素（如 emoji、大字） */
      .motif-flat-card div[style*="font-size:2.8em"],
      .motif-flat-card div[style*="font-size: 2.8em"] {
        font-size: 2.5em !important;
      }
      .motif-flat-card div[style*="font-size:1.8em"],
      .motif-flat-card div[style*="font-size: 1.8em"] {
        font-size: 1.8em !important;
      }
      .mindmap-container[style*="font-size"],
      .mindmap-container div[style*="font-size"] {
        font-size: 0.85em !important;
      }

      .adv-grid, .two-col-grid, .vs-grid, .conclusion-grid, .three-card-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      .vs-center {
        padding: 10px 0;
        font-size: 1.2em;
      }
      .stat-row {
        flex-direction: column;
        gap: 12px;
      }
      /* 讓特定寬度元素在手機端自適應 */
      div[style*="width:800px"], div[style*="width: 800px"] {
        width: 100% !important;
        height: 240px !important;
      }
      input[style*="width:500px"], input[style*="width: 500px"] {
        width: 90% !important;
      }
      div[style*="width:500px"], div[style*="width: 500px"] {
        width: 100% !important;
      }
      /* 讓文字雲在手機上垂直排版 */
      div[style*="grid-template-columns:250px 1fr"], div[style*="grid-template-columns: 250px 1fr"] {
        grid-template-columns: 1fr !important;
        height: auto !important;
      }
      #wc-canvas {
        height: 220px !important;
      }
      /* 限制心智圖組件寬度 */
      .mindmap-container {
        max-width: 100% !important;
      }
      .mindmap-container div[style*="grid-template-columns"] {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
    }
  </style>
</head>
<body>
<div class="reveal">
  <div class="slides">

    <!-- 投影片從這裡開始 -->

    <!-- 封面範例 -->
    <section data-background-image="images/cover.png"
             data-background-opacity="0.35"
             data-background-size="cover">
      <div class="title-slide">
        <div class="tag"><!-- 場次標籤，如：2026 年 5 月 · 課程名稱 --></div>
        <h1><!-- 主標題 --></h1>
        <h2 style="color:var(--accent); margin-top:0.2em;"><!-- 副標題 --></h2>
        <p class="subtitle"><!-- 說明文字 --></p>
        <p class="author"><!-- 講師 / 日期 --></p>
      </div>
    </section>

    <!-- 更多投影片... -->

  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script>
  // 偵測是否為手機/垂直螢幕，如果是，調整投影片基礎尺寸為 450x800 (9:16) 適合手機垂直觀看
  const isMobile = window.innerHeight > window.innerWidth || window.innerWidth < 600;
  Reveal.initialize({
    width: isMobile ? 450 : 960,
    height: isMobile ? 800 : 700,
    margin: isMobile ? 0.05 : 0.1,
    hash: true,
    transition: 'slide',
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    center: true,
    progress: true,
    controls: true,
    slideNumber: 'c/t',
    touch: true,
    plugins: []
  });
</script>

<!-- 若有互動元件，Firebase module script 加在這裡 -->

</body>
</html>
```

---

## 常用 Section 片段

### 數字統計頁
```html
<section>
  <h2>關鍵數字</h2>
  <div class="stat-row fragment">
    <div class="stat-card">
      <div class="num">440<span style="font-size:0.5em">萬+</span></div>
      <div class="label">說明文字</div>
    </div>
    <div class="stat-card">
      <div class="num">8,200</div>
      <div class="label">說明文字</div>
    </div>
  </div>
</section>
```

### 4 欄優勢卡（含圖標）
```html
<section>
  <h2>四大優勢</h2>
  <div class="adv-grid">
    <div class="adv-card fragment">
      <div class="adv-icon"><img src="images/icon_a.png" alt="A"></div>
      <div class="adv-title">標題 A</div>
      <div class="adv-desc">說明文字...</div>
    </div>
    <!-- 重複 4 次 -->
  </div>
</section>
```

### 封底
```html
<section data-background-image="images/ending.png"
         data-background-opacity="0.4"
         data-background-size="cover">
  <div class="end-slide">
    <div class="big">
      <img src="images/icon_globe.png" alt=""
           style="width:160px;height:160px;object-fit:contain;
                  filter:drop-shadow(0 0 24px rgba(79,195,247,0.7));">
    </div>
    <h1 style="color:var(--accent2);"><!-- 收尾標語 --></h1>
    <p class="tagline"><!-- 引用句 --></p>
  </div>
</section>
```
