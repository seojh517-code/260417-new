/* 스튜디오 공용 유틸 (독립 실행 — 게임 앱과 분리) */
window.App = window.App || {};
(function () {
  const u = {};

  u.el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  u.pick = (a) => a[Math.floor(Math.random() * a.length)];
  u.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  u.hexToRgb = (hex) => {
    hex = String(hex).replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  /* localStorage (내 도안·스티커 저장) */
  u.load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  u.save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 용량초과 무시 */ } };

  /* 효과음 */
  let actx = null;
  function ctx() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return actx; }
  function tone(f, d, w, t) {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = t || 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(c.destination);
    const s = c.currentTime + (w || 0);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.2, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.start(s); o.stop(s + d + 0.02);
  }
  u.sfxTap = () => tone(520, 0.06, 0, 'square');
  u.sfxGood = () => { tone(660, 0.12, 0); tone(880, 0.16, 0.1); };

  u.speak = (text) => {
    if (!window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const x = new SpeechSynthesisUtterance(text);
      x.lang = 'ko-KR'; x.rate = 0.97; x.pitch = 1.1;
      speechSynthesis.speak(x);
    } catch (e) {}
  };

  /* 안내 토스트 */
  u.toast = (msg) => {
    let t = document.querySelector('.toast');
    if (!t) { t = u.el('div', 'toast'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /* 사진 파일 → dataURL */
  u.fileToDataURL = (file, cb) => {
    const r = new FileReader();
    r.onload = () => cb(r.result);
    r.onerror = () => cb(null);
    r.readAsDataURL(file);
  };

  App.util = u;
})();
