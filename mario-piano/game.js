// 瑪利歐鋼琴遊戲核心邏輯
import { SONGS, PIANO_KEYS } from "./songs.js";
import { audio } from "./audio.js";

class PianoGame {
  constructor() {
    this.canvas = document.getElementById("piano-roll");
    this.ctx = this.canvas.getContext("2d");
    this.judgmentEl = document.getElementById("judgment-display");
    
    // 遊戲狀態
    this.currentSong = null;
    this.gameMode = "practice"; // "practice" 或 "challenge"
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    
    // 播放/下落狀態
    this.isPlaying = false;
    this.gameStartTime = 0;
    this.songNotes = []; // 複製並包裝歌曲的音符狀態
    this.currentTime = 0; // 挑戰模式下的歌曲播放時間 (秒)
    this.lastFrameTime = 0;
    
    // 下落速度 (像素/秒)
    this.fallSpeed = 250;
    this.hitLineY = 0; // 判定線的 Y 座標 (在 initDimensions 計算)
    
    // 粒子系統
    this.particles = [];
    
    // 鍵盤與琴鍵對照
    this.keys = [];
    this.keyMap = {}; // 用於 KeyDown 快速查詢: { key: keyObject }
    this.noteToKeyMap = {}; // 用於音符查詢: { noteName: keyElement }

    // 用於練習模式的音符狀態
    this.practiceTargetIndex = 0;

    // 麥克風實體鋼琴偵測狀態
    this.micEnabled = false;
    this.lastDetectedNote = null;
    this.lastDetectedTime = 0;
    this.silenceStartTime = null;
  }

  init() {
    this.initDimensions();
    this.buildKeyboard();
    this.bindEvents();
    this.loadSongList();
    this.animate(0);
  }

  initDimensions() {
    // 取得容器大小，將 Canvas 像素調整為實際顯示大小 (防止模糊)
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 判定線在畫布底部上方 10 像素處，對應琴鍵的頂部
    this.hitLineY = rect.height - 10;
  }

  buildKeyboard() {
    const keyboardEl = document.getElementById("piano-keyboard");
    keyboardEl.innerHTML = "";
    
    this.keys = [];
    this.keyMap = {};
    this.noteToKeyMap = {};
    
    // 計算白鍵總數以決定寬度
    const whiteKeysCount = PIANO_KEYS.filter(k => !k.isBlack).length;
    let whiteKeyIndex = 0;
    
    // 第一步：先渲染白鍵並記錄位置
    PIANO_KEYS.forEach((keyData) => {
      const keyEl = document.createElement("div");
      keyEl.dataset.note = keyData.note;
      
      const labelEl = document.createElement("span");
      labelEl.className = "key-label";
      labelEl.textContent = keyData.note;
      
      const bindEl = document.createElement("span");
      bindEl.className = "key-bind";
      bindEl.textContent = keyData.keyBind === ";" ? "Semicolon" : keyData.keyBind;
      
      keyEl.appendChild(labelEl);
      keyEl.appendChild(bindEl);
      
      // 計算畫布對齊用 X 座標比率 (xRatio)
      let xRatio = 0;
      
      if (!keyData.isBlack) {
        keyEl.className = "white-key";
        keyboardEl.appendChild(keyEl);
        
        // 白鍵置中
        xRatio = (whiteKeyIndex + 0.5) / whiteKeysCount;
        whiteKeyIndex++;
      } else {
        keyEl.className = "black-key";
        keyboardEl.appendChild(keyEl);
        
        // 黑鍵寬度設為白鍵的 60%
        const whiteKeyWidthPercent = 100 / whiteKeysCount;
        const blackKeyWidthPercent = whiteKeyWidthPercent * 0.6;
        
        // 黑鍵定位：置於前一個白鍵與後一個白鍵之間
        // 取得前一個白鍵的 index
        const prevWhiteIndex = whiteKeyIndex - 1;
        const leftPercent = (prevWhiteIndex + 1) * whiteKeyWidthPercent - (blackKeyWidthPercent / 2);
        keyEl.style.left = `${leftPercent}%`;
        keyEl.style.width = `${blackKeyWidthPercent}%`;
        
        // 黑鍵 X 軸置中
        xRatio = (prevWhiteIndex + 1) / whiteKeysCount;
      }
      
      const keyObj = {
        note: keyData.note,
        isBlack: keyData.isBlack,
        keyBind: keyData.keyBind.toLowerCase(),
        el: keyEl,
        xRatio: xRatio
      };
      
      this.keys.push(keyObj);
      this.keyMap[keyObj.keyBind] = keyObj;
      this.noteToKeyMap[keyObj.note] = keyEl;
    });
  }

