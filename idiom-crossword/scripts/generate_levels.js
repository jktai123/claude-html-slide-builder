const fs = require('fs');
const path = require('path');

// 讀取臺灣教育部成語典篩選出的 4543 個常用繁體成語
const idiomsJsonPath = path.join(__dirname, 'idioms_zh_tw.json');
if (!fs.existsSync(idiomsJsonPath)) {
    console.error(`找不到成語庫 JSON 檔案: {idiomsJsonPath}`);
    process.exit(1);
}

const idiomDatabase = JSON.parse(fs.readFileSync(idiomsJsonPath, 'utf-8'));
console.log(`成語庫載入成功，共有 ${idiomDatabase.length} 個台灣通用成語。`);

// 1. 預先建立字元到成語的 Map 索引，以 O(1) 時間尋找包含特定字元的成語
const charToIdioms = {};
for (const item of idiomDatabase) {
    for (const char of item.word) {
        if (!charToIdioms[char]) {
            charToIdioms[char] = [];
        }
        charToIdioms[char].push(item);
    }
}

// Crossword 關卡生成演算法
class CrosswordGenerator {
    constructor(db, indexMap) {
        this.db = db;
        this.indexMap = indexMap;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    generateLevel(levelNum, targetWordCount, gridSize = 9) {
        let attempts = 0;
        const maxAttempts = 1000;
        let currentTargetWordCount = targetWordCount;

        while (attempts < maxAttempts) {
            attempts++;
            
            // 如果嘗試次數過多，說明當前成語數在 9x9 網格下太擁擠，自動減少一個成語以確保順利生成
            if (attempts > 300 && currentTargetWordCount > 3) {
                currentTargetWordCount--;
                attempts = 0; // 重置嘗試次數
            }

            // 初始化網格
            const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(' '));
            const placedWords = []; // { word, x, y, direction }

            // 1. 隨機選第一個成語，放置在中間偏左
            const shuffledDb = this.shuffle([...this.db]);
            const firstIdiom = shuffledDb[0];
            
            const firstX = 2;
            const firstY = 4;
            
            for (let i = 0; i < 4; i++) {
                grid[firstY][firstX + i] = firstIdiom.word[i];
            }
            placedWords.push({
                word: firstIdiom.word,
                x: firstX,
                y: firstY,
                direction: 'h'
            });

            let success = true;
            
            // 2. 依序嘗試放置剩下的成語
            for (let w = 1; w < currentTargetWordCount; w++) {
                let placed = false;
                
                const gridChars = [];
                for (let r = 0; r < gridSize; r++) {
                    for (let c = 0; c < gridSize; c++) {
                        if (grid[r][c] !== ' ') {
                            gridChars.push({ char: grid[r][c], r, c });
                        }
                    }
                }
                
                this.shuffle(gridChars);

                // 尋找相交點
                findIntersect:
                for (const cell of gridChars) {
                    // 利用 Map 索引獲取包含該字的成語候選名單，極大加速搜尋速度
                    const allCandidates = this.indexMap[cell.char] || [];
                    const candidates = allCandidates.filter(item => 
                        !placedWords.some(pw => pw.word === item.word)
                    );

                    // 打亂候選成語以保證關卡隨機性
                    this.shuffle(candidates);

                    for (const candidate of candidates) {
                        const word = candidate.word;
                        const charIndex = word.indexOf(cell.char);

                        const matchingPlaced = placedWords.find(pw => {
                            if (pw.direction === 'h') {
                                return cell.r === pw.y && cell.c >= pw.x && cell.c < pw.x + 4 && pw.word[cell.c - pw.x] === cell.char;
                            } else {
                                return cell.c === pw.x && cell.r >= pw.y && cell.r < pw.y + 4 && pw.word[cell.r - pw.y] === cell.char;
                            }
                        });

                        const nextDirection = (matchingPlaced && matchingPlaced.direction === 'h') ? 'v' : 'h';

                        let startX, startY;
                        if (nextDirection === 'h') {
                            startX = cell.c - charIndex;
                            startY = cell.r;
                        } else {
                            startX = cell.c;
                            startY = cell.r - charIndex;
                        }

                        if (this.canPlaceWord(grid, word, startX, startY, nextDirection, gridSize, cell.r, cell.c)) {
                            for (let i = 0; i < 4; i++) {
                                const currX = (nextDirection === 'h') ? startX + i : startX;
                                const currY = (nextDirection === 'h') ? startY : startY + i;
                                grid[currY][currX] = word[i];
                            }
                            placedWords.push({
                                word: word,
                                x: startX,
                                y: startY,
                                direction: nextDirection
                            });
                            placed = true;
                            break findIntersect;
                        }
                    }
                }

                if (!placed) {
                    success = false;
                    break;
                }
            }

            if (success && placedWords.length === currentTargetWordCount) {
                return this.finalizeLevel(levelNum, grid, placedWords, gridSize);
            }
        }
        
        // 保底機制
        if (currentTargetWordCount > 3) {
            return this.generateLevel(levelNum, 3, gridSize);
        }
        throw new Error(`無法在 ${maxAttempts} 次嘗試內生成關卡 ${levelNum}`);
    }

