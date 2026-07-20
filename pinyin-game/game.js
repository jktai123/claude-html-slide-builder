/* ==========================================================================
   拼音島大冒險 - 遊戲核心邏輯 (game.js)
   包含詞庫、音效合成、語音 TTS、Canvas 動態紙花、狀態控制與各練習模式
   ========================================================================== */

// 1. 拼音字母對照資料 (教學用)
const INITIALS_TUTORIAL = [
  { pinyin: "b", zhuyin: "ㄅ", example: "爸 (bà)" },
  { pinyin: "p", zhuyin: "ㄆ", example: "婆 (pó)" },
  { pinyin: "m", zhuyin: "ㄇ", example: "媽 (mā)" },
  { pinyin: "f", zhuyin: "ㄈ", example: "飛 (fēi)" },
  { pinyin: "d", zhuyin: "ㄉ", example: "大 (dà)" },
  { pinyin: "t", zhuyin: "ㄊ", example: "兔 (tù)" },
  { pinyin: "n", zhuyin: "ㄋ", example: "泥 (ní)" },
  { pinyin: "l", zhuyin: "ㄌ", example: "綠 (lǜ)" },
  { pinyin: "g", zhuyin: "ㄍ", example: "歌 (gē)" },
  { pinyin: "k", zhuyin: "ㄎ", example: "可 (kě)" },
  { pinyin: "h", zhuyin: "ㄏ", example: "河 (hé)" },
  { pinyin: "j", zhuyin: "ㄐ", example: "雞 (jī)" },
  { pinyin: "q", zhuyin: "ㄑ", example: "七 (qī)" },
  { pinyin: "x", zhuyin: "ㄒ", example: "西 (xī)" },
  { pinyin: "zh", zhuyin: "ㄓ", example: "豬 (zhū)" },
  { pinyin: "ch", zhuyin: "ㄔ", example: "車 (chē)" },
  { pinyin: "sh", zhuyin: "ㄕ", example: "書 (shū)" },
  { pinyin: "r", zhuyin: "ㄖ", example: "日 (rì)" },
  { pinyin: "z", zhuyin: "ㄗ", example: "字 (zì)" },
  { pinyin: "c", zhuyin: "ㄘ", example: "草 (cǎo)" },
  { pinyin: "s", zhuyin: "ㄙ", example: "四 (sì)" },
  { pinyin: "y", zhuyin: "ㄧ", example: "衣 (yī)" },
  { pinyin: "w", zhuyin: "ㄨ", example: "屋 (wū)" }
];

const FINALS_TUTORIAL = [
  // 單韻母
  { pinyin: "a", zhuyin: "ㄚ", example: "啊 (a)", group: "單韻母" },
  { pinyin: "o", zhuyin: "ㄛ", example: "喔 (o)", group: "單韻母" },
  { pinyin: "e", zhuyin: "ㄜ", example: "鵝 (é)", group: "單韻母" },
  { pinyin: "i", zhuyin: "ㄧ", example: "衣 (yī)", group: "單韻母" },
  { pinyin: "u", zhuyin: "ㄨ", example: "屋 (wū)", group: "單韻母" },
  { pinyin: "ü", zhuyin: "ㄩ", example: "魚 (yú)", group: "單韻母" },
  // 複韻母
  { pinyin: "ai", zhuyin: "ㄞ", example: "愛 (ài)", group: "複韻母" },
  { pinyin: "ei", zhuyin: "ㄟ", example: "飛 (fēi)", group: "複韻母" },
  { pinyin: "ui", zhuyin: "ㄨㄟ", example: "回 (huí)", group: "複韻母" },
  { pinyin: "ao", zhuyin: "ㄠ", example: "貓 (māo)", group: "複韻母" },
  { pinyin: "ou", zhuyin: "ㄡ", example: "狗 (gǒu)", group: "複韻母" },
  { pinyin: "iu", zhuyin: "ㄧㄡ", example: "牛 (niú)", group: "複韻母" },
  { pinyin: "ie", zhuyin: "ㄧㄝ", example: "葉 (yè)", group: "複韻母" },
  { pinyin: "üe", zhuyin: "ㄩㄝ", example: "月 (yuè)", group: "複韻母" },
  { pinyin: "er", zhuyin: "er", example: "二 (èr)", group: "複韻母" },
  // 鼻韻母
  { pinyin: "an", zhuyin: "ㄢ", example: "山 (shān)", group: "鼻韻母" },
  { pinyin: "en", zhuyin: "ㄣ", example: "人 (rén)", group: "鼻韻母" },
  { pinyin: "in", zhuyin: "ㄧㄣ", example: "音 (yīn)", group: "鼻韻母" },
  { pinyin: "un", zhuyin: "ㄨㄣ", example: "問 (wèn)", group: "鼻韻母" },
  { pinyin: "ün", zhuyin: "ㄩㄣ", example: "雲 (yún)", group: "鼻韻母" },
  { pinyin: "ang", zhuyin: "ㄤ", example: "羊 (yáng)", group: "鼻韻母" },
  { pinyin: "eng", zhuyin: "ㄥ", example: "風 (fēng)", group: "鼻韻母" },
  { pinyin: "ing", zhuyin: "ㄧㄥ", example: "星 (xīng)", group: "鼻韻母" },
  { pinyin: "ong", zhuyin: "ㄨㄥ", example: "紅 (hóng)", group: "鼻韻母" }
];

// 拼讀規則卡內容
const RULES_TUTORIAL = [
  {
    title: "ü 碰 j q x 要去點 🐟",
    detail: "當小魚母 `ü` 遇到聲母 `j`, `q`, `x` 時，頭上的兩點要擦掉。但遇到 `n`, `l` 時不能去掉喔！",
    example: "例：j + ü ➔ ju (橘子 🍊) / l + ü ➔ lü (綠色 🟢)"
  },
  {
    title: "單獨成音節加 y 或 w 🏠",
    detail: "單韻母 `i`, `u`, `ü` 自成音節時，前面要加上 `y` 或 `w`。如果是 `ü` 開頭的還要去掉頭上的兩點！",
    example: "例：i ➔ yi (衣服 👕) / u ➔ wu (屋子 🏠) / ü ➔ yu (下雨 🌧️)"
  },
  {
    title: "標調順序歌 🎵",
    detail: "聲調符號要標在母音上，順序是：有 `a` 在給 `a` 戴；沒 `a` 找 `o`, `e`；`i`, `u` 並列標在後面那個。",
    example: "例：guǐ (軌 🚊) 標在 i / liú (流 🌊) 標在 u"
  },
  {
    title: "什麼是三拼音節？ 🍉",
    detail: "有些字除了「聲母」和「韻母」，中間還夾著一個介音（如 i, u, ü）。三個拼起來就叫三拼音節！",
    example: "例：g (聲母) + u (介音) + ā (韻母) ➔ guā (西瓜 🍉)"
  }
];

