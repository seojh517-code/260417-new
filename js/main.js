/* 메인 — 홈 화면(놀이 선택)과 게임 전환을 담당 */
(function () {
  const u = App.util;
  const order = ['counting', 'sorting', 'memory', 'shadow'];

  const home = document.getElementById('home');
  const gameView = document.getElementById('gameView');
  const gameRoot = document.getElementById('gameRoot');
  const gameTitle = document.getElementById('gameTitle');
  const tiles = document.getElementById('tiles');

  let current = null, cleanup = null;

  // 홈 화면 타일 생성
  order.forEach((key) => {
    const g = App.games[key];
    if (!g) return;
    const t = u.el('button', 'tile');
    t.style.setProperty('--c', g.color);
    t.innerHTML =
      `<span class="tile-icon">${g.icon}</span>` +
      `<span class="tile-name">${g.name}</span>`;
    t.onclick = () => { u.sfxTap(); open(key); };
    tiles.appendChild(t);
  });

  function open(key) {
    current = key;
    const g = App.games[key];
    home.hidden = true;
    gameView.hidden = false;
    gameTitle.textContent = g.icon + ' ' + g.name;
    gameRoot.innerHTML = '';
    cleanup = g.start(gameRoot) || null;
  }

  function back() {
    if (cleanup) { cleanup(); cleanup = null; }
    u.cancelSpeech();
    gameRoot.innerHTML = '';
    gameView.hidden = true;
    home.hidden = false;
  }

  function replay() {
    if (!current) return;
    const k = current;
    back();
    open(k);
  }

  document.getElementById('backBtn').onclick = () => { u.sfxTap(); back(); };
  document.getElementById('replayBtn').onclick = () => { u.sfxTap(); replay(); };

  const st = document.getElementById('soundToggle');
  st.onclick = () => {
    const on = !u.isSound();
    u.setSound(on);
    st.textContent = on ? '🔊' : '🔇';
  };
})();
