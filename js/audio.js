// js/audio.js
/**
 * 圣杯抉择器 - 纯程序化 Web Audio 拟真音效合成器
 * 零外部音频文件加载，纯原生算法实时合成木质物理打击与共振声。
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volumeLevel = 'medium';
    this.volumeMultiplier = 1.0;

    try {
      this.muted = localStorage.getItem('hg_sound_muted') === 'true';
      const savedVol = localStorage.getItem('hg_sound_volume');
      if (savedVol && ['soft', 'medium', 'loud'].includes(savedVol)) {
        this.setVolume(savedVol, false);
      }
    } catch (e) {
      this.muted = false;
      this.volumeLevel = 'medium';
    }
  }

  setVolume(level, persist = true) {
    this.volumeLevel = level;
    const map = { soft: 0.5, medium: 1.0, loud: 1.4 };
    this.volumeMultiplier = map[level] || 1.0;
    if (persist) {
      try {
        localStorage.setItem('hg_sound_volume', level);
      } catch (e) {}
    }
  }

  _initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('hg_sound_muted', this.muted);
    } catch (e) {}
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * 掷出空中碰击清脆木音 (Air Clack)
   */
  playClack() {
    if (this.muted) return;
    this._initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // 木材敲击高频瞬态与急剧下潜
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

    // 带通滤波赋予原木箱体共振感
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(820, t);
    filter.Q.setValueAtTime(3.5, t);

    const baseVol = 0.3 * this.volumeMultiplier;
    gain.gain.setValueAtTime(baseVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * 落地弹跳打击音效 (Bounce Land)
   * @param {number} bounceLevel 弹跳阶梯：0(主落点), 1(第一次反弹), 2(微弱余颤)
   * @param {boolean} isConvex 是否阳面（凸面弧形落地自带轻微二次摇晃滚动共振）
   */
  playLand(bounceLevel = 0, isConvex = false) {
    if (this.muted) return;
    this._initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const baseFreq = isConvex ? 260 : 320;
    const decayTime = isConvex ? 0.09 : 0.06;
    const attenuation = Math.pow(2.2, bounceLevel);
    const volume = Math.max(0.02, (0.4 / attenuation) * this.volumeMultiplier);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + decayTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decayTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + decayTime + 0.01);
  }

  /**
   * 最终选择 A (三圣达成/圣杯成立) 提示微音
   */
  playSuccess() {
    if (this.muted) return;
    this._initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 纯和弦
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.18 * this.volumeMultiplier;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * 最终选择 B 提示微音
   */
  playSettle() {
    if (this.muted) return;
    this._initContext();
    if (!this.ctx) return;

    const notes = [440, 392]; // A4, G4 柔和沉稳
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.15 * this.volumeMultiplier;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.31);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundController };
}
if (typeof window !== 'undefined') {
  window.SoundController = SoundController;
}