// 2. 詞庫資料庫
const VOCABULARY = [
{
    word: "蘋果",
    emoji: "🍎",
    english: "Apple",
    pinyin: "píng guǒ",
    zhuyin: "%ㄆㄧㄥˊ %ㄍㄨㄛˇ",
    chars: [
      { char: "蘋", initial: "p", final: "ing", tone: 2, pinyin: "píng", zhuyin: "ㄆㄧㄥˊ", exampleChar: "平" },
      { char: "果", initial: "g", final: "uo", tone: 3, pinyin: "guǒ", zhuyin: "ㄍㄨㄛˇ", exampleChar: "裹" }
    ]
  },
  {
    word: "香蕉",
    emoji: "🍌",
    english: "Banana",
    pinyin: "xiāng jiāo",
    zhuyin: "%ㄒㄧㄤ %ㄐㄧㄠ",
    chars: [
      { char: "香", initial: "x", final: "iang", tone: 1, pinyin: "xiāng", zhuyin: "ㄒㄧㄤ", exampleChar: "箱" },
      { char: "蕉", initial: "j", final: "iao", tone: 1, pinyin: "jiāo", zhuyin: "ㄐㄧㄠ", exampleChar: "交" }
    ]
  },
  {
    word: "西瓜",
    emoji: "🍉",
    english: "Watermelon",
    pinyin: "xī guā",
    zhuyin: "%ㄒㄧ %ㄍㄨㄚ",
    chars: [
      { char: "西", initial: "x", final: "i", tone: 1, pinyin: "xī", zhuyin: "ㄒㄧ", exampleChar: "吸" },
      { char: "瓜", initial: "g", final: "ua", tone: 1, pinyin: "guā", zhuyin: "ㄍㄨㄚ", exampleChar: "刮" }
    ]
  },
  {
    word: "貓咪",
    emoji: "🐱",
    english: "Cat",
    pinyin: "māo mī",
    zhuyin: "%ㄇㄠ %ㄇㄧ",
    chars: [
      { char: "貓", initial: "m", final: "ao", tone: 1, pinyin: "māo", zhuyin: "ㄇㄠ", exampleChar: "包" },
      { char: "咪", initial: "m", final: "i", tone: 1, pinyin: "mī", zhuyin: "ㄇㄧ", exampleChar: "米" }
    ]
  },
  {
    word: "小狗",
    emoji: "🐶",
    english: "Dog",
    pinyin: "xiǎo gǒu",
    zhuyin: "%ㄒㄧㄠˇ %ㄍㄡˇ",
    chars: [
      { char: "小", initial: "x", final: "iao", tone: 3, pinyin: "xiǎo", zhuyin: "ㄒㄧㄠˇ", exampleChar: "曉" },
      { char: "狗", initial: "g", final: "ou", tone: 3, pinyin: "gǒu", zhuyin: "ㄍㄡˇ", exampleChar: "口" }
    ]
  },
  {
    word: "大象",
    emoji: "🐘",
    english: "Elephant",
    pinyin: "dà xiàng",
    zhuyin: "%ㄉㄚˋ %ㄒㄧㄤˋ",
    chars: [
      { char: "大", initial: "d", final: "a", tone: 4, pinyin: "dà", zhuyin: "ㄉㄚˋ", exampleChar: "打" },
      { char: "象", initial: "x", final: "iang", tone: 4, pinyin: "xiàng", zhuyin: "ㄒㄧㄤˋ", exampleChar: "向" }
    ]
  },
  {
    word: "兔子",
    emoji: "🐰",
    english: "Rabbit",
    pinyin: "tù zi",
    zhuyin: "%ㄊㄨˋ %ㄗ˙",
    chars: [
      { char: "兔", initial: "t", final: "u", tone: 4, pinyin: "tù", zhuyin: "ㄊㄨˋ", exampleChar: "吐" },
      { char: "子", initial: "z", final: "i", tone: 0, pinyin: "zi", zhuyin: "ㄗ˙", exampleChar: "自" }
    ]
  },
  {
    word: "獅子",
    emoji: "🦁",
    english: "Lion",
    pinyin: "shī zi",
    zhuyin: "%ㄕ %ㄗ˙",
    chars: [
      { char: "獅", initial: "sh", final: "i", tone: 1, pinyin: "shī", zhuyin: "ㄕ", exampleChar: "師" },
      { char: "子", initial: "z", final: "i", tone: 0, pinyin: "zi", zhuyin: "ㄗ˙", exampleChar: "自" }
    ]
  },
  {
    word: "太陽",
    emoji: "☀️",
    english: "Sun",
    pinyin: "tài yáng",
    zhuyin: "%ㄊㄞˋ %ㄧㄤˊ",
    chars: [
      { char: "太", initial: "t", final: "a", tone: 4, pinyin: "tài", zhuyin: "ㄊㄞˋ", exampleChar: "泰" },
      { char: "陽", initial: "y", final: "ang", tone: 2, pinyin: "yáng", zhuyin: "ㄧㄤˊ", exampleChar: "洋" }
    ]
  },
  {
    word: "月亮",
    emoji: "🌙",
    english: "Moon",
    pinyin: "yuè liang",
    zhuyin: "%ㄩㄝˋ %ㄌㄧㄤ˙",
    chars: [
      { char: "月", initial: "y", final: "ue", tone: 4, pinyin: "yuè", zhuyin: "ㄩㄝˋ", exampleChar: "樂" },
      { char: "亮", initial: "l", final: "iang", tone: 0, pinyin: "liang", zhuyin: "ㄌㄧㄤ˙", exampleChar: "量" }
    ]
  },
  {
    word: "飛機",
    emoji: "✈️",
    english: "Airplane",
    pinyin: "fēi jī",
    zhuyin: "%ㄈㄟ %ㄐㄧ",
    chars: [
      { char: "飛", initial: "f", final: "ei", tone: 1, pinyin: "fēi", zhuyin: "ㄈㄟ", exampleChar: "非" },
      { char: "機", initial: "j", final: "i", tone: 1, pinyin: "jī", zhuyin: "ㄐㄧ", exampleChar: "雞" }
    ]
  },
  {
    word: "火車",
    emoji: "🚂",
    english: "Train",
    pinyin: "huǒ chē",
    zhuyin: "%跑 %ㄔㄜ",
    chars: [
      { char: "火", initial: "h", final: "uo", tone: 3, pinyin: "huǒ", zhuyin: "ㄏㄨㄛˇ", exampleChar: "伙" },
      { char: "車", initial: "ch", final: "e", tone: 1, pinyin: "chē", zhuyin: "ㄔㄜ", exampleChar: "遮" }
    ]
  },
{
    "word": "戮力同心",
    "emoji": "📚",
    "english": "齊心合力，團結一致。＃語出《墨子．尚賢中》。 △「同心同德」、「同心協力」、「群策群力」",
    "pinyin": "lù lì tóng xīn",
    "zhuyin": "%ㄌㄨˋ %ㄌㄧˋ %ㄊㄨㄥˊ %ㄒㄧㄣ",
    "chars": [
      {
        "char": "戮",
        "initial": "l",
        "final": "u",
        "tone": 4,
        "pinyin": "lù",
        "zhuyin": "ㄌㄨˋ"
      },
      {
        "char": "力",
        "initial": "l",
        "final": "i",
        "tone": 4,
        "pinyin": "lì",
        "zhuyin": "ㄌㄧˋ"
      },
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      }
    ]
  },
  {
    "word": "一心一意",
    "emoji": "💡",
    "english": "同心同意。亦用於指心意專一，毫無他念。＃語本《杜氏新書》。 △「全心全意」",
    "pinyin": "yī xīn yī yì",
    "zhuyin": "%ㄧ %ㄒㄧㄣ %ㄧ %ㄧˋ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      },
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "意",
        "initial": "y",
        "final": "i",
        "tone": 4,
        "pinyin": "yì",
        "zhuyin": "ㄧˋ"
      }
    ]
  },
  {
    "word": "一視同仁",
    "emoji": "🧠",
    "english": "同樣以博愛的仁心，對待所有的人及禽獸。語出唐．韓愈〈原人〉。後用「一視同仁」指平等待人，不分親疏厚薄。",
    "pinyin": "yī shì tóng rén",
    "zhuyin": "%ㄧ %ㄕˋ %ㄊㄨㄥˊ %ㄖㄣˊ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "視",
        "initial": "sh",
        "final": "i",
        "tone": 4,
        "pinyin": "shì",
        "zhuyin": "ㄕˋ"
      },
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "仁",
        "initial": "r",
        "final": "en",
        "tone": 2,
        "pinyin": "rén",
        "zhuyin": "ㄖㄣˊ"
      }
    ]
  },
  {
    "word": "南柯一夢",
    "emoji": "📖",
    "english": "淳于棼夢中出任南柯太守，歷盡人生窮通榮辱，醒來才知道是一場夢。典出唐．李公佐《南柯太守傳》。後用「南柯一夢」比喻人生如夢，富貴得失無常。",
    "pinyin": "nán kē yī mèng",
    "zhuyin": "%ㄋㄢˊ %ㄎㄜ %ㄧ %ㄇㄥˋ",
    "chars": [
      {
        "char": "南",
        "initial": "n",
        "final": "an",
        "tone": 2,
        "pinyin": "nán",
        "zhuyin": "ㄋㄢˊ"
      },
      {
        "char": "柯",
        "initial": "k",
        "final": "e",
        "tone": 1,
        "pinyin": "kē",
        "zhuyin": "ㄎㄜ"
      },
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "夢",
        "initial": "m",
        "final": "eng",
        "tone": 4,
        "pinyin": "mèng",
        "zhuyin": "ㄇㄥˋ"
      }
    ]
  },
  {
    "word": "一鼓作氣",
    "emoji": "✨",
    "english": "古代作戰時，第一通鼓最能激起戰士們的勇氣。語出《左傳．莊公十年》。後用「一鼓作氣」比喻做事時要趁著初起時的勇氣去做才容易成功。",
    "pinyin": "yī gǔ zuò qì",
    "zhuyin": "%ㄧ %ㄍㄨˇ %ㄗㄨㄛˋ %ㄑㄧˋ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "鼓",
        "initial": "g",
        "final": "u",
        "tone": 3,
        "pinyin": "gǔ",
        "zhuyin": "ㄍㄨˇ"
      },
      {
        "char": "作",
        "initial": "z",
        "final": "uo",
        "tone": 4,
        "pinyin": "zuò",
        "zhuyin": "ㄗㄨㄛˋ"
      },
      {
        "char": "氣",
        "initial": "q",
        "final": "i",
        "tone": 4,
        "pinyin": "qì",
        "zhuyin": "ㄑㄧˋ"
      }
    ]
  },
  {
    "word": "趾高氣揚",
    "emoji": "🌟",
    "english": "走路時腳抬得很高，樣子顯得十分神氣。形容人驕傲自滿、得意忘形。＃語本《戰國策．齊策三》。",
    "pinyin": "zhǐ gāo qì yáng",
    "zhuyin": "%ㄓˇ %ㄍㄠ %ㄑㄧˋ %ㄧㄤˊ",
    "chars": [
      {
        "char": "趾",
        "initial": "zh",
        "final": "i",
        "tone": 3,
        "pinyin": "zhǐ",
        "zhuyin": "ㄓˇ"
      },
      {
        "char": "高",
        "initial": "g",
        "final": "ao",
        "tone": 1,
        "pinyin": "gāo",
        "zhuyin": "ㄍㄠ"
      },
      {
        "char": "氣",
        "initial": "q",
        "final": "i",
        "tone": 4,
        "pinyin": "qì",
        "zhuyin": "ㄑㄧˋ"
      },
      {
        "char": "揚",
        "initial": "y",
        "final": "ang",
        "tone": 2,
        "pinyin": "yáng",
        "zhuyin": "ㄧㄤˊ"
      }
    ]
  },
  {
    "word": "彈丸之地",
    "emoji": "📜",
    "english": "像彈丸一樣大小的地方。比喻狹小的地方。語出《戰國策．趙策三》。",
    "pinyin": "dàn wán zhī dì",
    "zhuyin": "%ㄉㄢˋ %ㄨㄢˊ %ㄓ %ㄉㄧˋ",
    "chars": [
      {
        "char": "彈",
        "initial": "d",
        "final": "an",
        "tone": 4,
        "pinyin": "dàn",
        "zhuyin": "ㄉㄢˋ"
      },
      {
        "char": "丸",
        "initial": "w",
        "final": "an",
        "tone": 2,
        "pinyin": "wán",
        "zhuyin": "ㄨㄢˊ"
      },
      {
        "char": "之",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "地",
        "initial": "d",
        "final": "i",
        "tone": 4,
        "pinyin": "dì",
        "zhuyin": "ㄉㄧˋ"
      }
    ]
  },
  {
    "word": "呼天搶地",
    "emoji": "🎒",
    "english": "「呼天」，呼叫蒼天。※語或出《史記．卷八四．屈原賈生列傳．屈原》。「搶地」，用頭撞地。語出《戰國策．魏策四》。後以「呼天搶地」指情緒激動，無處宣洩，只能大聲喊天，用頭撞地。形容極度哀傷、悲痛。",
    "pinyin": "hū tiān qiāng dì",
    "zhuyin": "%ㄏㄨ %ㄊㄧㄢ %ㄑㄧㄤ %ㄉㄧˋ",
    "chars": [
      {
        "char": "呼",
        "initial": "h",
        "final": "u",
        "tone": 1,
        "pinyin": "hū",
        "zhuyin": "ㄏㄨ"
      },
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "搶",
        "initial": "q",
        "final": "iang",
        "tone": 1,
        "pinyin": "qiāng",
        "zhuyin": "ㄑㄧㄤ"
      },
      {
        "char": "地",
        "initial": "d",
        "final": "i",
        "tone": 4,
        "pinyin": "dì",
        "zhuyin": "ㄉㄧˋ"
      }
    ]
  },
  {
    "word": "一呼百諾",
    "emoji": "🎓",
    "english": "在上位者一呼喚，在下位者則連聲應諾。形容恭敬順從。語本《韓詩外傳》。後用「一呼百諾」形容權勢顯赫，隨從盛多。",
    "pinyin": "yī hū bǎi nuò",
    "zhuyin": "%ㄧ %ㄏㄨ %ㄅㄞˇ %ㄋㄨㄛˋ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "呼",
        "initial": "h",
        "final": "u",
        "tone": 1,
        "pinyin": "hū",
        "zhuyin": "ㄏㄨ"
      },
      {
        "char": "百",
        "initial": "b",
        "final": "ai",
        "tone": 3,
        "pinyin": "bǎi",
        "zhuyin": "ㄅㄞˇ"
      },
      {
        "char": "諾",
        "initial": "n",
        "final": "uo",
        "tone": 4,
        "pinyin": "nuò",
        "zhuyin": "ㄋㄨㄛˋ"
      }
    ]
  },
  {
    "word": "明知故犯",
    "emoji": "🧩",
    "english": "形容明明知道不對，卻故意去做。語本宋．陳世崇《隨隱漫錄》卷一。",
    "pinyin": "míng zhī gù fàn",
    "zhuyin": "%ㄇㄧㄥˊ %ㄓ %ㄍㄨˋ %ㄈㄢˋ",
    "chars": [
      {
        "char": "明",
        "initial": "m",
        "final": "ing",
        "tone": 2,
        "pinyin": "míng",
        "zhuyin": "ㄇㄧㄥˊ"
      },
      {
        "char": "知",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "故",
        "initial": "g",
        "final": "u",
        "tone": 4,
        "pinyin": "gù",
        "zhuyin": "ㄍㄨˋ"
      },
      {
        "char": "犯",
        "initial": "f",
        "final": "an",
        "tone": 4,
        "pinyin": "fàn",
        "zhuyin": "ㄈㄢˋ"
      }
    ]
  },
  {
    "word": "相知恨晚",
    "emoji": "📚",
    "english": "憾恨相知不早。語本《史記．卷一○七．魏其武安侯列傳》。 △「相見恨晚」",
    "pinyin": "xiāng zhī hèn wǎn",
    "zhuyin": "%ㄒㄧㄤ %ㄓ %ㄏㄣˋ %ㄨㄢˇ",
    "chars": [
      {
        "char": "相",
        "initial": "x",
        "final": "iang",
        "tone": 1,
        "pinyin": "xiāng",
        "zhuyin": "ㄒㄧㄤ"
      },
      {
        "char": "知",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "恨",
        "initial": "h",
        "final": "en",
        "tone": 4,
        "pinyin": "hèn",
        "zhuyin": "ㄏㄣˋ"
      },
      {
        "char": "晚",
        "initial": "w",
        "final": "an",
        "tone": 3,
        "pinyin": "wǎn",
        "zhuyin": "ㄨㄢˇ"
      }
    ]
  },
  {
    "word": "大器晚成",
    "emoji": "💡",
    "english": "貴重的器物需要長時間才能完成。＃語出《老子》第四一章。後用「大器晚成」比喻卓越的人才往往成就較晚。",
    "pinyin": "dà qì wǎn chéng",
    "zhuyin": "%ㄉㄚˋ %ㄑㄧˋ %ㄨㄢˇ %ㄔㄥˊ",
    "chars": [
      {
        "char": "大",
        "initial": "d",
        "final": "a",
        "tone": 4,
        "pinyin": "dà",
        "zhuyin": "ㄉㄚˋ"
      },
      {
        "char": "器",
        "initial": "q",
        "final": "i",
        "tone": 4,
        "pinyin": "qì",
        "zhuyin": "ㄑㄧˋ"
      },
      {
        "char": "晚",
        "initial": "w",
        "final": "an",
        "tone": 3,
        "pinyin": "wǎn",
        "zhuyin": "ㄨㄢˇ"
      },
      {
        "char": "成",
        "initial": "ch",
        "final": "eng",
        "tone": 2,
        "pinyin": "chéng",
        "zhuyin": "ㄔㄥˊ"
      }
    ]
  },
  {
    "word": "見獵心喜",
    "emoji": "🧠",
    "english": "看到有人打獵，激起舊日的愛好而心喜。＃語本宋．周敦頤〈周子遺事〉。後用「見獵心喜」比喻舊習難忘，看見有人在做自己所愛好的事情，便心情愉悅而躍躍欲試。也單指見到喜愛事物而心中欣喜。",
    "pinyin": "jiàn liè xīn xǐ",
    "zhuyin": "%ㄐㄧㄢˋ %ㄌㄧㄝˋ %ㄒㄧㄣ %ㄒㄧˇ",
    "chars": [
      {
        "char": "見",
        "initial": "j",
        "final": "ian",
        "tone": 4,
        "pinyin": "jiàn",
        "zhuyin": "ㄐㄧㄢˋ"
      },
      {
        "char": "獵",
        "initial": "l",
        "final": "ie",
        "tone": 4,
        "pinyin": "liè",
        "zhuyin": "ㄌㄧㄝˋ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      },
      {
        "char": "喜",
        "initial": "x",
        "final": "i",
        "tone": 3,
        "pinyin": "xǐ",
        "zhuyin": "ㄒㄧˇ"
      }
    ]
  },
  {
    "word": "圖窮匕見",
    "emoji": "📖",
    "english": "見，音ㄒㄧㄢˋ，顯露。「圖窮匕見」指戰國時荊軻欲刺秦始皇，藏匕首於地圖中，地圖打開至盡頭時，露出匕首。＃典出《戰國策．燕策三》。後用「圖窮匕見」比喻事情發展到最後，形跡敗露，現出真相。",
    "pinyin": "tú qióng bǐ xiàn",
    "zhuyin": "%ㄊㄨˊ %ㄑㄩㄥˊ %ㄅㄧˇ %ㄒㄧㄢˋ",
    "chars": [
      {
        "char": "圖",
        "initial": "t",
        "final": "u",
        "tone": 2,
        "pinyin": "tú",
        "zhuyin": "ㄊㄨˊ"
      },
      {
        "char": "窮",
        "initial": "q",
        "final": "iong",
        "tone": 2,
        "pinyin": "qióng",
        "zhuyin": "ㄑㄩㄥˊ"
      },
      {
        "char": "匕",
        "initial": "b",
        "final": "i",
        "tone": 3,
        "pinyin": "bǐ",
        "zhuyin": "ㄅㄧˇ"
      },
      {
        "char": "見",
        "initial": "x",
        "final": "ian",
        "tone": 4,
        "pinyin": "xiàn",
        "zhuyin": "ㄒㄧㄢˋ"
      }
    ]
  },
  {
    "word": "按圖索驥",
    "emoji": "✨",
    "english": "按照前人所畫的圖象，去尋求當代的良馬。比喻做事拘泥成規，呆板不知變通。語本《漢書．卷六七．楊胡米梅云傳．梅福》。後亦用「按圖索驥」比喻按照所掌握的線索辦事。",
    "pinyin": "àn tú suǒ jì",
    "zhuyin": "%ㄢˋ %ㄊㄨˊ %ㄙㄨㄛˇ %ㄐㄧˋ",
    "chars": [
      {
        "char": "按",
        "initial": "",
        "final": "an",
        "tone": 4,
        "pinyin": "àn",
        "zhuyin": "ㄢˋ"
      },
      {
        "char": "圖",
        "initial": "t",
        "final": "u",
        "tone": 2,
        "pinyin": "tú",
        "zhuyin": "ㄊㄨˊ"
      },
      {
        "char": "索",
        "initial": "s",
        "final": "uo",
        "tone": 3,
        "pinyin": "suǒ",
        "zhuyin": "ㄙㄨㄛˇ"
      },
      {
        "char": "驥",
        "initial": "j",
        "final": "i",
        "tone": 4,
        "pinyin": "jì",
        "zhuyin": "ㄐㄧˋ"
      }
    ]
  },
  {
    "word": "滿城風雨",
    "emoji": "🌟",
    "english": "滿城，到處都颳風下雨的景象。本指自然現象，這種現象多出現在重陽或晚春時節。※語或出宋．釋惠洪《冷齋夜話．卷四．滿城風雨近重陽》。後「滿城風雨」語義一轉，也用來指事情一經傳出，便流言四起，到處議論紛紛。",
    "pinyin": "mǎn chéng fēng yǔ",
    "zhuyin": "%ㄇㄢˇ %ㄔㄥˊ %ㄈㄥ %ㄩˇ",
    "chars": [
      {
        "char": "滿",
        "initial": "m",
        "final": "an",
        "tone": 3,
        "pinyin": "mǎn",
        "zhuyin": "ㄇㄢˇ"
      },
      {
        "char": "城",
        "initial": "ch",
        "final": "eng",
        "tone": 2,
        "pinyin": "chéng",
        "zhuyin": "ㄔㄥˊ"
      },
      {
        "char": "風",
        "initial": "f",
        "final": "eng",
        "tone": 1,
        "pinyin": "fēng",
        "zhuyin": "ㄈㄥ"
      },
      {
        "char": "雨",
        "initial": "y",
        "final": "u",
        "tone": 3,
        "pinyin": "yǔ",
        "zhuyin": "ㄩˇ"
      }
    ]
  },
  {
    "word": "春風化雨",
    "emoji": "📜",
    "english": "「春風」，春風吹拂，化育萬物。語出漢．劉向《說苑．卷五．貴德》。「化雨」，雨水灌育草木。語本《孟子．盡心上》。「春風化雨」指適合草木生長的和風及雨水，亦用於比喻師長和藹親切的教導。 △「春風風人」、「夏雨雨人」",
    "pinyin": "chūn fēng huà yǔ",
    "zhuyin": "%ㄔㄨㄣ %ㄈㄥ %ㄏㄨㄚˋ %ㄩˇ",
    "chars": [
      {
        "char": "春",
        "initial": "ch",
        "final": "un",
        "tone": 1,
        "pinyin": "chūn",
        "zhuyin": "ㄔㄨㄣ"
      },
      {
        "char": "風",
        "initial": "f",
        "final": "eng",
        "tone": 1,
        "pinyin": "fēng",
        "zhuyin": "ㄈㄥ"
      },
      {
        "char": "化",
        "initial": "h",
        "final": "ua",
        "tone": 4,
        "pinyin": "huà",
        "zhuyin": "ㄏㄨㄚˋ"
      },
      {
        "char": "雨",
        "initial": "y",
        "final": "u",
        "tone": 3,
        "pinyin": "yǔ",
        "zhuyin": "ㄩˇ"
      }
    ]
  },
  {
    "word": "金城湯池",
    "emoji": "🎒",
    "english": "金城，金屬造的城。湯池，沸水流動的護城河。「金城湯池」形容堅固險阻的城池。＃語出《漢書．卷四五．蒯伍江息夫傳．蒯通》。",
    "pinyin": "jīn chéng tāng chí",
    "zhuyin": "%ㄐㄧㄣ %ㄔㄥˊ %ㄊㄤ %ㄔˊ",
    "chars": [
      {
        "char": "金",
        "initial": "j",
        "final": "in",
        "tone": 1,
        "pinyin": "jīn",
        "zhuyin": "ㄐㄧㄣ"
      },
      {
        "char": "城",
        "initial": "ch",
        "final": "eng",
        "tone": 2,
        "pinyin": "chéng",
        "zhuyin": "ㄔㄥˊ"
      },
      {
        "char": "湯",
        "initial": "t",
        "final": "ang",
        "tone": 1,
        "pinyin": "tāng",
        "zhuyin": "ㄊㄤ"
      },
      {
        "char": "池",
        "initial": "ch",
        "final": "i",
        "tone": 2,
        "pinyin": "chí",
        "zhuyin": "ㄔˊ"
      }
    ]
  },
  {
    "word": "杯水車薪",
    "emoji": "🎓",
    "english": "以一杯水去撲滅一車木柴所燃起的火。比喻力量太小，無濟於事。＃語本《孟子．告子上》。 △「無濟於事」",
    "pinyin": "bēi shuǐ jū xīn",
    "zhuyin": "%ㄅㄟ %ㄕㄨㄟˇ %ㄐㄩ %ㄒㄧㄣ",
    "chars": [
      {
        "char": "杯",
        "initial": "b",
        "final": "ei",
        "tone": 1,
        "pinyin": "bēi",
        "zhuyin": "ㄅㄟ"
      },
      {
        "char": "水",
        "initial": "sh",
        "final": "ui",
        "tone": 3,
        "pinyin": "shuǐ",
        "zhuyin": "ㄕㄨㄟˇ"
      },
      {
        "char": "車",
        "initial": "j",
        "final": "u",
        "tone": 1,
        "pinyin": "jū",
        "zhuyin": "ㄐㄩ"
      },
      {
        "char": "薪",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      }
    ]
  },
  {
    "word": "細水長流",
    "emoji": "🧩",
    "english": "「細水長流」典源作「小水長流」，細、小同義；長、常義近。謂水流細而能常久流動，比喻力量微小而能持之以恆，終有所成。語本《佛遺教經》。後亦用「細水長流」形容節約使用財物，而長久不缺。",
    "pinyin": "xì shuǐ cháng liú",
    "zhuyin": "%ㄒㄧˋ %ㄕㄨㄟˇ %ㄔㄤˊ %ㄌㄧㄡˊ",
    "chars": [
      {
        "char": "細",
        "initial": "x",
        "final": "i",
        "tone": 4,
        "pinyin": "xì",
        "zhuyin": "ㄒㄧˋ"
      },
      {
        "char": "水",
        "initial": "sh",
        "final": "ui",
        "tone": 3,
        "pinyin": "shuǐ",
        "zhuyin": "ㄕㄨㄟˇ"
      },
      {
        "char": "長",
        "initial": "ch",
        "final": "ang",
        "tone": 2,
        "pinyin": "cháng",
        "zhuyin": "ㄔㄤˊ"
      },
      {
        "char": "流",
        "initial": "l",
        "final": "iu",
        "tone": 2,
        "pinyin": "liú",
        "zhuyin": "ㄌㄧㄡˊ"
      }
    ]
  },
  {
    "word": "從善如流",
    "emoji": "📚",
    "english": "聽從好的意見，就像流水般的自然順暢。比喻樂於接受別人好的意見。◎語出《左傳．成公八年》。 △「從誨如流」、「從諫如流」",
    "pinyin": "cóng shàn rú liú",
    "zhuyin": "%ㄘㄨㄥˊ %ㄕㄢˋ %ㄖㄨˊ %ㄌㄧㄡˊ",
    "chars": [
      {
        "char": "從",
        "initial": "c",
        "final": "ong",
        "tone": 2,
        "pinyin": "cóng",
        "zhuyin": "ㄘㄨㄥˊ"
      },
      {
        "char": "善",
        "initial": "sh",
        "final": "an",
        "tone": 4,
        "pinyin": "shàn",
        "zhuyin": "ㄕㄢˋ"
      },
      {
        "char": "如",
        "initial": "r",
        "final": "u",
        "tone": 2,
        "pinyin": "rú",
        "zhuyin": "ㄖㄨˊ"
      },
      {
        "char": "流",
        "initial": "l",
        "final": "iu",
        "tone": 2,
        "pinyin": "liú",
        "zhuyin": "ㄌㄧㄡˊ"
      }
    ]
  },
  {
    "word": "正中下懷",
    "emoji": "💡",
    "english": "恰好符合自己的心意。※語或出《水滸傳》第六三回。",
    "pinyin": "zhèng zhòng xià huái",
    "zhuyin": "%ㄓㄥˋ %ㄓㄨㄥˋ %ㄒㄧㄚˋ %ㄏㄨㄞˊ",
    "chars": [
      {
        "char": "正",
        "initial": "zh",
        "final": "eng",
        "tone": 4,
        "pinyin": "zhèng",
        "zhuyin": "ㄓㄥˋ"
      },
      {
        "char": "中",
        "initial": "zh",
        "final": "ong",
        "tone": 4,
        "pinyin": "zhòng",
        "zhuyin": "ㄓㄨㄥˋ"
      },
      {
        "char": "下",
        "initial": "x",
        "final": "ia",
        "tone": 4,
        "pinyin": "xià",
        "zhuyin": "ㄒㄧㄚˋ"
      },
      {
        "char": "懷",
        "initial": "h",
        "final": "uai",
        "tone": 2,
        "pinyin": "huái",
        "zhuyin": "ㄏㄨㄞˊ"
      }
    ]
  },
  {
    "word": "撥亂反正",
    "emoji": "🧠",
    "english": "扭轉亂象，歸於正道。語出《公羊傳．哀公十四年》。",
    "pinyin": "bō luàn fǎn zhèng",
    "zhuyin": "%ㄅㄛ %ㄌㄨㄢˋ %ㄈㄢˇ %ㄓㄥˋ",
    "chars": [
      {
        "char": "撥",
        "initial": "b",
        "final": "o",
        "tone": 1,
        "pinyin": "bō",
        "zhuyin": "ㄅㄛ"
      },
      {
        "char": "亂",
        "initial": "l",
        "final": "uan",
        "tone": 4,
        "pinyin": "luàn",
        "zhuyin": "ㄌㄨㄢˋ"
      },
      {
        "char": "反",
        "initial": "f",
        "final": "an",
        "tone": 3,
        "pinyin": "fǎn",
        "zhuyin": "ㄈㄢˇ"
      },
      {
        "char": "正",
        "initial": "zh",
        "final": "eng",
        "tone": 4,
        "pinyin": "zhèng",
        "zhuyin": "ㄓㄥˋ"
      }
    ]
  },
  {
    "word": "坐懷不亂",
    "emoji": "📖",
    "english": "春秋時魯國柳下惠夜宿城門，遇一來不及進城回家的女子，柳下惠恐女子受凍，使其坐己懷中，以衣裹之，而整夜無不規矩的舉動。＃典出《詩經．小雅．巷伯》漢．毛亨傳。後用「坐懷不亂」形容男子行事端正，雖與女子同處而不淫亂。",
    "pinyin": "zuò huái bù luàn",
    "zhuyin": "%ㄗㄨㄛˋ %ㄏㄨㄞˊ %ㄅㄨˋ %ㄌㄨㄢˋ",
    "chars": [
      {
        "char": "坐",
        "initial": "z",
        "final": "uo",
        "tone": 4,
        "pinyin": "zuò",
        "zhuyin": "ㄗㄨㄛˋ"
      },
      {
        "char": "懷",
        "initial": "h",
        "final": "uai",
        "tone": 2,
        "pinyin": "huái",
        "zhuyin": "ㄏㄨㄞˊ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "亂",
        "initial": "l",
        "final": "uan",
        "tone": 4,
        "pinyin": "luàn",
        "zhuyin": "ㄌㄨㄢˋ"
      }
    ]
  },
  {
    "word": "舉足輕重",
    "emoji": "✨",
    "english": "一舉腳就會影響兩邊的輕重。形容所居地位極為重要，一舉一動皆足以影響全局。語本《後漢書．卷二三．竇融列傳》。",
    "pinyin": "jǔ zú qīng zhòng",
    "zhuyin": "%ㄐㄩˇ %ㄗㄨˊ %ㄑㄧㄥ %ㄓㄨㄥˋ",
    "chars": [
      {
        "char": "舉",
        "initial": "j",
        "final": "u",
        "tone": 3,
        "pinyin": "jǔ",
        "zhuyin": "ㄐㄩˇ"
      },
      {
        "char": "足",
        "initial": "z",
        "final": "u",
        "tone": 2,
        "pinyin": "zú",
        "zhuyin": "ㄗㄨˊ"
      },
      {
        "char": "輕",
        "initial": "q",
        "final": "ing",
        "tone": 1,
        "pinyin": "qīng",
        "zhuyin": "ㄑㄧㄥ"
      },
      {
        "char": "重",
        "initial": "zh",
        "final": "ong",
        "tone": 4,
        "pinyin": "zhòng",
        "zhuyin": "ㄓㄨㄥˋ"
      }
    ]
  },
  {
    "word": "輕舉妄動",
    "emoji": "🌟",
    "english": "輕，輕率。妄，胡亂。「輕舉妄動」形容未經慎重考慮，即輕率地採取行動。◎語本《韓非子．解老》。",
    "pinyin": "qīng jǔ wàng dòng",
    "zhuyin": "%ㄑㄧㄥ %ㄐㄩˇ %ㄨㄤˋ %ㄉㄨㄥˋ",
    "chars": [
      {
        "char": "輕",
        "initial": "q",
        "final": "ing",
        "tone": 1,
        "pinyin": "qīng",
        "zhuyin": "ㄑㄧㄥ"
      },
      {
        "char": "舉",
        "initial": "j",
        "final": "u",
        "tone": 3,
        "pinyin": "jǔ",
        "zhuyin": "ㄐㄩˇ"
      },
      {
        "char": "妄",
        "initial": "w",
        "final": "ang",
        "tone": 4,
        "pinyin": "wàng",
        "zhuyin": "ㄨㄤˋ"
      },
      {
        "char": "動",
        "initial": "d",
        "final": "ong",
        "tone": 4,
        "pinyin": "dòng",
        "zhuyin": "ㄉㄨㄥˋ"
      }
    ]
  },
  {
    "word": "不動聲色",
    "emoji": "📜",
    "english": "一聲不響，不流露感情。語本唐．韓愈〈司徒兼侍中中書令許國公贈太尉韓公神道碑銘〉。後用「不動聲色」形容人遇事不張揚的冷靜態度。",
    "pinyin": "bù dòng shēng sè",
    "zhuyin": "%ㄅㄨˋ %ㄉㄨㄥˋ %ㄕㄥ %ㄙㄜˋ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "動",
        "initial": "d",
        "final": "ong",
        "tone": 4,
        "pinyin": "dòng",
        "zhuyin": "ㄉㄨㄥˋ"
      },
      {
        "char": "聲",
        "initial": "sh",
        "final": "eng",
        "tone": 1,
        "pinyin": "shēng",
        "zhuyin": "ㄕㄥ"
      },
      {
        "char": "色",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      }
    ]
  },
  {
    "word": "老馬識途",
    "emoji": "🎒",
    "english": "老馬認得走過的路。典出《韓非子．說林上》。後用「老馬識途」比喻有經驗的人對情況比較熟悉，容易把工作做好。",
    "pinyin": "lǎo mǎ shì tú",
    "zhuyin": "%ㄌㄠˇ %ㄇㄚˇ %ㄕˋ %ㄊㄨˊ",
    "chars": [
      {
        "char": "老",
        "initial": "l",
        "final": "ao",
        "tone": 3,
        "pinyin": "lǎo",
        "zhuyin": "ㄌㄠˇ"
      },
      {
        "char": "馬",
        "initial": "m",
        "final": "a",
        "tone": 3,
        "pinyin": "mǎ",
        "zhuyin": "ㄇㄚˇ"
      },
      {
        "char": "識",
        "initial": "sh",
        "final": "i",
        "tone": 4,
        "pinyin": "shì",
        "zhuyin": "ㄕˋ"
      },
      {
        "char": "途",
        "initial": "t",
        "final": "u",
        "tone": 2,
        "pinyin": "tú",
        "zhuyin": "ㄊㄨˊ"
      }
    ]
  },
  {
    "word": "殊途同歸",
    "emoji": "🎓",
    "english": "「殊途同歸」之「途」，典源作「塗」。「塗」通「途」。比喻採取的方法雖不同，所得的結果卻相同。語本《易經．繫辭下》。 △「異曲同工」",
    "pinyin": "shū tú tóng guī",
    "zhuyin": "%ㄕㄨ %ㄊㄨˊ %ㄊㄨㄥˊ %ㄍㄨㄟ",
    "chars": [
      {
        "char": "殊",
        "initial": "sh",
        "final": "u",
        "tone": 1,
        "pinyin": "shū",
        "zhuyin": "ㄕㄨ"
      },
      {
        "char": "途",
        "initial": "t",
        "final": "u",
        "tone": 2,
        "pinyin": "tú",
        "zhuyin": "ㄊㄨˊ"
      },
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "歸",
        "initial": "g",
        "final": "ui",
        "tone": 1,
        "pinyin": "guī",
        "zhuyin": "ㄍㄨㄟ"
      }
    ]
  },
  {
    "word": "同病相憐",
    "emoji": "🧩",
    "english": "有同樣不幸遭遇的人互相同情。語出漢．趙曄《吳越春秋．闔閭內傳》。 △「同憂相救」、「物傷其類」",
    "pinyin": "tóng bìng xiāng lián",
    "zhuyin": "%ㄊㄨㄥˊ %ㄅㄧㄥˋ %ㄒㄧㄤ %ㄌㄧㄢˊ",
    "chars": [
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "病",
        "initial": "b",
        "final": "ing",
        "tone": 4,
        "pinyin": "bìng",
        "zhuyin": "ㄅㄧㄥˋ"
      },
      {
        "char": "相",
        "initial": "x",
        "final": "iang",
        "tone": 1,
        "pinyin": "xiāng",
        "zhuyin": "ㄒㄧㄤ"
      },
      {
        "char": "憐",
        "initial": "l",
        "final": "ian",
        "tone": 2,
        "pinyin": "lián",
        "zhuyin": "ㄌㄧㄢˊ"
      }
    ]
  },
  {
    "word": "無的放矢",
    "emoji": "📚",
    "english": "沒有目標而胡亂放箭，比喻言語或行動沒有目的。語本唐．劉禹錫〈答容州竇中丞書〉。後亦用「無地放矢」比喻毫無事實根據而胡亂地指責、攻擊別人。 △「有的放矢」",
    "pinyin": "wú dì fàng shǐ",
    "zhuyin": "%ㄨˊ %ㄉㄧˋ %ㄈㄤˋ %ㄕˇ",
    "chars": [
      {
        "char": "無",
        "initial": "w",
        "final": "u",
        "tone": 2,
        "pinyin": "wú",
        "zhuyin": "ㄨˊ"
      },
      {
        "char": "的",
        "initial": "d",
        "final": "i",
        "tone": 4,
        "pinyin": "dì",
        "zhuyin": "ㄉㄧˋ"
      },
      {
        "char": "放",
        "initial": "f",
        "final": "ang",
        "tone": 4,
        "pinyin": "fàng",
        "zhuyin": "ㄈㄤˋ"
      },
      {
        "char": "矢",
        "initial": "sh",
        "final": "i",
        "tone": 3,
        "pinyin": "shǐ",
        "zhuyin": "ㄕˇ"
      }
    ]
  },
  {
    "word": "眾矢之的",
    "emoji": "💡",
    "english": "指眾人射箭的靶子。比喻眾人一致攻擊的目標。※語或本《明史．卷二三一．顧憲成等傳》。",
    "pinyin": "zhòng shǐ zhī dì",
    "zhuyin": "%ㄓㄨㄥˋ %ㄕˇ %ㄓ %ㄉㄧˋ",
    "chars": [
      {
        "char": "眾",
        "initial": "zh",
        "final": "ong",
        "tone": 4,
        "pinyin": "zhòng",
        "zhuyin": "ㄓㄨㄥˋ"
      },
      {
        "char": "矢",
        "initial": "sh",
        "final": "i",
        "tone": 3,
        "pinyin": "shǐ",
        "zhuyin": "ㄕˇ"
      },
      {
        "char": "之",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "的",
        "initial": "d",
        "final": "i",
        "tone": 4,
        "pinyin": "dì",
        "zhuyin": "ㄉㄧˋ"
      }
    ]
  },
  {
    "word": "放浪形骸",
    "emoji": "🧠",
    "english": "放浪，放縱、不受拘束。形骸，人的形體。「放浪形骸」指放縱性情於形體之外。語出晉．王羲之〈蘭亭集序〉。後用「放浪形骸」形容縱情放任，不受世俗禮教約束。",
    "pinyin": "fàng làng xíng hái",
    "zhuyin": "%ㄈㄤˋ %ㄌㄤˋ %ㄒㄧㄥˊ %ㄏㄞˊ",
    "chars": [
      {
        "char": "放",
        "initial": "f",
        "final": "ang",
        "tone": 4,
        "pinyin": "fàng",
        "zhuyin": "ㄈㄤˋ"
      },
      {
        "char": "浪",
        "initial": "l",
        "final": "ang",
        "tone": 4,
        "pinyin": "làng",
        "zhuyin": "ㄌㄤˋ"
      },
      {
        "char": "形",
        "initial": "x",
        "final": "ing",
        "tone": 2,
        "pinyin": "xíng",
        "zhuyin": "ㄒㄧㄥˊ"
      },
      {
        "char": "骸",
        "initial": "h",
        "final": "ai",
        "tone": 2,
        "pinyin": "hái",
        "zhuyin": "ㄏㄞˊ"
      }
    ]
  },
  {
    "word": "門庭若市",
    "emoji": "📖",
    "english": "門庭間來往的人很多，像市集一般熱鬧。比喻上門來的人很多。語出《戰國策．齊策一》。",
    "pinyin": "mén tíng ruò shì",
    "zhuyin": "%ㄇㄣˊ %ㄊㄧㄥˊ %ㄖㄨㄛˋ %ㄕˋ",
    "chars": [
      {
        "char": "門",
        "initial": "m",
        "final": "en",
        "tone": 2,
        "pinyin": "mén",
        "zhuyin": "ㄇㄣˊ"
      },
      {
        "char": "庭",
        "initial": "t",
        "final": "ing",
        "tone": 2,
        "pinyin": "tíng",
        "zhuyin": "ㄊㄧㄥˊ"
      },
      {
        "char": "若",
        "initial": "r",
        "final": "uo",
        "tone": 4,
        "pinyin": "ruò",
        "zhuyin": "ㄖㄨㄛˋ"
      },
      {
        "char": "市",
        "initial": "sh",
        "final": "i",
        "tone": 4,
        "pinyin": "shì",
        "zhuyin": "ㄕˋ"
      }
    ]
  },
  {
    "word": "分庭抗禮",
    "emoji": "✨",
    "english": "「分庭抗禮」之「抗」，典源作「伉」，對等、匹敵之義。「分庭抗禮」指分處庭中，相對設禮，以平等的禮節相見。比喻地位相當。語本《莊子．漁父》。後亦用「分庭抗禮」比喻兩者對立。 △「平起平坐」",
    "pinyin": "fēn tíng kàng lǐ",
    "zhuyin": "%ㄈㄣ %ㄊㄧㄥˊ %ㄎㄤˋ %ㄌㄧˇ",
    "chars": [
      {
        "char": "分",
        "initial": "f",
        "final": "en",
        "tone": 1,
        "pinyin": "fēn",
        "zhuyin": "ㄈㄣ"
      },
      {
        "char": "庭",
        "initial": "t",
        "final": "ing",
        "tone": 2,
        "pinyin": "tíng",
        "zhuyin": "ㄊㄧㄥˊ"
      },
      {
        "char": "抗",
        "initial": "k",
        "final": "ang",
        "tone": 4,
        "pinyin": "kàng",
        "zhuyin": "ㄎㄤˋ"
      },
      {
        "char": "禮",
        "initial": "l",
        "final": "i",
        "tone": 3,
        "pinyin": "lǐ",
        "zhuyin": "ㄌㄧˇ"
      }
    ]
  },
  {
    "word": "海市蜃樓",
    "emoji": "🌟",
    "english": "蜃，大蛤蜊。傳說蜃能吐氣而形成樓臺城市等景觀，其實這是由於光線折射造成的自然現象。語本《史記．卷二七．天官書》。後用「海市蜃樓」比喻虛幻的事物。 △「空中樓閣」",
    "pinyin": "hǎi shì shèn lóu",
    "zhuyin": "%ㄏㄞˇ %ㄕˋ %ㄕㄣˋ %ㄌㄡˊ",
    "chars": [
      {
        "char": "海",
        "initial": "h",
        "final": "ai",
        "tone": 3,
        "pinyin": "hǎi",
        "zhuyin": "ㄏㄞˇ"
      },
      {
        "char": "市",
        "initial": "sh",
        "final": "i",
        "tone": 4,
        "pinyin": "shì",
        "zhuyin": "ㄕˋ"
      },
      {
        "char": "蜃",
        "initial": "sh",
        "final": "en",
        "tone": 4,
        "pinyin": "shèn",
        "zhuyin": "ㄕㄣˋ"
      },
      {
        "char": "樓",
        "initial": "l",
        "final": "ou",
        "tone": 2,
        "pinyin": "lóu",
        "zhuyin": "ㄌㄡˊ"
      }
    ]
  },
  {
    "word": "葉公好龍",
    "emoji": "📜",
    "english": "指古人葉公以喜歡龍聞名，但真龍下凡到他家，他卻被嚇得面無人色。比喻所好似是而非，以致表裡不一，有名無實。＃典出《莊子》逸文。",
    "pinyin": "shè gōng hào lóng",
    "zhuyin": "%ㄕㄜˋ %ㄍㄨㄥ %ㄏㄠˋ %ㄌㄨㄥˊ",
    "chars": [
      {
        "char": "葉",
        "initial": "sh",
        "final": "e",
        "tone": 4,
        "pinyin": "shè",
        "zhuyin": "ㄕㄜˋ"
      },
      {
        "char": "公",
        "initial": "g",
        "final": "ong",
        "tone": 1,
        "pinyin": "gōng",
        "zhuyin": "ㄍㄨㄥ"
      },
      {
        "char": "好",
        "initial": "h",
        "final": "ao",
        "tone": 4,
        "pinyin": "hào",
        "zhuyin": "ㄏㄠˋ"
      },
      {
        "char": "龍",
        "initial": "l",
        "final": "ong",
        "tone": 2,
        "pinyin": "lóng",
        "zhuyin": "ㄌㄨㄥˊ"
      }
    ]
  },
  {
    "word": "乘龍快婿",
    "emoji": "🎒",
    "english": "比喻好女婿。＃典出《魏志》。",
    "pinyin": "chéng lóng kuài xù",
    "zhuyin": "%ㄔㄥˊ %ㄌㄨㄥˊ %ㄎㄨㄞˋ %ㄒㄩˋ",
    "chars": [
      {
        "char": "乘",
        "initial": "ch",
        "final": "eng",
        "tone": 2,
        "pinyin": "chéng",
        "zhuyin": "ㄔㄥˊ"
      },
      {
        "char": "龍",
        "initial": "l",
        "final": "ong",
        "tone": 2,
        "pinyin": "lóng",
        "zhuyin": "ㄌㄨㄥˊ"
      },
      {
        "char": "快",
        "initial": "k",
        "final": "uai",
        "tone": 4,
        "pinyin": "kuài",
        "zhuyin": "ㄎㄨㄞˋ"
      },
      {
        "char": "婿",
        "initial": "x",
        "final": "u",
        "tone": 4,
        "pinyin": "xù",
        "zhuyin": "ㄒㄩˋ"
      }
    ]
  },
  {
    "word": "葉落歸根",
    "emoji": "🎓",
    "english": "樹葉凋謝後，落回根處。比喻事物最後終須返回本源。＃語出《六祖大師法寶壇經．付囑品第十》。後亦用以比喻久居異地之人返回家鄉。 △「木落歸本」",
    "pinyin": "yè luò guī gēn",
    "zhuyin": "%ㄧㄝˋ %ㄌㄨㄛˋ %ㄍㄨㄟ %ㄍㄣ",
    "chars": [
      {
        "char": "葉",
        "initial": "y",
        "final": "e",
        "tone": 4,
        "pinyin": "yè",
        "zhuyin": "ㄧㄝˋ"
      },
      {
        "char": "落",
        "initial": "l",
        "final": "uo",
        "tone": 4,
        "pinyin": "luò",
        "zhuyin": "ㄌㄨㄛˋ"
      },
      {
        "char": "歸",
        "initial": "g",
        "final": "ui",
        "tone": 1,
        "pinyin": "guī",
        "zhuyin": "ㄍㄨㄟ"
      },
      {
        "char": "根",
        "initial": "g",
        "final": "en",
        "tone": 1,
        "pinyin": "gēn",
        "zhuyin": "ㄍㄣ"
      }
    ]
  },
  {
    "word": "一波三折",
    "emoji": "🧩",
    "english": "原指書法中的一捺，筆鋒需作三次轉折，使之曲折多姿。＃語本晉．王羲之〈題衛夫人筆陣圖後〉。後用「一波三折」形容聲音、文章的跌宕起伏多變，或比喻事情進行得曲折不順。",
    "pinyin": "yī bō sān zhé",
    "zhuyin": "%ㄧ %ㄅㄛ %ㄙㄢ %ㄓㄜˊ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "波",
        "initial": "b",
        "final": "o",
        "tone": 1,
        "pinyin": "bō",
        "zhuyin": "ㄅㄛ"
      },
      {
        "char": "三",
        "initial": "s",
        "final": "an",
        "tone": 1,
        "pinyin": "sān",
        "zhuyin": "ㄙㄢ"
      },
      {
        "char": "折",
        "initial": "zh",
        "final": "e",
        "tone": 2,
        "pinyin": "zhé",
        "zhuyin": "ㄓㄜˊ"
      }
    ]
  },
  {
    "word": "一朝一夕",
    "emoji": "📚",
    "english": "朝，早晨。夕，傍晚。「一朝一夕」形容時間短暫。語出《易經．坤卦．文言》。",
    "pinyin": "yī zhāo yī xì",
    "zhuyin": "%ㄧ %ㄓㄠ %ㄧ %ㄒㄧˋ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "朝",
        "initial": "zh",
        "final": "ao",
        "tone": 1,
        "pinyin": "zhāo",
        "zhuyin": "ㄓㄠ"
      },
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "夕",
        "initial": "x",
        "final": "i",
        "tone": 4,
        "pinyin": "xì",
        "zhuyin": "ㄒㄧˋ"
      }
    ]
  },
  {
    "word": "朝令夕改",
    "emoji": "💡",
    "english": "早上下達的命令，到傍晚就改變了。比喻政令、主張或意見反覆無常。語本漢．鼂錯〈論貴粟疏〉。",
    "pinyin": "zhāo lìng xì gǎi",
    "zhuyin": "%ㄓㄠ %ㄌㄧㄥˋ %ㄒㄧˋ %ㄍㄞˇ",
    "chars": [
      {
        "char": "朝",
        "initial": "zh",
        "final": "ao",
        "tone": 1,
        "pinyin": "zhāo",
        "zhuyin": "ㄓㄠ"
      },
      {
        "char": "令",
        "initial": "l",
        "final": "ing",
        "tone": 4,
        "pinyin": "lìng",
        "zhuyin": "ㄌㄧㄥˋ"
      },
      {
        "char": "夕",
        "initial": "x",
        "final": "i",
        "tone": 4,
        "pinyin": "xì",
        "zhuyin": "ㄒㄧˋ"
      },
      {
        "char": "改",
        "initial": "g",
        "final": "ai",
        "tone": 3,
        "pinyin": "gǎi",
        "zhuyin": "ㄍㄞˇ"
      }
    ]
  },
  {
    "word": "普天同慶",
    "emoji": "🧠",
    "english": "「普天同慶」之「普」，典源作「溥」。「溥」通「普」。全天下的人共同慶祝。語本《三國志．卷二六．魏書．滿田牽郭傳．郭淮》。",
    "pinyin": "pǔ tiān tóng qìng",
    "zhuyin": "%ㄆㄨˇ %ㄊㄧㄢ %ㄊㄨㄥˊ %ㄑㄧㄥˋ",
    "chars": [
      {
        "char": "普",
        "initial": "p",
        "final": "u",
        "tone": 3,
        "pinyin": "pǔ",
        "zhuyin": "ㄆㄨˇ"
      },
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "慶",
        "initial": "q",
        "final": "ing",
        "tone": 4,
        "pinyin": "qìng",
        "zhuyin": "ㄑㄧㄥˋ"
      }
    ]
  },
  {
    "word": "不約而同",
    "emoji": "📖",
    "english": "彼此並未事先約定，而意見或行為卻相同。語本《史記．卷一一二．平津侯主父列傳．主父偃》。 △「不謀而合」",
    "pinyin": "bù yuē ér tóng",
    "zhuyin": "%ㄅㄨˋ %ㄩㄝ %ㄦˊ %ㄊㄨㄥˊ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "約",
        "initial": "y",
        "final": "ue",
        "tone": 1,
        "pinyin": "yuē",
        "zhuyin": "ㄩㄝ"
      },
      {
        "char": "而",
        "initial": "",
        "final": "er",
        "tone": 2,
        "pinyin": "ér",
        "zhuyin": "ㄦˊ"
      },
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      }
    ]
  },
  {
    "word": "天涯海角",
    "emoji": "✨",
    "english": "「天涯海角」之「海」，典源作「地」。形容偏僻或相距遙遠的地方。※語或本南朝陳．徐陵〈武皇帝作相時與嶺南酋豪書〉。 △「天南地北」、「天涯海際」",
    "pinyin": "tiān yá hǎi jiǎo",
    "zhuyin": "%ㄊㄧㄢ %ㄧㄚˊ %ㄏㄞˇ %ㄐㄧㄠˇ",
    "chars": [
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "涯",
        "initial": "y",
        "final": "a",
        "tone": 2,
        "pinyin": "yá",
        "zhuyin": "ㄧㄚˊ"
      },
      {
        "char": "海",
        "initial": "h",
        "final": "ai",
        "tone": 3,
        "pinyin": "hǎi",
        "zhuyin": "ㄏㄞˇ"
      },
      {
        "char": "角",
        "initial": "j",
        "final": "iao",
        "tone": 3,
        "pinyin": "jiǎo",
        "zhuyin": "ㄐㄧㄠˇ"
      }
    ]
  },
  {
    "word": "入不敷出",
    "emoji": "🌟",
    "english": "敷，足夠。收入不夠支出。※語或出清．朱彝尊《竹垞詩話．卷下．臣士下．倪嘉慶》。 △「寅吃卯糧」",
    "pinyin": "rù bù fū chū",
    "zhuyin": "%ㄖㄨˋ %ㄅㄨˋ %ㄈㄨ %ㄔㄨ",
    "chars": [
      {
        "char": "入",
        "initial": "r",
        "final": "u",
        "tone": 4,
        "pinyin": "rù",
        "zhuyin": "ㄖㄨˋ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "敷",
        "initial": "f",
        "final": "u",
        "tone": 1,
        "pinyin": "fū",
        "zhuyin": "ㄈㄨ"
      },
      {
        "char": "出",
        "initial": "ch",
        "final": "u",
        "tone": 1,
        "pinyin": "chū",
        "zhuyin": "ㄔㄨ"
      }
    ]
  },
  {
    "word": "敷衍塞責",
    "emoji": "📜",
    "english": "形容做事不認真負責，只是表面應付。※語或出清．張集馨《道咸宦海見聞錄．丁巳五十八歲》。 △「敷衍了事」",
    "pinyin": "fū yǎn sè zé",
    "zhuyin": "%ㄈㄨ %ㄧㄢˇ %ㄙㄜˋ %ㄗㄜˊ",
    "chars": [
      {
        "char": "敷",
        "initial": "f",
        "final": "u",
        "tone": 1,
        "pinyin": "fū",
        "zhuyin": "ㄈㄨ"
      },
      {
        "char": "衍",
        "initial": "y",
        "final": "an",
        "tone": 3,
        "pinyin": "yǎn",
        "zhuyin": "ㄧㄢˇ"
      },
      {
        "char": "塞",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      },
      {
        "char": "責",
        "initial": "z",
        "final": "e",
        "tone": 2,
        "pinyin": "zé",
        "zhuyin": "ㄗㄜˊ"
      }
    ]
  },
  {
    "word": "茅塞頓開",
    "emoji": "🎒",
    "english": "被茅草阻塞的山路，豁然開通了。比喻閉塞的心思，頓時豁然了悟。語本《孟子．盡心下》。",
    "pinyin": "máo sè dùn kāi",
    "zhuyin": "%ㄇㄠˊ %ㄙㄜˋ %ㄉㄨㄣˋ %ㄎㄞ",
    "chars": [
      {
        "char": "茅",
        "initial": "m",
        "final": "ao",
        "tone": 2,
        "pinyin": "máo",
        "zhuyin": "ㄇㄠˊ"
      },
      {
        "char": "塞",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      },
      {
        "char": "頓",
        "initial": "d",
        "final": "un",
        "tone": 4,
        "pinyin": "dùn",
        "zhuyin": "ㄉㄨㄣˋ"
      },
      {
        "char": "開",
        "initial": "k",
        "final": "ai",
        "tone": 1,
        "pinyin": "kāi",
        "zhuyin": "ㄎㄞ"
      }
    ]
  },
  {
    "word": "石破天驚",
    "emoji": "🎓",
    "english": "形容樂器彈奏出來的聲音激越高亢，驚天動地。語出唐．李賀〈李憑箜篌引〉。後用「石破天驚」形容事物或言論新奇驚人。",
    "pinyin": "shí pò tiān jīng",
    "zhuyin": "%ㄕˊ %ㄆㄛˋ %ㄊㄧㄢ %ㄐㄧㄥ",
    "chars": [
      {
        "char": "石",
        "initial": "sh",
        "final": "i",
        "tone": 2,
        "pinyin": "shí",
        "zhuyin": "ㄕˊ"
      },
      {
        "char": "破",
        "initial": "p",
        "final": "o",
        "tone": 4,
        "pinyin": "pò",
        "zhuyin": "ㄆㄛˋ"
      },
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "驚",
        "initial": "j",
        "final": "ing",
        "tone": 1,
        "pinyin": "jīng",
        "zhuyin": "ㄐㄧㄥ"
      }
    ]
  },
  {
    "word": "水滴石穿",
    "emoji": "🧩",
    "english": "滴水久了可使石穿。比喻持之以恆，事必有成。語本《尸子》。後亦用「水滴石穿」比喻小問題日積月累也會成為大問題。 △「繩鋸木斷」",
    "pinyin": "shuǐ dī shí chuān",
    "zhuyin": "%ㄕㄨㄟˇ %ㄉㄧ %ㄕˊ %ㄔㄨㄢ",
    "chars": [
      {
        "char": "水",
        "initial": "sh",
        "final": "ui",
        "tone": 3,
        "pinyin": "shuǐ",
        "zhuyin": "ㄕㄨㄟˇ"
      },
      {
        "char": "滴",
        "initial": "d",
        "final": "i",
        "tone": 1,
        "pinyin": "dī",
        "zhuyin": "ㄉㄧ"
      },
      {
        "char": "石",
        "initial": "sh",
        "final": "i",
        "tone": 2,
        "pinyin": "shí",
        "zhuyin": "ㄕˊ"
      },
      {
        "char": "穿",
        "initial": "ch",
        "final": "uan",
        "tone": 1,
        "pinyin": "chuān",
        "zhuyin": "ㄔㄨㄢ"
      }
    ]
  },
  {
    "word": "觸目驚心",
    "emoji": "📚",
    "english": "目光所及，令人內心深受衝擊。語本《南齊書．卷二二．豫章文獻王列傳》。形容事情景況，令人震驚。 △「劌目怵心」、「劌目鉥心」",
    "pinyin": "chù mù jīng xīn",
    "zhuyin": "%ㄔㄨˋ %ㄇㄨˋ %ㄐㄧㄥ %ㄒㄧㄣ",
    "chars": [
      {
        "char": "觸",
        "initial": "ch",
        "final": "u",
        "tone": 4,
        "pinyin": "chù",
        "zhuyin": "ㄔㄨˋ"
      },
      {
        "char": "目",
        "initial": "m",
        "final": "u",
        "tone": 4,
        "pinyin": "mù",
        "zhuyin": "ㄇㄨˋ"
      },
      {
        "char": "驚",
        "initial": "j",
        "final": "ing",
        "tone": 1,
        "pinyin": "jīng",
        "zhuyin": "ㄐㄧㄥ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      }
    ]
  },
  {
    "word": "失魂落魄",
    "emoji": "💡",
    "english": "魂、魄，皆古人想像中一種能脫離人體而獨立存在的精神。「失魂落魄」形容人極度驚慌或精神恍惚、失其主宰。※語或出《初刻拍案驚奇》卷二五。 △「魂不守舍」",
    "pinyin": "shī hún luò pò",
    "zhuyin": "%ㄕ %ㄏㄨㄣˊ %ㄌㄨㄛˋ %ㄆㄛˋ",
    "chars": [
      {
        "char": "失",
        "initial": "sh",
        "final": "i",
        "tone": 1,
        "pinyin": "shī",
        "zhuyin": "ㄕ"
      },
      {
        "char": "魂",
        "initial": "h",
        "final": "un",
        "tone": 2,
        "pinyin": "hún",
        "zhuyin": "ㄏㄨㄣˊ"
      },
      {
        "char": "落",
        "initial": "l",
        "final": "uo",
        "tone": 4,
        "pinyin": "luò",
        "zhuyin": "ㄌㄨㄛˋ"
      },
      {
        "char": "魄",
        "initial": "p",
        "final": "o",
        "tone": 4,
        "pinyin": "pò",
        "zhuyin": "ㄆㄛˋ"
      }
    ]
  },
  {
    "word": "神魂顛倒",
    "emoji": "🧠",
    "english": "比喻精神恍惚，心意迷亂。※語或出《醒世恆言．卷一六．陸五漢硬留合色鞋》。 △「夢魂顛倒」",
    "pinyin": "shén hún diān dǎo",
    "zhuyin": "%ㄕㄣˊ %ㄏㄨㄣˊ %ㄉㄧㄢ %ㄉㄠˇ",
    "chars": [
      {
        "char": "神",
        "initial": "sh",
        "final": "en",
        "tone": 2,
        "pinyin": "shén",
        "zhuyin": "ㄕㄣˊ"
      },
      {
        "char": "魂",
        "initial": "h",
        "final": "un",
        "tone": 2,
        "pinyin": "hún",
        "zhuyin": "ㄏㄨㄣˊ"
      },
      {
        "char": "顛",
        "initial": "d",
        "final": "ian",
        "tone": 1,
        "pinyin": "diān",
        "zhuyin": "ㄉㄧㄢ"
      },
      {
        "char": "倒",
        "initial": "d",
        "final": "ao",
        "tone": 3,
        "pinyin": "dǎo",
        "zhuyin": "ㄉㄠˇ"
      }
    ]
  },
  {
    "word": "倒行逆施",
    "emoji": "📖",
    "english": "不按照情理行事。＃語本《史記．卷六六．伍子胥列傳》。後用「倒行逆施」比喻胡作非為的罪惡行徑。",
    "pinyin": "dào xíng nì shī",
    "zhuyin": "%ㄉㄠˋ %ㄒㄧㄥˊ %ㄋㄧˋ %ㄕ",
    "chars": [
      {
        "char": "倒",
        "initial": "d",
        "final": "ao",
        "tone": 4,
        "pinyin": "dào",
        "zhuyin": "ㄉㄠˋ"
      },
      {
        "char": "行",
        "initial": "x",
        "final": "ing",
        "tone": 2,
        "pinyin": "xíng",
        "zhuyin": "ㄒㄧㄥˊ"
      },
      {
        "char": "逆",
        "initial": "n",
        "final": "i",
        "tone": 4,
        "pinyin": "nì",
        "zhuyin": "ㄋㄧˋ"
      },
      {
        "char": "施",
        "initial": "sh",
        "final": "i",
        "tone": 1,
        "pinyin": "shī",
        "zhuyin": "ㄕ"
      }
    ]
  },
  {
    "word": "奮不顧身",
    "emoji": "✨",
    "english": "奮勇向前，不顧生死。＃語出漢．司馬遷〈報任少卿書〉。 △「大謬不然」、「戴盆望天」",
    "pinyin": "fèn bù gù shēn",
    "zhuyin": "%ㄈㄣˋ %ㄅㄨˋ %ㄍㄨˋ %ㄕㄣ",
    "chars": [
      {
        "char": "奮",
        "initial": "f",
        "final": "en",
        "tone": 4,
        "pinyin": "fèn",
        "zhuyin": "ㄈㄣˋ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "顧",
        "initial": "g",
        "final": "u",
        "tone": 4,
        "pinyin": "gù",
        "zhuyin": "ㄍㄨˋ"
      },
      {
        "char": "身",
        "initial": "sh",
        "final": "en",
        "tone": 1,
        "pinyin": "shēn",
        "zhuyin": "ㄕㄣ"
      }
    ]
  },
  {
    "word": "黃袍加身",
    "emoji": "🌟",
    "english": "黃袍，皇帝所服之袍。「黃袍加身」指被擁戴為皇帝。＃典出《宋史．卷一．太祖本紀》。",
    "pinyin": "huáng páo jiā shēn",
    "zhuyin": "%ㄏㄨㄤˊ %ㄆㄠˊ %ㄐㄧㄚ %ㄕㄣ",
    "chars": [
      {
        "char": "黃",
        "initial": "h",
        "final": "uang",
        "tone": 2,
        "pinyin": "huáng",
        "zhuyin": "ㄏㄨㄤˊ"
      },
      {
        "char": "袍",
        "initial": "p",
        "final": "ao",
        "tone": 2,
        "pinyin": "páo",
        "zhuyin": "ㄆㄠˊ"
      },
      {
        "char": "加",
        "initial": "j",
        "final": "ia",
        "tone": 1,
        "pinyin": "jiā",
        "zhuyin": "ㄐㄧㄚ"
      },
      {
        "char": "身",
        "initial": "sh",
        "final": "en",
        "tone": 1,
        "pinyin": "shēn",
        "zhuyin": "ㄕㄣ"
      }
    ]
  },
  {
    "word": "信口雌黃",
    "emoji": "📜",
    "english": "雌黃，橙黃色礦物，成分是三硫化二砷，可作退色劑，古代用於塗改文字。本指有如口中含著雌黃，能隨時改正不合意的語句。＃語本晉．孫盛《晉陽秋》。後用「信口雌黃」比喻不顧事實真相，隨口亂說或妄加批評。 △「妄下雌黃」、「信口開河」",
    "pinyin": "xìn kǒu cī huáng",
    "zhuyin": "%ㄒㄧㄣˋ %ㄎㄡˇ %ㄘ %ㄏㄨㄤˊ",
    "chars": [
      {
        "char": "信",
        "initial": "x",
        "final": "in",
        "tone": 4,
        "pinyin": "xìn",
        "zhuyin": "ㄒㄧㄣˋ"
      },
      {
        "char": "口",
        "initial": "k",
        "final": "ou",
        "tone": 3,
        "pinyin": "kǒu",
        "zhuyin": "ㄎㄡˇ"
      },
      {
        "char": "雌",
        "initial": "c",
        "final": "i",
        "tone": 1,
        "pinyin": "cī",
        "zhuyin": "ㄘ"
      },
      {
        "char": "黃",
        "initial": "h",
        "final": "uang",
        "tone": 2,
        "pinyin": "huáng",
        "zhuyin": "ㄏㄨㄤˊ"
      }
    ]
  },
  {
    "word": "鉤心鬥角",
    "emoji": "🎒",
    "english": "形容宮室建築的結構精緻巧妙。語出唐．杜牧〈阿房宮賦〉。後用「鉤心鬥角」比喻詩文的布局結構精心巧製，爭奇鬥勝。亦用於比喻競鬥心機，刻意經營。 △「明爭暗鬥」、「爾虞我詐」",
    "pinyin": "gōu xīn dòu jiǎo",
    "zhuyin": "%ㄍㄡ %ㄒㄧㄣ %ㄉㄡˋ %ㄐㄧㄠˇ",
    "chars": [
      {
        "char": "鉤",
        "initial": "g",
        "final": "ou",
        "tone": 1,
        "pinyin": "gōu",
        "zhuyin": "ㄍㄡ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      },
      {
        "char": "鬥",
        "initial": "d",
        "final": "ou",
        "tone": 4,
        "pinyin": "dòu",
        "zhuyin": "ㄉㄡˋ"
      },
      {
        "char": "角",
        "initial": "j",
        "final": "iao",
        "tone": 3,
        "pinyin": "jiǎo",
        "zhuyin": "ㄐㄧㄠˇ"
      }
    ]
  },
  {
    "word": "咫尺天涯",
    "emoji": "🎓",
    "english": "咫，周代八寸叫咫。咫尺，比喻距離很近。「咫尺天涯」比喻相距雖近，卻有如相隔天涯一般，無緣相見。語本唐．李中〈宮詞〉二首之一。 △「尺幅千里」",
    "pinyin": "zhǐ chǐ tiān yá",
    "zhuyin": "%ㄓˇ %ㄔˇ %ㄊㄧㄢ %ㄧㄚˊ",
    "chars": [
      {
        "char": "咫",
        "initial": "zh",
        "final": "i",
        "tone": 3,
        "pinyin": "zhǐ",
        "zhuyin": "ㄓˇ"
      },
      {
        "char": "尺",
        "initial": "ch",
        "final": "i",
        "tone": 3,
        "pinyin": "chǐ",
        "zhuyin": "ㄔˇ"
      },
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "涯",
        "initial": "y",
        "final": "a",
        "tone": 2,
        "pinyin": "yá",
        "zhuyin": "ㄧㄚˊ"
      }
    ]
  },
  {
    "word": "死灰復燃",
    "emoji": "🧩",
    "english": "「死灰復燃」之「燃」，典源作「然」。「然」同「燃」。「死灰復燃」是將已經熄滅的灰燼，又重新燃燒起來，比喻失勢者重新得勢。語本《史記．卷一○八．韓長孺列傳》。後亦用「死灰復燃」比喻已經平息的事物，又重新活動起來。",
    "pinyin": "sǐ huī fù rán",
    "zhuyin": "%ㄙˇ %ㄏㄨㄟ %ㄈㄨˋ %ㄖㄢˊ",
    "chars": [
      {
        "char": "死",
        "initial": "s",
        "final": "i",
        "tone": 3,
        "pinyin": "sǐ",
        "zhuyin": "ㄙˇ"
      },
      {
        "char": "灰",
        "initial": "h",
        "final": "ui",
        "tone": 1,
        "pinyin": "huī",
        "zhuyin": "ㄏㄨㄟ"
      },
      {
        "char": "復",
        "initial": "f",
        "final": "u",
        "tone": 4,
        "pinyin": "fù",
        "zhuyin": "ㄈㄨˋ"
      },
      {
        "char": "燃",
        "initial": "r",
        "final": "an",
        "tone": 2,
        "pinyin": "rán",
        "zhuyin": "ㄖㄢˊ"
      }
    ]
  },
  {
    "word": "燃眉之急",
    "emoji": "📚",
    "english": "像火燒眉毛般緊迫。形容事態嚴重，情況危急。※語或出明．李開先〈亡妹盧氏婦墓志銘〉。 △「當務之急」",
    "pinyin": "rán méi zhī jí",
    "zhuyin": "%ㄖㄢˊ %ㄇㄟˊ %ㄓ %ㄐㄧˊ",
    "chars": [
      {
        "char": "燃",
        "initial": "r",
        "final": "an",
        "tone": 2,
        "pinyin": "rán",
        "zhuyin": "ㄖㄢˊ"
      },
      {
        "char": "眉",
        "initial": "m",
        "final": "ei",
        "tone": 2,
        "pinyin": "méi",
        "zhuyin": "ㄇㄟˊ"
      },
      {
        "char": "之",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "急",
        "initial": "j",
        "final": "i",
        "tone": 2,
        "pinyin": "jí",
        "zhuyin": "ㄐㄧˊ"
      }
    ]
  },
  {
    "word": "萬劫不復",
    "emoji": "💡",
    "english": "佛教以世界經歷若干萬年即毀滅一次，再重新開始為「一劫」。「萬劫不復」指人一旦墮入無間地獄，雖歷經萬次世界毀滅那麼久的時間，也不易投胎為人。語出《梵網經盧舍那佛說菩薩心地戒品第十．梵網經菩薩戒序》。後用「萬劫不復」比喻無法挽救的行為或命運。",
    "pinyin": "wàn jié bù fù",
    "zhuyin": "%ㄨㄢˋ %ㄐㄧㄝˊ %ㄅㄨˋ %ㄈㄨˋ",
    "chars": [
      {
        "char": "萬",
        "initial": "w",
        "final": "an",
        "tone": 4,
        "pinyin": "wàn",
        "zhuyin": "ㄨㄢˋ"
      },
      {
        "char": "劫",
        "initial": "j",
        "final": "ie",
        "tone": 2,
        "pinyin": "jié",
        "zhuyin": "ㄐㄧㄝˊ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "復",
        "initial": "f",
        "final": "u",
        "tone": 4,
        "pinyin": "fù",
        "zhuyin": "ㄈㄨˋ"
      }
    ]
  },
  {
    "word": "推心置腹",
    "emoji": "🧠",
    "english": "把赤忱之心推到人家肚子裡。比喻以至誠待人。＃語本《東觀漢記．卷一．光武帝紀》。",
    "pinyin": "tuī xīn zhì fù",
    "zhuyin": "%ㄊㄨㄟ %ㄒㄧㄣ %ㄓˋ %ㄈㄨˋ",
    "chars": [
      {
        "char": "推",
        "initial": "t",
        "final": "ui",
        "tone": 1,
        "pinyin": "tuī",
        "zhuyin": "ㄊㄨㄟ"
      },
      {
        "char": "心",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      },
      {
        "char": "置",
        "initial": "zh",
        "final": "i",
        "tone": 4,
        "pinyin": "zhì",
        "zhuyin": "ㄓˋ"
      },
      {
        "char": "腹",
        "initial": "f",
        "final": "u",
        "tone": 4,
        "pinyin": "fù",
        "zhuyin": "ㄈㄨˋ"
      }
    ]
  },
  {
    "word": "大腹便便",
    "emoji": "📖",
    "english": "大肚子顯得肥胖而凸出的樣子。＃語本晉．司馬彪《續漢書》。 △「腦滿腸肥」",
    "pinyin": "dà fù pián pián",
    "zhuyin": "%ㄉㄚˋ %ㄈㄨˋ %ㄆㄧㄢˊ %ㄆㄧㄢˊ",
    "chars": [
      {
        "char": "大",
        "initial": "d",
        "final": "a",
        "tone": 4,
        "pinyin": "dà",
        "zhuyin": "ㄉㄚˋ"
      },
      {
        "char": "腹",
        "initial": "f",
        "final": "u",
        "tone": 4,
        "pinyin": "fù",
        "zhuyin": "ㄈㄨˋ"
      },
      {
        "char": "便",
        "initial": "p",
        "final": "ian",
        "tone": 2,
        "pinyin": "pián",
        "zhuyin": "ㄆㄧㄢˊ"
      },
      {
        "char": "便",
        "initial": "p",
        "final": "ian",
        "tone": 2,
        "pinyin": "pián",
        "zhuyin": "ㄆㄧㄢˊ"
      }
    ]
  },
  {
    "word": "推己及人",
    "emoji": "✨",
    "english": "將心比心，設身處地替別人著想。語出晉．傅玄《傅子．卷一．仁論》。",
    "pinyin": "tuī jǐ jí rén",
    "zhuyin": "%ㄊㄨㄟ %ㄐㄧˇ %ㄐㄧˊ %ㄖㄣˊ",
    "chars": [
      {
        "char": "推",
        "initial": "t",
        "final": "ui",
        "tone": 1,
        "pinyin": "tuī",
        "zhuyin": "ㄊㄨㄟ"
      },
      {
        "char": "己",
        "initial": "j",
        "final": "i",
        "tone": 3,
        "pinyin": "jǐ",
        "zhuyin": "ㄐㄧˇ"
      },
      {
        "char": "及",
        "initial": "j",
        "final": "i",
        "tone": 2,
        "pinyin": "jí",
        "zhuyin": "ㄐㄧˊ"
      },
      {
        "char": "人",
        "initial": "r",
        "final": "en",
        "tone": 2,
        "pinyin": "rén",
        "zhuyin": "ㄖㄣˊ"
      }
    ]
  },
  {
    "word": "強弩之末",
    "emoji": "🌟",
    "english": "「強弩之末」之「強」，典源作「彊」。「彊」同「強」。強勁弓弩所射出的箭，到射程盡頭，已經沒有力道。比喻原本強大的力量已經衰竭，不能再發揮效用。＃語本《史記．卷一○八．韓長孺列傳》。",
    "pinyin": "qiáng nǔ zhī mò",
    "zhuyin": "%ㄑㄧㄤˊ %ㄋㄨˇ %ㄓ %ㄇㄛˋ",
    "chars": [
      {
        "char": "強",
        "initial": "q",
        "final": "iang",
        "tone": 2,
        "pinyin": "qiáng",
        "zhuyin": "ㄑㄧㄤˊ"
      },
      {
        "char": "弩",
        "initial": "n",
        "final": "u",
        "tone": 3,
        "pinyin": "nǔ",
        "zhuyin": "ㄋㄨˇ"
      },
      {
        "char": "之",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "末",
        "initial": "m",
        "final": "o",
        "tone": 4,
        "pinyin": "mò",
        "zhuyin": "ㄇㄛˋ"
      }
    ]
  },
  {
    "word": "不時之需",
    "emoji": "📜",
    "english": "「不時之需」之「需」，典源作「須」。「須」義同「需」。指隨時的需用。＃語本宋．蘇軾〈後赤壁賦〉。",
    "pinyin": "bù shí zhī xū",
    "zhuyin": "%ㄅㄨˋ %ㄕˊ %ㄓ %ㄒㄩ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "時",
        "initial": "sh",
        "final": "i",
        "tone": 2,
        "pinyin": "shí",
        "zhuyin": "ㄕˊ"
      },
      {
        "char": "之",
        "initial": "zh",
        "final": "i",
        "tone": 1,
        "pinyin": "zhī",
        "zhuyin": "ㄓ"
      },
      {
        "char": "需",
        "initial": "x",
        "final": "u",
        "tone": 1,
        "pinyin": "xū",
        "zhuyin": "ㄒㄩ"
      }
    ]
  },
  {
    "word": "牽強附會",
    "emoji": "🎒",
    "english": "比喻生拉硬扯，勉強湊合。語本宋．鄭樵〈通志總序〉。 △「穿鑿附會」",
    "pinyin": "qiān qiǎng fù huì",
    "zhuyin": "%ㄑㄧㄢ %ㄑㄧㄤˇ %ㄈㄨˋ %ㄏㄨㄟˋ",
    "chars": [
      {
        "char": "牽",
        "initial": "q",
        "final": "ian",
        "tone": 1,
        "pinyin": "qiān",
        "zhuyin": "ㄑㄧㄢ"
      },
      {
        "char": "強",
        "initial": "q",
        "final": "iang",
        "tone": 3,
        "pinyin": "qiǎng",
        "zhuyin": "ㄑㄧㄤˇ"
      },
      {
        "char": "附",
        "initial": "f",
        "final": "u",
        "tone": 4,
        "pinyin": "fù",
        "zhuyin": "ㄈㄨˋ"
      },
      {
        "char": "會",
        "initial": "h",
        "final": "ui",
        "tone": 4,
        "pinyin": "huì",
        "zhuyin": "ㄏㄨㄟˋ"
      }
    ]
  },
  {
    "word": "博古通今",
    "emoji": "🎓",
    "english": "學問淵博，通曉古今。語本《孔子家語．卷三．觀周》。",
    "pinyin": "bó gǔ tōng jīn",
    "zhuyin": "%ㄅㄛˊ %ㄍㄨˇ %ㄊㄨㄥ %ㄐㄧㄣ",
    "chars": [
      {
        "char": "博",
        "initial": "b",
        "final": "o",
        "tone": 2,
        "pinyin": "bó",
        "zhuyin": "ㄅㄛˊ"
      },
      {
        "char": "古",
        "initial": "g",
        "final": "u",
        "tone": 3,
        "pinyin": "gǔ",
        "zhuyin": "ㄍㄨˇ"
      },
      {
        "char": "通",
        "initial": "t",
        "final": "ong",
        "tone": 1,
        "pinyin": "tōng",
        "zhuyin": "ㄊㄨㄥ"
      },
      {
        "char": "今",
        "initial": "j",
        "final": "in",
        "tone": 1,
        "pinyin": "jīn",
        "zhuyin": "ㄐㄧㄣ"
      }
    ]
  },
  {
    "word": "古色古香",
    "emoji": "🧩",
    "english": "形容具有古舊典雅色彩和情調的書畫、或造型仿古的器物、建築、藝術品等。＃語本宋．趙希鵠《洞天清祿集》。",
    "pinyin": "gǔ sè gǔ xiāng",
    "zhuyin": "%ㄍㄨˇ %ㄙㄜˋ %ㄍㄨˇ %ㄒㄧㄤ",
    "chars": [
      {
        "char": "古",
        "initial": "g",
        "final": "u",
        "tone": 3,
        "pinyin": "gǔ",
        "zhuyin": "ㄍㄨˇ"
      },
      {
        "char": "色",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      },
      {
        "char": "古",
        "initial": "g",
        "final": "u",
        "tone": 3,
        "pinyin": "gǔ",
        "zhuyin": "ㄍㄨˇ"
      },
      {
        "char": "香",
        "initial": "x",
        "final": "iang",
        "tone": 1,
        "pinyin": "xiāng",
        "zhuyin": "ㄒㄧㄤ"
      }
    ]
  },
  {
    "word": "融會貫通",
    "emoji": "📚",
    "english": "形容將各種相關的知識或事物加以融合、貫穿，進而獲得全面通徹的領會。語出宋．朱熹〈答姜叔權書〉其一。",
    "pinyin": "róng huì guàn tōng",
    "zhuyin": "%ㄖㄨㄥˊ %ㄏㄨㄟˋ %ㄍㄨㄢˋ %ㄊㄨㄥ",
    "chars": [
      {
        "char": "融",
        "initial": "r",
        "final": "ong",
        "tone": 2,
        "pinyin": "róng",
        "zhuyin": "ㄖㄨㄥˊ"
      },
      {
        "char": "會",
        "initial": "h",
        "final": "ui",
        "tone": 4,
        "pinyin": "huì",
        "zhuyin": "ㄏㄨㄟˋ"
      },
      {
        "char": "貫",
        "initial": "g",
        "final": "uan",
        "tone": 4,
        "pinyin": "guàn",
        "zhuyin": "ㄍㄨㄢˋ"
      },
      {
        "char": "通",
        "initial": "t",
        "final": "ong",
        "tone": 1,
        "pinyin": "tōng",
        "zhuyin": "ㄊㄨㄥ"
      }
    ]
  },
  {
    "word": "同仇敵愾",
    "emoji": "💡",
    "english": "「同仇」，一致對抗仇敵。語出《詩經．秦風．無衣》。「敵愾」，抵禦怨恨的人。語本《左傳．文公四年》。「同仇敵愾」指共同抵禦仇敵。",
    "pinyin": "tóng chóu dí kài",
    "zhuyin": "%ㄊㄨㄥˊ %ㄔㄡˊ %ㄉㄧˊ %ㄎㄞˋ",
    "chars": [
      {
        "char": "同",
        "initial": "t",
        "final": "ong",
        "tone": 2,
        "pinyin": "tóng",
        "zhuyin": "ㄊㄨㄥˊ"
      },
      {
        "char": "仇",
        "initial": "ch",
        "final": "ou",
        "tone": 2,
        "pinyin": "chóu",
        "zhuyin": "ㄔㄡˊ"
      },
      {
        "char": "敵",
        "initial": "d",
        "final": "i",
        "tone": 2,
        "pinyin": "dí",
        "zhuyin": "ㄉㄧˊ"
      },
      {
        "char": "愾",
        "initial": "k",
        "final": "ai",
        "tone": 4,
        "pinyin": "kài",
        "zhuyin": "ㄎㄞˋ"
      }
    ]
  },
  {
    "word": "期期艾艾",
    "emoji": "🧠",
    "english": "「期期」，口吃重言的樣子。語出《史記．卷九六．張丞相列傳》。「艾艾」，口吃重言的樣子。＃語出晉．裴啟《語林》。「期期艾艾」形容口吃結巴的樣子。",
    "pinyin": "qí qí ài ài",
    "zhuyin": "%ㄑㄧˊ %ㄑㄧˊ %ㄞˋ %ㄞˋ",
    "chars": [
      {
        "char": "期",
        "initial": "q",
        "final": "i",
        "tone": 2,
        "pinyin": "qí",
        "zhuyin": "ㄑㄧˊ"
      },
      {
        "char": "期",
        "initial": "q",
        "final": "i",
        "tone": 2,
        "pinyin": "qí",
        "zhuyin": "ㄑㄧˊ"
      },
      {
        "char": "艾",
        "initial": "",
        "final": "ai",
        "tone": 4,
        "pinyin": "ài",
        "zhuyin": "ㄞˋ"
      },
      {
        "char": "艾",
        "initial": "",
        "final": "ai",
        "tone": 4,
        "pinyin": "ài",
        "zhuyin": "ㄞˋ"
      }
    ]
  },
  {
    "word": "不期而遇",
    "emoji": "📖",
    "english": "不在約定的日期見面。＃語本《穀梁傳．隱公八年》。後用「不期而遇」指未經約定而意外相見。",
    "pinyin": "bù qí ér yù",
    "zhuyin": "%ㄅㄨˋ %ㄑㄧˊ %ㄦˊ %ㄩˋ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "期",
        "initial": "q",
        "final": "i",
        "tone": 2,
        "pinyin": "qí",
        "zhuyin": "ㄑㄧˊ"
      },
      {
        "char": "而",
        "initial": "",
        "final": "er",
        "tone": 2,
        "pinyin": "ér",
        "zhuyin": "ㄦˊ"
      },
      {
        "char": "遇",
        "initial": "y",
        "final": "u",
        "tone": 4,
        "pinyin": "yù",
        "zhuyin": "ㄩˋ"
      }
    ]
  },
  {
    "word": "自怨自艾",
    "emoji": "✨",
    "english": "悔恨自己犯下的錯誤而加以改正。語出《孟子．萬章上》。後用「自怨自艾」形容消極地埋怨自責。",
    "pinyin": "zì yuàn zì yì",
    "zhuyin": "%ㄗˋ %ㄩㄢˋ %ㄗˋ %ㄧˋ",
    "chars": [
      {
        "char": "自",
        "initial": "z",
        "final": "i",
        "tone": 4,
        "pinyin": "zì",
        "zhuyin": "ㄗˋ"
      },
      {
        "char": "怨",
        "initial": "y",
        "final": "uan",
        "tone": 4,
        "pinyin": "yuàn",
        "zhuyin": "ㄩㄢˋ"
      },
      {
        "char": "自",
        "initial": "z",
        "final": "i",
        "tone": 4,
        "pinyin": "zì",
        "zhuyin": "ㄗˋ"
      },
      {
        "char": "艾",
        "initial": "y",
        "final": "i",
        "tone": 4,
        "pinyin": "yì",
        "zhuyin": "ㄧˋ"
      }
    ]
  },
  {
    "word": "滄海一粟",
    "emoji": "🌟",
    "english": "大海中的一粒粟米。比喻渺小而微不足道。語本宋．蘇軾〈赤壁賦〉。 △「九牛一毛」",
    "pinyin": "cāng hǎi yī sù",
    "zhuyin": "%ㄘㄤ %ㄏㄞˇ %ㄧ %ㄙㄨˋ",
    "chars": [
      {
        "char": "滄",
        "initial": "c",
        "final": "ang",
        "tone": 1,
        "pinyin": "cāng",
        "zhuyin": "ㄘㄤ"
      },
      {
        "char": "海",
        "initial": "h",
        "final": "ai",
        "tone": 3,
        "pinyin": "hǎi",
        "zhuyin": "ㄏㄞˇ"
      },
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "粟",
        "initial": "s",
        "final": "u",
        "tone": 4,
        "pinyin": "sù",
        "zhuyin": "ㄙㄨˋ"
      }
    ]
  },
  {
    "word": "滄海遺珠",
    "emoji": "📜",
    "english": "被採珠人遺漏在大海的珍珠。比喻被埋沒的人才或被人忽視的珍貴事物。＃語出《新唐書．卷一一五．狄仁傑列傳》。",
    "pinyin": "cāng hǎi yí zhū",
    "zhuyin": "%ㄘㄤ %ㄏㄞˇ %ㄧˊ %ㄓㄨ",
    "chars": [
      {
        "char": "滄",
        "initial": "c",
        "final": "ang",
        "tone": 1,
        "pinyin": "cāng",
        "zhuyin": "ㄘㄤ"
      },
      {
        "char": "海",
        "initial": "h",
        "final": "ai",
        "tone": 3,
        "pinyin": "hǎi",
        "zhuyin": "ㄏㄞˇ"
      },
      {
        "char": "遺",
        "initial": "y",
        "final": "i",
        "tone": 2,
        "pinyin": "yí",
        "zhuyin": "ㄧˊ"
      },
      {
        "char": "珠",
        "initial": "zh",
        "final": "u",
        "tone": 1,
        "pinyin": "zhū",
        "zhuyin": "ㄓㄨ"
      }
    ]
  },
  {
    "word": "懲前毖後",
    "emoji": "🎒",
    "english": "以從前的過失為教訓，戒慎自己不再犯錯。語本《詩經．周頌．小毖》。",
    "pinyin": "chéng qián bì hòu",
    "zhuyin": "%ㄔㄥˊ %ㄑㄧㄢˊ %ㄅㄧˋ %ㄏㄡˋ",
    "chars": [
      {
        "char": "懲",
        "initial": "ch",
        "final": "eng",
        "tone": 2,
        "pinyin": "chéng",
        "zhuyin": "ㄔㄥˊ"
      },
      {
        "char": "前",
        "initial": "q",
        "final": "ian",
        "tone": 2,
        "pinyin": "qián",
        "zhuyin": "ㄑㄧㄢˊ"
      },
      {
        "char": "毖",
        "initial": "b",
        "final": "i",
        "tone": 4,
        "pinyin": "bì",
        "zhuyin": "ㄅㄧˋ"
      },
      {
        "char": "後",
        "initial": "h",
        "final": "ou",
        "tone": 4,
        "pinyin": "hòu",
        "zhuyin": "ㄏㄡˋ"
      }
    ]
  },
  {
    "word": "雨後春筍",
    "emoji": "🎓",
    "english": "春筍在雨後長得又多又快。＃語本宋．趙蕃〈過易簡彥從〉詩。後用以比喻事物在某一時期新生之後大量湧現，迅速發展。",
    "pinyin": "yǔ hòu chūn sǔn",
    "zhuyin": "%ㄩˇ %ㄏㄡˋ %ㄔㄨㄣ %ㄙㄨㄣˇ",
    "chars": [
      {
        "char": "雨",
        "initial": "y",
        "final": "u",
        "tone": 3,
        "pinyin": "yǔ",
        "zhuyin": "ㄩˇ"
      },
      {
        "char": "後",
        "initial": "h",
        "final": "ou",
        "tone": 4,
        "pinyin": "hòu",
        "zhuyin": "ㄏㄡˋ"
      },
      {
        "char": "春",
        "initial": "ch",
        "final": "un",
        "tone": 1,
        "pinyin": "chūn",
        "zhuyin": "ㄔㄨㄣ"
      },
      {
        "char": "筍",
        "initial": "s",
        "final": "un",
        "tone": 3,
        "pinyin": "sǔn",
        "zhuyin": "ㄙㄨㄣˇ"
      }
    ]
  },
  {
    "word": "前功盡棄",
    "emoji": "🧩",
    "english": "指以前辛苦獲得的成果，全部廢棄。◎語本《戰國策．西周策》。 △「功虧一簣」、「百步穿楊」、「百發百中」",
    "pinyin": "qián gōng jìn qì",
    "zhuyin": "%ㄑㄧㄢˊ %ㄍㄨㄥ %ㄐㄧㄣˋ %ㄑㄧˋ",
    "chars": [
      {
        "char": "前",
        "initial": "q",
        "final": "ian",
        "tone": 2,
        "pinyin": "qián",
        "zhuyin": "ㄑㄧㄢˊ"
      },
      {
        "char": "功",
        "initial": "g",
        "final": "ong",
        "tone": 1,
        "pinyin": "gōng",
        "zhuyin": "ㄍㄨㄥ"
      },
      {
        "char": "盡",
        "initial": "j",
        "final": "in",
        "tone": 4,
        "pinyin": "jìn",
        "zhuyin": "ㄐㄧㄣˋ"
      },
      {
        "char": "棄",
        "initial": "q",
        "final": "i",
        "tone": 4,
        "pinyin": "qì",
        "zhuyin": "ㄑㄧˋ"
      }
    ]
  },
  {
    "word": "爐火純青",
    "emoji": "📚",
    "english": "原指道家煉丹，爐火出現純青的火焰時，就煉成功了。※語或本唐．孫思邈〈四言〉詩。後用「爐火純青」比喻學問、技術、功夫等到達精純完美的境地。",
    "pinyin": "lú huǒ chún qīng",
    "zhuyin": "%ㄌㄨˊ %ㄏㄨㄛˇ %ㄔㄨㄣˊ %ㄑㄧㄥ",
    "chars": [
      {
        "char": "爐",
        "initial": "l",
        "final": "u",
        "tone": 2,
        "pinyin": "lú",
        "zhuyin": "ㄌㄨˊ"
      },
      {
        "char": "火",
        "initial": "h",
        "final": "uo",
        "tone": 3,
        "pinyin": "huǒ",
        "zhuyin": "ㄏㄨㄛˇ"
      },
      {
        "char": "純",
        "initial": "ch",
        "final": "un",
        "tone": 2,
        "pinyin": "chún",
        "zhuyin": "ㄔㄨㄣˊ"
      },
      {
        "char": "青",
        "initial": "q",
        "final": "ing",
        "tone": 1,
        "pinyin": "qīng",
        "zhuyin": "ㄑㄧㄥ"
      }
    ]
  },
  {
    "word": "隔岸觀火",
    "emoji": "💡",
    "english": "在河水對岸看火災。※語或本清．梁啟超〈呵旁觀者文〉。比喻事不干己，袖手旁觀，漠不關心。 △「見死不救」",
    "pinyin": "gé àn guān huǒ",
    "zhuyin": "%ㄍㄜˊ %ㄢˋ %ㄍㄨㄢ %ㄏㄨㄛˇ",
    "chars": [
      {
        "char": "隔",
        "initial": "g",
        "final": "e",
        "tone": 2,
        "pinyin": "gé",
        "zhuyin": "ㄍㄜˊ"
      },
      {
        "char": "岸",
        "initial": "",
        "final": "an",
        "tone": 4,
        "pinyin": "àn",
        "zhuyin": "ㄢˋ"
      },
      {
        "char": "觀",
        "initial": "g",
        "final": "uan",
        "tone": 1,
        "pinyin": "guān",
        "zhuyin": "ㄍㄨㄢ"
      },
      {
        "char": "火",
        "initial": "h",
        "final": "uo",
        "tone": 3,
        "pinyin": "huǒ",
        "zhuyin": "ㄏㄨㄛˇ"
      }
    ]
  },
  {
    "word": "火樹銀花",
    "emoji": "🧠",
    "english": "「火樹」，像火一般燦爛的樹。語出晉．傅玄〈庭燎〉詩。「銀花」，銀色的花朵，後指燈。語出南朝梁．簡文帝〈彌陀佛像銘〉。「火樹銀花」形容燈火通明燦爛的景象。",
    "pinyin": "huǒ shù yín huā",
    "zhuyin": "%ㄏㄨㄛˇ %ㄕㄨˋ %ㄧㄣˊ %ㄏㄨㄚ",
    "chars": [
      {
        "char": "火",
        "initial": "h",
        "final": "uo",
        "tone": 3,
        "pinyin": "huǒ",
        "zhuyin": "ㄏㄨㄛˇ"
      },
      {
        "char": "樹",
        "initial": "sh",
        "final": "u",
        "tone": 4,
        "pinyin": "shù",
        "zhuyin": "ㄕㄨˋ"
      },
      {
        "char": "銀",
        "initial": "y",
        "final": "in",
        "tone": 2,
        "pinyin": "yín",
        "zhuyin": "ㄧㄣˊ"
      },
      {
        "char": "花",
        "initial": "h",
        "final": "ua",
        "tone": 1,
        "pinyin": "huā",
        "zhuyin": "ㄏㄨㄚ"
      }
    ]
  },
  {
    "word": "抱殘守缺",
    "emoji": "📖",
    "english": "固守舊有殘缺的經文不放。語本漢．劉歆〈移書讓太常博士〉。後用「抱殘守缺」比喻固守舊有事物或思想，而不知改進變通。",
    "pinyin": "bào cán shǒu quē",
    "zhuyin": "%ㄅㄠˋ %ㄘㄢˊ %ㄕㄡˇ %ㄑㄩㄝ",
    "chars": [
      {
        "char": "抱",
        "initial": "b",
        "final": "ao",
        "tone": 4,
        "pinyin": "bào",
        "zhuyin": "ㄅㄠˋ"
      },
      {
        "char": "殘",
        "initial": "c",
        "final": "an",
        "tone": 2,
        "pinyin": "cán",
        "zhuyin": "ㄘㄢˊ"
      },
      {
        "char": "守",
        "initial": "sh",
        "final": "ou",
        "tone": 3,
        "pinyin": "shǒu",
        "zhuyin": "ㄕㄡˇ"
      },
      {
        "char": "缺",
        "initial": "q",
        "final": "ue",
        "tone": 1,
        "pinyin": "quē",
        "zhuyin": "ㄑㄩㄝ"
      }
    ]
  },
  {
    "word": "抱薪救火",
    "emoji": "✨",
    "english": "抱著木柴去救火，比喻處理事情的方法錯誤，既無法達成目的，反而情勢更為惡劣。比喻用錯方法，而致禍害加深。＃語出《戰國策．魏策三》。 △「潑油救火」",
    "pinyin": "bào xīn jiù huǒ",
    "zhuyin": "%ㄅㄠˋ %ㄒㄧㄣ %ㄐㄧㄡˋ %ㄏㄨㄛˇ",
    "chars": [
      {
        "char": "抱",
        "initial": "b",
        "final": "ao",
        "tone": 4,
        "pinyin": "bào",
        "zhuyin": "ㄅㄠˋ"
      },
      {
        "char": "薪",
        "initial": "x",
        "final": "in",
        "tone": 1,
        "pinyin": "xīn",
        "zhuyin": "ㄒㄧㄣ"
      },
      {
        "char": "救",
        "initial": "j",
        "final": "iu",
        "tone": 4,
        "pinyin": "jiù",
        "zhuyin": "ㄐㄧㄡˋ"
      },
      {
        "char": "火",
        "initial": "h",
        "final": "uo",
        "tone": 3,
        "pinyin": "huǒ",
        "zhuyin": "ㄏㄨㄛˇ"
      }
    ]
  },
  {
    "word": "不可救藥",
    "emoji": "🌟",
    "english": "病重無藥可醫治。比喻到了無法挽救的地步。語出《詩經．大雅．板》。",
    "pinyin": "bù kě jiù yào",
    "zhuyin": "%ㄅㄨˋ %ㄎㄜˇ %ㄐㄧㄡˋ %ㄧㄠˋ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "可",
        "initial": "k",
        "final": "e",
        "tone": 3,
        "pinyin": "kě",
        "zhuyin": "ㄎㄜˇ"
      },
      {
        "char": "救",
        "initial": "j",
        "final": "iu",
        "tone": 4,
        "pinyin": "jiù",
        "zhuyin": "ㄐㄧㄡˋ"
      },
      {
        "char": "藥",
        "initial": "y",
        "final": "ao",
        "tone": 4,
        "pinyin": "yào",
        "zhuyin": "ㄧㄠˋ"
      }
    ]
  },
  {
    "word": "大謬不然",
    "emoji": "📜",
    "english": "謬，錯誤。「大謬不然」指大錯特錯，與事實完全不符。語出漢．司馬遷〈報任少卿書〉。 △「奮不顧身」、「戴盆望天」",
    "pinyin": "dà miù bù rán",
    "zhuyin": "%ㄉㄚˋ %ㄇㄧㄡˋ %ㄅㄨˋ %ㄖㄢˊ",
    "chars": [
      {
        "char": "大",
        "initial": "d",
        "final": "a",
        "tone": 4,
        "pinyin": "dà",
        "zhuyin": "ㄉㄚˋ"
      },
      {
        "char": "謬",
        "initial": "m",
        "final": "iu",
        "tone": 4,
        "pinyin": "miù",
        "zhuyin": "ㄇㄧㄡˋ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "然",
        "initial": "r",
        "final": "an",
        "tone": 2,
        "pinyin": "rán",
        "zhuyin": "ㄖㄢˊ"
      }
    ]
  },
  {
    "word": "不二法門",
    "emoji": "🎒",
    "english": "佛教用語。不二，不是兩個極端；法門，修行入道的門徑。「不二法門」指觀察事物的道理，要離開相對的兩個極端的看法，才能得其實在，所以「不二法門」是指到達絕對真理的方法。語出《維摩詰所說經．卷中．入不二法門品第九》。後用「不二法門」比喻唯一的方法或途徑。",
    "pinyin": "bù èr fǎ mén",
    "zhuyin": "%ㄅㄨˋ %ㄦˋ %ㄈㄚˇ %ㄇㄣˊ",
    "chars": [
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "二",
        "initial": "",
        "final": "er",
        "tone": 4,
        "pinyin": "èr",
        "zhuyin": "ㄦˋ"
      },
      {
        "char": "法",
        "initial": "f",
        "final": "a",
        "tone": 3,
        "pinyin": "fǎ",
        "zhuyin": "ㄈㄚˇ"
      },
      {
        "char": "門",
        "initial": "m",
        "final": "en",
        "tone": 2,
        "pinyin": "mén",
        "zhuyin": "ㄇㄣˊ"
      }
    ]
  },
  {
    "word": "道貌岸然",
    "emoji": "🎓",
    "english": "學道的人容貌莊嚴肅穆。形容外表莊重嚴肅的樣子。語本敦煌變文《維摩詰經講經文》。 △「一本正經」",
    "pinyin": "dào mào àn rán",
    "zhuyin": "%ㄉㄠˋ %ㄇㄠˋ %ㄢˋ %ㄖㄢˊ",
    "chars": [
      {
        "char": "道",
        "initial": "d",
        "final": "ao",
        "tone": 4,
        "pinyin": "dào",
        "zhuyin": "ㄉㄠˋ"
      },
      {
        "char": "貌",
        "initial": "m",
        "final": "ao",
        "tone": 4,
        "pinyin": "mào",
        "zhuyin": "ㄇㄠˋ"
      },
      {
        "char": "岸",
        "initial": "",
        "final": "an",
        "tone": 4,
        "pinyin": "àn",
        "zhuyin": "ㄢˋ"
      },
      {
        "char": "然",
        "initial": "r",
        "final": "an",
        "tone": 2,
        "pinyin": "rán",
        "zhuyin": "ㄖㄢˊ"
      }
    ]
  },
  {
    "word": "瞻前顧後",
    "emoji": "🧩",
    "english": "瞻，向前看。顧，回頭看。「瞻前顧後」指看看前面再看看後面，形容做事謹慎周密。後用來形容檢討過去、計畫未來，也用於形容做事猶豫不決，顧慮太多。語出戰國楚．屈原〈離騷〉。",
    "pinyin": "zhān qián gù hòu",
    "zhuyin": "%ㄓㄢ %ㄑㄧㄢˊ %ㄍㄨˋ %ㄏㄡˋ",
    "chars": [
      {
        "char": "瞻",
        "initial": "zh",
        "final": "an",
        "tone": 1,
        "pinyin": "zhān",
        "zhuyin": "ㄓㄢ"
      },
      {
        "char": "前",
        "initial": "q",
        "final": "ian",
        "tone": 2,
        "pinyin": "qián",
        "zhuyin": "ㄑㄧㄢˊ"
      },
      {
        "char": "顧",
        "initial": "g",
        "final": "u",
        "tone": 4,
        "pinyin": "gù",
        "zhuyin": "ㄍㄨˋ"
      },
      {
        "char": "後",
        "initial": "h",
        "final": "ou",
        "tone": 4,
        "pinyin": "hòu",
        "zhuyin": "ㄏㄡˋ"
      }
    ]
  },
  {
    "word": "前倨後恭",
    "emoji": "📚",
    "english": "先前傲慢無禮，後又謙卑恭敬。比喻待人勢利，態度轉變迅速。＃語出《戰國策．秦策一》。 △「引錐刺股」、「今恭昔慢」",
    "pinyin": "qián jù hòu gōng",
    "zhuyin": "%ㄑㄧㄢˊ %ㄐㄩˋ %ㄏㄡˋ %ㄍㄨㄥ",
    "chars": [
      {
        "char": "前",
        "initial": "q",
        "final": "ian",
        "tone": 2,
        "pinyin": "qián",
        "zhuyin": "ㄑㄧㄢˊ"
      },
      {
        "char": "倨",
        "initial": "j",
        "final": "u",
        "tone": 4,
        "pinyin": "jù",
        "zhuyin": "ㄐㄩˋ"
      },
      {
        "char": "後",
        "initial": "h",
        "final": "ou",
        "tone": 4,
        "pinyin": "hòu",
        "zhuyin": "ㄏㄡˋ"
      },
      {
        "char": "恭",
        "initial": "g",
        "final": "ong",
        "tone": 1,
        "pinyin": "gōng",
        "zhuyin": "ㄍㄨㄥ"
      }
    ]
  },
  {
    "word": "高瞻遠矚",
    "emoji": "💡",
    "english": "「高瞻」，由高處觀看，形容識見廣闊。語出漢．王充《論衡．別通》。「遠矚」，注視遠處，形容眼光寬遠。語出北魏．張淵〈觀象賦〉。後用「高瞻遠矚」形容見識遠大。或形容往遠處眺望，看得更全面。",
    "pinyin": "gāo zhān yuǎn zhǔ",
    "zhuyin": "%ㄍㄠ %ㄓㄢ %ㄩㄢˇ %ㄓㄨˇ",
    "chars": [
      {
        "char": "高",
        "initial": "g",
        "final": "ao",
        "tone": 1,
        "pinyin": "gāo",
        "zhuyin": "ㄍㄠ"
      },
      {
        "char": "瞻",
        "initial": "zh",
        "final": "an",
        "tone": 1,
        "pinyin": "zhān",
        "zhuyin": "ㄓㄢ"
      },
      {
        "char": "遠",
        "initial": "y",
        "final": "uan",
        "tone": 3,
        "pinyin": "yuǎn",
        "zhuyin": "ㄩㄢˇ"
      },
      {
        "char": "矚",
        "initial": "zh",
        "final": "u",
        "tone": 3,
        "pinyin": "zhǔ",
        "zhuyin": "ㄓㄨˇ"
      }
    ]
  },
  {
    "word": "國色天香",
    "emoji": "🧠",
    "english": "形容牡丹花濃郁的香味和嬌豔的姿態。※＃語或本唐．李濬《松窗雜錄》。後亦用「國色天香」形容容貌美麗、姿態曼妙的女子。",
    "pinyin": "guó sè tiān xiāng",
    "zhuyin": "%ㄍㄨㄛˊ %ㄙㄜˋ %ㄊㄧㄢ %ㄒㄧㄤ",
    "chars": [
      {
        "char": "國",
        "initial": "g",
        "final": "uo",
        "tone": 2,
        "pinyin": "guó",
        "zhuyin": "ㄍㄨㄛˊ"
      },
      {
        "char": "色",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      },
      {
        "char": "天",
        "initial": "t",
        "final": "ian",
        "tone": 1,
        "pinyin": "tiān",
        "zhuyin": "ㄊㄧㄢ"
      },
      {
        "char": "香",
        "initial": "x",
        "final": "iang",
        "tone": 1,
        "pinyin": "xiāng",
        "zhuyin": "ㄒㄧㄤ"
      }
    ]
  },
  {
    "word": "平分秋色",
    "emoji": "📖",
    "english": "「平分秋色」，典源作「平分四時」，意思是一年被平均分成春夏秋冬四時。※＃語或本戰國楚．宋玉〈九辯〉。「平分秋色」指中秋時分。亦用於指平均分配好處。亦用於形容二者一樣出色，分不出高下。",
    "pinyin": "píng fēn qiū sè",
    "zhuyin": "%ㄆㄧㄥˊ %ㄈㄣ %ㄑㄧㄡ %ㄙㄜˋ",
    "chars": [
      {
        "char": "平",
        "initial": "p",
        "final": "ing",
        "tone": 2,
        "pinyin": "píng",
        "zhuyin": "ㄆㄧㄥˊ"
      },
      {
        "char": "分",
        "initial": "f",
        "final": "en",
        "tone": 1,
        "pinyin": "fēn",
        "zhuyin": "ㄈㄣ"
      },
      {
        "char": "秋",
        "initial": "q",
        "final": "iu",
        "tone": 1,
        "pinyin": "qiū",
        "zhuyin": "ㄑㄧㄡ"
      },
      {
        "char": "色",
        "initial": "s",
        "final": "e",
        "tone": 4,
        "pinyin": "sè",
        "zhuyin": "ㄙㄜˋ"
      }
    ]
  },
  {
    "word": "平地風波",
    "emoji": "✨",
    "english": "平地上起風波，比喻突然發生事故或變化。語本唐．劉禹錫〈竹枝詞〉九首之七。",
    "pinyin": "píng dì fēng bō",
    "zhuyin": "%ㄆㄧㄥˊ %ㄉㄧˋ %ㄈㄥ %ㄅㄛ",
    "chars": [
      {
        "char": "平",
        "initial": "p",
        "final": "ing",
        "tone": 2,
        "pinyin": "píng",
        "zhuyin": "ㄆㄧㄥˊ"
      },
      {
        "char": "地",
        "initial": "d",
        "final": "i",
        "tone": 4,
        "pinyin": "dì",
        "zhuyin": "ㄉㄧˋ"
      },
      {
        "char": "風",
        "initial": "f",
        "final": "eng",
        "tone": 1,
        "pinyin": "fēng",
        "zhuyin": "ㄈㄥ"
      },
      {
        "char": "波",
        "initial": "b",
        "final": "o",
        "tone": 1,
        "pinyin": "bō",
        "zhuyin": "ㄅㄛ"
      }
    ]
  },
  {
    "word": "安居樂業",
    "emoji": "🌟",
    "english": "生活安定和樂，而且喜好自己的職業。語本《漢書．卷九一．貨殖傳．序》。",
    "pinyin": "ān jū lè yè",
    "zhuyin": "%ㄢ %ㄐㄩ %ㄌㄜˋ %ㄧㄝˋ",
    "chars": [
      {
        "char": "安",
        "initial": "",
        "final": "an",
        "tone": 1,
        "pinyin": "ān",
        "zhuyin": "ㄢ"
      },
      {
        "char": "居",
        "initial": "j",
        "final": "u",
        "tone": 1,
        "pinyin": "jū",
        "zhuyin": "ㄐㄩ"
      },
      {
        "char": "樂",
        "initial": "l",
        "final": "e",
        "tone": 4,
        "pinyin": "lè",
        "zhuyin": "ㄌㄜˋ"
      },
      {
        "char": "業",
        "initial": "y",
        "final": "e",
        "tone": 4,
        "pinyin": "yè",
        "zhuyin": "ㄧㄝˋ"
      }
    ]
  },
  {
    "word": "兢兢業業",
    "emoji": "📜",
    "english": "兢兢，小心謹慎的樣子。業業，危懼的樣子。「兢兢業業」形容戒慎恐懼，認真負責的樣子。＃語出《書經．皋陶謨》。",
    "pinyin": "jīng jīng yè yè",
    "zhuyin": "%ㄐㄧㄥ %ㄐㄧㄥ %ㄧㄝˋ %ㄧㄝˋ",
    "chars": [
      {
        "char": "兢",
        "initial": "j",
        "final": "ing",
        "tone": 1,
        "pinyin": "jīng",
        "zhuyin": "ㄐㄧㄥ"
      },
      {
        "char": "兢",
        "initial": "j",
        "final": "ing",
        "tone": 1,
        "pinyin": "jīng",
        "zhuyin": "ㄐㄧㄥ"
      },
      {
        "char": "業",
        "initial": "y",
        "final": "e",
        "tone": 4,
        "pinyin": "yè",
        "zhuyin": "ㄧㄝˋ"
      },
      {
        "char": "業",
        "initial": "y",
        "final": "e",
        "tone": 4,
        "pinyin": "yè",
        "zhuyin": "ㄧㄝˋ"
      }
    ]
  },
  {
    "word": "安如泰山",
    "emoji": "🎒",
    "english": "「安如泰山」之「泰山」，典源作「太山」。「太山」即「泰山」。形容安定穩固如泰山一般，不可動搖。＃語本漢．焦贛《焦氏易林．卷一．坤之中孚》。",
    "pinyin": "ān rú tài shān",
    "zhuyin": "%ㄢ %ㄖㄨˊ %ㄊㄞˋ %ㄕㄢ",
    "chars": [
      {
        "char": "安",
        "initial": "",
        "final": "an",
        "tone": 1,
        "pinyin": "ān",
        "zhuyin": "ㄢ"
      },
      {
        "char": "如",
        "initial": "r",
        "final": "u",
        "tone": 2,
        "pinyin": "rú",
        "zhuyin": "ㄖㄨˊ"
      },
      {
        "char": "泰",
        "initial": "t",
        "final": "ai",
        "tone": 4,
        "pinyin": "tài",
        "zhuyin": "ㄊㄞˋ"
      },
      {
        "char": "山",
        "initial": "sh",
        "final": "an",
        "tone": 1,
        "pinyin": "shān",
        "zhuyin": "ㄕㄢ"
      }
    ]
  },
  {
    "word": "耳濡目染",
    "emoji": "🎓",
    "english": "「耳濡目染」之「濡」，典源作「擩」。「擩」義同「濡」。濡，習染、感染。「耳濡目染」指經常聽到、看到而深受影響。語本唐．韓愈〈清河郡公房公墓碣銘〉。 △「潛移默化」",
    "pinyin": "ěr rú mù rǎn",
    "zhuyin": "%ㄦˇ %ㄖㄨˊ %ㄇㄨˋ %ㄖㄢˇ",
    "chars": [
      {
        "char": "耳",
        "initial": "",
        "final": "er",
        "tone": 3,
        "pinyin": "ěr",
        "zhuyin": "ㄦˇ"
      },
      {
        "char": "濡",
        "initial": "r",
        "final": "u",
        "tone": 2,
        "pinyin": "rú",
        "zhuyin": "ㄖㄨˊ"
      },
      {
        "char": "目",
        "initial": "m",
        "final": "u",
        "tone": 4,
        "pinyin": "mù",
        "zhuyin": "ㄇㄨˋ"
      },
      {
        "char": "染",
        "initial": "r",
        "final": "an",
        "tone": 3,
        "pinyin": "rǎn",
        "zhuyin": "ㄖㄢˇ"
      }
    ]
  },
  {
    "word": "一塵不染",
    "emoji": "🧩",
    "english": "本指佛家修道的人，不被六塵（色、聲、香、味、觸、法）所玷汙。語出《景德傳燈錄．卷三．弘忍大師》。後用「一塵不染」泛指人品純潔，絲毫不沾染壞習氣。也用於形容非常乾淨，一點灰塵都沒有。",
    "pinyin": "yī chén bù rǎn",
    "zhuyin": "%ㄧ %ㄔㄣˊ %ㄅㄨˋ %ㄖㄢˇ",
    "chars": [
      {
        "char": "一",
        "initial": "y",
        "final": "i",
        "tone": 1,
        "pinyin": "yī",
        "zhuyin": "ㄧ"
      },
      {
        "char": "塵",
        "initial": "ch",
        "final": "en",
        "tone": 2,
        "pinyin": "chén",
        "zhuyin": "ㄔㄣˊ"
      },
      {
        "char": "不",
        "initial": "b",
        "final": "u",
        "tone": 4,
        "pinyin": "bù",
        "zhuyin": "ㄅㄨˋ"
      },
      {
        "char": "染",
        "initial": "r",
        "final": "an",
        "tone": 3,
        "pinyin": "rǎn",
        "zhuyin": "ㄖㄢˇ"
      }
    ]
  }
];

