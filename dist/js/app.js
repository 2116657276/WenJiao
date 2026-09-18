// js/app.js
/**
 * 圣杯抉择器 - 宣纸风交互中枢与状态机联动
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素引用
  const stage3dScene = document.getElementById('stage-3d-scene');
  const btnAction = document.getElementById('btn-action');
  const btnActionText = document.getElementById('btn-action-text');
  const btnNextRound = document.getElementById('btn-next-round');
  const btnTip = document.getElementById('btn-tip');

  const btnSound = document.getElementById('btn-sound');
  const soundIconContainer = document.getElementById('sound-icon-container');
  const btnHelp = document.getElementById('btn-help');
  const helpModal = document.getElementById('help-modal');
  const helpBtnClose = document.getElementById('help-btn-close');

  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  const settingsBtnClose = document.getElementById('settings-btn-close');
  const btnFontDec = document.getElementById('btn-font-dec');
  const btnFontInc = document.getElementById('btn-font-inc');
  const fontScaleDisplay = document.getElementById('font-scale-display');
  const speedSegmented = document.getElementById('speed-segmented');
  const volumeSegmented = document.getElementById('volume-segmented');
  const checkShowShortcuts = document.getElementById('check-show-shortcuts');

  const tabFair = document.getElementById('tab-fair');
  const tabTraditional = document.getElementById('tab-traditional');
  const traditionalTripleBar = document.getElementById('traditional-triple-bar');
  const checkTraditionalTriple = document.getElementById('check-traditional-triple');

  const inputOptA = document.getElementById('input-opt-a');
  const inputOptB = document.getElementById('input-opt-b');

  const statusBadge = document.getElementById('status-badge');
  const badgeText = document.getElementById('badge-text');
  const progressDots = document.getElementById('progress-dots');
  const dot1 = document.getElementById('dot-1');
  const dot2 = document.getElementById('dot-2');
  const dot3 = document.getElementById('dot-3');

  const decisionBanner = document.getElementById('decision-banner');
  const bannerSeal = document.getElementById('banner-seal');
  const bannerReason = document.getElementById('banner-reason');
  const bannerResultText = document.getElementById('banner-result-text');

  const historyList = document.getElementById('history-list');
  const btnExport = document.getElementById('btn-export');
  const btnClearHistory = document.getElementById('btn-clear-history');

  const confirmModal = document.getElementById('confirm-modal');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');

  // 初始化核心实例
  const sound = new SoundController();
  const engine = new DecisionEngine('fair', true, inputOptA.value.trim(), inputOptB.value.trim());
  const stage = new Bwa3DStage(stage3dScene, sound);

  let pendingAction = null;

  // 更新声音按钮图标 (纯 SVG 无 emoji)
  function updateSoundUI() {
    const isMuted = sound.isMuted();
    btnSound.classList.toggle('active', !isMuted);
    if (isMuted) {
      soundIconContainer.innerHTML = `
        <svg class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      `;
    } else {
      soundIconContainer.innerHTML = `
        <svg class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      `;
    }
  }
  updateSoundUI();

  btnSound.addEventListener('click', () => {
    sound.toggleMute();
    updateSoundUI();
  });

  // 规则释例浮层
  btnHelp.addEventListener('click', () => helpModal.classList.add('show'));
  helpBtnClose.addEventListener('click', () => helpModal.classList.remove('show'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.remove('show');
  });

  // 案台设置浮层与功能管理
  btnSettings.addEventListener('click', () => settingsModal.classList.add('show'));
  settingsBtnClose.addEventListener('click', () => settingsModal.classList.remove('show'));
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('show');
  });

  // 1. 字号缩放控制 (0.9 ~ 1.3)
  const FONT_SCALES = [0.9, 1.0, 1.1, 1.2, 1.3];
  const FONT_LABELS = ['纤秀 (90%)', '标准 (100%)', '微大 (110%)', '清晰 (120%)', '特大 (130%)'];
  let currentFontIndex = 1;

  try {
    const savedFont = localStorage.getItem('hg_font_scale_index');
    if (savedFont !== null) {
      const idx = parseInt(savedFont, 10);
      if (idx >= 0 && idx < FONT_SCALES.length) currentFontIndex = idx;
    }
  } catch (e) {}

  function applyFontScale(index) {
    currentFontIndex = Math.max(0, Math.min(FONT_SCALES.length - 1, index));
    const scale = FONT_SCALES[currentFontIndex];
    document.documentElement.style.setProperty('--font-scale', scale);
    fontScaleDisplay.textContent = FONT_LABELS[currentFontIndex];
    btnFontDec.disabled = currentFontIndex === 0;
    btnFontInc.disabled = currentFontIndex === FONT_SCALES.length - 1;

    try {
      localStorage.setItem('hg_font_scale_index', currentFontIndex);
    } catch (e) {}
  }
  applyFontScale(currentFontIndex);

  btnFontDec.addEventListener('click', () => applyFontScale(currentFontIndex - 1));
  btnFontInc.addEventListener('click', () => applyFontScale(currentFontIndex + 1));

  // 2. 动效节律设置
  function syncSpeedButtons() {
    const current = stage.speed || 'normal';
    speedSegmented.querySelectorAll('.setting-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-speed') === current);
    });
  }
  syncSpeedButtons();

  speedSegmented.addEventListener('click', (e) => {
    const btn = e.target.closest('.setting-tab');
    if (!btn) return;
    const speed = btn.getAttribute('data-speed');
    if (speed) {
      stage.setSpeed(speed);
      syncSpeedButtons();
    }
  });

  // 3. 音量强度设置
  function syncVolumeButtons() {
    const current = sound.volumeLevel || 'medium';
    volumeSegmented.querySelectorAll('.setting-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-vol') === current);
    });
  }
  syncVolumeButtons();

  volumeSegmented.addEventListener('click', (e) => {
    const btn = e.target.closest('.setting-tab');
    if (!btn) return;
    const vol = btn.getAttribute('data-vol');
    if (vol) {
      sound.setVolume(vol);
      syncVolumeButtons();
      // 试听一次木质敲击
      sound.playClack();
    }
  });

  // 4. 快捷键提示开关
  let showShortcuts = true;
  try {
    showShortcuts = localStorage.getItem('hg_show_shortcuts') !== 'false';
  } catch (e) {}

  function updateShortcutTipUI() {
    checkShowShortcuts.checked = showShortcuts;
    btnTip.classList.toggle('hidden', !showShortcuts);
  }
  updateShortcutTipUI();

  checkShowShortcuts.addEventListener('change', () => {
    showShortcuts = checkShowShortcuts.checked;
    try {
      localStorage.setItem('hg_show_shortcuts', showShortcuts);
    } catch (e) {}
    updateShortcutTipUI();
  });

  // 渲染铜钉 / 朱砂圆点进度
  function updateProgressDots() {
    const isTriple = engine.mode === 'fair' || engine.tripleSacred;
    if (!isTriple) {
      progressDots.style.display = 'none';
      return;
    }
    progressDots.style.display = 'flex';
    const c = engine.state.consecutiveSacred;
    dot1.classList.toggle('active', c >= 1);
    dot2.classList.toggle('active', c >= 2);
    dot3.classList.toggle('active', c >= 3);
  }

  // 检查轮次是否进行中 (防误触保护)
  function isRoundInProgress() {
    return engine.state.roundCount > 0 && !engine.state.isFinished;
  }

  function guardRoundChange(actionToExecute) {
    if (isRoundInProgress()) {
      pendingAction = actionToExecute;
      confirmModal.classList.add('show');
    } else {
      actionToExecute();
    }
  }

  modalBtnCancel.addEventListener('click', () => {
    confirmModal.classList.remove('show');
    pendingAction = null;
    syncUiFromEngine();
  });

  modalBtnConfirm.addEventListener('click', () => {
    confirmModal.classList.remove('show');
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  });

  function syncUiFromEngine() {
    tabFair.classList.toggle('active', engine.mode === 'fair');
    tabTraditional.classList.toggle('active', engine.mode === 'traditional');
    traditionalTripleBar.classList.toggle('hidden', engine.mode !== 'traditional');
    checkTraditionalTriple.checked = engine.tripleSacred;
    inputOptA.value = engine.optionA;
    inputOptB.value = engine.optionB;
  }

  // 模式切换
  tabFair.addEventListener('click', () => {
    if (engine.mode === 'fair') return;
    guardRoundChange(() => {
      engine.setMode('fair', true);
      syncUiFromEngine();
      resetRoundUI();
    });
  });

  tabTraditional.addEventListener('click', () => {
    if (engine.mode === 'traditional') return;
    guardRoundChange(() => {
      engine.setMode('traditional', checkTraditionalTriple.checked);
      syncUiFromEngine();
      resetRoundUI();
    });
  });

  checkTraditionalTriple.addEventListener('change', () => {
    guardRoundChange(() => {
      engine.setMode('traditional', checkTraditionalTriple.checked);
      resetRoundUI();
    });
  });

  // 选项输入监听
  function handleOptionChange() {
    const newA = inputOptA.value.trim() || '是 / 行';
    const newB = inputOptB.value.trim() || '否 / 止';
    if (newA === engine.optionA && newB === engine.optionB) return;

    guardRoundChange(() => {
      engine.setOptions(newA, newB);
      resetRoundUI();
    });
  }

  inputOptA.addEventListener('change', handleOptionChange);
  inputOptB.addEventListener('change', handleOptionChange);

  // 重置单轮 UI
  function resetRoundUI() {
    engine.resetRound();
    decisionBanner.style.display = 'none';
    decisionBanner.className = 'decision-banner';
    statusBadge.classList.remove('highlight');
    badgeText.textContent = '案上静候 · 掷杯以决';

    btnAction.disabled = false;
    btnAction.style.display = 'block';
    btnActionText.textContent = '掷杯';

    btnNextRound.classList.add('hidden');

    updateProgressDots();
    stage.resetToRestState(['yin', 'yang']);
  }

  // 执行一次投掷
  function executeThrow() {
    if (btnAction.disabled || stage.isAnimating || engine.state.isFinished) return;

    // 禁用操作，防止连点
    btnAction.disabled = true;
    badgeText.textContent = '腾空翻转 · 爻象未定...';

    // 计算结果
    const res = engine.throwOnce();

    // 触发 3D 物理与落地弹跳
    stage.throwAnimation(res.cups, () => {
      handleThrowResult(res);
    });
  }

  // 投掷动效落定后的状态与文案展示
  function handleThrowResult(res) {
    updateProgressDots();

    // 杯型典雅文案
    const cupNameMap = {
      sacred: '圣杯 (一平一凸)',
      laugh: '笑杯 (两凸朝上)',
      yin: '阴杯 (两平朝上)'
    };
    const cupLabel = cupNameMap[res.singleResult] || res.singleResult;

    // 记录单次簿册流水
    logSingleThrowToHistory(res, cupLabel);

    if (!res.isFinished) {
      // 尚未终结 (三圣中途)
      const countPrefix = ['第一投', '第二投', '第三投'][res.roundCount - 1] || `第${res.roundCount}投`;
      if (engine.mode === 'fair' || engine.tripleSacred) {
        badgeText.textContent = `${countPrefix} · ${cupLabel} · ${res.progress.current}/3`;
      } else {
        badgeText.textContent = `${countPrefix} · 笑杯 · 意旨未明，可再掷`;
      }
      btnAction.disabled = false;
      btnActionText.textContent = '掷杯';
    } else {
      // 终局达成！
      statusBadge.classList.add('highlight');
      const isWinA = res.finalDecision === 'A';
      const chosenText = isWinA ? engine.optionA : engine.optionB;

      let reasonText = '';
      if (isWinA) {
        sound.playSuccess();
        decisionBanner.className = 'decision-banner win-a';
        reasonText = '三圣既成';
        bannerReason.textContent = reasonText;
        bannerResultText.textContent = `所决为甲：${chosenText}`;
        badgeText.textContent = '三圣既定 · 此轮归甲';
      } else {
        sound.playSettle();
        decisionBanner.className = 'decision-banner win-b';
        if (res.isInterrupted) {
          reasonText = '中道未应';
          bannerReason.textContent = '三圣未成 · 中道未应';
          bannerResultText.textContent = `所决为乙：${chosenText}`;
          badgeText.textContent = '中道未应 · 此轮归乙';
        } else {
          reasonText = '阴杯止息';
          bannerReason.textContent = '阴杯止息';
          bannerResultText.textContent = `所决为乙：${chosenText}`;
          badgeText.textContent = '阴杯止息 · 此轮归乙';
        }
      }

      decisionBanner.style.display = 'flex';

      // 主按钮隐藏，“开始下一轮”显示
      btnAction.style.display = 'none';
      btnNextRound.classList.remove('hidden');

      // 记录终局决策至账册
      logFinalDecisionToHistory(res, chosenText, reasonText);
    }
  }

  // 快捷键支持 (Space 掷杯, Enter 下一轮)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!engine.state.isFinished && !btnAction.disabled) {
        executeThrow();
      }
    } else if (e.code === 'Enter') {
      e.preventDefault();
      if (engine.state.isFinished) {
        resetRoundUI();
      } else if (!btnAction.disabled) {
        executeThrow();
      }
    }
  });

  btnAction.addEventListener('click', executeThrow);
  btnNextRound.addEventListener('click', resetRoundUI);

  // 簿册历史记录 (宣纸账册风格)
  const STORAGE_KEY = 'hg_decision_records_v3';
  let historyData = [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) historyData = JSON.parse(saved);
  } catch (e) {
    historyData = [];
  }

  function renderHistory() {
    if (!historyData || historyData.length === 0) {
      historyList.innerHTML = `<div class="history-empty">案上尚无投掷墨迹</div>`;
      return;
    }

    historyList.innerHTML = historyData.slice(-30).reverse().map(item => {
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (item.type === 'single') {
        return `
          <div class="history-row">
            <span class="history-col-time">${timeStr}</span>
            <span class="history-col-desc">${item.countName}  ${item.cupName}</span>
            <span class="history-col-badge">${item.progress}</span>
          </div>
        `;
      } else {
        const itemTag = item.decision === 'A' ? '甲' : '乙';
        return `
          <div class="history-row final-decision">
            <span class="history-col-time">${timeStr}</span>
            <span class="history-col-desc final-text">
              <span class="seal-mini">定</span>
              此轮：[${itemTag}] ${escapeHtml(item.chosenText)}
            </span>
            <span class="history-col-badge">${item.reason}</span>
          </div>
        `;
      }
    }).join('');
  }

  function logSingleThrowToHistory(res, cupLabel) {
    const countPrefix = ['第一投', '第二投', '第三投'][res.roundCount - 1] || `第${res.roundCount}投`;
    const record = {
      type: 'single',
      roundCount: res.roundCount,
      countName: countPrefix,
      cupName: cupLabel,
      progress: res.isFinished ? '结' : `${res.progress.current}/${res.progress.total}`,
      timestamp: Date.now()
    };
    historyData.push(record);
    saveHistory();
  }

  function logFinalDecisionToHistory(res, chosenText, reasonText) {
    const record = {
      type: 'final',
      roundCount: res.roundCount,
      decision: res.finalDecision,
      chosenText: chosenText,
      reason: reasonText,
      timestamp: Date.now()
    };
    historyData.push(record);
    saveHistory();
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
    } catch (e) {}
    renderHistory();
  }

  // 导出与清空
  btnExport.addEventListener('click', () => {
    if (!historyData || historyData.length === 0) {
      alert('当前簿册无任何墨迹记录可导出。');
      return;
    }
    let text = '【问筊 · 筊册誊录】\n' + '------------------------------\n';
    historyData.forEach((h) => {
      const d = new Date(h.timestamp).toLocaleString();
      if (h.type === 'single') {
        text += `[${d}] ${h.countName} -> ${h.cupName} (${h.progress})\n`;
      } else {
        text += `[${d}] 终决：【${h.decision === 'A' ? '甲' : '乙'}】${h.chosenText} （${h.reason}）\n`;
      }
    });
    text += '------------------------------\n';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `圣杯抉择录_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnClearHistory.addEventListener('click', () => {
    if (confirm('是否确定清空全部案上墨迹？此操作不可复原。')) {
      historyData = [];
      saveHistory();
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 初始渲染
  syncUiFromEngine();
  renderHistory();
});
