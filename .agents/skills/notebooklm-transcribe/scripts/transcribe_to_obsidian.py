#!/usr/bin/env python3
import os
import sys
import json
import subprocess
from datetime import date

def get_vault_path():
    config_path = os.path.expanduser("~/.gemini/antigravity/mcp_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                obsidian_args = config.get("mcpServers", {}).get("obsidian", {}).get("args", [])
                if obsidian_args:
                    return obsidian_args[0]
        except Exception as e:
            print(f"Warning: Failed to parse mcp_config.json: {e}", file=sys.stderr)
            
    # Fallback default path
    return os.path.expanduser("~/Library/CloudStorage/GoogleDrive-jktai123@gmail.com/我的雲端硬碟/secondbrain")

def run_command(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Command {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()

def get_or_create_notebook():
    print("Checking NotebookLM notebooks...")
    out = run_command(["nlm", "list", "notebooks"])
    try:
        notebooks = json.loads(out)
    except Exception:
        notebooks = []
        
    for nb in notebooks:
        if nb.get("title") == "Audio_Transcript_Notebook":
            return nb.get("id")
            
    print("Creating new notebook: Audio_Transcript_Notebook...")
    out = run_command(["nlm", "create", "notebook", "Audio_Transcript_Notebook"])
    nb_data = json.loads(out)
    return nb_data.get("notebook_id")

def main():
    if len(sys.argv) < 2:
        print("Usage: transcribe_to_obsidian.py <path_to_audio_file>", file=sys.stderr)
        sys.exit(1)
        
    audio_file = sys.argv[1]
    if not os.path.exists(audio_file):
        print(f"Error: File not found: {audio_file}", file=sys.stderr)
        sys.exit(1)
        
    vault_path = get_vault_path()
    if not os.path.exists(vault_path):
        print(f"Error: Obsidian Vault path does not exist: {vault_path}", file=sys.stderr)
        sys.exit(1)
        
    notebook_id = get_or_create_notebook()
    print(f"Using Notebook ID: {notebook_id}")
    
    print(f"Uploading {audio_file} and waiting for transcription...")
    # Add source and wait
    upload_cmd = ["nlm", "source", "add", notebook_id, "--file", audio_file, "--wait", "--wait-timeout", "1200"]
    result = subprocess.run(upload_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Upload failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
        
    # Parse source ID from output
    source_id = None
    for line in result.stdout.split("\n"):
        if "Source ID:" in line:
            source_id = line.split("Source ID:")[-1].strip()
            break
            
    if not source_id:
        print("Error: Could not extract Source ID from output.", file=sys.stderr)
        print(result.stdout)
        sys.exit(1)
        
    print(f"Source ID obtained: {source_id}")
    print("Fetching raw transcript content...")
    
    # Save transcript directly
    temp_transcript_path = "temp_transcript.txt"
    run_command(["nlm", "content", "source", source_id, "-o", temp_transcript_path])
    
    with open(temp_transcript_path, "r", encoding="utf-8") as f:
        transcript_content = f.read()
        
    if os.path.exists(temp_transcript_path):
        os.remove(temp_transcript_path)
        
    # Generate Obsidian note
    today_str = date.today().isoformat()
    basename = os.path.basename(audio_file)
    title_no_ext, _ = os.path.splitext(basename)
    
    clippings_dir = os.path.join(vault_path, "Clippings")
    os.makedirs(clippings_dir, exist_ok=True)
    
    output_filename = f"{today_str} {title_no_ext}.md"
    output_path = os.path.join(clippings_dir, output_filename)
    
    frontmatter = f"""---
title: {title_no_ext}
date: {today_str}
source: {basename}
tags:
  - clippings
  - 語音轉文字
  - notebooklm
---

# {title_no_ext}（語音逐字稿）

> 來源音檔：`{basename}`（經 NotebookLM 轉錄）
> 轉錄日期：{today_str}

---

"""
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(frontmatter + transcript_content)
        
    print(f"Success! Note written to: {output_path}")

if __name__ == "__main__":
    main()
