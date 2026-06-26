/* 개수 세기 — 사물이 몇 개인지 세고 맞는 숫자를 누르는 놀이 (수 개념) */
window.App = window.App || {};
App.games = App.games || {};
App.games.counting = {
  id: 'counting',
  name: '개수 세기',
  icon: '🔢',
  color: '#4d96ff',
  start(root) {
    const u = App.util, el = u.el, timers = u.makeTimers();
    const ITEMS = ['🍎', '⚽', '⭐', '🐥', '🍓', '🎈', '🐞', '🍪', '🚗', '🌸'];
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

      // 라운드가 올라갈수록 살짝 어려워짐 (최대 9개)
      const n = u.randInt(1, Math.min(4 + round, 9));
      const item = u.pick(ITEMS);

      const objs = el('div', 'count-objects');
      for (let i = 0; i < n; i++) {
        const o = el('span', 'count-obj', item);
        o.style.animationDelay = (i * 0.06) + 's';
        objs.appendChild(o);
      }
      stage.appendChild(objs);

      const q = el('div', 'stage-q', '몇 개일까요?');
      stage.appendChild(q);

      const cwrap = el('div', 'choices');
      u.numberChoices(n, 1, 9, 3).forEach((c) => {
        const b = el('button', 'choice', String(c));
        b.onclick = () => {
          if (locked) return;
          u.sfxTap();
          if (c === n) {
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
            u.speak('다시 세어볼까요?');
            timers.after(() => b.classList.remove('wrong'), 500);
          }
        };
        cwrap.appendChild(b);
      });
      stage.appendChild(cwrap);
      u.speak('몇 개일까요?');
    }

    next();
    return () => timers.clearAll();
  },
};