// 拼音標聲調對照表
const TONE_MAP = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
};

// 標調輔助函數
function addToneMark(base, tone) {
  if (tone === 0 || tone === 5) return base; // 輕聲 / 無聲調
  let str = base.replace('v', 'ü');
  let targetChar = '';
  
  if (str.includes('a')) targetChar = 'a';
  else if (str.includes('o')) targetChar = 'o';
  else if (str.includes('e')) targetChar = 'e';
  else if (str.includes('ui')) targetChar = 'i';
  else if (str.includes('iu')) targetChar = 'u';
  else if (str.includes('i')) targetChar = 'i';
  else if (str.includes('u')) targetChar = 'u';
  else if (str.includes('ü')) targetChar = 'ü';
  
  if (targetChar && TONE_MAP[targetChar] && TONE_MAP[targetChar][tone]) {
    return str.replace(targetChar, TONE_MAP[targetChar][tone]);
  }
  return str;
}

// 聲調名與字元對照 (用於聲母韻母拼拼樂顯示)
const TONE_SYMBOLS = {
  1: "ˉ",
  2: "ˊ",
  3: "ˇ",
  4: "ˋ",
  0: "·"
};

// 3. Web Audio API 音效類別
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playPop() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 琶音
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  }

  playFailure() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

// 4. TTS 語音發音類別
class TTSController {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.initVoice();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.initVoice();
    }
  }

  initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // 優先尋找台灣、香港繁體中文，否則一般中文，最後隨機
    this.voice = voices.find(v => v.lang.includes('zh-TW')) ||
                 voices.find(v => v.lang.includes('zh-HK')) ||
                 voices.find(v => v.lang.includes('zh-CN')) ||
                 voices.find(v => v.lang.includes('zh')) ||
                 voices[0];
  }

  speak(text, rate = 0.8) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.lang = this.voice ? this.voice.lang : 'zh-TW';
    utterance.rate = rate;
    this.synth.speak(utterance);
  }
}

