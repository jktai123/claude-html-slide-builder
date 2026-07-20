// 瑪利歐鋼琴音訊合成引擎
import { NOTE_FREQS } from "./songs.js";

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.instrument = "piano"; // "piano" 或 "retro"
    this.activeNotes = {}; // 追蹤正在播放的音符：{ noteName: { oscs: [...], gainNode: ... } }
    this.isMuted = false;
    
    // 麥克風音高偵測相關屬性
    this.micStream = null;
    this.analyser = null;
    this.micSource = null;
    this.isListening = false;

    // 音量控制 (預設 0.7)
    this.masterVolume = 0.7;
  }

  // 初始化 AudioContext，通常在使用者第一次點擊網頁時調用
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(val)));
  }

  setInstrument(type) {
    this.instrument = type;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playNote(noteName) {
    if (this.isMuted) return;
    this.init();

    const freq = NOTE_FREQS[noteName];
    if (!freq) return;

    // 如果該音符已經在彈奏，先將其平滑結束
    if (this.activeNotes[noteName]) {
      this.stopNote(noteName);
    }

    const now = this.ctx.currentTime;
    const gainNode = this.ctx.createGain();
    const oscs = [];

    // 依據音色設定不同的振盪器與 ADSR
    if (this.instrument === "piano") {
      // 鋼琴音色：疊加正弦波與三角波，以產生溫潤的基音與泛音
      const osc1 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, now); // 高一個八度的泛音

      const osc3 = this.ctx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(freq * 3, now); // 三倍頻泛音

      // 使用低通濾波器使聲音更柔和、更像木質鋼琴
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.5);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gainNode);

      oscs.push(osc1, osc2, osc3);

      // ADSR 封包控制 (鋼琴)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.005); // Attack 快
      gainNode.gain.exponentialRampToValueAtTime(0.15 * this.masterVolume, now + 0.4); // Decay
      gainNode.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 3.0); // Sustain 自然緩慢衰減到低點
    } else {
      // 復古 8-bit 音色：模擬紅白機經典 Pulse Wave (方波)
      const osc1 = this.ctx.createOscillator();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq, now);

      // 微調頻率的第二個方波，製造寬廣的 Chorus 合唱效果
      const osc2 = this.ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(freq + 1.5, now);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      oscs.push(osc1, osc2);

      // ADSR 封包控制 (8-Bit)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.002); // Attack 極快
      gainNode.gain.exponentialRampToValueAtTime(0.08 * this.masterVolume, now + 0.15); // Decay 快
      gainNode.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.15); // Sustain
    }

    gainNode.connect(this.ctx.destination);
    oscs.forEach(osc => osc.start(now));

    // 保存作用中的音符節點
    this.activeNotes[noteName] = { oscs, gainNode, startTime: now };
  }

  stopNote(noteName) {
    if (!this.ctx) return;
    const active = this.activeNotes[noteName];
    if (!active) return;

    const now = this.ctx.currentTime;
    const { oscs, gainNode } = active;

    // 平滑釋放 (Release) 防止爆音
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      
      const releaseTime = this.instrument === "piano" ? 0.6 : 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

      oscs.forEach(osc => {
        osc.stop(now + releaseTime);
      });
    } catch (e) {
      console.warn("停止音符錯誤:", e);
    }

    delete this.activeNotes[noteName];
  }

  // --- 瑪利歐特效音合成 ---

  // 1. 金幣音效 (Coin)
  playCoinSound() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    // 瑪利歐金幣頻率：B5 (988 Hz) 隨後是 E6 (1319 Hz)
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 2. 錯誤音效 (Bump)
  playBumpSound() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 3. 過關音效 (Stage Clear Snippet)
  playStageClearSound() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.1 }, // E5
      { f: 783.99, t: 0.2 }, // G5
      { f: 1046.50, t: 0.3 },// C6 (移低一個八度也可以，這裡用 C6 亮麗)
      { f: 1318.51, t: 0.4 },// E6
      { f: 1567.98, t: 0.5 } // G6
    ];

    notes.forEach(n => {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12 * this.masterVolume, now + n.t);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + 0.3);

      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(n.f, now + n.t);

      osc.connect(g);
      g.connect(this.ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + 0.3);
    });
  }

  // 4. 失敗音效 (Game Over / Fall)
  playGameOverSound() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    // 快速下落半音階
    const freqs = [400, 360, 320, 280, 240, 200];
    freqs.forEach((f, i) => {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15 * this.masterVolume, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.15);

      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      osc.connect(g);
      g.connect(this.ctx.destination);

      osc.start(now + i * 0.1);
    });
  }

  // --- 麥克風與實體配對偵測實作 ---

  async initMic() {
    this.init();
    if (this.isListening) return true;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048; // 足以辨識 C4 261Hz 到 G5 784Hz

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);
      
      this.isListening = true;
      return true;
    } catch (e) {
      console.error("麥克風存取失敗:", e);
      this.isListening = false;
      throw e;
    }
  }

  stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.analyser = null;
    this.isListening = false;
  }

  detectPitch() {
    if (!this.isListening || !this.analyser) return null;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloat32TimeDomainData(dataArray);

    const freq = this.autoCorrelate(dataArray, this.ctx.sampleRate);
    if (freq === -1 || isNaN(freq)) {
      return null;
    }

    const note = this.frequencyToNote(freq);
    return note ? { frequency: freq, note } : null;
  }

  frequencyToNote(freq) {
    let closestNote = null;
    let minDiff = Infinity;
    
    for (const [note, noteFreq] of Object.entries(NOTE_FREQS)) {
      const diff = Math.abs(freq - noteFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote) return null;

    // 半音的比率大約是 6% 差異。
    // 設定 3.5% 的最大頻率偏差，避免過度偏離的環境雜音被視為音符
    const expectedFreq = NOTE_FREQS[closestNote];
    if (Math.abs(freq - expectedFreq) / expectedFreq > 0.035) {
      return null;
    }
    
    return closestNote;
  }

  autoCorrelate(buffer, sampleRate) {
    const size = buffer.length;
    let rms = 0;
    
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    
    rms = Math.sqrt(rms / size);
    
    // 如果訊號太微弱，視為靜音
    if (rms < 0.015) {
      return -1;
    }

    // 尋找自相關區間
    let r1 = 0;
    let r2 = size - 1;
    const thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = size - 1; i >= size / 2; i--) {
      if (Math.abs(buffer[i]) < thres) {
        r2 = i;
        break;
      }
    }
    
    const slicedBuffer = buffer.slice(r1, r2);
    const newSize = slicedBuffer.length;

    // 自相關計算
    const c = new Float32Array(newSize);
    for (let i = 0; i < newSize; i++) {
      for (let j = 0; j < newSize - i; j++) {
        c[i] = c[i] + slicedBuffer[j] * slicedBuffer[j + i];
      }
    }

    // 尋找第一個波谷
    let d = 0;
    while (d < newSize - 1 && c[d] > c[d + 1]) d++;
    
    // 尋找最大峰值
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < newSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 < 0) return -1;

    // 二次插值優化
    if (T0 > 0 && T0 < newSize - 1) {
      const x1 = c[T0 - 1];
      const x2 = c[T0];
      const x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }

    return sampleRate / T0;
  }
}
export const audio = new AudioEngine();
