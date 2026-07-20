import os
import re
import sys
import json
import time
import subprocess
from datetime import datetime, timezone, timedelta

INTERVAL = 15  # seconds between samples
DATA_FILE = "/Users/jktai/.gemini/antigravity/brain/952e3ed4-320c-4227-9034-7a8aea21001f/screentime.json"

def get_idle_seconds():
    try:
        out = subprocess.check_output("ioreg -a -r -n IOHIDSystem", shell=True).decode()
        match = re.search(r'<key>HIDIdleTime</key>\s*<integer>(\d+)</integer>', out)
        if match:
            return float(match.group(1)) / 1000000000.0
    except Exception:
        pass
    return 0.0

def get_frontmost_app():
    try:
        # Get active app ASN without using osascript (sandbox safe)
        asn = subprocess.check_output(["lsappinfo", "front"], timeout=5).decode().strip()
        if not asn:
            return "Unknown"
        info = subprocess.check_output(["lsappinfo", "info", asn], timeout=5).decode().strip()
        first_line = info.split('\n')[0]
        match = re.match(r'^"([^"]+)"', first_line)
        if match:
            return match.group(1)
    except Exception:
        pass
    return "Unknown"

def get_tpe_date():
    tpe_tz = timezone(timedelta(hours=8))
    return datetime.now(timezone.utc).astimezone(tpe_tz).strftime("%Y-%m-%d")

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_data(data):
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving screentime: {e}")

def run():
    print(f"🚀 Antigravity Screen Time Tracker 已啟動 (採樣間隔: {INTERVAL} 秒)...")
    while True:
        try:
            date_str = get_tpe_date()
            idle_sec = get_idle_seconds()
            
            # Load current state
            data = load_data()
            if date_str not in data:
                data[date_str] = {}
                
            day_data = data[date_str]
            
            # Determine active target
            if idle_sec > 120.0:  # Idle for more than 2 minutes
                target = "Idle / Locked"
            else:
                target = get_frontmost_app()
                if not target or target == "Unknown":
                    target = "Idle / Locked"
            
            # Map common names or keep original
            # e.g., "Google Chrome" -> "Chrome"
            if target == "Google Chrome":
                target = "Chrome"
            elif target == "Antigravity IDE":
                target = "Antigravity"
                
            # Update duration
            day_data[target] = day_data.get(target, 0.0) + INTERVAL
            
            # Save state
            save_data(data)
            
        except Exception as e:
            print(f"Tracker Loop Error: {e}")
            
        time.sleep(INTERVAL)

if __name__ == "__main__":
    run()
