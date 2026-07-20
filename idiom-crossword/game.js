/* ==========================================================================
   成語十字接龍 - game.js (核心遊玩與音效合成系統)
   ========================================================================== */

// 遊戲狀態變數
let currentLevel = 1;
let coins = 100;
let unlockedLevel = 1;
let soundEnabled = true;

let levelData = null; // 當前關卡資料
let playerAnswers = {}; // 記錄玩家填寫的字，鍵為 "r,c"，值為候選字 index 或字符
let selectedCell = null; // 當前選中的空格坐標: { r, c }

// Web Audio API 音效合成器
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
}

// 播放正弦波簡易音效
function playSound(freqs, duration, type = 'sine', delayBetween = 0) {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    freqs.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + (index * delayBetween));

        gainNode.gain.setValueAtTime(0.15, now + (index * delayBetween));
        // 線性衰減
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + (index * delayBetween) + duration);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now + (index * delayBetween));
        osc.stop(now + (index * delayBetween) + duration);
    });
}

// 各種場景音效
const SoundEffects = {
    click: () => playSound([600], 0.08, 'triangle'),
    fill: () => playSound([800], 0.1, 'sine'),
    erase: () => playSound([500], 0.1, 'sine'),
    error: () => playSound([220, 200], 0.25, 'sawtooth', 0.05),
    wordCorrect: () => playSound([523.25, 659.25, 783.99], 0.3, 'sine', 0.06), // 和弦
    win: () => {
        const notes = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5];
        playSound(notes, 0.4, 'sine', 0.08);
    },
    coin: () => playSound([987.77, 1318.51], 0.2, 'sine', 0.05)
};

// 初始化 localStorage 進度
function loadProgress() {
    const savedLevel = localStorage.getItem('idiom_current_level');
    const savedCoins = localStorage.getItem('idiom_coins');
    const savedUnlocked = localStorage.getItem('idiom_unlocked_level');
    const savedSound = localStorage.getItem('idiom_sound_enabled');

    if (savedLevel) currentLevel = parseInt(savedLevel);
    if (savedCoins) coins = parseInt(savedCoins);
    if (savedUnlocked) unlockedLevel = parseInt(savedUnlocked);
    if (savedSound) soundEnabled = (savedSound === 'true');

    document.getElementById('coin-count').innerText = coins;
    document.getElementById('toggle-sound').checked = soundEnabled;
}

function saveProgress() {
    localStorage.setItem('idiom_current_level', currentLevel);
    localStorage.setItem('idiom_coins', coins);
    localStorage.setItem('idiom_unlocked_level', unlockedLevel);
    localStorage.setItem('idiom_sound_enabled', soundEnabled);
    document.getElementById('coin-count').innerText = coins;
}

// 頁面加載完成後初始化
window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    setupEventListeners();
    loadLevel(currentLevel);
});

// ==========================================================================
// 關卡加載與渲染
// ==========================================================================
function loadLevel(levelNum) {
    if (levelNum < 1 || levelNum > 1000) return;
    currentLevel = levelNum;
    
    // 獲取當前關卡數據（由 levels.js 提供）
    levelData = idiomLevels[levelNum - 1];
    playerAnswers = {};
    selectedCell = null;

    // 更新頂部關卡標題
    document.getElementById('current-level-text').innerText = `第 ${levelNum} 關`;
    
    // 渲染網格棋盤
    renderBoard();

    // 渲染候選字
    renderCandidates();

    // 預設選中第一個空格
    selectFirstEmptyCell();

    saveProgress();
}

