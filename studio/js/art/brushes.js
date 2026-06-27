/* 화구(브러시) 정의 + 점 찍기(dab) 렌더러
   각 화구는 굵기배율/투명도/질감 조합으로 느낌을 표현 (에셋 불필요) */
window.App = window.App || {};
App.art = App.art || {};

App.art.BRUSHES = [
  { key: 'pencil',     name: '연필',   icon: '✏️', sizeMul: 0.45, spacing: 0.16, baseAlpha: 0.5,  type: 'grain', grain: 0.4, pressureW: true,  pressureA: true },
  { key: 'pen',        name: '펜',     icon: '🖊️', sizeMul: 0.6,  spacing: 0.12, baseAlpha: 1.0,  type: 'hard',              pressureW: false, pressureA: false },
  { key: 'fountain',   name: '만년필', icon: '✒️', sizeMul: 0.8,  spacing: 0.1,  baseAlpha: 1.0,  type: 'hard',              pressureW: true,  pressureA: false },
  { key: 'colored',    name: '색연필', icon: '🖌️', sizeMul: 0.55, spacing: 0.15, baseAlpha: 0.72, type: 'grain', grain: 0.3, pressureW: true,  pressureA: true },
  { key: 'crayon',     name: '크레파스', icon: '🖍️', sizeMul: 1.0, spacing: 0.2, baseAlpha: 0.85, type: 'grain', grain: 0.7, pressureW: false, pressureA: false },
  { key: 'pastel',     name: '파스텔', icon: '☁️', sizeMul: 1.35, spacing: 0.26, baseAlpha: 0.4,  type: 'grain', grain: 0.9, pressureW: false, pressureA: true },
  { key: 'watercolor', name: '수채화', icon: '💧', sizeMul: 1.4,  spacing: 0.3,  baseAlpha: 0.22, type: 'soft',              pressureW: false, pressureA: true },
  { key: 'oil',        name: '유화',   icon: '🛢️', sizeMul: 1.2,  spacing: 0.18, baseAlpha: 1.0,  type: 'hard',  jitter: 0.18, pressureW: true,  pressureA: false },
];

/* 한 점(dab) 그리기 — type 별로 질감이 다름 */
App.art.dab = function (ctx, b, x, y, r, color, alpha) {
  const rgb = App.util.hexToRgb(color);
  const type = b.type || 'hard';

  if (b.jitter) { x += (Math.random() - 0.5) * r * b.jitter; y += (Math.random() - 0.5) * r * b.jitter; }

  if (type === 'soft') {
    // 수채화: 부드러운 가장자리 (방사형 그라데이션)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    g.addColorStop(0.7, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.6})`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  } else if (type === 'grain') {
    // 연필·색연필·크레파스·파스텔: 작은 점들을 흩뿌려 질감 표현
    const n = Math.max(4, Math.round(r * (b.grain || 0.5) * 2.2));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, rad = Math.random() * r;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      const dotR = Math.max(0.4, r * 0.16 * (0.5 + Math.random()));
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * (0.45 + Math.random() * 0.55)})`;
      ctx.beginPath(); ctx.arc(px, py, dotR, 0, 6.2832); ctx.fill();
    }
  } else {
    // 펜·만년필·유화: 단단한 원
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
};
