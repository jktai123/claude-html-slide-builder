#!/bin/bash

# Port number
PORT=8288

# Get local IP
get_local_ip() {
    # macOS way to get local IP
    ip=$(ipconfig getifaddr en0)
    if [ -z "$ip" ]; then
        ip=$(ipconfig getifaddr en1)
    fi
    if [ -z "$ip" ]; then
        ip=$(python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 1)); print(s.getsockname()[0]); s.close()")
    fi
    if [ -z "$ip" ]; then
        ip="localhost"
    fi
    echo "$ip"
}

IP=$(get_local_ip)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if port is already in use
pid=$(lsof -t -i:$PORT)
if [ -n "$pid" ]; then
    echo "⚠️  偵測到 Port $PORT 已經被佔用 (PID: $pid)。正在為你關閉舊的服務..."
    kill -9 $pid
    pkill -f "tracker.py"
    sleep 1
fi

echo "========================================="
echo "🪐 正在啟動 Antigravity Web UI Portal..."
echo "========================================="

# Export path to ensure ntn and helper scripts are available to the background process
export PATH="/Users/jktai/.local/bin:$PATH"

# Load NOTION_API_TOKEN from .env and export it for ntn to use
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    token=$(grep "NOTION_API_TOKEN=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$token" ]; then
        export NOTION_API_TOKEN="$token"
        echo "🔑 成功從 .env 載入並匯出 NOTION_API_TOKEN"
    fi
fi

# Start Screen Time Tracker in the background
nohup python3 -u "$SCRIPT_DIR/agy_portal/tracker.py" > "$SCRIPT_DIR/agy_portal/tracker.log" 2>&1 &

# Start backend server with caffeinate to prevent Mac from entering system sleep while server is running
nohup caffeinate -s python3 -u "$SCRIPT_DIR/agy_portal/app.py" > "$SCRIPT_DIR/agy_portal/server.log" 2>&1 &
SERVER_PID=$!

sleep 1.5

# Double check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo "🎉 服務啟動成功！"
    echo "💻 Mac 本機連結 : http://localhost:$PORT"
    echo "📱 行動裝置連結 : http://$IP:$PORT"
    echo "-----------------------------------------"
    echo "💡 提示：手機或 iPad 需與這台 Mac 連上相同的 Wi-Fi。"
    echo "🛑 若要關閉此服務，請於 Terminal 執行：kill $SERVER_PID && pkill -f tracker.py"
    echo "========================================="
else
    echo "❌ 啟動失敗，請查看日誌檔：$SCRIPT_DIR/agy_portal/server.log"
    echo "========================================="
fi
