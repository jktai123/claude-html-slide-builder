#!/bin/bash
# 台股背離自動掃描與發佈腳本

export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"

SCANNER_DIR="/Volumes/1T_HDD_2/Antigravity/20260625_html簡報/stock-scanner"
PUBLISH_SCRIPT="/Users/jktai/.gemini/config/skills/publish-to-github-io/scripts/publish.py"
SVN12_DIR="/Users/jktai/web/svn12.github.io"

echo "==========================================" >> "$SCANNER_DIR/output/cron_run.log"
echo "🚀 [$(date '+%Y-%m-%d %H:%M:%S')] 開始執行每日台股背離自動掃描..." >> "$SCANNER_DIR/output/cron_run.log"

# 1. 執行掃描 (全檔，15 workers)
cd "$SCANNER_DIR"
python3 scanner.py --workers 15 >> "$SCANNER_DIR/output/cron_run.log" 2>&1

# 2. 發佈至 GitHub Pages (svn12.github.io)
python3 "$PUBLISH_SCRIPT" \
  --src "$SCANNER_DIR/output" \
  --dest-dir "stock-scanner" \
  --title "台股底背離 / 頭背離每日自動掃描報表 (MACD + KD)" \
  --desc "每日收盤自動掃描全台股 (上市+上櫃) 之 MACD 與 KD 底背離及頭背離 (頂背離) 高低轉折訊號互動報表。" \
  --tag "量化投資" >> "$SCANNER_DIR/output/cron_run.log" 2>&1

cp "$SCANNER_DIR/output/divergence_latest.html" "$SVN12_DIR/Gemini/stock-scanner/index.html"

cd "$SVN12_DIR"
git add .
git commit -m "auto: 每日 15:00 收盤自動掃描發佈台股背離報表" >> "$SCANNER_DIR/output/cron_run.log" 2>&1
git pull --rebase >> "$SCANNER_DIR/output/cron_run.log" 2>&1
git push >> "$SCANNER_DIR/output/cron_run.log" 2>&1

echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] 每日掃描與發佈流程完成！" >> "$SCANNER_DIR/output/cron_run.log"
