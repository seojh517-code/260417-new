/* 그림자 맞추기 — 위의 그림과 같은 그림자를 고르는 놀이 (관찰력) */
window.App = window.App || {};
App.games = App.games || {};
App.games.shadow = {
  id: 'shadow',
  name: '그림자 맞추기',
  icon: '🌑',
  color: '#a26bff',
  start(root) {
    const u = App.util, el = u.el, timers = u.makeTimers();
    const POOL = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐯', '🦁', '🐸', '🐵',
                  '🐔', '🦉', '🐢', '🦋', '🐬', '🐝', '🦄', '🐙', '🐘', '🦒'];
    const TOTAL = 5;
    let round = 0, locked = false;

    const wrap = el('div', 'game');
    const prog = el('div', 'progress');
    const stage = el('div', 'stage');
    wrap.appendChild(prog);
    wrap.appendChild(stage);
    root.appendChild(wrap);

    function next() {
      locked = false;
      if (round >= TOTAL) {
        u.celebrate(wrap, '다 맞혔어요!', () => { round = 0; next(); });
        return;
      }
      u.renderDots(prog, TOTAL, round);
      stage.innerHTML = '';

      const target = u.pick(POOL);
      const others = u.sample(POOL.filter((x) => x !== target), 2);
      const opts = u.shuffle([target, ...others]);

      const t = el('div', 'shadow-target', target);
      stage.appendChild(t);
      stage.appendChild(el('div', 'stage-q', '같은 그림자를 찾아요!'));

      const row = el('div', 'shadow-opts');
      opts.forEach((sym) => {
        const b = el('button', 'shadow-opt');
        b.innerHTML = `<span class="sil">${sym}</span>`;
        b.onclick = () => {
          if (locked) return;
          u.sfxTap();
          if (sym === target) {
            locked = true;
            b.classList.add('correct');
            u.sfxGood();
            u.flashStar(stage);
            u.speak(u.praise());
            round++;
            timers.after(next, 1100);
          } else {
            b.classList.add('wrong');
            u.sfxOops();
            u.speak('다시 볼까요?');
            timers.after(() => b.classList.remove('wrong'), 500);
          }
        };
        row.appendChild(b);
      });
      stage.appendChild(row);
      u.speak('같은 그림자를 찾아요!');
    }

    next();
    return () => timers.clearAll();
  },
};