// 渲染 9x9 棋盤
function renderBoard() {
    const board = document.getElementById('grid-board');
    board.innerHTML = '';

    const gridSize = levelData.gridSize || 9;
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    // 建立二維網格對應的字元與屬性
    const cellMap = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

    // 1. 將所有成語的字填入地圖
    levelData.words.forEach(w => {
        for (let i = 0; i < 4; i++) {
            const r = (w.direction === 'h') ? w.y : w.y + i;
            const c = (w.direction === 'h') ? w.x + i : w.x;
            cellMap[r][c] = {
                char: w.word[i],
                wordIndex: levelData.words.indexOf(w),
                isIntersect: cellMap[r][c] !== null // 是否為交叉點
            };
        }
    });

    // 2. 動態生成網格 DOM
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.r = r;
            cell.dataset.c = c;

            const info = cellMap[r][c];

            if (!info) {
                // 空白格
                cell.classList.add('empty');
            } else {
                cell.classList.add('char');

                // 檢查此格子是否被挖空
                const isBlank = levelData.blanks.some(b => b.x === c && b.y === r);

                if (isBlank) {
                    cell.classList.add('blank');
                    const key = `${r},${c}`;
                    const filledChar = playerAnswers[key];

                    if (filledChar) {
                        cell.innerText = filledChar;
                        cell.classList.add('filled');
                    } else {
                        cell.innerText = '';
                    }

                    // 點擊事件：選中空格或撤回
                    cell.addEventListener('click', () => {
                        initAudio();
                        SoundEffects.click();
                        
                        if (cell.classList.contains('filled')) {
                            // 如果已經填了字，撤回該字
                            recallChar(r, c);
                        } else {
                            // 選中該格子
                            selectCell(r, c);
                        }
                    });
                } else {
                    // 非挖空字，直接顯示
                    cell.innerText = info.char;
                }
            }

            board.appendChild(cell);
        }
    }

    // 更新成語是否正確的視覺狀態 (綠色)
    checkWordStatuses(false);
}

// 選中特定坐標的格子
function selectCell(r, c) {
    // 移除之前的選中樣式
    const prevSelected = document.querySelector('.grid-cell.selected');
    if (prevSelected) {
        prevSelected.classList.remove('selected');
    }

    selectedCell = { r, c };
    const cell = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
        cell.classList.add('selected');
    }
}

// 選中第一個未填寫的空格
function selectFirstEmptyCell() {
    for (const blank of levelData.blanks) {
        const key = `${blank.y},${blank.x}`;
        if (!playerAnswers[key]) {
            selectCell(blank.y, blank.x);
            return;
        }
    }
    // 如果全部都填了，就選中第一個挖空處
    if (levelData.blanks.length > 0) {
        selectCell(levelData.blanks[0].y, levelData.blanks[0].x);
    }
}

// ==========================================================================
// 候選字渲染與處理
// ==========================================================================
function renderCandidates() {
    const row1 = document.getElementById('candidate-row-1');
    const row2 = document.getElementById('candidate-row-2');
    row1.innerHTML = '';
    row2.innerHTML = '';

    levelData.candidates.forEach((char, index) => {
        const tile = document.createElement('div');
        tile.classList.add('candidate-tile');
        tile.innerText = char;
        tile.dataset.index = index;

        // 檢查此候選字是否已經在棋盤上被使用
        const isUsed = Object.values(playerAnswers).includes(char);
        // 等等，多個相同的字可能會有重疊。我們更精確地追蹤使用情況：
        // 為了簡單，如果這個字已經在玩家填寫的答案中，且其被使用次數等於目前網格中出現該字的次數，則置灰。
        const countInAnswers = Object.values(playerAnswers).filter(val => val === char).length;
        const totalIndexWithThisChar = levelData.candidates.filter(c => c === char).length;
        
        // 我們用一個 array 紀錄被使用的候選字 index
        const usedIndices = Object.keys(playerAnswers).map(key => playerAnswers[key].candidateIndex);
        if (usedIndices.includes(index)) {
            tile.classList.add('used');
        }

        tile.addEventListener('click', () => {
            initAudio();
            SoundEffects.fill();
            fillCandidate(char, index);
        });

        if (index < 6) {
            row1.appendChild(tile);
        } else {
            row2.appendChild(tile);
        }
    });
}

// 玩家點擊候選字填入
function fillCandidate(char, candidateIndex) {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const key = `${r},${c}`;

    // 如果該格原本已經填了字，先將原字撤回
    if (playerAnswers[key]) {
        recallChar(r, c);
    }

    // 填入新字，記錄候選字 index 供撤回使用
    playerAnswers[key] = { char, candidateIndex };

    // 重新渲染棋盤與候選字（不破壞動畫）
    const cell = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
        cell.innerText = char;
        cell.classList.add('filled');
    }

    const tile = document.querySelector(`.candidate-tile[data-index="${candidateIndex}"]`);
    if (tile) {
        tile.classList.add('used');
    }

    // 檢查成語是否正確並播放特效
    checkWordStatuses(true);

    // 自動跳到下一個未填寫的空格
    selectNextEmptyCell();
}

