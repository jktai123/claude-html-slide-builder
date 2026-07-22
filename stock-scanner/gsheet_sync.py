import os
import json
import subprocess
import logging

logger = logging.getLogger(__name__)

DOC_ID = "1jx9hL4CZuyET00_6LYbcz4d23WLv7iMsLbcPR3xqGbo"
SHEET_NAME = "底背離"
SAVE_SCRIPT = "/Users/jktai/.gemini/config/skills/google-sheet-writer/scripts/save_to_gsheet.js"

def sync_to_google_sheet(results, output_dir):
    """
    將掃描結果格式化並同步上傳至 Google Sheet 試算表
    - 標題欄位: code (取代 代號), 名稱, 市場, 收盤價, 漲跌幅%, 日均量(張), 訊號類型, 背離細節
    - code 內容強制加上單引號 "'" 確保寫入為純文字格式
    """
    if not results:
        logger.info("⚠️ 無資料可同步至 Google Sheet")
        return

    sheet_data = []
    for r in results:
        detail_parts = []
        if r.get("bot_macd_details"):
            d = r["bot_macd_details"]
            detail_parts.append(f"底MACD(價:{d['prev_price']}→{d['curr_price']}, 柱:{d['prev_ind']}→{d['curr_ind']})")
        if r.get("bot_kd_details"):
            d = r["bot_kd_details"]
            detail_parts.append(f"底KD(價:{d['prev_price']}→{d['curr_price']}, K:{d['prev_ind']}→{d['curr_ind']})")

        if r.get("top_macd_details"):
            d = r["top_macd_details"]
            detail_parts.append(f"頂MACD(價:{d['prev_price']}→{d['curr_price']}, 柱:{d['prev_ind']}→{d['curr_ind']})")
        if r.get("top_kd_details"):
            d = r["top_kd_details"]
            detail_parts.append(f"頂KD(價:{d['prev_price']}→{d['curr_price']}, K:{d['prev_ind']}→{d['curr_ind']})")

        sheet_data.append({
            "code": f"'{r['code']}",
            "名稱": r["name"],
            "市場": r["market"],
            "收盤價": r["close"],
            "漲跌幅%": r["change_pct"],
            "日均量(張)": r["volume_lots"],
            "背離方向": r.get("direction", "底背離"),
            "訊號類型": r["signal_type"],
            "背離細節": " / ".join(detail_parts),
        })

    json_path = os.path.join(output_dir, "gsheet_sync_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(sheet_data, f, ensure_ascii=False, indent=2)

    logger.info(f"📊 正在同步 {len(sheet_data)} 筆資料至 Google Sheet (Sheet: {SHEET_NAME})...")

    cmd = [
        "node", SAVE_SCRIPT,
        "--docId", DOC_ID,
        "--sheet", SHEET_NAME,
        "--file", json_path,
        "--mode", "overwrite"
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        logger.info(f"✅ Google Sheet 同步完成：\n{res.stdout.strip()}")
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Google Sheet 同步失敗：{e.stderr or e.stdout}")
