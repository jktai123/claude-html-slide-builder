// ==========================================
// 1. 成語關卡資料庫
// ==========================================
const levels = [
  {
    idiom: "井底之蛙",
    chars: ["井", "底", "之", "蛙"],
    bpmfs: ["ㄐㄧㄥˇ", "ㄉㄧˇ", "ㄓ", "ㄨㄚ"],
    explanation: "比喻眼光很小，知道的事情很少的人。",
    sentence: "我們不要當井底之蛙，要多看書、多旅行，了解更多外面的世界！",
    image: "assets/idiom_frog.webp",
    // 4個干擾字及其注音
    distractors: [
      { char: "水", bpmf: "ㄕㄨㄟˇ" },
      { char: "天", bpmf: "ㄊㄧㄢ" },
      { char: "魚", bpmf: "ㄩˊ" },
      { char: "鳥", bpmf: "ㄋㄧㄠˇ" }
    ]
  },
  {
    idiom: "畫蛇添足",
    chars: ["畫", "蛇", "添", "足"],
    bpmfs: ["ㄏㄨㄚˋ", "ㄕㄜˊ", "ㄊㄧㄢ", "ㄗㄨˊ"],
    explanation: "比喻做了多餘的事，不但沒有幫忙，反而把事情弄糟了。",
    sentence: "這張畫已經很漂亮了，你再塗上其他顏色就是畫蛇添足了。",
    image: "assets/idiom_snake.webp",
    distractors: [
      { char: "龍", bpmf: "ㄌㄨㄥˊ" },
      { char: "腳", bpmf: "ㄐㄧㄠˇ" },
      { char: "手", bpmf: "ㄕㄡˇ" },
      { char: "多", bpmf: "ㄉㄨㄛ" }
    ]
  },
  {
    idiom: "守株待兔",
    chars: ["守", "株", "待", "兔"],
    bpmfs: ["ㄕㄡˇ", "ㄓㄨ", "ㄉㄞˋ", "ㄊㄨˋ"],
    explanation: "比喻不肯主動努力，只希望得到意外的收穫。",
    sentence: "如果不努力讀書，只靠運氣拿高分，就像守株待兔一樣是不可能的。",
    image: "assets/idiom_rabbit.webp",
    distractors: [
      { char: "樹", bpmf: "ㄕㄨˋ" },
      { char: "等", bpmf: "ㄉㄥˇ" },
      { char: "農", bpmf: "ㄋㄨㄥˊ" },
      { char: "跑", bpmf: "ㄆㄠˇ" }
    ]
  },
  {
    idiom: "盲人摸象",
    chars: ["盲", "人", "摸", "象"],
    bpmfs: ["ㄇㄤˊ", "ㄖㄣˊ", "ㄇㄛ", "ㄒㄧㄤˋ"],
    explanation: "比喻只看到事情的一部分，就以為自己知道全部的樣子。",
    sentence: "我們如果不了解整件事情就亂下結論，就跟盲人摸象一樣容易出錯。",
    image: "assets/idiom_elephant.webp",
    distractors: [
      { char: "看", bpmf: "ㄎㄢˋ" },
      { char: "大", bpmf: "ㄉㄚˋ" },
      { char: "耳", bpmf: "ㄦˇ" },
      { char: "鼻", bpmf: "ㄅㄧˊ" }
    ]
  },
  {
    idiom: "亡羊補牢",
    chars: ["亡", "羊", "補", "牢"],
    bpmfs: ["ㄨㄤˊ", "ㄧㄤˊ", "ㄅㄨˇ", "ㄌㄠˊ"],
    explanation: "比喻在犯錯或受到損失後，趕緊想辦法補救，還不算太晚。",
    sentence: "這次考試考不好沒關係，亡羊補牢趕快複習，下次一定能考好！",
    image: "assets/idiom_sheep.webp",
    distractors: [
      { char: "狼", bpmf: "ㄌㄤˊ" },
      { char: "圈", bpmf: "ㄐㄩㄢˋ" },
      { char: "修", bpmf: "ㄒㄧㄡ" },
      { char: "草", bpmf: "ㄘㄠˇ" }
    ]
  }
];

