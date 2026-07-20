# macOS LaunchAgents 檢查報告與必要性建議 (更新版)

本報告針對 `/Library/LaunchAgents` 目錄下的所有排程與常駐服務進行分析，提供功能摘要、觸發條件與必要性建議。

---

## 總覽表格

| 檔名 | 執行程式 / 腳本 | 觸發條件 | 建議與必要性 |
| :--- | :--- | :--- | :--- |
| `com.changing.servisign.bank_of_taiwan.plist` | `first_run.command` (台銀 ServiSign) | 登入時載入 (`RunAtLoad`) | **依需求保留**。使用台銀網頁版網銀與讀卡機時需要，不常用可停用。 |
| `com.jktai.daily.plist` | `/Users/jktai/web/shell_sh/daily.sh` | 每天 00:00 (`StartCalendarInterval`) | **必要 (自訂)**。使用者個人每日腳本。 |
| `com.jktai.stock.plist` | `/Users/jktai/web/shell_sh/stock.sh` | 台股開盤期間多個時段 | **必要 (自訂)**。使用者股票資料排程。 |
| `com.microsoft.update.agent.plist` | `Microsoft Update Assistant` | 每 2 小時 & 登入時載入 | **建議保留**。負責微軟 Office 軟體之背景更新。 |
| `com.wacom.DataStoreMgr.plist` | `DataStoreMgr` (Wacom) | 登入時載入 & 異常重啟 | **使用繪圖板時必要**。Wacom 數據儲存管理。 |
| `com.wacom.IOManager.plist` | `IOManager` (Wacom) | 異常重啟 | **使用繪圖板時必要**。Wacom 輸入輸出管理。 |
| `com.wacom.wacomtablet.plist` | `WacomTabletDriver` (Wacom) | 登入時載入 & 異常/崩潰重啟 | **使用繪圖板時必要**。Wacom 核心驅動。 |

---

## 詳細分析與處置建議

### 1. 台灣銀行憑證簽章服務 (ServiSign)
* **檔案名稱**：[com.changing.servisign.bank_of_taiwan.plist](file:///Library/LaunchAgents/com.changing.servisign.bank_of_taiwan.plist)
* **執行路徑**：`/Library/Bank_Of_Taiwan/ServiSign/script/first_run.command`
* **功能摘要**：台灣銀行網路銀行安全憑證與讀卡機連接服務 (ServiSign)。
* **必要性建議**：
  * **必要**：若你經常使用台灣銀行網銀並需使用實體讀卡機/憑證。
  * **可停用**：若不常用，可透過指令停用。
* **停用指令**：
  ```bash
  sudo launchctl unload -w /Library/LaunchAgents/com.changing.servisign.bank_of_taiwan.plist
  ```

### 2. 個人自訂腳本 - 每日排程
* **檔案名稱**：[com.jktai.daily.plist](file:///Library/LaunchAgents/com.jktai.daily.plist)
* **執行路徑**：`/Users/jktai/web/shell_sh/daily.sh`
* **排程時間**：每天凌晨 `00:00`
* **日誌路徑**：
  * 輸出：`/Users/jktai/web/shell_sh/Logs/daily.log`
  * 錯誤：`/Users/jktai/web/shell_sh/Logs/daily.err`
* **必要性建議**：**必要**。這是你的自訂工作排程。

### 3. 個人自訂腳本 - 股票排程
* **檔案名稱**：[com.jktai.stock.plist](file:///Library/LaunchAgents/com.jktai.stock.plist)
* **執行路徑**：`/Users/jktai/web/shell_sh/stock.sh`
* **排程時間**：盤中/收盤時段 `09:05`, `10:35`, `11:45`, `13:50`
* **日誌路徑**：
  * 輸出：`/Users/jktai/web/shell_sh/Logs/stock.log`
  * 錯誤：`/Users/jktai/web/shell_sh/Logs/stock.err`
* **必要性建議**：**必要**。這是你的自訂股票排程。

### 4. Microsoft 軟體自動更新
* **檔案名稱**：[com.microsoft.update.agent.plist](file:///Library/LaunchAgents/com.microsoft.update.agent.plist)
* **執行路徑**：`.../Microsoft AutoUpdate.app/Contents/MacOS/Microsoft Update Assistant`
* **功能摘要**：每 2 小時檢查一次微軟產品 (如 Office 365) 的更新。
* **必要性建議**：**建議保留**，用來即時修補 Office 的安全性漏洞與取得新功能。

### 5. Wacom 繪圖板驅動 (3 個檔案)
* **檔案名稱**：
  * [com.wacom.DataStoreMgr.plist](file:///Library/LaunchAgents/com.wacom.DataStoreMgr.plist)
  * [com.wacom.IOManager.plist](file:///Library/LaunchAgents/com.wacom.IOManager.plist)
  * [com.wacom.wacomtablet.plist](file:///Library/LaunchAgents/com.wacom.wacomtablet.plist)
* **功能摘要**：Wacom 繪圖板的核心驅動、輸入輸出管理與資料儲存管理。
* **必要性建議**：**使用繪圖板時絕對必要**。若已不再使用 Wacom 設備，應卸載驅動以節省系統資源。