// 撤回已填的字
function recallChar(r, c) {
    const key = `${r},${c}`;
    const answer = playerAnswers[key];
    if (!answer) return;

    SoundEffects.erase();

    delete playerAnswers[key];

    // 更新棋盤 DOM
    const cell = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
        cell.innerText = '';
        cell.classList.remove('filled');
        cell.classList.remove('error');
    }

    // 恢復候選字牌可用狀態
    const tile = document.querySelector(`.candidate-tile[data-index="${answer.candidateIndex}"]`);
    if (tile) {
        tile.classList.remove('used');
    }

    // 撤回後，重新檢查所有成語的正確性（因為有些本來正確的可能被撤回而變不正確）
    checkWordStatuses(false);

    // 將該格子設為選中
    selectCell(r, c);
}

// 點擊字元後自動尋找下一個空格
function selectNextEmptyCell() {
    const blanks = levelData.blanks;
    // 從當前選中的格子開始往後找
    const currentIndex = blanks.findIndex(b => b.x === selectedCell.c && b.y === selectedCell.r);
    
    for (let i = 1; i <= blanks.length; i++) {
        const nextIdx = (currentIndex + i) % blanks.length;
        const blank = blanks[nextIdx];
        const key = `${blank.y},${blank.x}`;
        if (!playerAnswers[key]) {
            selectCell(blank.y, blank.x);
            return;
        }
    }
}

// ==========================================================================
// 判定與成語驗證
// ==========================================================================

// 檢查各成語的狀態，是否完全正確
function checkWordStatuses(playCorrectSound = true) {
    let allWin = true;
    let anyNewCorrect = false;

    // 建立一個對應坐標到正確成語的映射
    const coordToWord = {};
    const correctCoords = new Set();

    // 1. 遍歷當前關卡的所有成語，判斷哪些是正確的
    levelData.words.forEach((w) => {
        let wordCorrect = true;
        const coords = [];
        
        for (let i = 0; i < 4; i++) {
            const r = (w.direction === 'h') ? w.y : w.y + i;
            const c = (w.direction === 'h') ? w.x + i : w.x;
            const key = `${r},${c}`;
            coords.push({ r, c, char: w.word[i] });

            const isBlank = levelData.blanks.some(b => b.x === c && b.y === r);
            let currentChar = '';

            if (isBlank) {
                currentChar = playerAnswers[key] ? playerAnswers[key].char : '';
            } else {
                currentChar = w.word[i];
            }

            if (currentChar !== w.word[i]) {
                wordCorrect = false;
            }
        }

        if (wordCorrect) {
            coords.forEach(cell => {
                const key = `${cell.r},${cell.c}`;
                correctCoords.add(key);
                // 優先保留先找到的正確成語釋義
                if (!coordToWord[key]) {
                    coordToWord[key] = w;
                }
            });
        } else {
            allWin = false;
        }
    });

    // 2. 遍歷所有成語格子更新其 DOM 狀態
    const processedCells = new Set();
    levelData.words.forEach((w) => {
        for (let i = 0; i < 4; i++) {
            const r = (w.direction === 'h') ? w.y : w.y + i;
            const c = (w.direction === 'h') ? w.x + i : w.x;
            const key = `${r},${c}`;

            if (processedCells.has(key)) continue;
            processedCells.add(key);

            const cellDom = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
            if (!cellDom) continue;

            const isCorrect = correctCoords.has(key);

            if (isCorrect) {
                // 此格子屬於已拼對成語，設為綠色
                const hasExplListener = cellDom.dataset.hasExplListener === 'true';
                
                if (!cellDom.classList.contains('correct') || !hasExplListener) {
                    const newCell = cellDom.cloneNode(true);
                    newCell.classList.add('correct');
                    newCell.classList.remove('selected');
                    newCell.classList.remove('filled');
                    newCell.dataset.hasExplListener = 'true';
                    newCell.addEventListener('click', () => {
                        showExplanation(coordToWord[key]);
                    });
                    cellDom.parentNode.replaceChild(newCell, cellDom);
                    anyNewCorrect = true;
                }
            } else {
                // 此格子目前不屬於任何已拼對成語，還原普通樣式
                if (cellDom.classList.contains('correct') || cellDom.classList.contains('error') || cellDom.dataset.hasExplListener === 'true') {
                    const isBlank = levelData.blanks.some(b => b.x === c && b.y === r);
                    const newCell = cellDom.cloneNode(true);
                    newCell.classList.remove('correct');
                    newCell.classList.remove('error');
                    delete newCell.dataset.hasExplListener;

                    if (isBlank) {
                        newCell.classList.add('blank');
                        if (playerAnswers[key]) {
                            newCell.classList.add('filled');
                            newCell.innerText = playerAnswers[key].char;
                        } else {
                            newCell.classList.remove('filled');
                            newCell.innerText = '';
                        }
                        newCell.addEventListener('click', () => {
                            initAudio();
                            SoundEffects.click();
                            if (newCell.classList.contains('filled')) {
                                recallChar(r, c);
                            } else {
                                selectCell(r, c);
                            }
                        });
                    } else {
                        newCell.classList.add('char');
                        newCell.innerText = w.word[i];
                    }
                    cellDom.parentNode.replaceChild(newCell, cellDom);
                }
            }
        }
    });

    // 播放拼對單詞的音效
    if (anyNewCorrect && playCorrectSound) {
        SoundEffects.wordCorrect();
    }

    // 檢查是否全通關
    if (allWin && levelData.blanks.length > 0) {
        setTimeout(handleWinLevel, 600);
    }
}