// ==========================================
// 2. 遊戲狀態變數
// ==========================================
let currentLevelIndex = 0;
let score = 0;
let levelLetters = []; // 當前關卡混合後的8個字卡資訊
let slotsData = [null, null, null, null]; // 4個答案空格的填入狀態

// ==========================================
// 3. DOM 元素選取
// ==========================================
const startScreen = document.getElementById("start-screen");
const playScreen = document.getElementById("play-screen");
const endScreen = document.getElementById("end-screen");

const btnStart = document.getElementById("btn-start");
const btnHome = document.getElementById("btn-home");
const btnReset = document.getElementById("btn-reset");
const btnRestart = document.getElementById("btn-restart");

const levelNumDisp = document.getElementById("current-level-num");
const scoreDisp = document.getElementById("score");
const idiomImg = document.getElementById("idiom-image");
const answerSlotsContainer = document.getElementById("answer-slots");
const letterPoolContainer = document.getElementById("letter-pool");

// 彈窗元素
const modalSuccess = document.getElementById("modal-success");
const modalIdiomDisplay = document.getElementById("modal-idiom-display");
const modalExplanation = document.getElementById("modal-explanation");
const modalSentence = document.getElementById("modal-sentence");
const btnVoice = document.getElementById("btn-voice");
const btnNext = document.getElementById("btn-next");

// 紙花 Canvas
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");

