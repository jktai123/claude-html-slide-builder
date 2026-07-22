#!/usr/bin/env python3
"""
台股底背離自動掃描工具
收盤後掃描上市＋上櫃全部股票，偵測 MACD 和 KD 底背離訊號，輸出 HTML 互動報表。
"""

import os
import sys
import time
import re
import argparse
import logging
from datetime import datetime
from io import StringIO
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import pandas as pd
import numpy as np

try:
    import yfinance as yf
except ImportError:
    print("❌ 請先安裝 yfinance: pip install yfinance")
    sys.exit(1)

# ════════════════════════════════════════════════════════════
# 參數設定
# ════════════════════════════════════════════════════════════
LOOKBACK_PERIOD = "6mo"
DIVERGENCE_LOOKBACK = 60
PIVOT_WINDOW_LEFT = 5
PIVOT_WINDOW_RIGHT = 3
MIN_PIVOT_GAP = 8
MAX_RECENT_BARS = 7
MIN_VOLUME_LOTS = 100
MAX_WORKERS = 10
MACD_FAST, MACD_SLOW, MACD_SIGNAL = 12, 26, 9
KD_PERIOD, KD_K_SMOOTH, KD_D_SMOOTH = 9, 3, 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════
# 股票清單
# ════════════════════════════════════════════════════════════

def fetch_stock_list():
    """從 TWSE/TPEx ISIN 頁面取得上市＋上櫃普通股清單"""
    stocks = []

    logger.info("📋 取得上市股票清單...")
    twse = _fetch_isin_list(str_mode=2, suffix="TW", market="上市")
    stocks.extend(twse)
    logger.info(f"   → {len(twse)} 檔上市")

    time.sleep(1.5)

    logger.info("📋 取得上櫃股票清單...")
    tpex = _fetch_isin_list(str_mode=4, suffix="TWO", market="上櫃")
    stocks.extend(tpex)
    logger.info(f"   → {len(tpex)} 檔上櫃")

    return stocks


def _fetch_isin_list(str_mode: int, suffix: str, market: str):
    """解析 ISIN 公告頁面，回傳 [{'code','name','ticker','market'}, ...]"""
    url = f"https://isin.twse.com.tw/isin/C_public.jsp?strMode={str_mode}"
    try:
        resp = requests.get(url, timeout=30)
        resp.encoding = "big5"
        tables = pd.read_html(StringIO(resp.text), encoding="big5")
    except Exception as e:
        logger.error(f"   ❌ 無法取得 strMode={str_mode}: {e}")
        return []

    if not tables:
        return []

    df = tables[0]
    stocks = []
    in_stock_section = False

    for _, row in df.iterrows():
        cell = str(row.iloc[0]).strip()

        # 段落標頭 — 只抓「股票」段
        if cell == "股票":
            in_stock_section = True
            continue
        # 碰到下一個段落就停
        if in_stock_section and cell in (
            "特別股", "臺灣存託憑證(TDR)", "受益證券-Loss absorption",
            "ETF", "上櫃指數股票型基金(ETF)", "受益證券",
            "臺灣存託憑證", "認購(售)權證", "認購權證", "認售權證",
        ):
            in_stock_section = False
            continue
        if not in_stock_section:
            continue

        # 解析代號＋名稱，格式 "1101　台泥" 或 "1101 台泥"
        m = re.match(r"^(\d{4})\s+(.+)$", cell)
        if m:
            code, name = m.group(1), m.group(2).strip()
            stocks.append({
                "code": code,
                "name": name,
                "ticker": f"{code}.{suffix}",
                "market": market,
            })

    return stocks


# ════════════════════════════════════════════════════════════
# 技術指標
# ════════════════════════════════════════════════════════════

def calc_ema(s: pd.Series, span: int) -> pd.Series:
    return s.ewm(span=span, adjust=False).mean()


