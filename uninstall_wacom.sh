#!/bin/bash
echo "開始手動移除 Wacom 繪圖板驅動與殘留檔案..."

# 1. 停止服務 (LaunchAgents & LaunchDaemons)
echo "正在停止 Wacom 背景服務..."
sudo launchctl unload /Library/LaunchAgents/com.wacom.DataStoreMgr.plist 2>/dev/null
sudo launchctl unload /Library/LaunchAgents/com.wacom.IOManager.plist 2>/dev/null
sudo launchctl unload /Library/LaunchAgents/com.wacom.wacomtablet.plist 2>/dev/null
sudo launchctl unload /Library/LaunchDaemons/com.wacom.UpdateHelper.plist 2>/dev/null

# 2. 刪除 launchd 設定檔
echo "正在刪除 LaunchAgents 與 LaunchDaemons 設定..."
sudo rm -f /Library/LaunchAgents/com.wacom.DataStoreMgr.plist
sudo rm -f /Library/LaunchAgents/com.wacom.IOManager.plist
sudo rm -f /Library/LaunchAgents/com.wacom.wacomtablet.plist
sudo rm -f /Library/LaunchDaemons/com.wacom.UpdateHelper.plist

# 3. 刪除系統級應用程式與支援檔案
echo "正在刪除系統中的 Wacom 檔案..."
sudo rm -rf "/Applications/Wacom Tablet.localized"
sudo rm -rf "/Library/Application Support/Tablet"
sudo rm -rf "/Library/Preferences/Tablet"
sudo rm -rf "/Library/PreferencePanes/WacomTablet.prefpane"
sudo rm -rf /Library/PrivilegedHelperTools/com.wacom.UpdateHelper.app
sudo rm -rf /Library/PrivilegedHelperTools/com.wacom.IOManager.app
sudo rm -rf /Library/PrivilegedHelperTools/com.wacom.DataStoreMgr.app

# 4. 刪除使用者目錄下的 Wacom 設定、快取與容器 (Sandbox Containers)
echo "正在刪除使用者目錄下的快取與設定檔..."
rm -rf ~/Library/Saved\ Application\ State/com.wacom.WacomCenter.savedState
rm -rf ~/Library/Application\ Scripts/com.wacom.*
rm -rf ~/Library/Application\ Scripts/EG27766DY7.com.wacom.WacomTabletDriver
rm -rf ~/Library/Group\ Containers/com.wacom.*
rm -rf ~/Library/Group\ Containers/EG27766DY7.com.wacom.WacomTabletDriver
rm -rf ~/Library/Containers/com.wacom.*

echo "Wacom 驅動與殘留檔案已清理完成！"
