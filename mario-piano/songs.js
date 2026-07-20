// 瑪利歐鋼琴樂譜資料庫
// C4-G5 鋼琴琴鍵範圍 (白鍵與黑鍵)
// time: 音符開始時間 (秒)
// duration: 音符持續時間 (秒)
// note: 音高名稱 (如 C4, D#4, F5 等)

export const SONGS = [
  {
    id: "mario_theme",
    title: "經典主題曲 (Overworld)",
    difficulty: "中等",
    tempo: 120, // BPM
    description: "超級瑪利歐最經典的地上世界背景音樂！",
    notes: [
      // 開頭經典句
      { note: "E5", time: 0.0, duration: 0.15 },
      { note: "E5", time: 0.2, duration: 0.15 },
      { note: "E5", time: 0.5, duration: 0.15 },
      { note: "C5", time: 0.7, duration: 0.15 },
      { note: "E5", time: 0.9, duration: 0.25 },
      { note: "G5", time: 1.2, duration: 0.3 },
      { note: "G4", time: 1.7, duration: 0.3 },

      // 第一段
      { note: "C5", time: 2.3, duration: 0.25 },
      { note: "G4", time: 2.7, duration: 0.25 },
      { note: "E4", time: 3.1, duration: 0.25 },
      { note: "A4", time: 3.5, duration: 0.2 },
      { note: "B4", time: 3.8, duration: 0.2 },
      { note: "A#4", time: 4.1, duration: 0.2 },
      { note: "A4", time: 4.4, duration: 0.25 },
      
      { note: "G4", time: 4.7, duration: 0.18 },
      { note: "E5", time: 4.9, duration: 0.18 },
      { note: "G5", time: 5.1, duration: 0.18 },
      { note: "A5", time: 5.3, duration: 0.25 },
      { note: "F5", time: 5.6, duration: 0.18 },
      { note: "G5", time: 5.8, duration: 0.18 },
      { note: "E5", time: 6.1, duration: 0.25 },
      { note: "C5", time: 6.4, duration: 0.18 },
      { note: "D5", time: 6.6, duration: 0.18 },
      { note: "B4", time: 6.8, duration: 0.3 },

      // 重複第一段
      { note: "C5", time: 7.4, duration: 0.25 },
      { note: "G4", time: 7.8, duration: 0.25 },
      { note: "E4", time: 8.2, duration: 0.25 },
      { note: "A4", time: 8.6, duration: 0.2 },
      { note: "B4", time: 8.9, duration: 0.2 },
      { note: "A#4", time: 9.2, duration: 0.2 },
      { note: "A4", time: 9.5, duration: 0.25 },
      
      { note: "G4", time: 9.8, duration: 0.18 },
      { note: "E5", time: 10.0, duration: 0.18 },
      { note: "G5", time: 10.2, duration: 0.18 },
      { note: "A5", time: 10.4, duration: 0.25 },
      { note: "F5", time: 10.7, duration: 0.18 },
      { note: "G5", time: 10.9, duration: 0.18 },
      { note: "E5", time: 11.2, duration: 0.25 },
      { note: "C5", time: 11.5, duration: 0.18 },
      { note: "D5", time: 11.7, duration: 0.18 },
      { note: "B4", time: 11.9, duration: 0.3 },

      // 間奏 (跳躍段落)
      { note: "G5", time: 12.6, duration: 0.18 },
      { note: "F#5", time: 12.8, duration: 0.18 },
      { note: "F5", time: 13.0, duration: 0.18 },
      { note: "D#5", time: 13.2, duration: 0.25 },
      { note: "E5", time: 13.5, duration: 0.25 },
      { note: "G4", time: 13.8, duration: 0.18 },
      { note: "A4", time: 14.0, duration: 0.18 },
      { note: "C5", time: 14.2, duration: 0.25 },
      { note: "A4", time: 14.5, duration: 0.18 },
      { note: "C5", time: 14.7, duration: 0.18 },
      { note: "D5", time: 14.9, duration: 0.3 },

      { note: "G5", time: 15.5, duration: 0.18 },
      { note: "F#5", time: 15.7, duration: 0.18 },
      { note: "F5", time: 15.9, duration: 0.18 },
      { note: "D#5", time: 16.1, duration: 0.25 },
      { note: "E5", time: 16.4, duration: 0.25 },
      { note: "C5", time: 16.7, duration: 0.18 },
      { note: "C5", time: 16.9, duration: 0.18 },
      { note: "C5", time: 17.1, duration: 0.3 },

      { note: "G5", time: 17.7, duration: 0.18 },
      { note: "F#5", time: 17.9, duration: 0.18 },
      { note: "F5", time: 18.1, duration: 0.18 },
      { note: "D#5", time: 18.3, duration: 0.25 },
      { note: "E5", time: 18.6, duration: 0.25 },
      { note: "G4", time: 18.9, duration: 0.18 },
      { note: "A4", time: 19.1, duration: 0.18 },
      { note: "C5", time: 19.3, duration: 0.25 },
      { note: "A4", time: 19.6, duration: 0.18 },
      { note: "C5", time: 19.8, duration: 0.18 },
      { note: "D5", time: 20.0, duration: 0.3 },

      { note: "D#5", time: 20.6, duration: 0.25 },
      { note: "D5", time: 21.0, duration: 0.25 },
      { note: "C5", time: 21.4, duration: 0.4 }
    ]
  },
  {
    id: "mario_underworld",
    title: "地下關卡 (Underworld Theme)",
    difficulty: "簡單",
    tempo: 100,
    description: "神秘的地下水管世界，低沈獨特的旋律！",
    notes: [
      // 經典地下低音與節奏旋律 (調整到 C4-G5 鍵盤範圍)
      { note: "C4", time: 0.0, duration: 0.2 },
      { note: "C5", time: 0.25, duration: 0.2 },
      { note: "A4", time: 0.5, duration: 0.2 },
      { note: "A4", time: 0.75, duration: 0.2 },
      
      { note: "A#4", time: 1.25, duration: 0.2 },
      { note: "A#4", time: 1.5, duration: 0.2 },
      
      { note: "C4", time: 2.0, duration: 0.2 },
      { note: "C5", time: 2.2, duration: 0.2 },
      { note: "G4", time: 2.4, duration: 0.2 },
      { note: "E4", time: 2.6, duration: 0.2 },
      { note: "F4", time: 2.8, duration: 0.2 },
      { note: "G4", time: 3.0, duration: 0.3 },

      { note: "C4", time: 3.6, duration: 0.2 },
      { note: "C5", time: 3.8, duration: 0.2 },
      { note: "G4", time: 4.0, duration: 0.2 },
      { note: "E4", time: 4.2, duration: 0.2 },
      { note: "F4", time: 4.4, duration: 0.2 },
      { note: "G4", time: 4.6, duration: 0.3 },

      { note: "F#4", time: 5.2, duration: 0.2 },
      { note: "F4", time: 5.5, duration: 0.2 },
      { note: "D#4", time: 5.8, duration: 0.3 },
      { note: "E4", time: 6.2, duration: 0.4 },

      { note: "F4", time: 7.0, duration: 0.2 },
      { note: "E4", time: 7.3, duration: 0.2 },
      { note: "D4", time: 7.6, duration: 0.3 },
      { note: "C4", time: 8.0, duration: 0.4 }
    ]
  },
  {
    id: "mario_star",
    title: "無敵星 (Star Theme)",
    difficulty: "困難",
    tempo: 150,
    description: "吃下超級星星！無敵狀態下的熱血超快旋律！",
    notes: [
      // 無敵星旋律
      { note: "C5", time: 0.0, duration: 0.15 },
      { note: "B4", time: 0.15, duration: 0.15 },
      { note: "A4", time: 0.3, duration: 0.15 },
      { note: "G4", time: 0.45, duration: 0.15 },
      
      { note: "F4", time: 0.6, duration: 0.15 },
      { note: "F4", time: 0.75, duration: 0.15 },
      { note: "G4", time: 0.9, duration: 0.15 },
      { note: "A4", time: 1.05, duration: 0.15 },
      
      { note: "C5", time: 1.2, duration: 0.15 },
      { note: "B4", time: 1.35, duration: 0.15 },
      { note: "A4", time: 1.5, duration: 0.15 },
      { note: "G4", time: 1.65, duration: 0.15 },
      
      { note: "F4", time: 1.8, duration: 0.15 },
      { note: "E4", time: 1.95, duration: 0.15 },
      { note: "D4", time: 2.1, duration: 0.15 },
      { note: "C4", time: 2.25, duration: 0.3 },

      { note: "C5", time: 2.7, duration: 0.15 },
      { note: "B4", time: 2.85, duration: 0.15 },
      { note: "A4", time: 3.0, duration: 0.15 },
      { note: "G4", time: 3.15, duration: 0.15 },
      
      { note: "F4", time: 3.3, duration: 0.15 },
      { note: "F4", time: 3.45, duration: 0.15 },
      { note: "G4", time: 3.6, duration: 0.15 },
      { note: "A4", time: 3.75, duration: 0.15 },
      
      { note: "C5", time: 3.9, duration: 0.15 },
      { note: "B4", time: 4.05, duration: 0.15 },
      { note: "A4", time: 4.2, duration: 0.15 },
      { note: "G4", time: 4.35, duration: 0.15 },
      
      { note: "F4", time: 4.5, duration: 0.15 },
      { note: "E4", time: 4.65, duration: 0.15 },
      { note: "D4", time: 4.8, duration: 0.15 },
      { note: "C4", time: 4.95, duration: 0.3 }
    ]
  }
];

