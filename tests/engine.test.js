// tests/engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const { DecisionEngine, FAIR_P_SACRED, FAIR_P_LAUGH, FAIR_P_YIN } = require('../js/engine.js');

test('Fair probability constants accuracy', () => {
  const expectedP = Math.cbrt(0.5);
  assert.ok(Math.abs(FAIR_P_SACRED - expectedP) < 1e-9, 'FAIR_P_SACRED should match Math.cbrt(0.5)');
  assert.ok(Math.abs(FAIR_P_LAUGH - (1 - expectedP) / 2) < 1e-9, 'FAIR_P_LAUGH should split remainder');
  assert.ok(Math.abs(FAIR_P_YIN - (1 - expectedP) / 2) < 1e-9, 'FAIR_P_YIN should split remainder');
  assert.ok(Math.abs(FAIR_P_SACRED + FAIR_P_LAUGH + FAIR_P_YIN - 1) < 1e-9, 'Probabilities must sum to 1');
});

test('Traditional mode default (single throw decisions)', () => {
  const engine = new DecisionEngine('traditional', false, '方案A', '方案B');

  // Case 1: Sacred (Yin + Yang) -> A
  engine.randomFn = () => [0.1, 0.9]; // cup1: yin, cup2: yang
  let res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'sacred');
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'A');

  // Reset and test Yin (Yin + Yin) -> B
  engine.resetRound();
  engine.randomFn = () => [0.1, 0.2]; // cup1: yin, cup2: yin
  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'yin');
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'B');

  // Reset and test Laugh (Yang + Yang) -> No decision, continue
  engine.resetRound();
  engine.randomFn = () => [0.8, 0.9]; // cup1: yang, cup2: yang
  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'laugh');
  assert.strictEqual(res.isFinished, false);
  assert.strictEqual(res.finalDecision, null);

  // Next throw gives Sacred -> A
  engine.randomFn = () => [0.1, 0.9];
  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'sacred');
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'A');
});

test('Traditional mode with triple sacred: 3 sacred in a row yields A', () => {
  const engine = new DecisionEngine('traditional', true, 'A', 'B');
  engine.randomFn = () => [0.1, 0.9]; // Sacred

  let res = engine.throwOnce();
  assert.strictEqual(res.progress.current, 1);
  assert.strictEqual(res.isFinished, false);
  assert.strictEqual(res.finalDecision, null);

  res = engine.throwOnce();
  assert.strictEqual(res.progress.current, 2);
  assert.strictEqual(res.isFinished, false);

  res = engine.throwOnce();
  assert.strictEqual(res.progress.current, 3);
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'A');
});

test('Traditional mode with triple sacred: interrupted by laugh or yin leads to B', () => {
  const engine = new DecisionEngine('traditional', true, 'A', 'B');
  engine.randomFn = () => [0.1, 0.9]; // Sacred 1/3
  let res = engine.throwOnce();
  assert.strictEqual(res.progress.current, 1);
  assert.strictEqual(res.isFinished, false);

  // 2nd throw is Laugh (Yang + Yang)
  engine.randomFn = () => [0.8, 0.8];
  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'laugh');
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'B');
  assert.strictEqual(res.isInterrupted, true);
});

test('Fair mode: 3 consecutive sacred leads to A', () => {
  const engine = new DecisionEngine('fair', true, 'A', 'B');
  engine.randomVal = () => 0.1; // in sacred range (< 0.7937)

  let res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'sacred');
  assert.strictEqual(res.progress.current, 1);
  assert.strictEqual(res.isFinished, false);

  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'sacred');
  assert.strictEqual(res.progress.current, 2);
  assert.strictEqual(res.isFinished, false);

  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'sacred');
  assert.strictEqual(res.progress.current, 3);
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'A');
});

test('Fair mode: non-sacred on 1st throw directly yields B', () => {
  const engine = new DecisionEngine('fair', true, 'A', 'B');
  // First throw laugh (0.85 >= 0.7937 && < 0.8968)
  engine.randomVal = () => 0.85;
  const res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'laugh');
  assert.strictEqual(res.isFinished, true);
  assert.strictEqual(res.finalDecision, 'B');
  assert.strictEqual(res.isInterrupted, true);
  assert.deepStrictEqual(res.cups, ['yang', 'yang']);
});

test('Fair mode: visual cups mapping matches result', () => {
  const engine = new DecisionEngine('fair', true, 'A', 'B');
  // Sacred mapping
  engine.randomVal = () => 0.1;
  let res = engine.throwOnce();
  assert.ok(
    (res.cups[0] === 'yin' && res.cups[1] === 'yang') ||
    (res.cups[0] === 'yang' && res.cups[1] === 'yin'),
    'Sacred must map to one yin and one yang'
  );

  // Yin mapping
  engine.resetRound();
  engine.randomVal = () => 0.95; // > 0.8968
  res = engine.throwOnce();
  assert.strictEqual(res.singleResult, 'yin');
  assert.deepStrictEqual(res.cups, ['yin', 'yin']);
});

test('Monte Carlo convergence test for Fair mode (strictly 50% A vs 50% B)', () => {
  const trials = 10000;
  let aCount = 0;
  let bCount = 0;

  for (let i = 0; i < trials; i++) {
    const engine = new DecisionEngine('fair', true, 'A', 'B');
    while (!engine.state.isFinished) {
      engine.throwOnce();
    }
    if (engine.state.finalDecision === 'A') aCount++;
    else if (engine.state.finalDecision === 'B') bCount++;
  }

  const aRatio = aCount / trials;
  // With 10000 trials, 99.7% confidence interval is [0.485, 0.515]
  assert.ok(
    Math.abs(aRatio - 0.5) < 0.02,
    `Fair mode A ratio (${aRatio}) deviated more than 2% from theoretical 0.5`
  );
  assert.strictEqual(aCount + bCount, trials);
});
