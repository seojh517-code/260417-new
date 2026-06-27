/* 색칠 도안 — 번들 이미지(업로드된 선화) + 간단 SVG 선화 6종.
   사용자가 사진으로 직접 도안을 추가할 수도 있음 */
window.App = window.App || {};
App.art = App.art || {};

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">` +
  `<g fill="none" stroke="#000" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

App.art.TEMPLATES = [
  // ── 번들 선화(딸이 색칠할 그림) ──
  { id: 'camping',    name: '캠핑',     type: 'image', src: 'assets/templates/camping.png' },
  { id: 'playground', name: '놀이터',   type: 'image', src: 'assets/templates/playground.png' },
  { id: 'drawing',    name: '그림 그리기', type: 'image', src: 'assets/templates/ipad-coloring.png' },

  // ── 간단 SVG 도안(또렷한 큰 영역, 4세 색칠하기 쉬움) ──
  {
    id: 'apple', name: '사과', type: 'svg',
    svg: svg(
      `<circle cx="200" cy="225" r="120"/>` +
      `<path d="M200 110 L200 60"/>` +
      `<ellipse cx="245" cy="80" rx="38" ry="18" transform="rotate(-25 245 80)"/>`
    ),
  },
  {
    id: 'flower', name: '꽃', type: 'svg',
    svg: svg(
      `<circle cx="200" cy="170" r="42"/>` +
      `<circle cx="270" cy="170" r="40"/><circle cx="235" cy="231" r="40"/>` +
      `<circle cx="165" cy="231" r="40"/><circle cx="130" cy="170" r="40"/>` +
      `<circle cx="165" cy="109" r="40"/><circle cx="235" cy="109" r="40"/>` +
      `<path d="M200 250 L200 360"/>` +
      `<ellipse cx="150" cy="300" rx="34" ry="16" transform="rotate(25 150 300)"/>` +
      `<ellipse cx="250" cy="320" rx="34" ry="16" transform="rotate(-25 250 320)"/>`
    ),
  },
  {
    id: 'house', name: '집', type: 'svg',
    svg: svg(
      `<rect x="110" y="190" width="180" height="160"/>` +
      `<path d="M88 190 L200 90 L312 190 Z"/>` +
      `<rect x="178" y="265" width="54" height="85"/>` +
      `<rect x="130" y="215" width="46" height="46"/>` +
      `<rect x="224" y="215" width="46" height="46"/>`
    ),
  },
  {
    id: 'fish', name: '물고기', type: 'svg',
    svg: svg(
      `<ellipse cx="185" cy="200" rx="120" ry="78"/>` +
      `<path d="M298 200 L368 145 L368 255 Z"/>` +
      `<circle cx="135" cy="178" r="12"/>` +
      `<path d="M185 122 Q210 160 185 200"/>` +
      `<path d="M185 278 Q210 240 185 200"/>`
    ),
  },
  {
    id: 'butterfly', name: '나비', type: 'svg',
    svg: svg(
      `<ellipse cx="200" cy="205" rx="14" ry="85"/>` +
      `<ellipse cx="135" cy="155" rx="62" ry="50"/>` +
      `<ellipse cx="265" cy="155" rx="62" ry="50"/>` +
      `<ellipse cx="145" cy="255" rx="50" ry="42"/>` +
      `<ellipse cx="255" cy="255" rx="50" ry="42"/>` +
      `<path d="M193 125 Q175 90 150 85"/>` +
      `<path d="M207 125 Q225 90 250 85"/>`
    ),
  },
  {
    id: 'car', name: '자동차', type: 'svg',
    svg: svg(
      `<path d="M60 255 Q60 212 110 212 L150 212 L186 165 L300 165 L322 212 L352 212 Q362 212 362 252 L362 282 L60 282 Z"/>` +
      `<circle cx="132" cy="287" r="30"/>` +
      `<circle cx="300" cy="287" r="30"/>` +
      `<rect x="172" y="180" width="58" height="32"/>` +
      `<rect x="244" y="180" width="48" height="32"/>`
    ),
  },
];
