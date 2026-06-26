/* 짝 맞추기(메모리) — 카드를 뒤집어 같은 동물 짝을 찾는 놀이 (기억력) */
window.App = window.App || {};
App.games = App.games || {};
App.games.memory = {
  id: 'memory',
  name: '짝 맞추기',
  icon: '🃏',
  color: '#ff9f1c',
  start(root) {
    const u = App.util, el = u.el, timers = u.makeTimers();
    const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐯', '🦁', '🐮', '🐸', '🐵', '🐧'];
    const MAX_PAIRS = 5;
    let pairs = 3, first = null, lock = false, matched = 0;

    const wrap = el('div', 'game');
    const info = el('div', 'mem-info', '같은 그림을 찾아요!');
    const board = el('div', 'mem-board');
    wrap.appendChild(info);
    wrap.appendChild(board);
    root.appendChild(wrap);

    function deal() {
      matched = 0; first = null; lock = false;
      const chosen = u.sample(ANIMALS, pairs);
      const deck = u.shuffle([...chosen, ...chosen]);
      const cols = pairs <= 2 ? 2 : pairs <= 3 ? 3 : 4;
      board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      board.innerHTML = '';
      deck.forEach((sym) => {
        const card = el('button', 'card');
        card.dataset.sym = sym;
        card.innerHTML =
          `<span class="card-front">❓</span><span class="card-back">${sym}</span>`;
        card.onclick = () => flip(card);
        board.appendChild(card);
      });
      u.speak('같은 그림 두 개를 찾아요!');
    }

    function flip(card) {
      if (lock || card.classList.contains('open') || card.classList.contains('done')) return;
      u.sfxTap();
      card.classList.add('open');
      if (!first) { first = card; return; }
      lock = true;

      if (first.dataset.sym === card.dataset.sym) {
        const a = first, b = card;
        timers.after(() => {
          a.classList.add('done');
          b.classList.add('done');
          first = null; lock = false; matched++;
          u.sfxGood();
          u.flashStar(wrap);
          if (matched === pairs) {
            u.speak(u.praise());
            timers.after(() => {
              u.celebrate(wrap, '모두 찾았어요!', () => {
                pairs = Math.min(pairs + 1, MAX_PAIRS);
                deal();
              });
            }, 500);
          } else {
            u.speak(u.praise());
          }
        }, 450);
      } else {
        u.sfxOops();
        const a = first, b = card;
        timers.after(() => {
          a.classList.remove('open');
          b.classList.remove('open');
          first = null; lock = false;
        }, 850);
      }
    }

    deal();
    return () => timers.clearAll();
  },
};
