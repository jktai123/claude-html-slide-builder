import os
import json
import subprocess
import logging

logger = logging.getLogger(__name__)

DOC_ID = "1jx9hL4CZuyET00_6LYbcz4d23WLv7iMsLbcPR3xqGbo"
SHEET_BOTTOM = "底背離"
SHEET_TOP = "頭背離"
SAVE_SCRIPT = "/Users/jktai/.gemini/config/skills/google-sheet-writer/scripts/save_to_gsheet.js"

def _format_row(r, is_bottom=True):
    detail_parts = []
    if is_bottom:
        if r.get("bot_macd_details"):
            d = r["bot_macd_details"]
            detail_parts.append(f"底MACD(價:{d['prev_price']}→{d['curr_price']}, 柱:{d['prev_ind']}→{d['curr_ind']})")
        if r.get("bot_kd_details"):
            d = r["bot_kd_details"]
            detail_parts.append(f"底KD(價:{d['prev_price']}→{d['curr_price']}, K:{d['prev_ind']}→{d['curr_ind']})")
    else:
        if r.get("top_macd_details"):
            d = r["top_macd_details"]
            detail_parts.append(f"頂MACD(價:{d['prev_price']}→{d['curr_price']}, 柱:{d['prev_ind']}→{d['curr_ind']})")
        if r.get("top_kd_details"):
            d = r["top_kd_details"]
            detail_parts.append(f"頂KD(價:{d['prev_price']}→{d['curr_price']}, K:{d['prev_ind']}→{d['curr_ind']})")

    # 提取該指標種類名稱
    sig_name = r["signal_type"]
    if is_bottom:
        sig_name = sig_name.replace("底", "").replace("頂", "").strip()
    else:
        sig_name = sig_name.replace("底", "").replace("頂", "").strip()

    return {
        "code": f"'{r['code']}",
        "名稱": r["name"],
        "市場": r["market"],
        "收盤價": r["close"],
        "漲跌幅%": r["change_pct"],
        "日均量(張)": r["volume_lots"],
        "訊號類型": sig_name if sig_name else r["signal_type"],
        "背離細節": " / ".join(detail_parts),
    }

def sync_to_google_sheet(results, output_dir):
    """
    將掃描結果拆分為「底背離」與「頭背離」兩個獨立工作表，寫入指定的 Google Sheet
    - 工作表「底背離」
    - 工作表「頭背離」
    - 欄位: code (純文字格式), 名稱, 市場, 收盤價, 漲跌幅%, 日均量(張), 訊號類型, 背離細節
    """
    if not results:
        logger.info("⚠️ 無資料可同步至 Google Sheet")
        return

    bottom_rows = []
    top_rows = []

    for r in results:
        dir_str = r.get("direction", "")
        if "底背離" in dir_str:
            bottom_rows.append(_format_row(r, is_bottom=True))
        if "頭背離" in dir_str:
            top_rows.append(_format_row(r, is_bottom=False))

    # 1. 同步「底背離」工作表
    if bottom_rows:
        bot_json = os.path.join(output_dir, "gsheet_bottom_data.json")
        with open(bot_json, "w", encoding="utf-8") as f:
            json.dump(bottom_rows, f, ensure_ascii=False, indent=2)

        logger.info(f"📊 正在同步 {len(bottom_rows)} 筆底背離資料至 Google Sheet (Sheet: {SHEET_BOTTOM})...")
        cmd_bot = [
            "node", SAVE_SCRIPT,
            "--docId", DOC_ID,
            "--sheet", SHEET_BOTTOM,
            "--file", bot_json,
            "--mode", "overwrite"
        ]
        try:
            res = subprocess.run(cmd_bot, capture_output=True, text=True, check=True)
            logger.info(f"✅ 「底背離」Sheet 同步完成：\n{res.stdout.strip()}")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ 「底背離」Sheet 同步失敗：{e.stderr or e.stdout}")

    # 2. 同步「頭背離」工作表
    if top_rows:
        top_json = os.path.join(output_dir, "gsheet_top_data.json")
        with open(top_json, "w", encoding="utf-8") as f:
            json.dump(top_rows, f, ensure_ascii=False, indent=2)

        logger.info(f"📊 正在同步 {len(top_rows)} 筆頭背離資料至 Google Sheet (Sheet: {SHEET_TOP})...")
        cmd_top = [
            "node", SAVE_SCRIPT,
            "--docId", DOC_ID,
            "--sheet", SHEET_TOP,
            "--file", top_json,
            "--mode", "overwrite"
        ]
        try:
            res = subprocess.run(cmd_top, capture_output=True, text=True, check=True)
            logger.info(f"✅ 「頭背離」Sheet 同步完成：\n{res.stdout.strip()}")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ 「頭背離」Sheet 同步失敗：{e.stderr or e.stdout}")
