// js/engine.js
/**
 * 圣杯抉择器 - 核心数学引擎与决策状态机
 * 
 * 严格遵循独立随机与大数定律：
 * 1. 传统模式：两枚独立筊杯，各50%阴阳。
 *    - 圣杯 (一阴一阳): 50%
 *    - 笑杯 (两阳): 25%
 *    - 阴杯 (两阴): 25%
 * 2. 公平三圣模式：单次圣杯概率严格使用 p = ∛0.5 ≈ 79.3700526%，
 *    笑杯与阴杯各分担 10.3149737%，保证三连圣达成 A 与任意中断选 B 的最终概率各为严格 50%。
 */

const FAIR_P_SACRED = Math.cbrt(0.5); // ~0.7937005259840998
const FAIR_P_LAUGH = (1 - FAIR_P_SACRED) / 2; // ~0.1031497370079501
const FAIR_P_YIN = FAIR_P_LAUGH; // ~0.1031497370079501

class DecisionEngine {
  constructor(mode = 'fair', tripleSacred = true, optionA = '选项 A', optionB = '选项 B') {
    this.mode = mode; // 'fair' | 'traditional'
    this.tripleSacred = mode === 'fair' ? true : Boolean(tripleSacred);
    this.optionA = optionA;
    this.optionB = optionB;

    // Testing hooks for deterministic mocks
    this.randomFn = null;
    this.randomVal = null;

    this.state = {
      roundCount: 0,
      consecutiveSacred: 0,
      targetSacred: (this.mode === 'fair' || this.tripleSacred) ? 3 : 1,
      isFinished: false,
      finalDecision: null,
      isInterrupted: false,
      lastThrow: null
    };

    this.roundThrows = [];
  }

  setMode(mode, tripleSacred = false) {
    this.mode = mode;
    this.tripleSacred = mode === 'fair' ? true : Boolean(tripleSacred);
    this.resetRound();
  }

  setOptions(optionA, optionB) {
    this.optionA = optionA || '选项 A';
    this.optionB = optionB || '选项 B';
  }

  resetRound() {
    this.state = {
      roundCount: 0,
      consecutiveSacred: 0,
      targetSacred: (this.mode === 'fair' || this.tripleSacred) ? 3 : 1,
      isFinished: false,
      finalDecision: null,
      isInterrupted: false,
      lastThrow: null
    };
    this.roundThrows = [];
  }

  _getRandomVal() {
    return typeof this.randomVal === 'function' ? this.randomVal() : Math.random();
  }

  _getRandomPair() {
    if (typeof this.randomFn === 'function') {
      return this.randomFn();
    }
    return [Math.random(), Math.random()];
  }

  /**
   * 每次点击“掷一次”，产生且仅产生一次物理掷杯结果
   * 返回当前投掷详情及决策状态
   */
  throwOnce() {
    if (this.state.isFinished) {
      throw new Error('当前轮次已收敛并得出决策，请点击“开始下一轮”重新开始');
    }

    this.state.roundCount++;
    let singleResult = ''; // 'sacred' | 'laugh' | 'yin'
    let cups = []; // ['yin'|'yang', 'yin'|'yang']

    if (this.mode === 'traditional') {
      // 传统模式：两枚独立筊杯各自 50% 阴 (flat)、50% 阳 (convex)
      const [r1, r2] = this._getRandomPair();
      const c1 = r1 < 0.5 ? 'yin' : 'yang';
      const c2 = r2 < 0.5 ? 'yin' : 'yang';
      cups = [c1, c2];

      if ((c1 === 'yin' && c2 === 'yang') || (c1 === 'yang' && c2 === 'yin')) {
        singleResult = 'sacred'; // 一阴一阳：圣杯
      } else if (c1 === 'yang' && c2 === 'yang') {
        singleResult = 'laugh'; // 两阳：笑杯
      } else {
        singleResult = 'yin'; // 两阴：阴杯
      }
    } else {
      // 公平三圣模式：由数学概率生成单次结果，再映射为两枚筊杯的视觉形态
      const r = this._getRandomVal();
      if (r < FAIR_P_SACRED) {
        singleResult = 'sacred';
        // 圣杯视觉呈现：随机左阴右阳或左阳右阴
        cups = Math.random() < 0.5 ? ['yin', 'yang'] : ['yang', 'yin'];
      } else if (r < FAIR_P_SACRED + FAIR_P_LAUGH) {
        singleResult = 'laugh';
        cups = ['yang', 'yang'];
      } else {
        singleResult = 'yin';
        cups = ['yin', 'yin'];
      }
    }

    let isFinished = false;
    let finalDecision = null;
    let isInterrupted = false;

    if (this.mode === 'fair' || this.tripleSacred) {
      // 连续三圣规则
      if (singleResult === 'sacred') {
        this.state.consecutiveSacred++;
        if (this.state.consecutiveSacred === 3) {
          isFinished = true;
          finalDecision = 'A';
        } else {
          isFinished = false;
          finalDecision = null;
        }
      } else {
        // 中途出现笑杯或阴杯，连续三圣中断，立即决策为 B，本轮结束
        isFinished = true;
        finalDecision = 'B';
        isInterrupted = true;
      }
    } else {
      // 传统默认单次规则
      if (singleResult === 'sacred') {
        isFinished = true;
        finalDecision = 'A';
      } else if (singleResult === 'yin') {
        isFinished = true;
        finalDecision = 'B';
      } else {
        // 笑杯：本次无决断，可以继续投
        isFinished = false;
        finalDecision = null;
      }
    }

    this.state.isFinished = isFinished;
    this.state.finalDecision = finalDecision;
    this.state.isInterrupted = isInterrupted;

    const throwRecord = {
      roundCount: this.state.roundCount,
      singleResult, // 'sacred' | 'laugh' | 'yin'
      cups, // ['yin'|'yang', 'yin'|'yang']
      progress: {
        current: this.state.consecutiveSacred,
        total: (this.mode === 'fair' || this.tripleSacred) ? 3 : 1
      },
      isFinished,
      finalDecision, // 'A' | 'B' | null
      chosenText: finalDecision === 'A' ? this.optionA : (finalDecision === 'B' ? this.optionB : null),
      isInterrupted,
      timestamp: Date.now()
    };

    this.state.lastThrow = throwRecord;
    this.roundThrows.push(throwRecord);

    return throwRecord;
  }
}

// 兼容 CommonJS (Node.js 原生测试) 与 ES / 浏览器全局注入
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DecisionEngine, FAIR_P_SACRED, FAIR_P_LAUGH, FAIR_P_YIN };
}
if (typeof window !== 'undefined') {
  window.DecisionEngine = DecisionEngine;
  window.FAIR_P_SACRED = FAIR_P_SACRED;
  window.FAIR_P_LAUGH = FAIR_P_LAUGH;
  window.FAIR_P_YIN = FAIR_P_YIN;
}