def calc_macd(close: pd.Series):
    macd = calc_ema(close, MACD_FAST) - calc_ema(close, MACD_SLOW)
    signal = calc_ema(macd, MACD_SIGNAL)
    hist = macd - signal
    return macd, signal, hist


def calc_kd(high: pd.Series, low: pd.Series, close: pd.Series):
    l9 = low.rolling(KD_PERIOD).min()
    h9 = high.rolling(KD_PERIOD).max()
    rsv = ((close - l9) / (h9 - l9) * 100).fillna(50)
    k = rsv.ewm(com=KD_K_SMOOTH - 1, adjust=False).mean()
    d = k.ewm(com=KD_D_SMOOTH - 1, adjust=False).mean()
    return k, d


# ════════════════════════════════════════════════════════════
# 底背離偵測
# ════════════════════════════════════════════════════════════

def _find_pivot_lows(vals, wl=5, wr=3):
    """找局部最低點索引"""
    pivots = []
    n = len(vals)
    for i in range(wl, n - wr):
        lo = True
        for j in range(i - wl, i):
            if vals[j] <= vals[i]:
                lo = False
                break
        if not lo:
            continue
        for j in range(i + 1, i + wr + 1):
            if vals[j] <= vals[i]:
                lo = False
                break
        if lo:
            pivots.append(i)
    return pivots


def detect_divergence(df: pd.DataFrame, indicator_col: str, lookback: int = DIVERGENCE_LOOKBACK):
    """
    偵測底背離。
    回傳 (bool, details_dict | None)
    """
    if len(df) < lookback:
        return False, None

    recent = df.iloc[-lookback:]
    prices = recent["Low"].values.astype(float)
    indicator = recent[indicator_col].values.astype(float)
    dates = recent.index

    price_pivots = _find_pivot_lows(prices, PIVOT_WINDOW_LEFT, PIVOT_WINDOW_RIGHT)
    if len(price_pivots) < 2:
        return False, None

    # 從最新的低點往前找配對
    for i in range(len(price_pivots) - 1, 0, -1):
        curr = price_pivots[i]
        prev = price_pivots[i - 1]

        if curr - prev < MIN_PIVOT_GAP:
            continue
        if (lookback - 1 - curr) > MAX_RECENT_BARS:
            continue

        # 底背離：價格更低，指標更高
        if prices[curr] < prices[prev] and indicator[curr] > indicator[prev]:
            return True, {
                "prev_date": dates[prev].strftime("%m/%d"),
                "curr_date": dates[curr].strftime("%m/%d"),
                "prev_price": round(float(prices[prev]), 2),
                "curr_price": round(float(prices[curr]), 2),
                "prev_ind": round(float(indicator[prev]), 2),
                "curr_ind": round(float(indicator[curr]), 2),
            }

    return False, None


# ════════════════════════════════════════════════════════════
# 下載 & 掃描
# ════════════════════════════════════════════════════════════