// 處理關卡全通關
function handleWinLevel() {
    SoundEffects.win();
    
    // 撒花特效！
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    // 獲得金幣
    coins += 50;
    
    // 更新解鎖關卡進度
    if (currentLevel === unlockedLevel) {
        unlockedLevel = Math.min(1000, unlockedLevel + 1);
    }

    saveProgress();

    // 彈出通關彈窗
    setTimeout(() => {
        if (currentLevel === 1000) {
            showModal('modal-complete-all');
        } else {
            showModal('modal-win');
        }
    }, 500);
}

// ==========================================================================
// 提示與廣告系統 (Hints & Ads)
// ==========================================================================

// 使用金幣獲得提示 (花費 30 金幣)
function triggerHint() {
    if (coins < 30) {
        // 金幣不足動畫
        const coinCountDom = document.getElementById('coin-badge');
        coinCountDom.style.animation = 'shake-error 0.4s ease-in-out';
        setTimeout(() => coinCountDom.style.animation = '', 400);
        SoundEffects.error();
        alert("金幣不足！你可以點擊金幣旁的「+」或觀看廣告獲取免費金幣。");
        return;
    }

    // 尋找一個當前未填寫、或填錯的空格
    const targetBlank = findHintTarget();
    if (!targetBlank) return;

    coins -= 30;
    SoundEffects.coin();
    saveProgress();

    // 填入正確字
    applyHint(targetBlank);
}