    canPlaceWord(grid, word, startX, startY, direction, gridSize, intersectR, intersectC) {
        if (direction === 'h') {
            if (startX < 0 || startX + 3 >= gridSize || startY < 0 || startY >= gridSize) return false;
        } else {
            if (startX < 0 || startX >= gridSize || startY < 0 || startY + 3 >= gridSize) return false;
        }

        for (let i = 0; i < 4; i++) {
            const r = (direction === 'h') ? startY : startY + i;
            const c = (direction === 'h') ? startX + i : startX;

            const isIntersect = (r === intersectR && c === intersectC);

            if (isIntersect) {
                if (grid[r][c] !== word[i]) return false;
            } else {
                if (grid[r][c] !== ' ') return false;

                if (direction === 'h') {
                    if (r - 1 >= 0 && grid[r - 1][c] !== ' ') return false;
                    if (r + 1 < gridSize && grid[r + 1][c] !== ' ') return false;
                    if (i === 0 && c - 1 >= 0 && grid[r][c - 1] !== ' ') return false;
                    if (i === 3 && c + 1 < gridSize && grid[r][c + 1] !== ' ') return false;
                } else {
                    if (c - 1 >= 0 && grid[r][c - 1] !== ' ') return false;
                    if (c + 1 < gridSize && grid[r][c + 1] !== ' ') return false;
                    if (i === 0 && r - 1 >= 0 && grid[r - 1][c] !== ' ') return false;
                    if (i === 3 && r + 1 < gridSize && grid[r + 1][c] !== ' ') return false;
                }
            }
        }
        return true;
    }

    finalizeLevel(levelNum, grid, placedWords, gridSize) {
        const allCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] !== ' ') {
                    allCells.push({ r, c, char: grid[r][c] });
                }
            }
        }

        let blankCount = 3;
        if (levelNum > 800) blankCount = 7 + Math.floor(Math.random() * 2);
        else if (levelNum > 600) blankCount = 6;
        else if (levelNum > 300) blankCount = 5;
        else if (levelNum > 100) blankCount = 4;
        else if (levelNum > 10) blankCount = 3;
        else blankCount = 2;

        this.shuffle(allCells);
        const blanks = allCells.slice(0, Math.min(blankCount, allCells.length)).map(cell => ({
            x: cell.c,
            y: cell.r,
            char: cell.char
        }));

        const correctChars = blanks.map(b => b.char);
        const candidates = [...correctChars];
        const allIdiomChars = placedWords.map(pw => pw.word).join('');
        
        const extraNeeded = 12 - candidates.length;
        const candidatePool = [];
        
        // 隨機打亂資料庫，避免每次都拿到相同的干擾字
        const shuffledDb = this.shuffle([...this.db]);
        
        for (const item of shuffledDb) {
            if (candidatePool.length >= 24) break; // 湊足足夠的干擾字候選就提前結束，避免遍歷數千成語
            for (const char of item.word) {
                if (!allIdiomChars.includes(char) && !candidatePool.includes(char)) {
                    candidatePool.push(char);
                }
            }
        }

        this.shuffle(candidatePool);
        for (let i = 0; i < Math.min(extraNeeded, candidatePool.length); i++) {
            candidates.push(candidatePool[i]);
        }

        while (candidates.length < 12) {
            candidates.push("成");
        }

        this.shuffle(candidates);

        const wordInfos = placedWords.map(pw => {
            const dbItem = this.db.find(item => item.word === pw.word);
            return {
                word: pw.word,
                x: pw.x,
                y: pw.y,
                direction: pw.direction,
                pinyin: dbItem ? dbItem.pinyin : "",
                zhuyin: dbItem ? dbItem.zhuyin : "",
                explanation: dbItem ? dbItem.explanation : "",
                derivation: dbItem ? dbItem.derivation : ""
            };
        });

        return {
            level: levelNum,
            gridSize: gridSize,
            words: wordInfos,
            blanks: blanks,
            candidates: candidates
        };
    }
}

// 開始生成 1000 關
const generator = new CrosswordGenerator(idiomDatabase, charToIdioms);
const levels = [];

console.log("開始生成 1000 關成語十字接龍關卡...");
const startTime = Date.now();

for (let l = 1; l <= 1000; l++) {
    let wordCount = 3;
    if (l > 800) wordCount = 7;
    else if (l > 600) wordCount = 6;
    else if (l > 300) wordCount = 5;
    else if (l > 100) wordCount = 4;
    else wordCount = 3;

    const levelData = generator.generateLevel(l, wordCount, 9);
    levels.push(levelData);

    if (l % 100 === 0) {
        console.log(`已成功生成 ${l} 關...`);
    }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`生成完成！共花費 ${duration} 秒。`);

const outputDir = path.join(__dirname, '..');
const outputPath = path.join(outputDir, 'levels.js');
const fileContent = `// 自動生成的 1000 關成語十字接龍數據
const idiomLevels = ${JSON.stringify(levels, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`關卡已寫入至 ${outputPath}`);
