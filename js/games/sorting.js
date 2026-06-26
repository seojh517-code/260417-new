/* 모양·색 분류 — 같은 색 또는 같은 모양을 모두 찾아 담는 놀이 (분류) */
window.App = window.App || {};
App.games = App.games || {};
App.games.sorting = {
  id: 'sorting',
  name: '모양·색 분류',
  icon: '🔺',
  color: '#3ec46d',
  start(root) {
    const u = App.util, el = u.el, timers = u.makeTimers();

    const COLORS = [
      { k: 'red', ko: '빨간색', css: '#ff5a5f' },
      { k: 'yellow', ko: '노란색', css: '#ffd23f' },
      { k: 'blue', ko: '파란색', css: '#4d96ff' },
      { k: 'green', ko: '초록색', css: '#3ec46d' },
      { k: 'purple', ko: '보라색', css: '#a26bff' },
    ];
    const SHAPES = [
      { k: 'circle', ko: '동그라미' },
      { k: 'square', ko: '네모' },
      { k: 'triangle', ko: '세모' },
      { k: 'star', ko: '별' },
      { k: 'heart', ko: '하트' },
    ];
    const PATHS = {
      circle: '<circle cx="50" cy="50" r="42"/>',
      square: '<rect x="10" y="10" width="80" height="80" rx="12"/>',
      triangle: '<polygon points="50,8 92,90 8,90"/>',
      star: '<polygon points="50,5 61,38 96,38 68,59 79,92 50,72 21,92 32,59 4,38 39,38"/>',
      heart: '<path d="M50 88 L20 56 C5 40 15 16 35 22 C45 25 50 35 50 35 C50 35 55 25 65 22 C85 16 95 40 80 56 Z"/>',
    };
    const svgShape = (shapeKey, colorCss) =>
      `<svg viewBox="0 0 100 100" class="shape-svg" style="fill:${colorCss}">${PATHS[shapeKey]}</svg>`;

    const TOTAL = 5;
    let round = 0;

    const wrap = el('div', 'game');
    const prog = el('div', 'progress');
    const promptEl = el('div', 'sort-prompt');
    const grid = el('div', 'sort-grid');
    wrap.appendChild(prog);
    wrap.appendChild(promptEl);
    wrap.appendChild(grid);
    root.appendChild(wrap);

    function buildRound() {
      // 색 분류를 조금 더 자주 (4살에게 더 쉬움)
      const mode = u.pick(['color', 'color', 'shape']);
      const items = [];
      let promptKo;

      if (mode === 'color') {
        const target = u.pick(COLORS);
        promptKo = u.josa(target.ko, '을', '를') + ' 모두 담아요!';
        const matchN = u.randInt(2, 3);
        for (let i = 0; i < matchN; i++) items.push({ shape: u.pick(SHAPES), color: target, match: true });
        const others = COLORS.filter((c) => c.k !== target.k);
        const otherN = u.randInt(3, 4);
        for (let i = 0; i < otherN; i++) items.push({ shape: u.pick(SHAPES), color: u.pick(others), match: false });
      } else {
        const target = u.pick(SHAPES);
        promptKo = u.josa(target.ko, '을', '를') + ' 모두 담아요!';
        const matchN = u.randInt(2, 3);
        for (let i = 0; i < matchN; i++) items.push({ shape: target, color: u.pick(COLORS), match: true });
        const others = SHAPES.filter((s) => s.k !== target.k);
        const otherN = u.randInt(3, 4);
        for (let i = 0; i < otherN; i++) items.push({ shape: u.pick(others), color: u.pick(COLORS), match: false });
      }
      return { items: u.shuffle(items), promptKo };
    }

    function next() {
      if (round >= TOTAL) {
        u.celebrate(wrap, '정리 완료!', () => { round = 0; next(); });
        return;
      }
      u.renderDots(prog, TOTAL, round);
      const r = buildRound();
      let remaining = r.items.filter((i) => i.match).length;
      promptEl.textContent = r.promptKo;
      grid.innerHTML = '';

      r.items.forEach((it) => {
        const cell = el('button', 'sort-item');
        cell.innerHTML = svgShape(it.shape.k, it.color.css);
        cell.onclick = () => {
          if (cell.classList.contains('picked')) return;
          u.sfxTap();
          if (it.match) {
            cell.classList.add('picked');
            u.sfxGood();
            remaining--;
            if (remaining === 0) {
              u.flashStar(wrap);
              u.speak(u.praise());
              round++;
              timers.after(next, 1000);
            }
          } else {
            cell.classList.add('shake');
            u.sfxOops();
            u.speak('아니에요, 다시 찾아봐요');
            timers.after(() => cell.classList.remove('shake'), 450);
          }
        };
        grid.appendChild(cell);
      });
      u.speak(r.promptKo);
    }

    next();
    return () => timers.clearAll();
  },
};