// 鋼琴琴鍵頻率對照表 (C4-G5)
export const NOTE_FREQS = {
  "C4": 261.63,  "C#4": 277.18, "D4": 293.66,  "D#4": 311.13,
  "E4": 329.63,  "F4": 349.23,  "F#4": 369.99, "G4": 392.00,
  "G#4": 415.30, "A4": 440.00,  "A#4": 466.16, "B4": 493.88,
  "C5": 523.25,  "C#5": 554.37, "D5": 587.33,  "D#5": 622.25,
  "E5": 659.25,  "F5": 698.46,  "F#5": 739.99, "G5": 783.99
};

// 鍵盤對應白鍵與黑鍵清單
export const PIANO_KEYS = [
  { note: "C4", isBlack: false, keyBind: "a" },
  { note: "C#4", isBlack: true, keyBind: "w" },
  { note: "D4", isBlack: false, keyBind: "s" },
  { note: "D#4", isBlack: true, keyBind: "e" },
  { note: "E4", isBlack: false, keyBind: "d" },
  { note: "F4", isBlack: false, keyBind: "f" },
  { note: "F#4", isBlack: true, keyBind: "t" },
  { note: "G4", isBlack: false, keyBind: "g" },
  { note: "G#4", isBlack: true, keyBind: "y" },
  { note: "A4", isBlack: false, keyBind: "h" },
  { note: "A#4", isBlack: true, keyBind: "u" },
  { note: "B4", isBlack: false, keyBind: "j" },
  { note: "C5", isBlack: false, keyBind: "k" },
  { note: "C#5", isBlack: true, keyBind: "o" },
  { note: "D5", isBlack: false, keyBind: "l" },
  { note: "D#5", isBlack: true, keyBind: "p" },
  { note: "E5", isBlack: false, keyBind: ";" },
  { note: "F5", isBlack: false, keyBind: "'" },
  { note: "F#5", isBlack: true, keyBind: "]" },
  { note: "G5", isBlack: false, keyBind: "\\" }
];