// 5. Canvas 五彩紙花特效
class ConfettiManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.active = false;
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  start() {
    this.particles = [];
    this.active = true;
    this.resizeCanvas();
    const colors = ['#00f2fe', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316'];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * this.canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.08 + 0.02,
        tiltAngle: 0,
        speed: Math.random() * 3 + 2
      });
    }
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.draw();
  }

  stop() {
    this.active = false;
    setTimeout(() => {
      if (!this.active && this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }, 2000);
  }

  draw() {
    if (!this.active && this.particles.length === 0) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    let activeParticles = 0;
    this.particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.speed;
      p.x += Math.sin(p.tiltAngle) * 0.5;
      p.tilt = Math.sin(p.tiltAngle - idx/3) * 15;

      if (p.y < this.canvas.height) {
        activeParticles++;
      } else if (this.active) {
        p.y = -20;
        p.x = Math.random() * this.canvas.width;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    });

    if (activeParticles > 0 || this.active) {
      this.animationId = requestAnimationFrame(() => this.draw());
    }
  }
}

// 6. 遊戲主狀態管理器
const Game = {
  // 模組實例
  sounds: new SoundEffects(),
  tts: new TTSController(),
  confetti: null,

  // 狀態變數
  currentScreen: "start-screen",
  currentMode: null,
  score: 0,
  currentLevel: 0,
  maxLevels: 5,
  vocabList: [],
  currentWord: null,

  // 模式 1: 聲母韻母拼拼樂專用
  constSelectedCharIdx: 0, // 當前拼哪一個漢字
  constActiveSlot: "initial", // 當前選中的拼音格
  constCurrentVals: { initial: "", final: "", tone: "" },

  // 模式 2: 聲調大考驗氣球專用
  balloonTargetCharIdx: 0,
  balloonList: [],

  // 模式 4: 連連看專用
  matcherPairs: [], // 已正確配對的連線
  matcherLeftSelected: null,
  matcherRightSelected: null,
  matcherLeftList: [],
  matcherRightList: [],

  // 規則頁數專用
  currentRuleIdx: 0,

  // 初始化遊戲
  init() {
    this.confetti = new ConfettiManager("confetti-canvas");
    this.bindEvents();
    this.renderTutorialInitials();
    this.renderTutorialFinals();
    this.renderTutorialRules();
    this.renderTutorialIdioms();
  },

  // 註冊 DOM 事件
  bindEvents() {
    // 首頁按鈕
    document.getElementById("btn-to-modes").addEventListener("click", () => {
      this.sounds.playClick();
      this.switchScreen("mode-screen");
    });
    document.getElementById("btn-to-tutorial").addEventListener("click", () => {
      this.sounds.playClick();
      this.switchScreen("tutorial-screen");
    });

    // 返回/首頁控制
    document.getElementById("btn-back-home").addEventListener("click", () => {
      this.sounds.playClick();
      this.exitToHome();
    });
    document.getElementById("btn-mode-back").addEventListener("click", () => {
      this.sounds.playClick();
      this.switchScreen("start-screen");
    });
    document.getElementById("btn-tutorial-back").addEventListener("click", () => {
      this.sounds.playClick();
      this.switchScreen("start-screen");
    });

    // 選擇練習模式
    const modeCards = document.querySelectorAll(".mode-card");
    modeCards.forEach(card => {
      card.addEventListener("click", () => {
        const mode = card.getAttribute("data-mode");
        this.sounds.playClick();
        this.startAdventure(mode);
      });
    });

    // 教學標籤頁切換
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.sounds.playClick();
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const tab = btn.getAttribute("data-tab");
        const panels = document.querySelectorAll(".tab-panel");
        panels.forEach(p => p.classList.remove("active"));
        document.getElementById(`tab-${tab}`).classList.add("active");
      });
    });

    // 聲調小教室四聲連讀
    document.getElementById("btn-tone-all-play").addEventListener("click", () => {
      this.sounds.playClick();
      this.playFourTonesSequence();
    });

    // 規則課堂輪播按鈕
    document.getElementById("btn-rule-prev").addEventListener("click", () => {
      this.sounds.playClick();
      this.currentRuleIdx = (this.currentRuleIdx - 1 + RULES_TUTORIAL.length) % RULES_TUTORIAL.length;
      this.renderTutorialRules();
    });
    document.getElementById("btn-rule-next").addEventListener("click", () => {
      this.sounds.playClick();
      this.currentRuleIdx = (this.currentRuleIdx + 1) % RULES_TUTORIAL.length;
      this.renderTutorialRules();
    });

    // 聲韻拼拼樂 - 拼音格選取
    document.querySelectorAll(".pinyin-slot").forEach(slot => {
      slot.addEventListener("click", () => {
        this.sounds.playClick();
        document.querySelectorAll(".pinyin-slot").forEach(s => s.classList.remove("active-slot"));
        slot.classList.add("active-slot");
        this.constActiveSlot = slot.getAttribute("data-slot");
      });
    });

    // 聲韻拼拼樂 - 重置與發音與送出
    document.getElementById("btn-const-reset").addEventListener("click", () => {
      this.sounds.playClick();
      this.resetConstructorSlots();
    });
    document.getElementById("btn-const-speak").addEventListener("click", () => {
      if (this.currentWord) {
        const charObj = this.currentWord.chars[this.constSelectedCharIdx];
        this.tts.speak(charObj.char);
      }
    });
    document.getElementById("btn-const-submit").addEventListener("click", () => {
      this.checkConstructorAnswer();
    });

    // 聲調氣球大考驗 - 聽音按鈕
    document.getElementById("btn-balloon-speak").addEventListener("click", () => {
      if (this.currentWord) this.tts.speak(this.currentWord.word);
    });

    // 聽音辨字挑戰 - 發音與再播
    document.getElementById("btn-listen-play").addEventListener("click", () => {
      this.playListeningQuestionSound();
    });
    document.getElementById("btn-listen-replay").addEventListener("click", () => {
      this.playListeningQuestionSound();
    });

    // 連連看清除
    document.getElementById("btn-matcher-reset").addEventListener("click", () => {
      this.sounds.playClick();
      this.resetMatcher();
    });

    // 答對彈窗下一步
    document.getElementById("btn-modal-speak").addEventListener("click", () => {
      if (this.currentWord) this.tts.speak(this.currentWord.word);
    });
    document.getElementById("btn-modal-next").addEventListener("click", () => {
      this.sounds.playClick();
      document.getElementById("modal-success").classList.remove("active");
      this.confetti.stop();
      this.nextLevel();
    });

    // 結算返回首頁與重試
    document.getElementById("btn-end-restart").addEventListener("click", () => {
      this.sounds.playClick();
      this.startAdventure(this.currentMode);
    });
    document.getElementById("btn-end-home").addEventListener("click", () => {
      this.sounds.playClick();
      this.exitToHome();
    });

    // 重設連連看 Canvas 大小
    window.addEventListener("resize", () => {
      if (this.currentMode === "matcher") {
        this.resizeMatcherCanvas();
        this.drawMatcherLines();
      }
    });
  },

  // 畫面切換控制
  switchScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => s.classList.remove("active"));
    
    const target = document.getElementById(screenId);
    target.classList.add("active");
    this.currentScreen = screenId;

    // 通用頂部 header 顯示邏輯
    const header = document.getElementById("global-header");
    const progress = document.getElementById("game-progress-container");
    if (screenId === "play-screen") {
      header.classList.remove("hidden");
      progress.classList.remove("hidden");
    } else if (screenId === "tutorial-screen" || screenId === "mode-screen") {
      header.classList.remove("hidden");
      progress.classList.add("hidden");
    } else {
      header.classList.add("hidden");
    }
  },

  // 退出到首頁
  exitToHome() {
    this.currentMode = null;
    this.confetti.stop();
    // 停止氣球動畫迴圈與連連看重置
    this.balloonList = [];
    document.getElementById("modal-success").classList.remove("active");
    this.switchScreen("start-screen");
  },

  // 4 聲連續發音示範 (教學)
  playFourTonesSequence() {
    const toneChars = ["媽", "麻", "馬", "罵", "嗎"];
    let idx = 0;
    const playNext = () => {
      if (idx < toneChars.length) {
        // 點亮當前聲調卡片
        const cards = document.querySelectorAll(".tone-card-interactive");
        cards.forEach(c => c.style.borderColor = "var(--panel-border)");
        
        let toneVal = idx === 4 ? 0 : idx + 1;
        const activeCard = Array.from(cards).find(c => c.getAttribute("data-tone") == toneVal);
        if (activeCard) {
          activeCard.style.borderColor = "var(--color-yellow)";
        }
        
        this.tts.speak(toneChars[idx], 0.7);
        idx++;
        setTimeout(playNext, 1100);
      } else {
        // 恢復正常
        document.querySelectorAll(".tone-card-interactive").forEach(c => c.style.borderColor = "var(--panel-border)");
      }
    };
    playNext();
  },

  // 渲染聲母學習清單
  renderTutorialInitials() {
    const container = document.getElementById("initials-list");
    container.innerHTML = "";
    INITIALS_TUTORIAL.forEach(item => {
      const card = document.createElement("div");
      card.className = "letter-card";
      card.innerHTML = `
        <span class="symbol-main">${item.pinyin}</span>
        <span class="symbol-sub">${item.zhuyin}</span>
        <span class="symbol-example">${item.example}</span>
      `;
      card.addEventListener("click", () => {
        this.sounds.playPop();
        // 唸出範例字
        this.tts.speak(item.example.split(" ")[0]);
      });
      container.appendChild(card);
    });
  },

  // 渲染韻母學習清單
  renderTutorialFinals() {
    const container = document.getElementById("finals-list");
    container.innerHTML = "";
    FINALS_TUTORIAL.forEach(item => {
      const card = document.createElement("div");
      card.className = "letter-card";
      card.innerHTML = `
        <span class="symbol-main">${item.pinyin}</span>
        <span class="symbol-sub">${item.zhuyin}</span>
        <span class="symbol-example">${item.example}</span>
      `;
      card.addEventListener("click", () => {
        this.sounds.playPop();
        this.tts.speak(item.example.split(" ")[0]);
      });
      container.appendChild(card);
    });

    // 聲調卡片單點發音
    document.querySelectorAll(".tone-card-interactive").forEach(card => {
      card.addEventListener("click", () => {
        this.sounds.playClick();
        const tone = card.getAttribute("data-tone");
        const toneChars = {
          1: "媽",
          2: "麻",
          3: "馬",
          4: "罵",
          0: "嗎"
        };
        this.tts.speak(toneChars[tone], 0.7);
      });
    });
  },

  // 渲染拼讀規則卡
  renderTutorialRules() {
    const rule = RULES_TUTORIAL[this.currentRuleIdx];
    document.getElementById("rule-index").innerText = `規則 ${this.currentRuleIdx + 1}/${RULES_TUTORIAL.length}`;
    document.getElementById("rule-title").innerText = rule.title;
    document.getElementById("rule-detail").innerHTML = rule.detail.replace(/`([^`]+)`/g, '<span class="highlight" style="font-size:1.05rem">$1</span>');
    document.getElementById("rule-example").innerText = rule.example;
  },

  // 渲染成語例子卡片清單
  renderTutorialIdioms() {
    const container = document.getElementById("idioms-tutorial-list");
    if (!container) return;
    container.innerHTML = "";
    
    // 從 VOCABULARY 中篩選出成語 (字數為 4 的項目)
    const idiomsList = VOCABULARY.filter(item => item.word.length === 4);
    
    idiomsList.forEach(item => {
      const card = document.createElement("div");
      card.className = "idiom-tutorial-card";
      card.setAttribute("data-word", item.word);
      card.setAttribute("data-pinyin", item.pinyin.toLowerCase());
      
      card.innerHTML = `
        <div class="idiom-tut-header">
          <span class="idiom-tut-emoji">${item.emoji}</span>
          <span class="idiom-tut-word">${item.word}</span>
          <span class="idiom-tut-pinyin">${item.pinyin}</span>
        </div>
        <div class="idiom-tut-details hidden">
          <div class="idiom-tut-zhuyin">注音: <strong>${item.zhuyin.replace(/%/g, "")}</strong></div>
          <div class="idiom-tut-explanation">💡 意思: ${item.english}</div>
          <div class="idiom-tut-breakdown">
            ${item.chars.map(c => `
              <span class="bd-item">
                <strong class="char">${c.char}</strong>
                <span class="pinyin">${c.pinyin}</span>
                <span class="zhuyin">${c.zhuyin}</span>
              </span>
            `).join("")}
          </div>
        </div>
      `;
      
      // 點擊卡片：播放發音並切換展開詳細內容
      card.addEventListener("click", () => {
        this.sounds.playPop();
        this.tts.speak(item.word);
        
        const details = card.querySelector(".idiom-tut-details");
        const isHidden = details.classList.contains("hidden");
        
        // 先將其他成語卡片折疊以保持整潔
        document.querySelectorAll(".idiom-tutorial-card .idiom-tut-details").forEach(d => {
          d.classList.add("hidden");
        });
        document.querySelectorAll(".idiom-tutorial-card").forEach(c => {
          c.classList.remove("expanded");
        });
        
        if (isHidden) {
          details.classList.remove("hidden");
          card.classList.add("expanded");
        }
      });
      
      container.appendChild(card);
    });
    
    // 搜尋輸入框事件綁定
    const searchInput = document.getElementById("idioms-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();
        const cards = container.querySelectorAll(".idiom-tutorial-card");
        cards.forEach(c => {
          const word = c.getAttribute("data-word");
          const pinyin = c.getAttribute("data-pinyin");
          if (word.includes(q) || pinyin.includes(q)) {
            c.style.display = "";
          } else {
            c.style.display = "none";
          }
        });
      });
    }
  },

  // ==========================================================================
  // 遊戲核心邏輯：開始冒險
  // ==========================================================================
  startAdventure(mode) {
    this.currentMode = mode;
    this.score = 0;
    this.currentLevel = 0;
    
    // 更新頂部顯示的星星
    document.getElementById("score-val").innerText = this.score;

    // 從庫中隨機選出 5 個詞進行闖關
    this.vocabList = [...VOCABULARY].sort(() => Math.random() - 0.5).slice(0, this.maxLevels);

    // 切換顯示模式區域
    document.querySelectorAll(".workspace-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`workspace-${mode}`).classList.add("active");

    this.switchScreen("play-screen");
    this.loadLevel();
  },

  // 載入關卡
  loadLevel() {
    if (this.currentLevel >= this.maxLevels) {
      this.showEndScreen();
      return;
    }

    // 更新進度條
    const progressPercent = (this.currentLevel / this.maxLevels) * 100;
    document.getElementById("progress-bar-inner").style.width = `${progressPercent}%`;
    document.getElementById("progress-text").innerText = `${this.currentLevel + 1}/${this.maxLevels}`;

    this.currentWord = this.vocabList[this.currentLevel];
    
    // 依模式載入工作區
    if (this.currentMode === "constructor") {
      this.initConstructorMode();
    } else if (this.currentMode === "balloons") {
      this.initBalloonsMode();
    } else if (this.currentMode === "listening") {
      this.initListeningMode();
    } else if (this.currentMode === "matcher") {
      this.initMatcherMode();
    }
  },

  // 關卡答對處理
  levelComplete() {
    this.score += 10;
    document.getElementById("score-val").innerText = this.score;
    
    this.sounds.playSuccess();
    this.confetti.start();

    // 彈出詞彙說明視窗
    this.showSuccessModal();
  },

  // 下一關
  nextLevel() {
    this.currentLevel++;
    this.loadLevel();
  },

  // 展示答對詳細知識彈窗
  showSuccessModal() {
    const modal = document.getElementById("modal-success");
    document.getElementById("modal-vocab-emoji").innerText = this.currentWord.emoji;
    document.getElementById("modal-vocab-word").innerText = this.currentWord.word;
    document.getElementById("modal-vocab-pinyin").innerText = this.currentWord.pinyin;
    document.getElementById("modal-vocab-zhuyin").innerText = this.currentWord.zhuyin.replace(/%/g, "");
    document.getElementById("modal-vocab-english").innerText = this.currentWord.english;

    // 漢字聲韻拆解卡
    const cardsContainer = document.getElementById("modal-vocab-breakdown-cards");
    cardsContainer.innerHTML = "";
    this.currentWord.chars.forEach(c => {
      const card = document.createElement("div");
      card.className = "breakdown-card";
      
      const toneMark = TONE_SYMBOLS[c.tone] || "無";
      card.innerHTML = `
        <span class="bd-char">${c.char}</span>
        <span class="bd-pinyin">${c.pinyin}</span>
        <div class="bd-parts">
          <span>聲母: <strong>${c.initial || "無"}</strong></span>
          <span>韻母: <strong>${c.final}</strong></span>
          <span>聲調: <strong>${c.tone} 聲 (${toneMark})</strong></span>
          <span style="color:var(--color-yellow); margin-top:4px">${c.zhuyin}</span>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    modal.classList.add("active");
    // TTS 發音
    setTimeout(() => {
      this.tts.speak(this.currentWord.word);
    }, 300);
  },

  // 結算畫面
  showEndScreen() {
    this.sounds.playSuccess();
    this.confetti.start();
    this.switchScreen("end-screen");
    
    document.getElementById("end-score-val").innerText = this.score;
    
    // 依分數給予星星數量評價
    let starsStr = "⭐⭐⭐⭐⭐";
    if (this.score >= 50) starsStr = "⭐⭐⭐⭐⭐";
    else if (this.score >= 40) starsStr = "⭐⭐⭐⭐☆";
    else if (this.score >= 30) starsStr = "⭐⭐⭐☆☆";
    else starsStr = "⭐⭐☆☆☆";
    
    document.getElementById("end-stars").innerText = starsStr;

    // 發音讚美
    setTimeout(() => {
      this.tts.speak("太棒了，恭喜通關！");
    }, 400);
  },

  // ==========================================================================
  // [模式 1] 聲韻拼拼樂 (Constructor) 邏輯
  // ==========================================================================
  initConstructorMode() {
    // 每次載入時，隨機選中該詞彙的其中一個漢字讓玩家拼寫
    this.constSelectedCharIdx = Math.floor(Math.random() * this.currentWord.chars.length);
    const charObj = this.currentWord.chars[this.constSelectedCharIdx];

    // 更新漢字顯示
    document.getElementById("const-emoji").innerText = this.currentWord.emoji;
    document.getElementById("const-word").innerText = this.currentWord.word;
    document.getElementById("const-trans").innerText = this.currentWord.english;
    document.getElementById("const-target-char").innerText = charObj.char;

    // 清除 slots
    this.resetConstructorSlots();

    // 渲染候選卡片池
    this.renderConstructorPools(charObj);
  },

  resetConstructorSlots() {
    this.constCurrentVals = { initial: "", final: "", tone: "" };
    document.getElementById("slot-initial").innerText = "?";
    document.getElementById("slot-final").innerText = "?";
    document.getElementById("slot-tone").innerText = "?";
    
    document.querySelectorAll(".pinyin-slot").forEach(s => s.classList.remove("filled"));
    document.getElementById("const-pinyin-output").innerText = "_ _ _";
    
    // 取消候選卡池置灰
    document.querySelectorAll(".pool-card").forEach(c => c.classList.remove("selected"));

    // 預設選中聲母格
    document.querySelectorAll(".pinyin-slot").forEach(s => s.classList.remove("active-slot"));
    const initSlot = document.querySelector('[data-slot="initial"]');
    initSlot.classList.add("active-slot");
    this.constActiveSlot = "initial";
  },

  renderConstructorPools(charObj) {
    const initialsPool = document.getElementById("pool-initials");
    const finalsPool = document.getElementById("pool-finals");
    const tonesPool = document.getElementById("pool-tones");

    initialsPool.innerHTML = "";
    finalsPool.innerHTML = "";
    tonesPool.innerHTML = "";

    // 1. 聲母池：包含正確聲母 + 5 個隨機干擾
    const correctInit = charObj.initial;
    let initsList = [correctInit];
    while (initsList.length < 6) {
      const randInit = INITIALS_TUTORIAL[Math.floor(Math.random() * INITIALS_TUTORIAL.length)].pinyin;
      if (!initsList.includes(randInit)) initsList.push(randInit);
    }
    initsList.sort(() => Math.random() - 0.5);

    initsList.forEach(item => {
      const card = document.createElement("div");
      card.className = "pool-card";
      card.innerText = item === "" ? "無" : item;
      card.addEventListener("click", () => this.handleConstructorCardClick("initial", item, card));
      initialsPool.appendChild(card);
    });

    // 2. 韻母池：包含正確韻母 + 5 個隨機干擾
    const correctFinal = charObj.final;
    let finalsList = [correctFinal];
    while (finalsList.length < 6) {
      const randFinal = FINALS_TUTORIAL[Math.floor(Math.random() * FINALS_TUTORIAL.length)].pinyin;
      if (!finalsList.includes(randFinal)) finalsList.push(randFinal);
    }
    finalsList.sort(() => Math.random() - 0.5);

    finalsList.forEach(item => {
      const card = document.createElement("div");
      card.className = "pool-card";
      card.innerText = item;
      card.addEventListener("click", () => this.handleConstructorCardClick("final", item, card));
      finalsPool.appendChild(card);
    });

    // 3. 聲調池：1-4聲與輕聲
    const tonesList = [1, 2, 3, 4, 0];
    tonesList.forEach(item => {
      const card = document.createElement("div");
      card.className = "pool-card";
      card.innerText = TONE_SYMBOLS[item];
      card.addEventListener("click", () => this.handleConstructorCardClick("tone", item, card));
      tonesPool.appendChild(card);
    });
  },

  handleConstructorCardClick(type, value, cardEl) {
    if (this.constActiveSlot !== type) {
      // 提醒用戶點選正確的欄位
      this.sounds.playClick();
      // 切換選中欄位
      document.querySelectorAll(".pinyin-slot").forEach(s => s.classList.remove("active-slot"));
      const slot = document.querySelector(`[data-slot="${type}"]`);
      slot.classList.add("active-slot");
      this.constActiveSlot = type;
    }

    this.sounds.playPop();

    // 恢復該組之前置灰的卡片
    cardEl.parentElement.querySelectorAll(".pool-card").forEach(c => c.classList.remove("selected"));
    cardEl.classList.add("selected");

    this.constCurrentVals[type] = value;
    
    // 更新插槽畫面
    const slotValEl = document.getElementById(`slot-${type}`);
    slotValEl.innerText = type === "tone" ? TONE_SYMBOLS[value] : (value === "" ? "無" : value);
    document.querySelector(`[data-slot="${type}"]`).classList.add("filled");

    // 組合結果動態顯示
    this.updateCombinedConstructorPinyin();

    // 自動跳轉下一個空白格
    if (type === "initial") {
      this.autoSelectSlot("final");
    } else if (type === "final") {
      this.autoSelectSlot("tone");
    }
  },

  autoSelectSlot(targetSlot) {
    document.querySelectorAll(".pinyin-slot").forEach(s => s.classList.remove("active-slot"));
    const slot = document.querySelector(`[data-slot="${targetSlot}"]`);
    slot.classList.add("active-slot");
    this.constActiveSlot = targetSlot;
  },

  updateCombinedConstructorPinyin() {
    const vals = this.constCurrentVals;
    if (vals.final !== "") {
      const combined = addToneMark(vals.initial + vals.final, vals.tone === "" ? 5 : vals.tone);
      document.getElementById("const-pinyin-output").innerText = combined;
    } else {
      document.getElementById("const-pinyin-output").innerText = (vals.initial || "_") + " + _ + _";
    }
  },

  checkConstructorAnswer() {
    const vals = this.constCurrentVals;
    const charObj = this.currentWord.chars[this.constSelectedCharIdx];

    // 如果沒有填滿，震動提示
    if (vals.final === "" || vals.tone === "") {
      this.sounds.playFailure();
      const workspace = document.getElementById("workspace-constructor");
      workspace.classList.add("shake");
      setTimeout(() => workspace.classList.remove("shake"), 400);
      return;
    }

    const playerAnswer = addToneMark(vals.initial + vals.final, vals.tone);
    const correctAnswer = charObj.pinyin;

    if (playerAnswer === correctAnswer) {
      this.levelComplete();
    } else {
      // 答錯
      this.sounds.playFailure();
      const workspace = document.getElementById("workspace-constructor");
      workspace.classList.add("shake");
      setTimeout(() => workspace.classList.remove("shake"), 400);
      // 閃爍紅色 slots
      document.querySelectorAll(".pinyin-slot").forEach(s => {
        s.style.borderColor = "hsl(0, 85%, 60%)";
        setTimeout(() => s.style.borderColor = "", 1000);
      });
    }
  },

  // ==========================================================================
  // [模式 2] 聲調大考驗 (Balloons) 邏輯
  // ==========================================================================
  initBalloonsMode() {
    // 隨機選一個漢字來測聲調
    this.balloonTargetCharIdx = Math.floor(Math.random() * this.currentWord.chars.length);
    const charObj = this.currentWord.chars[this.balloonTargetCharIdx];

    // 卡片內容
    document.getElementById("balloon-emoji").innerText = this.currentWord.emoji;
    document.getElementById("balloon-word").innerText = this.currentWord.word;
    document.getElementById("balloon-trans").innerText = this.currentWord.english;

    // 將考題拼音隱藏聲調標誌
    let textBlank = "";
    this.currentWord.chars.forEach((c, idx) => {
      if (idx === this.balloonTargetCharIdx) {
        // 這是要考的字
        const pinyinWithoutTone = c.initial + c.final;
        textBlank += `<span class="highlight">${pinyinWithoutTone}[?]</span>`;
      } else {
        textBlank += ` ${c.pinyin} `;
      }
    });
    document.getElementById("balloon-pinyin-blank").innerHTML = textBlank;

    // 清除氣球並生成
    this.balloonList = [];
    const stage = document.getElementById("balloons-stage");
    stage.innerHTML = "";

    // 建立 5 個不同聲調氣球
    const tones = [1, 2, 3, 4, 0];
    const colors = [1, 2, 3, 4, 0];
    
    // 亂序生成
    tones.sort(() => Math.random() - 0.5);

    const rect = stage.getBoundingClientRect();
    const stageWidth = rect.width || 340;
    const stageHeight = rect.height || 280;

    tones.forEach((tone, idx) => {
      const balloonEl = document.createElement("div");
      balloonEl.className = `balloon balloon-color-${colors[tone]}`;
      balloonEl.innerHTML = `<span>${TONE_SYMBOLS[tone]}</span><div class="balloon-string"></div>`;
      
      stage.appendChild(balloonEl);

      // 動態浮動定位與速度
      const balloonObj = {
        el: balloonEl,
        tone: tone,
        x: Math.random() * (stageWidth - 80),
        y: stageHeight + Math.random() * 150, // 錯開出現時間
        speed: Math.random() * 0.8 + 0.5,
        width: 70
      };

      balloonEl.style.left = `${balloonObj.x}px`;
      balloonEl.style.bottom = `${-100}px`;

      // 綁定點擊事件
      balloonEl.addEventListener("click", () => {
        this.handleBalloonClick(balloonObj);
      });

      this.balloonList.push(balloonObj);
    });

    // 啟動氣球動畫輪詢
    if (this.balloonList.length > 0) {
      // 防止多次調用 requestAnimationFrame
      if (this.balloonAnimationId) cancelAnimationFrame(this.balloonAnimationId);
      this.animateBalloons();
    }
  },

  animateBalloons() {
    if (this.currentMode !== "balloons" || this.currentScreen !== "play-screen") return;
    
    const stage = document.getElementById("balloons-stage");
    const rect = stage.getBoundingClientRect();
    const stageWidth = rect.width || 340;
    const stageHeight = rect.height || 280;

    this.balloonList.forEach(b => {
      b.y -= b.speed;
      
      // 當氣球飛出頂部，重新循環至底部
      if (b.y < -90) {
        b.y = stageHeight + 20;
        b.x = Math.random() * (stageWidth - 85);
      }
      
      b.el.style.transform = `translateY(${- (stageHeight - b.y)}px)`;
      b.el.style.left = `${b.x}px`;
    });

    this.balloonAnimationId = requestAnimationFrame(() => this.animateBalloons());
  },

  handleBalloonClick(balloonObj) {
    const charObj = this.currentWord.chars[this.balloonTargetCharIdx];
    const correctTone = charObj.tone;

    if (balloonObj.tone === correctTone) {
      // 答對了！
      this.sounds.playPop();
      
      // 氣球爆炸特效 (縮放並消失)
      balloonObj.el.style.transform += " scale(1.4)";
      balloonObj.el.style.opacity = "0";
      balloonObj.el.style.pointerEvents = "none";
      
      // 停止動畫
      this.balloonList = [];
      
      setTimeout(() => {
        this.levelComplete();
      }, 400);
    } else {
      // 答錯，氣球反彈震動
      this.sounds.playFailure();
      balloonObj.el.classList.add("shake");
      setTimeout(() => balloonObj.el.classList.remove("shake"), 400);
      
      // 扣除少許星星
      if (this.score > 0) {
        this.score = Math.max(0, this.score - 2);
        document.getElementById("score-val").innerText = this.score;
      }
    }
  },

  // ==========================================================================
  // [模式 3] 聽音辨字挑戰 (Listening) 邏輯
  // ==========================================================================
  initListeningMode() {
    const optionsGrid = document.getElementById("listening-options");
    optionsGrid.innerHTML = "";

    // 產生聽音選項 (1 正確 + 3 干擾)
    const options = this.generateListeningOptions(this.currentWord);

    options.forEach(opt => {
      const card = document.createElement("div");
      card.className = "option-card";
      
      // 我們只顯示拼音與對應的代表字，不顯示注音以強調聽音拼音對照，或是簡單顯示
      card.innerHTML = `
        <span class="opt-pinyin">${opt.pinyin}</span>
        <span class="opt-zhuyin">${opt.zhuyin}</span>
      `;

      card.addEventListener("click", () => {
        this.handleListeningAnswer(opt, card);
      });
      optionsGrid.appendChild(card);
    });

    // 自動播放發音
    setTimeout(() => {
      this.playListeningQuestionSound();
    }, 400);
  },

  playListeningQuestionSound() {
    if (this.currentWord) {
      // 喇叭動畫
      const ring = document.querySelector(".pulse-ring");
      if (ring) {
        ring.style.animation = "none";
        setTimeout(() => ring.style.animation = "ringPulse 1.2s infinite ease-out", 10);
        setTimeout(() => ring.style.animation = "none", 2400);
      }
      this.tts.speak(this.currentWord.word);
    }
  },

  handleListeningAnswer(opt, cardEl) {
    if (opt.correct) {
      this.levelComplete();
    } else {
      this.sounds.playFailure();
      cardEl.classList.add("shake");
      setTimeout(() => cardEl.classList.remove("shake"), 400);
      cardEl.style.borderColor = "hsl(0, 85%, 60%)";
      cardEl.style.opacity = "0.6";
      cardEl.style.pointerEvents = "none";
      
      if (this.score > 0) {
        this.score = Math.max(0, this.score - 2);
        document.getElementById("score-val").innerText = this.score;
      }
    }
  },

  generateListeningOptions(wordObj) {
    const correctPinyin = wordObj.pinyin;
    const correctZhuyin = wordObj.zhuyin.replace(/%/g, "");
    const options = [{
      pinyin: correctPinyin,
      zhuyin: correctZhuyin,
      correct: true
    }];

    const tones = [1, 2, 3, 4, 0];
    const zhuyinTones = ["", "ˊ", "ˇ", "ˋ", "˙"];
    const usedPinyins = new Set([correctPinyin]);

    while (options.length < 4) {
      let wrongPinyins = [];
      let wrongZhuyins = [];

      // 決定修改類型：單純修改聲調，或修改字母
      const alterType = Math.random() < 0.6 ? 'tone' : 'letter';

      wordObj.chars.forEach(c => {
        if (alterType === 'tone') {
          // 修改聲調
          let newTone = c.tone;
          while (newTone === c.tone) {
            newTone = tones[Math.floor(Math.random() * tones.length)];
          }
          wrongPinyins.push(addToneMark(c.initial + c.final, newTone));
          
          let baseZhuyin = c.zhuyin.replace(/[ˊˇˋ˙]/g, "");
          if (newTone === 0) {
            wrongZhuyins.push("˙" + baseZhuyin);
          } else {
            wrongZhuyins.push(baseZhuyin + zhuyinTones[newTone]);
          }
        } else {
          // 修改字母 (替換發音相近的聲母/韻母)
          const initialMap = {
            'b': 'p', 'p': 'b', 'd': 't', 't': 'd', 'g': 'k', 'k': 'g', 
            'l': 'n', 'n': 'l', 'j': 'q', 'q': 'j', 'zh': 'ch', 'ch': 'zh',
            'z': 'c', 'c': 'z', 's': 'sh', 'sh': 's', 'x': 's'
          };
          let newInit = c.initial;
          if (initialMap[c.initial] && Math.random() < 0.6) {
            newInit = initialMap[c.initial];
          }

          const finalMap = {
            'an': 'ang', 'ang': 'an', 'en': 'eng', 'eng': 'en',
            'in': 'ing', 'ing': 'in', 'o': 'e', 'e': 'o', 'ai': 'ei',
            'ei': 'ai', 'ao': 'ou', 'ou': 'ao', 'uo': 'u'
          };
          let newFinal = c.final;
          if (finalMap[c.final] && Math.random() < 0.6) {
            newFinal = finalMap[c.final];
          }

          // 強制製造不同
          let newTone = c.tone;
          if (newInit === c.initial && newFinal === c.final) {
            newTone = (c.tone + 1) % 5;
          }

          wrongPinyins.push(addToneMark(newInit + newFinal, newTone));
          wrongZhuyins.push(""); // 連同注音替換太複雜，此時干擾選項可略過注音顯示
        }
      });

      const pinyinStr = wrongPinyins.join(" ");
      if (!usedPinyins.has(pinyinStr)) {
        usedPinyins.add(pinyinStr);
        options.push({
          pinyin: pinyinStr,
          zhuyin: wrongZhuyins.join(" ").trim(),
          correct: false
        });
      }
    }

    return options.sort(() => Math.random() - 0.5);
  },

  // ==========================================================================
  // [模式 4] 注音拼音連連看 (Matcher) 邏輯
  // ==========================================================================
  initMatcherMode() {
    this.matcherPairs = [];
    this.matcherLeftSelected = null;
    this.matcherRightSelected = null;

    // 取出本關卡的 4 個字或詞（如果當前詞是雙字詞，我們從關卡列表拼湊 4 個字）
    this.matcherLeftList = [];
    this.matcherRightList = [];

    // 取出當前與前後共4個單字做連連看
    let idxList = [];
    for (let i = 0; i < 4; i++) {
      let vIdx = (this.currentLevel + i) % this.vocabList.length;
      let vocab = this.vocabList[vIdx];
      let charObj = vocab.chars[0]; // 拿每個詞的第一個字來比
      idxList.push({
        id: `m-${i}`,
        char: charObj.char,
        zhuyin: charObj.zhuyin,
        pinyin: charObj.pinyin
      });
    }

    // 複製並洗牌
    const leftData = [...idxList].sort(() => Math.random() - 0.5);
    const rightData = [...idxList].sort(() => Math.random() - 0.5);

    this.matcherLeftList = leftData;
    this.matcherRightList = rightData;

    this.renderMatcherColumns();
    this.resizeMatcherCanvas();
    this.drawMatcherLines();
  },

  renderMatcherColumns() {
    const leftCol = document.getElementById("matcher-left");
    const rightCol = document.getElementById("matcher-right");
    leftCol.innerHTML = "";
    rightCol.innerHTML = "";

    // 左側：注音
    this.matcherLeftList.forEach(item => {
      const card = document.createElement("div");
      card.className = "match-item";
      card.setAttribute("data-id", item.id);
      card.setAttribute("data-side", "left");
      card.innerHTML = `
        <span style="font-size:0.85rem; color:var(--text-muted)">${item.char}</span><br>
        <span style="color:var(--color-yellow)">${item.zhuyin}</span>
        <div class="match-dot"></div>
      `;
      card.addEventListener("click", () => this.handleMatcherItemClick(item.id, "left", card));
      leftCol.appendChild(card);
    });

    // 右側：拼音
    this.matcherRightList.forEach(item => {
      const card = document.createElement("div");
      card.className = "match-item";
      card.setAttribute("data-id", item.id);
      card.setAttribute("data-side", "right");
      card.innerHTML = `
        <span style="font-size:0.85rem; color:var(--text-muted)">${item.char}</span><br>
        <span style="color:var(--color-cyan)">${item.pinyin}</span>
        <div class="match-dot"></div>
      `;
      card.addEventListener("click", () => this.handleMatcherItemClick(item.id, "right", card));
      rightCol.appendChild(card);
    });
  },

  handleMatcherItemClick(id, side, cardEl) {
    this.sounds.playClick();

    if (side === "left") {
      // 點選左側
      if (this.matcherLeftSelected === id) {
        // 取消選取
        this.matcherLeftSelected = null;
        cardEl.classList.remove("selected");
      } else {
        // 清除左側舊選取
        document.querySelectorAll('#matcher-left .match-item').forEach(el => el.classList.remove("selected"));
        this.matcherLeftSelected = id;
        cardEl.classList.add("selected");
      }
    } else {
      // 點選右側
      if (this.matcherRightSelected === id) {
        this.matcherRightSelected = null;
        cardEl.classList.remove("selected");
      } else {
        document.querySelectorAll('#matcher-right .match-item').forEach(el => el.classList.remove("selected"));
        this.matcherRightSelected = id;
        cardEl.classList.add("selected");
      }
    }

    // 如果兩邊都選了，檢查是否匹配
    if (this.matcherLeftSelected && this.matcherRightSelected) {
      if (this.matcherLeftSelected === this.matcherRightSelected) {
        // 配對成功！
        const pairId = this.matcherLeftSelected;
        this.matcherPairs.push(pairId);
        this.sounds.playPop();

        // 將對應卡片改為 matched
        const leftEl = document.querySelector(`#matcher-left [data-id="${pairId}"]`);
        const rightEl = document.querySelector(`#matcher-right [data-id="${pairId}"]`);
        
        leftEl.classList.remove("selected");
        leftEl.classList.add("matched");
        rightEl.classList.remove("selected");
        rightEl.classList.add("matched");

        this.matcherLeftSelected = null;
        this.matcherRightSelected = null;

        // 重新繪圖
        this.drawMatcherLines();

        // 檢查是否全部連完
        if (this.matcherPairs.length === 4) {
          setTimeout(() => {
            this.levelComplete();
          }, 600);
        }
      } else {
        // 配對失敗
        this.sounds.playFailure();
        const leftEl = document.querySelector(`#matcher-left [data-id="${this.matcherLeftSelected}"]`);
        const rightEl = document.querySelector(`#matcher-right [data-id="${this.matcherRightSelected}"]`);
        
        leftEl.classList.add("shake");
        rightEl.classList.add("shake");
        
        setTimeout(() => {
          leftEl.classList.remove("shake", "selected");
          rightEl.classList.remove("shake", "selected");
        }, 400);

        this.matcherLeftSelected = null;
        this.matcherRightSelected = null;
      }
    }
  },

  resetMatcher() {
    this.matcherPairs = [];
    this.matcherLeftSelected = null;
    this.matcherRightSelected = null;
    
    document.querySelectorAll('.match-item').forEach(el => {
      el.classList.remove("selected", "matched");
    });
    
    this.drawMatcherLines();
  },

  resizeMatcherCanvas() {
    const canvas = document.getElementById("matcher-canvas");
    const container = document.getElementById("matcher-container");
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  },

  drawMatcherLines() {
    const canvas = document.getElementById("matcher-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerRect = document.getElementById("matcher-container").getBoundingClientRect();

    this.matcherPairs.forEach(pairId => {
      const leftEl = document.querySelector(`#matcher-left [data-id="${pairId}"]`);
      const rightEl = document.querySelector(`#matcher-right [data-id="${pairId}"]`);
      
      if (leftEl && rightEl) {
        const leftDot = leftEl.querySelector(".match-dot");
        const rightDot = rightEl.querySelector(".match-dot");
        
        const r1 = leftDot.getBoundingClientRect();
        const r2 = rightDot.getBoundingClientRect();
        
        const x1 = r1.left + r1.width / 2 - containerRect.left;
        const y1 = r1.top + r1.height / 2 - containerRect.top;
        const x2 = r2.left + r2.width / 2 - containerRect.left;
        const y2 = r2.top + r2.height / 2 - containerRect.top;

        // 畫霓虹綠連線
        ctx.shadowBlur = 10;
        ctx.shadowColor = "hsl(145, 75%, 50%)";
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "var(--color-green)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        
        ctx.shadowBlur = 0; // 恢復
      }
    });
  }
};

// 網頁載入後啟動
window.addEventListener("DOMContentLoaded", () => {
  Game.init();
});