  bindEvents() {
    // 視窗縮放
    window.addEventListener("resize", () => {
      this.initDimensions();
      this.buildKeyboard();
    });

    // 電腦實體鍵盤監聽
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return; // 忽略鍵盤自動長按重複
      const key = e.key.toLowerCase();
      
      // 解鎖 Web Audio
      audio.init();

      if (this.keyMap[key]) {
        e.preventDefault();
        this.onKeyPress(this.keyMap[key].note);
      }
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (this.keyMap[key]) {
        e.preventDefault();
        this.onKeyRelease(this.keyMap[key].note);
      }
    });

    // 螢幕虛擬琴鍵點擊 (點擊/滑動/觸控)
    const keyboardEl = document.getElementById("piano-keyboard");
    
    const handlePianoStart = (e) => {
      const target = e.target.closest(".white-key, .black-key");
      if (target) {
        const note = target.dataset.note;
        this.onKeyPress(note);
        target.classList.add("active");
        
        // 保存目前正在按著的琴鍵，供滑開或放開時清除
        target.dataset.activePointer = "true";
      }
    };

    const handlePianoEnd = (e) => {
      const target = e.target.closest(".white-key, .black-key");
      if (target && target.dataset.activePointer) {
        const note = target.dataset.note;
        this.onKeyRelease(note);
        target.classList.remove("active");
        delete target.dataset.activePointer;
      }
    };

    // 支援滑鼠點擊
    keyboardEl.addEventListener("mousedown", handlePianoStart);
    window.addEventListener("mouseup", (e) => {
      const activeKeys = keyboardEl.querySelectorAll("[data-active-pointer]");
      activeKeys.forEach(k => {
        this.onKeyRelease(k.dataset.note);
        k.classList.remove("active");
        delete k.dataset.activePointer;
      });
    });

    // 支援觸控
    keyboardEl.addEventListener("touchstart", (e) => {
      e.preventDefault(); // 防止滾動
      handlePianoStart(e);
    });
    keyboardEl.addEventListener("touchend", handlePianoEnd);

    // Mute 按鈕
    const muteBtn = document.getElementById("mute-btn");
    muteBtn.addEventListener("click", () => {
      const muted = audio.toggleMute();
      muteBtn.innerHTML = muted ? "🔇" : "🔊";
      muteBtn.classList.toggle("muted", muted);
    });

    // 模式與歌曲切換
    document.getElementById("song-select").addEventListener("change", (e) => {
      this.selectSong(e.target.value);
    });

    document.getElementById("mode-select").addEventListener("change", (e) => {
      this.gameMode = e.target.value;
      this.resetGame();
    });

    // 重新開始與開始按鈕
    document.getElementById("restart-btn").addEventListener("click", () => {
      this.resetGame();
      this.startGame();
    });

    document.getElementById("play-overlay-btn").addEventListener("click", () => {
      audio.init();
      document.getElementById("start-overlay").style.opacity = 0;
      setTimeout(() => {
        document.getElementById("start-overlay").style.display = "none";
        this.resetGame();
        this.startGame();
      }, 500);
    });

    // Modal 按鈕
    document.getElementById("modal-restart-btn").addEventListener("click", () => {
      document.getElementById("modal-overlay").classList.remove("show");
      this.resetGame();
      this.startGame();
    });

    // 實體麥克風配對按鈕
    const micBtn = document.getElementById("mic-toggle-btn");
    if (micBtn) {
      micBtn.addEventListener("click", async () => {
        if (!this.micEnabled) {
          try {
            micBtn.textContent = "🎙️ 連接中...";
            await audio.initMic();
            this.micEnabled = true;
            micBtn.textContent = "🎙️ 聽音中";
            micBtn.classList.add("active");
          } catch (err) {
            alert("麥克風啟動失敗，請確認是否允許麥克風權限。");
            micBtn.textContent = "🎙️ 實體配對";
            micBtn.classList.remove("active");
            this.micEnabled = false;
          }
        } else {
          audio.stopMic();
          this.micEnabled = false;
          micBtn.textContent = "🎙️ 實體配對";
          micBtn.classList.remove("active");
        }
      });
    }

    // 音量控制拉桿
    const volumeSlider = document.getElementById("volume-slider");
    if (volumeSlider) {
      volumeSlider.addEventListener("input", (e) => {
        audio.setVolume(e.target.value);
      });
      // 初始化音量為滑桿的值
      audio.setVolume(volumeSlider.value);
    }

    // 速度控制拉桿
    const speedSlider = document.getElementById("speed-slider");
    if (speedSlider) {
      speedSlider.addEventListener("input", (e) => {
        this.fallSpeed = parseFloat(e.target.value);
      });
      // 初始化速度為滑桿的值
      this.fallSpeed = parseFloat(speedSlider.value);
    }
  }

  loadSongList() {
    const select = document.getElementById("song-select");
    select.innerHTML = "";
    SONGS.forEach(song => {
      const opt = document.createElement("option");
      opt.value = song.id;
      opt.textContent = `${song.title} [${song.difficulty}]`;
      select.appendChild(opt);
    });
    
    // 預設載入第一首歌
    this.selectSong(SONGS[0].id);
  }

  selectSong(songId) {
    const song = SONGS.find(s => s.id === songId);
    if (!song) return;
    this.currentSong = song;
    
    // 更新說明文字
    document.getElementById("song-desc").textContent = song.description;
    
    this.resetGame();
  }

  resetGame() {
    this.isPlaying = false;
    this.score = 0;
    this.combo = 0;
    this.practiceTargetIndex = 0;
    this.currentTime = 0;
    this.particles = [];
    
    // 複製歌曲音符並初始化狀態
    this.songNotes = this.currentSong.notes.map(n => ({
      ...n,
      hit: false,
      missed: false
    }));

    this.updateStatusUI();
    
    // 清除琴鍵的高亮
    this.keys.forEach(k => {
      k.el.classList.remove("active");
    });
  }

  startGame() {
    this.initDimensions();
    this.isPlaying = true;
    this.gameStartTime = performance.now();
    this.lastFrameTime = performance.now();
  }

  // 當按下琴鍵
  onKeyPress(note) {
    audio.playNote(note);
    const key = this.keys.find(k => k.note === note);
    if (key) {
      key.el.classList.add("active");
    }

    if (!this.isPlaying) return;

    const now = this.currentTime;
    
    if (this.gameMode === "challenge") {
      // 挑戰模式：尋找在判定窗口內的音符
      let hitSuccess = false;
      
      // 判定容許範圍 (秒)：Perfect 0.15s, Good 0.3s
      const PERFECT_WINDOW = 0.15;
      const GOOD_WINDOW = 0.30;

      for (let i = 0; i < this.songNotes.length; i++) {
        const noteItem = this.songNotes[i];
        if (noteItem.note === note && !noteItem.hit && !noteItem.missed) {
          const diff = Math.abs(noteItem.time - now);
          
          if (diff <= PERFECT_WINDOW) {
            noteItem.hit = true;
            this.handleHit("perfect", key);
            hitSuccess = true;
            break;
          } else if (diff <= GOOD_WINDOW) {
            noteItem.hit = true;
            this.handleHit("good", key);
            hitSuccess = true;
            break;
          }
        }
      }

      // 如果彈錯音高，不算 Hit 也不扣分，只發出普通琴音
    } else {
      // 練習模式 (跟彈模式)：必須按下下一個等待的音符
      const targetNote = this.songNotes[this.practiceTargetIndex];
      if (targetNote && targetNote.note === note) {
        targetNote.hit = true;
        this.handleHit("perfect", key);
        this.practiceTargetIndex++;
        
        // 檢查是否彈完整首歌
        if (this.practiceTargetIndex >= this.songNotes.length) {
          this.endGame(true);
        }
      }
    }
  }

  // 放開琴鍵
  onKeyRelease(note) {
    audio.stopNote(note);
    const key = this.keys.find(k => k.note === note);
    if (key) {
      key.el.classList.remove("active");
    }
  }

  handleHit(rating, keyObj) {
    let scoreGain = 0;
    if (rating === "perfect") {
      scoreGain = 100 + this.combo * 5;
      this.combo++;
      this.showJudgment("PERFECT", "perfect");
      audio.playCoinSound(); // 彈得精準發出瑪利歐金幣特效音
    } else if (rating === "good") {
      scoreGain = 50 + this.combo * 2;
      this.combo++;
      this.showJudgment("GOOD", "good");
    }

    this.score += scoreGain;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.updateStatusUI();

    // 粒子爆炸效果
    if (keyObj) {
      const rect = this.canvas.getBoundingClientRect();
      const x = keyObj.xRatio * rect.width;
      const y = this.hitLineY;
      const color = keyObj.isBlack ? "#ff007f" : "#00f0ff";
      this.spawnParticles(x, y, color, rating === "perfect");
    }
  }

  handleMiss() {
    this.combo = 0;
    this.showJudgment("MISS", "miss");
    audio.playBumpSound(); // 漏掉音符發出瑪利歐撞牆特效音
    this.updateStatusUI();
  }

  showJudgment(text, ratingClass) {
    this.judgmentEl.className = ``; // 清除舊樣式
    void this.judgmentEl.offsetWidth; // 強制重繪以重設 CSS 動畫
    this.judgmentEl.textContent = text;
    this.judgmentEl.classList.add(ratingClass, "show");
    
    // 0.5 秒後淡出
    if (this.judgmentTimeout) clearTimeout(this.judgmentTimeout);
    this.judgmentTimeout = setTimeout(() => {
      this.judgmentEl.classList.remove("show");
    }, 500);
  }

  updateStatusUI() {
    document.getElementById("score-val").textContent = this.score;
    document.getElementById("combo-val").textContent = this.combo;
  }

  // --- 粒子系統 ---

  spawnParticles(x, y, color, isPerfect) {
    const count = isPerfect ? 18 : 8;
    for (let i = 0; i < count; i++) {
      // 隨機角度與初速
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.6; // 向上噴射
      const speed = 2 + Math.random() * 5;
      
      // 金幣形狀或圓點
      const shapeType = isPerfect && Math.random() > 0.4 ? "coin" : "star";
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: shapeType === "coin" ? "#ffd700" : color,
        alpha: 1,
        life: 0.9 + Math.random() * 0.3, // 生存時間 (秒)
        shape: shapeType,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.2
      });
    }
  }

  updateAndDrawParticles(dt) {
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // 重力
      p.alpha -= dt / p.life;
      p.rot += p.rotSpd;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.strokeStyle = p.color;
      this.ctx.shadowBlur = p.shape === "coin" ? 10 : 5;
      this.ctx.shadowColor = p.color;
      
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);

      if (p.shape === "coin") {
        // 繪製瑪利歐像素金幣
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffd700";
        this.ctx.fill();
        // 繪製中間的線
        this.ctx.fillStyle = "#b8860b";
        this.ctx.fillRect(-p.size * 0.2, -p.size * 0.6, p.size * 0.4, p.size * 1.2);
      } else if (p.shape === "star") {
        // 繪製閃亮小星星
        this.ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          this.ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size,
                          Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
          this.ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size * 0.4),
                          Math.sin((54 + j * 72) * Math.PI / 180) * (p.size * 0.4));
        }
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // 普通發光圓球
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  // --- 主繪圖與更新循環 (60fps) ---

  animate(nowTime) {
    requestAnimationFrame((t) => this.animate(t));
    
    // 計算 delta time (秒)
    const dt = (nowTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = nowTime;
    
    // 限制最大 dt 防背景標籤凍結造成的時間跳躍
    const dtClamped = Math.min(dt, 0.1);

    // 清除畫布
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    this.ctx.clearRect(0, 0, width, height);

    // 繪製網格輔助線
    this.drawKeyTracks(width, height);

    if (this.isPlaying) {
      this.updateGameTime(dtClamped);
      this.drawFallingNotes(width);
      this.checkMissedNotes();

      // 實體麥克風聽音配對判定
      if (this.micEnabled) {
        const pitch = audio.detectPitch();
        if (pitch && pitch.note) {
          const now = performance.now();
          if (pitch.note !== this.lastDetectedNote || (now - this.lastDetectedTime) > 350) {
            this.onKeyPress(pitch.note);
            
            // 模擬 200ms 後釋放琴鍵，顯示發光霓虹動畫
            const noteToRelease = pitch.note;
            setTimeout(() => {
              this.onKeyRelease(noteToRelease);
            }, 200);

            this.lastDetectedNote = pitch.note;
            this.lastDetectedTime = now;
            this.silenceStartTime = null;
          }
        } else {
          // 若連續 120ms 無聲，重置辨識音符
          if (this.lastDetectedNote) {
            if (!this.silenceStartTime) {
              this.silenceStartTime = performance.now();
            } else if (performance.now() - this.silenceStartTime > 120) {
              this.lastDetectedNote = null;
              this.silenceStartTime = null;
            }
          }
        }
      }
    } else {
      // 未開始時也繪製一下前幾個音符
      this.drawFallingNotes(width);
    }

    // 更新並繪製粒子
    this.updateAndDrawParticles(dtClamped);
    
    // 繪製判定線與發光效果
    this.drawHitLine(width);

    // 繪製實體麥克風音訊視覺化波形
    if (this.micEnabled) {
      this.drawMicVisualizer(width, height);
    }
  }

  // 實體麥克風示波器繪製
  drawMicVisualizer(width, height) {
    if (!audio.analyser) return;
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    audio.analyser.getByteFrequencyData(dataArray);

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 0, 127, 0.5)";
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = "#ff007f";
    this.ctx.beginPath();

    const sliceWidth = 100 / bufferLength; // 寬度 100px
    let x = width - 120; // 靠右側
    let y = 30;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255.0; // 0.0 - 1.0
      // 微小的正弦波裝飾動畫
      const py = y - (v * 20);

      if (i === 0) {
        this.ctx.moveTo(x, py);
      } else {
        this.ctx.lineTo(x, py);
      }

      x += sliceWidth;
    }
    this.ctx.stroke();

    // 繪製麥克風工作呼吸紅燈
    this.ctx.fillStyle = "#ff007f";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = "#ff007f";
    this.ctx.beginPath();
    const rad = 4 + Math.sin(performance.now() * 0.01) * 1.5;
    this.ctx.arc(width - 135, y - 5, rad, 0, Math.PI * 2);
    this.ctx.fill();

    // 聽音文字提示
    this.ctx.fillStyle = "#8b9bb4";
    this.ctx.font = "10px sans-serif";
    this.ctx.shadowBlur = 0;
    this.ctx.fillText("MIC LINK ACTIVE", width - 235, y);
    
    this.ctx.restore();
  }

  updateGameTime(dt) {
    if (this.gameMode === "challenge") {
      this.currentTime += dt;
      
      // 檢查挑戰模式是否結束 (最後一個音符落出畫布外)
      const lastNote = this.songNotes[this.songNotes.length - 1];
      if (lastNote && this.currentTime > lastNote.time + 1.5) {
        this.endGame(true);
      }
    } else {
      // 練習模式：時間前進但不能越過下一個未彈對的音符
      const targetNote = this.songNotes[this.practiceTargetIndex];
      
      if (targetNote) {
        // 讓音符在落在判定線前 0.1 秒處完全停住
        const targetStopSec = targetNote.time;
        if (this.currentTime < targetStopSec) {
          this.currentTime += dt * 1.5; // 移動快一點以節省等待時間
          if (this.currentTime > targetStopSec) {
            this.currentTime = targetStopSec;
          }
        }
        
        // 呼吸燈效果高亮提示琴鍵
        const key = this.keys.find(k => k.note === targetNote.note);
        if (key) {
          const pulse = Math.sin(performance.now() / 150) * 0.4 + 0.6;
          key.el.style.boxShadow = `0 0 25px rgba(${key.isBlack ? '255,0,127' : '0,240,255'}, ${pulse})`;
        }
      } else {
        // 沒有下一個音符，結束
        this.endGame(true);
      }
      
      // 清除其他沒有被高亮的琴鍵樣式
      this.keys.forEach((k, idx) => {
        const target = this.songNotes[this.practiceTargetIndex];
        if (!target || k.note !== target.note) {
          k.el.style.boxShadow = "";
        }
      });
    }
  }

  drawKeyTracks(width, height) {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    this.ctx.lineWidth = 1;
    
    // 繪製各個音階通道的分隔線
    const whiteKeysCount = PIANO_KEYS.filter(k => !k.isBlack).length;
    const w = width / whiteKeysCount;
    for (let i = 1; i < whiteKeysCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * w, 0);
      this.ctx.lineTo(i * w, height);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawHitLine(width) {
    this.ctx.save();
    
    // 判定線發光背景
    const grad = this.ctx.createLinearGradient(0, this.hitLineY - 10, 0, this.hitLineY + 10);
    grad.addColorStop(0, "rgba(0, 240, 255, 0)");
    grad.addColorStop(0.5, "rgba(0, 240, 255, 0.25)");
    grad.addColorStop(1, "rgba(0, 240, 255, 0)");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, this.hitLineY - 10, width, 20);

    // 判定線主實線
    this.ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = "#00f0ff";
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.hitLineY);
    this.ctx.lineTo(width, this.hitLineY);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawFallingNotes(width) {
    const whiteKeysCount = PIANO_KEYS.filter(k => !k.isBlack).length;
    const wWidth = width / whiteKeysCount; // 白鍵寬度

    this.songNotes.forEach(noteItem => {
      // 忽略已經彈對的音符
      if (noteItem.hit) return;

      const keyObj = this.keys.find(k => k.note === noteItem.note);
      if (!keyObj) return;

      // X 軸座標
      const centerX = keyObj.xRatio * width;
      const noteWidth = keyObj.isBlack ? wWidth * 0.55 : wWidth * 0.8;
      const x = centerX - noteWidth / 2;

      // Y 軸座標計算：y = 判定線 - (開始時間 - 當前時間) * 速度
      const timeDiff = noteItem.time - this.currentTime;
      const y = this.hitLineY - timeDiff * this.fallSpeed;
      const height = noteItem.duration * this.fallSpeed;

      // 只有在畫布範圍內的才繪製
      if (y + height < 0 || y > this.canvas.height / window.devicePixelRatio + 100) {
        return;
      }

      this.ctx.save();
      
      // 玻璃擬態與霓虹漸層
      const color = keyObj.isBlack ? "#ff007f" : "#00f0ff";
      const grad = this.ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, color);
      grad.addColorStop(1, keyObj.isBlack ? "#8a0045" : "#005bb8");
      
      this.ctx.fillStyle = grad;
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = color;
      
      // 繪製圓角音符矩形
      this.drawRoundRect(x, y - height, noteWidth, height, 8);
      this.ctx.fill();

      // 在音符內部點綴一個小發光點 (像瑪利歐金幣一樣)
      if (height > 25) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.beginPath();
        this.ctx.arc(x + noteWidth / 2, y - height / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  // 繪製圓角矩形輔助函式
  drawRoundRect(x, y, width, height, radius) {
    if (height < radius * 2) radius = height / 2;
    if (width < radius * 2) radius = width / 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  checkMissedNotes() {
    if (this.gameMode !== "challenge") return;

    const MISS_THRESHOLD = 0.35; // 音符越過判定線超過 0.35 秒視為 Miss
    
    this.songNotes.forEach(noteItem => {
      if (!noteItem.hit && !noteItem.missed) {
        const diff = this.currentTime - noteItem.time;
        if (diff > MISS_THRESHOLD) {
          noteItem.missed = true;
          this.handleMiss();
        }
      }
    });
  }

  endGame(isCompleted) {
    this.isPlaying = false;
    
    if (isCompleted) {
      audio.playStageClearSound();
      
      // 更新彈出視窗資料
      document.getElementById("modal-title").textContent = "🎵 挑戰成功 🎵";
      document.getElementById("modal-score").textContent = this.score;
      document.getElementById("stat-maxcombo").textContent = this.maxCombo;
      
      const accuracy = this.calculateAccuracy();
      document.getElementById("stat-accuracy").textContent = `${accuracy}%`;
      
      setTimeout(() => {
        document.getElementById("modal-overlay").classList.add("show");
      }, 1000);
    }
  }

  calculateAccuracy() {
    const totalNotes = this.songNotes.length;
    const hitNotes = this.songNotes.filter(n => n.hit).length;
    if (totalNotes === 0) return 100;
    return Math.round((hitNotes / totalNotes) * 100);
  }
}

// 實例化並載入遊戲
const game = new PianoGame();
window.addEventListener("DOMContentLoaded", () => {
  game.init();
});