// 免費廣告提示（顯示聖經金句隨機照片）
function triggerAdHint() {
    initAudio();
    SoundEffects.click();

    const targetBlank = findHintTarget();
    if (!targetBlank) return;

    // 建立 overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.cssText = 'z-index:999; cursor:default;';

    const GALLERY_DATA_URL = 'https://www.jktai123.com/Gemini/bible_verses_gallery/data.js';
    const GALLERY_PAGE_URL = 'https://www.jktai123.com/Gemini/bible_verses_gallery/index.html';

    // 顯示過渡中的載入畫面
    overlay.innerHTML = `
        <div class="modal-content paper-style text-center animate-pop" style="max-width:340px; padding:20px;">
            <h3 class="modal-title font-ancient" style="margin-bottom:10px;">🙏 今日靈感</h3>
            <div id="ad-photo-area" style="min-height:160px; display:flex; align-items:center; justify-content:center;">
                <p style="color:gray; font-size:13px;">載入中...</p>
            </div>
            <p id="ad-topic-label" style="font-size:12px; color:#888; margin:8px 0 4px;"></p>
            <a id="ad-gallery-link" href="${GALLERY_PAGE_URL}" target="_blank"
               style="font-size:11px; color:var(--primary-color); text-decoration:underline; display:block; margin-bottom:12px;">
               查看更多聖經金句 →
            </a>
            <div id="ad-countdown" style="font-size:12px; color:gray; margin-bottom:12px;">請稍候 <span id="ad-sec">5</span> 秒...</div>
            <button id="ad-close-btn" class="btn-primary" style="display:none; padding:8px 24px; border:none; background:var(--primary-color); color:#fff; border-radius:20px; cursor:pointer; font-size:14px;">
                ✅ 已閱讀，獲得提示
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    // 動態載入 BIBLE_DATA（若尚未載入）
    function loadBibleData(cb) {
        if (typeof BIBLE_DATA !== 'undefined') { cb(BIBLE_DATA); return; }
        const s = document.createElement('script');
        s.src = GALLERY_DATA_URL;
        s.onload = () => cb(BIBLE_DATA);
        s.onerror = () => cb(null);
        document.head.appendChild(s);
    }

    loadBibleData((data) => {
        const photoArea = document.getElementById('ad-photo-area');
        const topicLabel = document.getElementById('ad-topic-label');

        if (!data || !data.data || data.data.length === 0) {
            if (photoArea) photoArea.innerHTML = '<p style="color:gray;">無法載入圖片，請稍後再試。</p>';
        } else {
            // 隨機選一個主題
            const topic = data.data[Math.floor(Math.random() * data.data.length)];
            // 從該主題隨機選一張圖
            const imgUrl = topic.images[Math.floor(Math.random() * topic.images.length)];

            if (photoArea) {
                photoArea.innerHTML = `
                    <img src="${imgUrl}" alt="${topic.topic}"
                         style="max-width:100%; max-height:200px; border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,0.18); object-fit:cover;"
                         onerror="this.style.display='none'">
                `;
            }
            if (topicLabel) topicLabel.textContent = `主題：${topic.topic}`;
        }
    });

    // 倒數計時 5 秒後顯示關閉按鈕
    let timeLeft = 5;
    const secEl = () => document.getElementById('ad-sec');
    const timer = setInterval(() => {
        timeLeft--;
        if (secEl()) secEl().textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            const cdEl = document.getElementById('ad-countdown');
            const btnEl = document.getElementById('ad-close-btn');
            if (cdEl) cdEl.style.display = 'none';
            if (btnEl) btnEl.style.display = 'inline-block';
        }
    }, 1000);

    // 關閉按鈕：給予提示並移除 overlay
    overlay.addEventListener('click', (e) => {
        if (e.target.id === 'ad-close-btn') {
            clearInterval(timer);
            document.body.removeChild(overlay);
            applyHint(targetBlank);
        }
    });
}


// 尋找提示要填哪一個字（尚未填寫或填錯的格子）
function findHintTarget() {
    const blanks = levelData.blanks;
    // 打亂順序尋找，增加隨機感
    const shuffledBlanks = [...blanks].sort(() => Math.random() - 0.5);

    for (const blank of shuffledBlanks) {
        const key = `${blank.y},${blank.x}`;
        const currentAnswer = playerAnswers[key];
        
        // 未填寫，或者填寫的字是不正確的
        if (!currentAnswer || currentAnswer.char !== blank.char) {
            return blank;
        }
    }
    return null;
}

// 實作提示字元填入
function applyHint(blank) {
    const key = `${blank.y},${blank.x}`;
    
    // 如果該格有字，先撤回
    if (playerAnswers[key]) {
        recallChar(blank.y, blank.x);
    }

    // 尋找下方候選字中正確字的 index
    // 優先選取「尚未被使用」的正確候選字
    const correctChar = blank.char;
    let candidateIndex = -1;

    // 取得當前已被使用的 index 清單
    const usedIndices = Object.keys(playerAnswers).map(k => playerAnswers[k].candidateIndex);

    for (let i = 0; i < levelData.candidates.length; i++) {
        if (levelData.candidates[i] === correctChar && !usedIndices.includes(i)) {
            candidateIndex = i;
            break;
        }
    }

    // 如果所有該字元的候選牌都被佔用了（這幾乎不會發生，除非數據有誤），我們直接用第一個相符的
    if (candidateIndex === -1) {
        candidateIndex = levelData.candidates.indexOf(correctChar);
    }

    // 填入
    playerAnswers[key] = { char: correctChar, candidateIndex };

    // 更新棋盤 DOM
    const cellDom = document.querySelector(`.grid-cell[data-r="${blank.y}"][data-c="${blank.x}"]`);
    if (cellDom) {
        cellDom.innerText = correctChar;
        cellDom.classList.add('filled');
        cellDom.classList.remove('error');
    }

    // 標記候選字置灰
    const tileDom = document.querySelector(`.candidate-tile[data-index="${candidateIndex}"]`);
    if (tileDom) {
        tileDom.classList.add('used');
    }

    // 檢查成語
    checkWordStatuses(true);

    // 自動選下一個
    selectNextEmptyCell();
}

// ==========================================================================
// 彈窗 UI 互動邏輯
// ==========================================================================

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

// 顯示成語釋義
function showExplanation(wordObj) {
    document.getElementById('expl-word').innerText = wordObj.word;
    document.getElementById('expl-pinyin').innerText = wordObj.pinyin;
    document.getElementById('expl-zhuyin').innerText = wordObj.zhuyin;
    document.getElementById('expl-definition').innerText = wordObj.explanation;
    
    const derivationDom = document.getElementById('expl-derivation');
    const container = document.getElementById('expl-derivation-container');
    if (wordObj.derivation) {
        container.style.display = 'block';
        derivationDom.innerText = wordObj.derivation;
    } else {
        container.style.display = 'none';
    }

    showModal('modal-explanation');
}

// 顯示關卡選單
function openLevelsMenu() {
    const grid = document.getElementById('levels-menu-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= 1000; i++) {
        const item = document.createElement('div');
        item.classList.add('level-item');
        item.innerText = i;

        if (i < unlockedLevel) {
            // 已通關
            item.classList.add('completed');
            item.addEventListener('click', () => {
                closeModal('modal-levels-menu');
                loadLevel(i);
            });
        } else if (i === unlockedLevel) {
            // 當前進度
            item.classList.add('current');
            item.addEventListener('click', () => {
                closeModal('modal-levels-menu');
                loadLevel(i);
            });
        } else {
            // 鎖定中
            item.classList.add('locked');
            item.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            `;
        }

        grid.appendChild(item);
    }

    showModal('modal-levels-menu');
}

