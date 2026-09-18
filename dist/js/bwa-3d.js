// js/bwa-3d.js
/**
 * 圣杯抉择器 - 3D 筊杯物理抛掷与阻尼弹跳渲染器
 * 使用原生 CSS 3D Transforms + Web Animations API (WAAPI) + requestAnimationFrame
 */

class Bwa3DStage {
  constructor(stageContainer, soundController) {
    this.stage = stageContainer;
    this.sound = soundController;
    this.isAnimating = false;
    this.speed = 'normal';
    this.speedMultiplier = 1.0;

    try {
      const savedSpeed = localStorage.getItem('hg_anim_speed');
      if (savedSpeed && ['slow', 'normal', 'fast'].includes(savedSpeed)) {
        this.setSpeed(savedSpeed, false);
      }
    } catch (e) {}

    this._initDom();
    this.resetToRestState(['yang', 'yin']); // 默认初始状态：一阴一阳
  }

  setSpeed(speedKey, persist = true) {
    this.speed = speedKey;
    const map = { slow: 1.35, normal: 1.0, fast: 0.7 };
    this.speedMultiplier = map[speedKey] || 1.0;
    if (persist) {
      try {
        localStorage.setItem('hg_anim_speed', speedKey);
      } catch (e) {}
    }
  }

  _initDom() {
    this.stage.innerHTML = `
      <div class="table-plane"></div>
      <div class="cups-group" id="cups-group">
        <!-- 左杯 -->
        <div class="cup-wrapper" id="wrap-0">
          <div class="cup-shadow" id="shadow-0"></div>
          <div class="cup-3d" id="cup-0">
            <div class="cup-rim"></div>
            <div class="cup-face yin"></div>
            <div class="cup-face yang"></div>
          </div>
        </div>
        <!-- 右杯 -->
        <div class="cup-wrapper" id="wrap-1">
          <div class="cup-shadow" id="shadow-1"></div>
          <div class="cup-3d" id="cup-1">
            <div class="cup-rim"></div>
            <div class="cup-face yin"></div>
            <div class="cup-face yang"></div>
          </div>
        </div>
      </div>
    `;

    this.cup0 = document.getElementById('cup-0');
    this.cup1 = document.getElementById('cup-1');
    this.shadow0 = document.getElementById('shadow-0');
    this.shadow1 = document.getElementById('shadow-1');
  }

  /**
   * 重置筊杯至静止休眠姿态
   * @param {Array<string>} initialTypes ['yin'|'yang', 'yin'|'yang']
   */
  resetToRestState(initialTypes = ['yin', 'yang']) {
    if (this.runningAnims) {
      this.runningAnims.forEach(a => { try { a.cancel(); } catch (e) {} });
      this.runningAnims = null;
    }
    const rx0 = initialTypes[0] === 'yang' ? 180 : 0;
    const rx1 = initialTypes[1] === 'yang' ? 180 : 0;

    // 左杯微斜 -22deg，右杯镜像微斜 +22deg
    this.cup0.style.transform = `translate3d(0, 0, 0) rotateX(${rx0}deg) rotateZ(-22deg)`;
    this.cup1.style.transform = `scaleX(-1) translate3d(0, 0, 0) rotateX(${rx1}deg) rotateZ(-22deg)`;

    this.shadow0.style.transform = 'scale(1)';
    this.shadow0.style.opacity = '0.65';
    this.shadow1.style.transform = 'scale(1)';
    this.shadow1.style.opacity = '0.65';
  }

  /**
   * 执行完整的物理抛掷、翻转与阻尼落定动画
   * @param {Array<string>} targetCups ['yin'|'yang', 'yin'|'yang']
   * @param {Function} onComplete 动画完成回调
   */
  throwAnimation(targetCups, onComplete) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // 目标落定角：阴面朝上 rotateX(0deg), 阳面朝上 rotateX(180deg)
    // 翻滚多圈后对齐目标角 (如翻 2~3 圈即 720deg 或 1080deg)
    const spins0 = 720 + (targetCups[0] === 'yang' ? 180 : 0);
    const spins1 = 720 + (targetCups[1] === 'yang' ? 180 : 0);

    // 随机微扰让两枚杯子表现出物理独立性
    const jitterZ0 = -25 + (Math.random() * 16 - 8);
    const jitterZ1 = -25 + (Math.random() * 16 - 8);
    const jitterY0 = Math.random() * 30 - 15;
    const jitterY1 = Math.random() * 30 - 15;

    const mult = this.speedMultiplier;

    // 空中相撞音效 (Air Clack)
    setTimeout(() => {
      if (this.sound) this.sound.playClack();
    }, Math.round(60 * mult));

    // 落地敲击音效 1 (主落点 620ms)
    setTimeout(() => {
      const hasYang = targetCups[0] === 'yang' || targetCups[1] === 'yang';
      if (this.sound) this.sound.playLand(0, hasYang);
    }, Math.round(610 * mult));

    // 落地敲击音效 2 (第一次弹跳触地 800ms)
    setTimeout(() => {
      if (this.sound) this.sound.playLand(1, false);
    }, Math.round(790 * mult));

    // 落地敲击音效 3 (终定微颤 930ms)
    setTimeout(() => {
      const hasYang = targetCups[0] === 'yang' || targetCups[1] === 'yang';
      if (this.sound) this.sound.playLand(2, hasYang);
    }, Math.round(920 * mult));