// ==========================================
// 4. 音效合成器 (Web Audio API)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  // 確保 AudioContext 已啟動（瀏覽器安全性限制）
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (type === 'correct') {
    // 答對音效：輕快叮咚聲 (雙音)
    const now = audioCtx.currentTime;
    osc.type = 'sine';
    // 第一音
    osc.frequency.setValueAtTime(523.25, now); // C5
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
    
    // 第二音
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 100);
    
  } else if (type === 'wrong') {
    // 答錯音效：低沉的滑音 (類似「喔喔」)
    const now = audioCtx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.3); // 滑音到 A2
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
    
  } else if (type === 'click') {
    // 點擊音效：輕微木魚聲
    const now = audioCtx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

// ==========================================
// 5. 語音朗讀 (Web Speech API)
// ==========================================
let currentUtterance = null;

function speakIdiom(idiomText, explanationText, sentenceText) {
  if ('speechSynthesis' in window) {
    // 如果正在朗讀，則停止
    window.speechSynthesis.cancel();
    
    // 組合朗讀內容：慢速唸出成語，再唸意思與造句
    const fullText = `${idiomText}。意思是：${explanationText}。例如：${sentenceText}`;
    currentUtterance = new SpeechSynthesisUtterance(fullText);
    currentUtterance.lang = 'zh-TW';
    currentUtterance.rate = 0.85; // 速度慢一點，適合小朋友聽
    currentUtterance.pitch = 1.1; // 音調高一點，比較親切親和
    
    window.speechSynthesis.speak(currentUtterance);
  } else {
    alert("您的瀏覽器不支援語音朗讀功能喔！");
  }
}

// ==========================================
// 6. 遊戲初始化與關卡載入
// ==========================================
function startAdventure() {
  currentLevelIndex = 0;
  score = 0;
  scoreDisp.textContent = score;
  showScreen(playScreen);
  loadLevel(currentLevelIndex);
}

function loadLevel(index) {
  if (index >= levels.length) {
    showEndScreen();
    return;
  }
  
  const level = levels[index];
  levelNumDisp.textContent = index + 1;
  idiomImg.src = level.image;
  
  // 重置答案空格狀態
  slotsData = [null, null, null, null];
  renderAnswerSlots();
  
  // 準備 8 個字卡 (4 正確 + 4 干擾)
  const correctLetters = level.chars.map((char, i) => ({
    char: char,
    bpmf: level.bpmfs[i],
    isCorrect: true,
    index: i // 用來判斷在答案中的位置
  }));
  
  const distractorLetters = level.distractors.map(item => ({
    char: item.char,
    bpmf: item.bpmf,
    isCorrect: false
  }));
  
  // 合併並打亂
  levelLetters = [...correctLetters, ...distractorLetters];
  shuffleArray(levelLetters);
  
  // 為每個字卡指定一個唯一的臨時 ID
  levelLetters.forEach((item, idx) => {
    item.id = `card-${idx}`;
    item.used = false;
  });
  
  renderLetterPool();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================
// 7. 渲染 UI
// ==========================================

// 渲染答案空格
function renderAnswerSlots() {
  answerSlotsContainer.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.slotIndex = i;
    
    if (slotsData[i]) {
      slot.classList.add("filled");
      
      // 建立字卡放入空格內
      const card = document.createElement("div");
      card.className = "char-card in-slot";
      
      const bpmfDiv = document.createElement("div");
      bpmfDiv.className = "bpmf";
      bpmfDiv.textContent = slotsData[i].bpmf;
      
      const charDiv = document.createElement("div");
      charDiv.className = "char";
      charDiv.textContent = slotsData[i].char;
      
      card.appendChild(bpmfDiv);
      card.appendChild(charDiv);
      slot.appendChild(card);
      
      // 點擊填入的字卡，退回備選區
      slot.addEventListener("click", () => {
        playSound('click');
        removeLetterFromSlot(i);
      });
    }
    answerSlotsContainer.appendChild(slot);
  }
}

// 渲染備選字卡
function renderLetterPool() {
  letterPoolContainer.innerHTML = "";
  levelLetters.forEach(item => {
    const card = document.createElement("div");
    card.className = "char-card";
    card.id = item.id;
    
    if (item.used) {
      card.classList.add("used");
    }
    
    const bpmfDiv = document.createElement("div");
    bpmfDiv.className = "bpmf";
    bpmfDiv.textContent = item.bpmf;
    
    const charDiv = document.createElement("div");
    charDiv.className = "char";
    charDiv.textContent = item.char;
    
    card.appendChild(bpmfDiv);
    card.appendChild(charDiv);
    
    // 點擊字卡，填入答案格
    card.addEventListener("click", () => {
      if (!item.used) {
        playSound('click');
        addLetterToSlot(item);
      }
    });
    
    letterPoolContainer.appendChild(card);
  });
}

// ==========================================
// 8. 互動邏輯處理
// ==========================================

// 將字卡填入空格
function addLetterToSlot(letterItem) {
  // 尋找第一個空的空格
  const firstEmptyIndex = slotsData.indexOf(null);
  if (firstEmptyIndex !== -1) {
    // 填入空格
    slotsData[firstEmptyIndex] = letterItem;
    
    // 將備選區字卡設為已使用
    const letterInPool = levelLetters.find(item => item.id === letterItem.id);
    if (letterInPool) letterInPool.used = true;
    
    renderAnswerSlots();
    renderLetterPool();
    
    // 檢查是否所有格子都填滿了
    if (slotsData.indexOf(null) === -1) {
      // 延遲一點點時間進行檢查，讓畫面渲染完成
      setTimeout(checkAnswer, 250);
    }
  }
}

// 將字卡從空格移除，還原回備選區
function removeLetterFromSlot(slotIndex) {
  const letterItem = slotsData[slotIndex];
  if (letterItem) {
    // 釋放空格
    slotsData[slotIndex] = null;
    
    // 將備選區字卡設為未使用
    const letterInPool = levelLetters.find(item => item.id === letterItem.id);
    if (letterInPool) letterInPool.used = false;
    
    renderAnswerSlots();
    renderLetterPool();
  }
}

// 重置所有空格
function resetSlots() {
  playSound('click');
  slotsData = [null, null, null, null];
  levelLetters.forEach(item => {
    item.used = false;
  });
  renderAnswerSlots();
  renderLetterPool();
}

// 檢查答案是否正確
function checkAnswer() {
  const currentLevel = levels[currentLevelIndex];
  const userIdiom = slotsData.map(item => item ? item.char : "").join("");
  
  if (userIdiom === currentLevel.idiom) {
    // 答對了！
    playSound('correct');
    score++;
    scoreDisp.textContent = score;
    showSuccessModal();
    startConfetti();
  } else {
    // 答錯了！
    playSound('wrong');
    // 空格抖動效果
    const slots = document.querySelectorAll(".slot");
    slots.forEach(slot => {
      slot.classList.add("shake");
      // 動畫結束後移除 shake 類別
      slot.addEventListener("animationend", () => {
        slot.classList.remove("shake");
      });
    });
    // 彈回不正確的字卡，提供溫和的反饋。
    // 為了降低挫折感，直接全部清空讓小朋友重排
    setTimeout(() => {
      resetSlots();
    }, 600);
  }
}

// ==========================================
// 9. 彈窗與過關卡片
// ==========================================

function showSuccessModal() {
  const level = levels[currentLevelIndex];
  
  // 渲染帶注音的大字展示
  modalIdiomDisplay.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const charBox = document.createElement("div");
    charBox.className = "display-char-box";
    
    const bpmfDiv = document.createElement("div");
    bpmfDiv.className = "display-bpmf";
    bpmfDiv.textContent = level.bpmfs[i];
    
    const charDiv = document.createElement("div");
    charDiv.className = "display-char";
    charDiv.textContent = level.chars[i];
    
    charBox.appendChild(bpmfDiv);
    charBox.appendChild(charDiv);
    modalIdiomDisplay.appendChild(charBox);
  }
  
  modalExplanation.textContent = level.explanation;
  modalSentence.textContent = level.sentence;
  
  modalSuccess.classList.add("active");
  
  // 自動朗讀
  speakIdiom(level.idiom, level.explanation, level.sentence);
}