// ==========================================================================
// 綁定事件監聽器
// ==========================================================================
function setupEventListeners() {
    // 頂部按鈕
    document.getElementById('btn-levels-menu').addEventListener('click', () => {
        initAudio();
        SoundEffects.click();
        openLevelsMenu();
    });
    
    document.getElementById('btn-add-coin').addEventListener('click', () => {
        initAudio();
        coins += 100;
        SoundEffects.coin();
        saveProgress();
        // 飛入動畫提示
        alert("成功領取每日福袋金幣 +100！");
    });

    // 底部按鈕
    document.getElementById('btn-settings').addEventListener('click', () => {
        initAudio();
        SoundEffects.click();
        showModal('modal-settings');
    });

    document.getElementById('btn-hint').addEventListener('click', triggerHint);
    
    document.getElementById('btn-ad-hint').addEventListener('click', triggerAdHint);

    // 關閉彈窗按鈕
    document.getElementById('btn-close-explanation').addEventListener('click', () => closeModal('modal-explanation'));
    document.getElementById('btn-close-settings').addEventListener('click', () => closeModal('modal-settings'));
    document.getElementById('btn-close-levels').addEventListener('click', () => closeModal('modal-levels-menu'));

    // 通關後點擊下一關
    document.getElementById('btn-next-level').addEventListener('click', () => {
        closeModal('modal-win');
        if (currentLevel < 1000) {
            loadLevel(currentLevel + 1);
        }
    });

    // 100關破關後重新挑戰
    document.getElementById('btn-restart-all').addEventListener('click', () => {
        closeModal('modal-complete-all');
        currentLevel = 1;
        unlockedLevel = 1;
        coins = 100;
        saveProgress();
        loadLevel(1);
    });

    // 設定選項：音效開關
    document.getElementById('toggle-sound').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        saveProgress();
        if (soundEnabled) {
            initAudio();
            SoundEffects.click();
        }
    });

    // 設定選項：重置進度
    document.getElementById('btn-reset-game').addEventListener('click', () => {
        if (confirm("你確定要清除所有進度並重置遊戲嗎？這將會把關卡重置到第1關，金幣歸100。")) {
            currentLevel = 1;
            unlockedLevel = 1;
            coins = 100;
            saveProgress();
            closeModal('modal-settings');
            loadLevel(1);
        }
    });

    // 點擊彈窗外部關閉彈窗
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}
