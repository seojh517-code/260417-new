/* 공용 유틸리티 — 모든 게임이 함께 쓰는 도구 모음
   (음성 안내, 효과음, 칭찬, 별/색종이 보상, 랜덤 헬퍼) */
window.App = window.App || {};
(function () {
  const util = {};

  /* ---------- DOM 헬퍼 ---------- */
  util.el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  /* ---------- 랜덤 헬퍼 ---------- */
  util.randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  util.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  util.sample = (arr, n) => util.shuffle(arr).slice(0, n);
  util.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* 정답 숫자를 포함한 보기 만들기 */
  util.numberChoices = (correct, min, max, count) => {
    const set = new Set([correct]);
    let guard = 0;
    while (set.size < count && guard++ < 100) {
      set.add(util.randInt(min, max));
    }
    return util.shuffle([...set]);
  };

  /* 한국어 목적격 조사(을/를) 자동 처리 */
  util.josa = (word, withBatchim, without) => {
    const ch = word.charCodeAt(word.length - 1);
    const hasBatchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
    return word + (hasBatchim ? withBatchim : without);
  };

  /* 진행 표시 점(별) 그리기 */
  util.renderDots = (el, total, done) => {
    el.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = util.el('span', 'dot', i < done ? '⭐' : '•');
      el.appendChild(d);
    }
  };

  /* ---------- 타이머 (게임마다 정리 가능) ---------- */
  util.makeTimers = () => {
    const ids = [];
    return {
      after(fn, ms) { const id = setTimeout(fn, ms); ids.push(id); return id; },
      clearAll() { ids.forEach(clearTimeout); ids.length = 0; },
    };
  };

  /* ---------- 음성 (한국어 TTS) ---------- */
  let koVoice = null;
  function loadVoice() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    koVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
  }
  if (window.speechSynthesis) {
    loadVoice();
    speechSynthesis.onvoiceschanged = loadVoice;
  }

  let soundOn = true;
  util.setSound = (on) => { soundOn = on; if (!on) util.cancelSpeech(); };
  util.isSound = () => soundOn;

  util.speak = (text) => {
    if (!soundOn || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      if (koVoice) u.voice = koVoice;
      u.rate = 0.95;
      u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { /* 무시 */ }
  };
  util.cancelSpeech = () => {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
  };

  /* ---------- 효과음 (WebAudio, 에셋 불필요) ---------- */
  let actx = null;
  function ctx() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 무시 */ }
    }
    return actx;
  }
  function tone(freq, dur, when, type) {
    const c = ctx();
    if (!c || !soundOn) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + (when || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  util.sfxTap = () => tone(520, 0.07, 0, 'square');
  util.sfxGood = () => { tone(660, 0.15, 0); tone(880, 0.2, 0.12); };
  util.sfxWin = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, i * 0.13));
  util.sfxOops = () => tone(300, 0.18, 0, 'triangle');

  /* ---------- 칭찬 문구 ---------- */
  const PRAISE = ['잘했어요!', '최고예요!', '정답이에요!', '와, 멋져요!', '훌륭해요!', '맞았어요!'];
  util.praise = () => util.pick(PRAISE);

  /* ---------- 보상 연출 ---------- */
  util.flashStar = (container) => {
    const s = util.el('div', 'flash-star', '⭐');
    container.appendChild(s);
    setTimeout(() => s.remove(), 900);
  };

  util.confetti = (root) => {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f1c', '#c77dff'];
    for (let i = 0; i < 26; i++) {
      const p = util.el('div', 'confetti');
      p.style.left = util.randInt(0, 100) + '%';
      p.style.background = util.pick(colors);
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      p.style.transform = `rotate(${util.randInt(0, 360)}deg)`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  };

  util.celebrate = (container, message, onDone) => {
    util.sfxWin();
    util.speak(message || '참 잘했어요!');
    const ov = util.el('div', 'celebrate');
    ov.innerHTML =
      `<div class="celebrate-star">⭐</div>` +
      `<div class="celebrate-text">${message || '참 잘했어요!'}</div>`;
    container.appendChild(ov);
    util.confetti(ov);
    setTimeout(() => { ov.remove(); if (onDone) onDone(); }, 2300);
  };

  App.util = util;
})();