function nextLevel() {
  playSound('click');
  // 停止朗讀
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  modalSuccess.classList.remove("active");
  stopConfetti();
  
  currentLevelIndex++;
  loadLevel(currentLevelIndex);
}

function showEndScreen() {
  showScreen(endScreen);
  startConfetti(); // 通關狂歡灑花
}

function showScreen(screenToShow) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  screenToShow.classList.add("active");
}

// ==========================================
// 10. 紙花特效 (Confetti) 實作
// ==========================================
let confettiActive = false;
let confettiPieces = [];
const confettiColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

class ConfettiPiece {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * -canvas.height;
    this.size = Math.random() * 8 + 6;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.speed = Math.random() * 3 + 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 4 - 2;
  }
  
  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
    if (this.y > canvas.height) {
      this.y = -20;
      this.x = Math.random() * canvas.width;
    }
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

function resizeCanvas() {
  const container = document.getElementById("game-container");
  if (container) {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
}

// 當視窗縮放時調整 canvas 尺寸
window.addEventListener("resize", () => {
  const container = document.getElementById("game-container");
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
});

function startConfetti() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  confettiPieces = [];
  for (let i = 0; i < 80; i++) {
    confettiPieces.push(new ConfettiPiece());
  }
  
  confettiActive = true;
  animateConfetti();
}

function stopConfetti() {
  confettiActive = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animateConfetti() {
  if (!confettiActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiPieces.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateConfetti);
}

// ==========================================
// 11. 事件監聽設定
// ==========================================
btnStart.addEventListener("click", () => {
  playSound('click');
  startAdventure();
});

btnHome.addEventListener("click", () => {
  playSound('click');
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopConfetti();
  modalSuccess.classList.remove("active");
  showScreen(startScreen);
});

btnReset.addEventListener("click", resetSlots);

btnNext.addEventListener("click", nextLevel);

btnVoice.addEventListener("click", () => {
  playSound('click');
  const level = levels[currentLevelIndex];
  speakIdiom(level.idiom, level.explanation, level.sentence);
});

btnRestart.addEventListener("click", () => {
  playSound('click');
  stopConfetti();
  startAdventure();
});