def _download_and_scan(stock: dict):
    """下載單檔並偵測底背離"""
    code, name, ticker = stock["code"], stock["name"], stock["ticker"]
    try:
        # 用 Ticker.history() 而非 yf.download()，後者不 thread-safe
        data = yf.Ticker(ticker).history(period=LOOKBACK_PERIOD, auto_adjust=True)
        if data is None or data.empty or len(data) < DIVERGENCE_LOOKBACK:
            return None

        # 確認欄位存在
        for col in ("Open", "High", "Low", "Close", "Volume"):
            if col not in data.columns:
                return None

        # 成交量門檻
        avg_vol = data["Volume"].tail(20).mean()
        if pd.isna(avg_vol) or avg_vol < MIN_VOLUME_LOTS * 1000:
            return None

        # 技術指標
        macd_line, sig_line, hist = calc_macd(data["Close"])
        k_line, d_line = calc_kd(data["High"], data["Low"], data["Close"])
        data["Histogram"] = hist
        data["K"] = k_line
        data["D"] = d_line
        data = data.dropna()
        if len(data) < DIVERGENCE_LOOKBACK:
            return None

        # 偵測
        m_ok, m_det = detect_divergence(data, "Histogram")
        k_ok, k_det = detect_divergence(data, "K")

        if not m_ok and not k_ok:
            return None

        last = data.iloc[-1]
        prev_close = data["Close"].iloc[-2] if len(data) > 1 else last["Close"]
        chg = float((last["Close"] - prev_close) / prev_close * 100)

        sig = "雙指標" if m_ok and k_ok else ("MACD" if m_ok else "KD")
        strength = 3 if sig == "雙指標" else (2 if sig == "MACD" else 1)

        return {
            "code": code,
            "name": name,
            "market": stock["market"],
            "close": round(float(last["Close"]), 2),
            "change_pct": round(chg, 2),
            "volume_lots": int(avg_vol / 1000),
            "signal_type": sig,
            "signal_strength": strength,
            "macd_details": m_det,
            "kd_details": k_det,
        }
    except Exception:
        return None


def scan_all(stocks, workers=MAX_WORKERS):
    total = len(stocks)
    results = []
    done = 0

    logger.info(f"🔍 開始掃描 {total} 檔股票（{workers} workers）…")

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = {pool.submit(_download_and_scan, s): s for s in stocks}
        for fut in as_completed(futs):
            done += 1
            if done % 50 == 0 or done == total:
                found = len(results)
                logger.info(f"   進度 {done}/{total} ({done*100//total}%) — 已發現 {found} 檔")
            try:
                r = fut.result()
                if r:
                    results.append(r)
            except Exception:
                pass

    results.sort(key=lambda x: (-x["signal_strength"], x["code"]))
    logger.info(f"✅ 掃描完成！共 {len(results)} 檔底背離")
    return results


# ════════════════════════════════════════════════════════════
# HTML 報表
# ════════════════════════════════════════════════════════════