    // 左杯物理关键帧
    const cup0Keyframes = [
      { transform: this.cup0.style.transform, offset: 0, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
      // 跃升顶点：空中翻滚
      { transform: `translate3d(10px, -150px, 120px) rotateX(${spins0 * 0.45}deg) rotateY(160deg) rotateZ(${jitterZ0}deg)`, offset: 0.35, easing: 'cubic-bezier(0.6, 0.05, 0.9, 0.5)' },
      // 首次触地
      { transform: `translate3d(0, 0, 0) rotateX(${spins0}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0}deg)`, offset: 0.62, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      // 第一次反弹跳起
      { transform: `translate3d(-5px, -32px, 20px) rotateX(${spins0 + 12}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0 - 5}deg)`, offset: 0.76, easing: 'cubic-bezier(0.7, 0.1, 0.9, 0.6)' },
      // 第二次触地
      { transform: `translate3d(0, 0, 0) rotateX(${spins0}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0}deg)`, offset: 0.84, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      // 第二次微弹起
      { transform: `translate3d(0, -9px, 6px) rotateX(${spins0 - 4}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0 + 2}deg)`, offset: 0.91, easing: 'cubic-bezier(0.6, 0.1, 0.9, 0.7)' },
      // 终定落稳 (若阳面朝上，凸弧落地带自平衡余震)
      { transform: `translate3d(0, 0, 0) rotateX(${spins0}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0}deg)`, offset: 1.0 }
    ];

    // 右杯物理关键帧 (带 scaleX(-1) 镜像)
    const cup1Keyframes = [
      { transform: this.cup1.style.transform, offset: 0, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
      { transform: `scaleX(-1) translate3d(-10px, -165px, 130px) rotateX(${spins1 * 0.48}deg) rotateY(-180deg) rotateZ(${jitterZ1}deg)`, offset: 0.35, easing: 'cubic-bezier(0.6, 0.05, 0.9, 0.5)' },
      { transform: `scaleX(-1) translate3d(0, 0, 0) rotateX(${spins1}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1}deg)`, offset: 0.64, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      { transform: `scaleX(-1) translate3d(6px, -36px, 22px) rotateX(${spins1 - 15}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1 + 6}deg)`, offset: 0.78, easing: 'cubic-bezier(0.7, 0.1, 0.9, 0.6)' },
      { transform: `scaleX(-1) translate3d(0, 0, 0) rotateX(${spins1}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1}deg)`, offset: 0.86, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      { transform: `scaleX(-1) translate3d(0, -10px, 6px) rotateX(${spins1 + 5}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1 - 3}deg)`, offset: 0.92, easing: 'cubic-bezier(0.6, 0.1, 0.9, 0.7)' },
      { transform: `scaleX(-1) translate3d(0, 0, 0) rotateX(${spins1}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1}deg)`, offset: 1.0 }
    ];

    // 阴影动态关键帧 (随着跃升高度放大变淡，落案时收聚加深)
    const shadowKeyframes = [
      { transform: 'scale(1)', opacity: 0.65, filter: 'blur(5px)', offset: 0 },
      { transform: 'scale(2.1)', opacity: 0.15, filter: 'blur(14px)', offset: 0.35 },
      { transform: 'scale(1)', opacity: 0.65, filter: 'blur(5px)', offset: 0.63 },
      { transform: 'scale(1.25)', opacity: 0.4, filter: 'blur(8px)', offset: 0.77 },
      { transform: 'scale(1)', opacity: 0.65, filter: 'blur(5px)', offset: 0.85 },
      { transform: 'scale(1.08)', opacity: 0.55, filter: 'blur(6px)', offset: 0.91 },
      { transform: 'scale(1)', opacity: 0.65, filter: 'blur(5px)', offset: 1.0 }
    ];

    const animDuration = Math.round(1000 * mult);

    const anim0 = this.cup0.animate(cup0Keyframes, { duration: animDuration, fill: 'forwards' });
    const anim1 = this.cup1.animate(cup1Keyframes, { duration: animDuration, fill: 'forwards' });
    const s0 = this.shadow0.animate(shadowKeyframes, { duration: animDuration, fill: 'forwards' });
    const s1 = this.shadow1.animate(shadowKeyframes, { duration: animDuration, fill: 'forwards' });

    this.runningAnims = [anim0, anim1, s0, s1];

    anim1.onfinish = () => {
      // 保持终点位置，写入稳定 transform
      const finalX0 = targetCups[0] === 'yang' ? 180 : 0;
      const finalX1 = targetCups[1] === 'yang' ? 180 : 0;

      this.cup0.style.transform = `translate3d(0, 0, 0) rotateX(${finalX0}deg) rotateY(${jitterY0}deg) rotateZ(${jitterZ0}deg)`;
      this.cup1.style.transform = `scaleX(-1) translate3d(0, 0, 0) rotateX(${finalX1}deg) rotateY(${jitterY1}deg) rotateZ(${jitterZ1}deg)`;

      this.shadow0.style.transform = 'scale(1)';
      this.shadow0.style.opacity = '0.65';
      this.shadow1.style.transform = 'scale(1)';
      this.shadow1.style.opacity = '0.65';

      anim0.cancel();
      anim1.cancel();
      s0.cancel();
      s1.cancel();
      this.runningAnims = null;

      this.isAnimating = false;
      if (onComplete) onComplete();
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Bwa3DStage };
}
if (typeof window !== 'undefined') {
  window.Bwa3DStage = Bwa3DStage;
}
