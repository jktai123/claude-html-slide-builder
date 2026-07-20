#!/bin/bash
echo "正在停用並移除無用的 LaunchAgents..."

# 1. 停用服務
launchctl unload -w /Library/LaunchAgents/com.piriform.ccleaner.plist 2>/dev/null
launchctl unload -w /Library/LaunchAgents/com.piriform.ccleaner.update.plist 2>/dev/null

# 2. 刪除 plist 檔案 (需要輸入密碼)
sudo rm -f \
  /Library/LaunchAgents/com.google.keystone.agent.plist \
  /Library/LaunchAgents/com.google.keystone.xpcservice.plist \
  /Library/LaunchAgents/com.oracle.java.Java-Updater.plist \
  /Library/LaunchAgents/com.piriform.ccleaner.plist \
  /Library/LaunchAgents/com.piriform.ccleaner.update.plist

echo "清理完成！"