def _build_html(results, scan_date, total_scanned):
    dual = sum(1 for r in results if r["signal_type"] == "雙指標")
    macd_n = sum(1 for r in results if r["signal_type"] == "MACD")
    kd_n = sum(1 for r in results if r["signal_type"] == "KD")

    rows = ""
    for r in results:
        badge_cls = {"雙指標": "badge-dual", "MACD": "badge-macd", "KD": "badge-kd"}[r["signal_type"]]
        chg_cls = "pos" if r["change_pct"] >= 0 else "neg"
        chg_sign = "+" if r["change_pct"] >= 0 else ""

        detail_parts = []
        if r["macd_details"]:
            d = r["macd_details"]
            detail_parts.append(
                f'<span class="det-m">MACD 價:{d["prev_price"]}→{d["curr_price"]} '
                f'柱:{d["prev_ind"]}→{d["curr_ind"]}</span>'
            )
        if r["kd_details"]:
            d = r["kd_details"]
            detail_parts.append(
                f'<span class="det-k">KD 價:{d["prev_price"]}→{d["curr_price"]} '
                f'K:{d["prev_ind"]}→{d["curr_ind"]}</span>'
            )
        detail_html = "<br>".join(detail_parts)

        gi = f"https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID={r['code']}"
        yh = f"https://tw.stock.yahoo.com/quote/{r['code']}"

        rows += f"""<tr data-sig="{r['signal_type']}">
<td><a href="{gi}" target="_blank" class="sl">{r['code']}</a></td>
<td>{r['name']}</td><td>{r['market']}</td>
<td class="n">{r['close']:.2f}</td>
<td class="n {chg_cls}">{chg_sign}{r['change_pct']:.2f}%</td>
<td class="n">{r['volume_lots']:,}</td>
<td><span class="badge {badge_cls}">{r['signal_type']}</span></td>
<td class="det">{detail_html}</td>
<td><a href="{gi}" target="_blank" title="Goodinfo">📊</a> <a href="{yh}" target="_blank" title="Yahoo">📈</a></td>
</tr>\n"""

    empty = "" if results else '<div class="empty"><div class="ei">🔍</div>今日未偵測到底背離訊號</div>'
    tbl_open = '<table id="T"><thead><tr>' if results else ""
    headers = ""
    if results:
        for i, h in enumerate(["代號", "名稱", "市場", "收盤價", "漲跌幅", "日均量(張)", "訊號", "背離細節", "查看"]):
            sortable = f' onclick="S({i})"' if i < 7 else ""
            arrow = ' <span class="si">⇅</span>' if i < 7 else ""
            headers += f"<th{sortable}>{h}{arrow}</th>"
    tbl_close = "</tr></thead><tbody>" + rows + "</tbody></table>" if results else ""

    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>台股底背離掃描 {scan_date}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{--bg:#0a0e1a;--bg2:#111827;--card:#1a2035;--bdr:#2a3555;--t1:#e8ecf4;--t2:#8892a8;--t3:#5a6580;--red:#ef4444;--grn:#22c55e;--gold:#f59e0b;--blue:#3b82f6;--purp:#a855f7}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--t1);min-height:100vh}}
.hero{{background:linear-gradient(135deg,#0a0e1a,#1a1040,#0a0e1a);border-bottom:1px solid var(--bdr);padding:2.5rem 2rem 2rem;position:relative;overflow:hidden}}
.hero::before{{content:'';position:absolute;inset:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 50%,rgba(139,92,246,.08),transparent 50%),radial-gradient(circle at 70% 80%,rgba(34,197,94,.06),transparent 50%);pointer-events:none}}
.hc{{max-width:1400px;margin:0 auto;position:relative;z-index:1}}
h1{{font-size:1.8rem;font-weight:700;background:linear-gradient(135deg,#e8ecf4,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.4rem}}
.sub{{color:var(--t2);font-size:.95rem}}
.sg{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;max-width:1400px;margin:-1.5rem auto 2rem;padding:0 2rem;position:relative;z-index:2}}
.sc{{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:1.1rem 1.4rem;transition:transform .2s,box-shadow .2s}}
.sc:hover{{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.3)}}
.sc .lb{{font-size:.78rem;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem}}
.sc .vl{{font-size:1.7rem;font-weight:700;font-family:'JetBrains Mono',monospace}}
.vl.gd{{color:var(--gold)}}.vl.gn{{color:var(--grn)}}.vl.bl{{color:var(--blue)}}.vl.pp{{color:var(--purp)}}
.mc{{max-width:1400px;margin:0 auto;padding:0 2rem 3rem}}
.tc{{background:var(--card);border:1px solid var(--bdr);border-radius:12px;overflow:hidden}}
.th{{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid var(--bdr);flex-wrap:wrap;gap:.5rem}}
.th h2{{font-size:1rem;font-weight:600}}
.fg{{display:flex;gap:.4rem}}
.fb{{padding:.35rem .7rem;border-radius:6px;border:1px solid var(--bdr);background:0;color:var(--t2);font-size:.8rem;cursor:pointer;transition:all .2s;font-family:inherit}}
.fb:hover,.fb.on{{background:var(--bg2);color:var(--t1);border-color:var(--purp)}}
table{{width:100%;border-collapse:collapse}}
thead th{{background:var(--bg2);padding:.75rem 1rem;text-align:left;font-size:.76rem;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--bdr);cursor:pointer;user-select:none;white-space:nowrap;transition:color .2s}}
thead th:hover{{color:var(--t1)}}
.si{{margin-left:.2rem;opacity:.3;font-size:.7rem}}
th.sd .si{{opacity:1;color:var(--purp)}}
tbody tr{{border-bottom:1px solid rgba(42,53,85,.5);transition:background .15s}}
tbody tr:hover{{background:#1e2a45}}
td{{padding:.65rem 1rem;font-size:.87rem}}
.n{{font-family:'JetBrains Mono',monospace;text-align:right;font-size:.84rem}}
.pos{{color:var(--red)}}.neg{{color:var(--grn)}}
.sl{{color:var(--blue);text-decoration:none;font-family:'JetBrains Mono',monospace;font-weight:500;transition:color .2s}}
.sl:hover{{color:var(--purp);text-decoration:underline}}
.badge{{display:inline-block;padding:.22rem .55rem;border-radius:100px;font-size:.74rem;font-weight:600}}
.badge-dual{{background:rgba(245,158,11,.18);color:var(--gold);border:1px solid rgba(245,158,11,.3)}}
.badge-macd{{background:rgba(34,197,94,.14);color:var(--grn);border:1px solid rgba(34,197,94,.25)}}
.badge-kd{{background:rgba(59,130,246,.14);color:var(--blue);border:1px solid rgba(59,130,246,.25)}}
.det{{font-size:.76rem;color:var(--t2);line-height:1.5}}
.det-m{{color:#6ee7b7}}.det-k{{color:#93c5fd}}
td a[title]{{text-decoration:none;font-size:1.1rem;margin-right:.2rem;opacity:.7;transition:opacity .2s}}
td a[title]:hover{{opacity:1}}
.empty{{text-align:center;padding:4rem 2rem;color:var(--t3)}}.ei{{font-size:3rem;margin-bottom:1rem}}
.ft{{max-width:1400px;margin:0 auto;padding:1rem 2rem;text-align:center;color:var(--t3);font-size:.76rem}}
@media(max-width:768px){{.hero{{padding:1.5rem 1rem 1rem}}.sg{{padding:0 1rem;grid-template-columns:repeat(2,1fr)}}.mc{{padding:0 1rem 2rem}}.tc{{overflow-x:auto}}table{{min-width:900px}}}}
</style>
</head>
<body>
<div class="hero"><div class="hc">
<h1>📉 台股底背離掃描報表</h1>
<div class="sub">掃描日期：{scan_date} ｜ MACD + KD 雙指標偵測 ｜ 資料來源：Yahoo Finance</div>
</div></div>

<div class="sg">
<div class="sc"><div class="lb">掃描股票數</div><div class="vl pp">{total_scanned}</div></div>
<div class="sc"><div class="lb">底背離訊號</div><div class="vl gd">{len(results)}</div></div>
<div class="sc"><div class="lb">🔥 雙指標共振</div><div class="vl gd">{dual}</div></div>
<div class="sc"><div class="lb">MACD 底背離</div><div class="vl gn">{macd_n}</div></div>
<div class="sc"><div class="lb">KD 底背離</div><div class="vl bl">{kd_n}</div></div>
</div>

<div class="mc"><div class="tc">
<div class="th">
<h2>底背離股票清單</h2>
<div class="fg">
<button class="fb on" onclick="F('all')">全部</button>
<button class="fb" onclick="F('雙指標')">🔥 雙指標</button>
<button class="fb" onclick="F('MACD')">📗 MACD</button>
<button class="fb" onclick="F('KD')">📘 KD</button>
</div>
</div>
{empty}{tbl_open}{headers}{tbl_close}
</div></div>

<div class="ft">
<p>⚠️ 本報表僅供技術分析參考，不構成投資建議。底背離為技術面訊號，需搭配基本面與量能判斷。</p>
<p>Generated by 台股底背離掃描工具 · {scan_date}</p>
</div>

<script>
let sd={{}};
function S(c){{const t=document.getElementById('T');if(!t)return;const b=t.querySelector('tbody'),rs=Array.from(b.querySelectorAll('tr')),hs=t.querySelectorAll('thead th');sd[c]=!sd[c];const a=sd[c];hs.forEach((h,i)=>h.classList.toggle('sd',i===c));rs.sort((x,y)=>{{let av=x.cells[c].textContent.trim(),bv=y.cells[c].textContent.trim();const an=parseFloat(av.replace(/[,%]/g,'')),bn=parseFloat(bv.replace(/[,%]/g,''));if(!isNaN(an)&&!isNaN(bn))return a?an-bn:bn-an;return a?av.localeCompare(bv,'zh-TW'):bv.localeCompare(av,'zh-TW')}});rs.forEach(r=>b.appendChild(r))}}
function F(t){{const tbl=document.getElementById('T');if(!tbl)return;tbl.querySelectorAll('tbody tr').forEach(r=>{{r.style.display=t==='all'?'':r.dataset.sig===t?'':'none'}});document.querySelectorAll('.fb').forEach(b=>b.classList.toggle('on',t==='all'?b.textContent.includes('全部'):b.textContent.includes(t)))}}
</script>
</body>
</html>"""


def generate_report(results, scan_date, total_scanned):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    html = _build_html(results, scan_date, total_scanned)

    dated = os.path.join(OUTPUT_DIR, f"divergence_{scan_date.replace('-', '')}.html")
    latest = os.path.join(OUTPUT_DIR, "divergence_latest.html")

    for p in (dated, latest):
        with open(p, "w", encoding="utf-8") as f:
            f.write(html)

    return dated


# ════════════════════════════════════════════════════════════
# CLI
# ════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="台股底背離掃描工具")
    parser.add_argument("--test", type=int, default=0, help="測試模式：只掃描前 N 檔")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help=f"並行 worker 數 (預設 {MAX_WORKERS})")
    args = parser.parse_args()

    workers = args.workers

    scan_date = datetime.now().strftime("%Y-%m-%d")
    logger.info(f"{'='*50}")
    logger.info(f"📉 台股底背離掃描  {scan_date}")
    logger.info(f"{'='*50}")

    # 1. 取股票清單
    stocks = fetch_stock_list()
    if not stocks:
        logger.error("❌ 無法取得股票清單")
        sys.exit(1)

    if args.test:
        stocks = stocks[: args.test]
        logger.info(f"🧪 測試模式：只掃描前 {args.test} 檔")

    total = len(stocks)
    logger.info(f"📊 共 {total} 檔待掃描")

    # 2. 掃描
    results = scan_all(stocks, workers=workers)

    # 3. 報表
    out = generate_report(results, scan_date, total)
    logger.info(f"📄 報表已輸出: {out}")

    # 4. 終端摘要
    print(f"\n{'='*55}")
    print(f"  📊 底背離掃描結果 — {scan_date}")
    print(f"{'='*55}")
    print(f"  掃描: {total} 檔 ｜ 偵測到: {len(results)} 檔\n")

    dual = [r for r in results if r["signal_type"] == "雙指標"]
    if dual:
        print("  🔥 雙指標底背離（MACD + KD）:")
        for r in dual:
            print(f"     {r['code']} {r['name']:　<6} ${r['close']:.2f}  ({r['market']})")
        print()

    macd_only = [r for r in results if r["signal_type"] == "MACD"]
    if macd_only:
        print(f"  📗 MACD 底背離 ({len(macd_only)} 檔):")
        for r in macd_only[:10]:
            print(f"     {r['code']} {r['name']:　<6} ${r['close']:.2f}")
        if len(macd_only) > 10:
            print(f"     ... 還有 {len(macd_only)-10} 檔，詳見報表")
        print()

    kd_only = [r for r in results if r["signal_type"] == "KD"]
    if kd_only:
        print(f"  📘 KD 底背離 ({len(kd_only)} 檔):")
        for r in kd_only[:10]:
            print(f"     {r['code']} {r['name']:　<6} ${r['close']:.2f}")
        if len(kd_only) > 10:
            print(f"     ... 還有 {len(kd_only)-10} 檔，詳見報表")
        print()

    print(f"  📄 完整報表: {out}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
