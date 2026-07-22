#!/usr/bin/env python3
import os
import sys
import json
import argparse
import datetime

def main():
    parser = argparse.ArgumentParser(description="Sync Antigravity conversation summaries to Obsidian project workflow note.")
    parser.add_argument("--path", type=str, default=None, help="Target project absolute directory path.")
    args = parser.parse_args()

    project_dir = args.path if args.path else os.getcwd()
    project_dir = os.path.abspath(project_dir)
    project_name = os.path.basename(project_dir)

    print(f"🔍 開始為專案「{project_name}」({project_dir}) 地毯式掃描與同步對話動作摘要...")

    brain_dir = os.path.expanduser("~/.gemini/antigravity/brain")
    obsidian_base_paths = [
        os.path.expanduser("~/Library/Mobile Documents/iCloud~md~obsidian/Documents/secondbrain"),
        os.path.expanduser("~/Library/CloudStorage/GoogleDrive-jktai123@gmail.com/我的雲端硬碟/secondbrain")
    ]

    keywords = [
        project_name,
        project_dir,
        "claude-html-slide-builder",
        "html-slide-builder",
        "html簡報",
        "Reveal.js",
        "reveal.js",
        "html_slide",
        "簡報"
    ]

    all_convs = []

    if os.path.exists(brain_dir):
        for cid in os.listdir(brain_dir):
            if not (len(cid) == 36 and cid.count('-') == 4):
                continue
                
            log_path = os.path.join(brain_dir, cid, ".system_generated", "logs", "transcript.jsonl")
            if not os.path.exists(log_path):
                continue
                
            is_match = False
            user_requests = []
            last_time = None
            
            try:
                with open(log_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        step = json.loads(line)
                        content = step.get("content", "")
                        step_type = step.get("type")
                        
                        for kw in keywords:
                            if kw in content:
                                is_match = True
                                break
                                
                        if "<ADDITIONAL_METADATA>" in content:
                            try:
                                meta = content.split("<ADDITIONAL_METADATA>")[1].split("</ADDITIONAL_METADATA>")[0]
                                for m_line in meta.split("\n"):
                                    if "local time" in m_line:
                                        t_str = m_line.split("is:")[1].strip().rstrip('.')
                                        dt = datetime.datetime.fromisoformat(t_str)
                                        if last_time is None or dt > last_time:
                                            last_time = dt
                            except Exception:
                                pass
                                
                        if step_type == "USER_INPUT":
                            req = content
                            if "<ADDITIONAL_METADATA>" in content:
                                req = content.split("<ADDITIONAL_METADATA>")[0].replace("<USER_REQUEST>", "").replace("</USER_REQUEST>", "").strip()
                            req_clean = req.strip()
                            if req_clean and req_clean not in user_requests:
                                user_requests.append(req_clean)
            except Exception:
                continue
                
            if is_match and user_requests:
                first_title = user_requests[0].split('\n')[0][:70]
                all_convs.append({
                    "cid": cid,
                    "title": first_title,
                    "steps_count": len(user_requests),
                    "last_time": last_time or datetime.datetime.min,
                    "date_str": (last_time or datetime.datetime.min).strftime("%Y-%m-%d")
                })

    # Deduplicate by title & sort descending
    unique_convs = {}
    for c in all_convs:
        title_key = c["title"].lower().strip()
        if title_key not in unique_convs or c["last_time"] > unique_convs[title_key]["last_time"]:
            unique_convs[title_key] = c

    sorted_records = sorted(list(unique_convs.values()), key=lambda x: x["last_time"], reverse=True)

    print(f"📊 成功掃描並去重獲得 {len(sorted_records)} 筆全專案歷史對話摘要。")

    # Build Markdown Table
    table_lines = [
        "| 日期 | 對話主題與核心操作 | 互動步驟 | 對話 ID |",
        "|---|---|---|---|"
    ]

    for r in sorted_records:
        table_lines.append(f"| {r['date_str']} | {r['title']} | {r['steps_count']} 步 | `{r['cid'][:8]}` |")

    table_content = "\n".join(table_lines)
    now_date_str = datetime.datetime.now().strftime("%Y-%m-%d")

    # Sync to Obsidian
    synced_any = False
    for base_p in obsidian_base_paths:
        if not os.path.exists(base_p):
            continue
            
        proj_obs_dir = os.path.join(base_p, project_name)
        os.makedirs(proj_obs_dir, exist_ok=True)
        
        target_file = os.path.join(proj_obs_dir, "專案工作流程.md")
        
        if os.path.exists(target_file):
            with open(target_file, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = f"""---
date: '{now_date_str}'
tags:
  - 專案
  - 工作流程
title: {project_name}專案工作流程
---
# {project_name} - 專案工作流程與歷史紀錄

## 專案簡介
本檔案記錄 {project_name} 專案之架構決策與 Agent 歷史動作摘要。

## 決策與架構
- **技能機制**：導入 `project-init` / `startup` / `shutdown` / `sync-project-workflow` 跨電腦相容技能。

## 🗓️ 更動與初始化紀錄
"""

        header = "## 🗓️ 更動與初始化紀錄"
        new_section = f"{header}\n\n> 本章節由 `sync-project-workflow` 技能自動地毯式掃描備份，共包含 {len(sorted_records)} 筆歷史對話。\n\n{table_content}"
        
        if header in content:
            parts = content.split(header)
            content = parts[0] + new_section + "\n"
        else:
            content = content.strip() + f"\n\n{new_section}\n"
            
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"✅ 已成功同步至 Obsidian: {target_file}")
        synced_any = True

    if synced_any:
        print(f"🎉 專案「{project_name}」的全歷史動作摘要 (共 {len(sorted_records)} 筆) 已 100% 同步更新至 Obsidian！")
    else:
        print("⚠️ 未能在系統中找到有效的 Obsidian 筆記庫目錄。")

if __name__ == "__main__":
    main()
