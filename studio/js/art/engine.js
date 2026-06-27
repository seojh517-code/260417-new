/* 페인트 엔진 — 2레이어 캔버스(칠 아래 + 선화 위), 애플펜슬(Pointer Events),
   화구 그리기, 물통 채우기, 지우개, 스티커, Undo/Redo, 저장 */
window.App = window.App || {};
App.art = App.art || {};

App.art.createEngine = function (host) {
  const U = App.util;
  const MAXBACK = 1500; // 백버퍼 한 변 최대(메모리·성능 보호)

  const stack = U.el('div', 'canvas-stack');
  const paint = U.el('canvas', 'c-paint');     // 칠(도안 아래)
  const outline = U.el('canvas', 'c-outline'); // 도안 선화(multiply)
  const over = U.el('canvas', 'c-sticker');    // 스티커(도안 위)
  stack.appendChild(paint);
  stack.appendChild(outline);
  stack.appendChild(over);
  const cursor = U.el('div', 'brush-cursor'); // 붓/지우개 크기 미리보기
  cursor.hidden = true;
  stack.appendChild(cursor);
  host.appendChild(stack);
  const pctx = paint.getContext('2d', { willReadFrequently: true });
  const octx = outline.getContext('2d', { willReadFrequently: true });
  const sctx = over.getContext('2d', { willReadFrequently: true });

  const ERASER_K = 1.6; // 지우개 지름 배율(붓과 무관, 일관)

  const state = {
    color: '#ff5a5f', rgb: [255, 90, 95],
    brush: App.art.BRUSHES[1], // 펜 기본
    size: 16,                  // CSS px
    tool: 'brush',             // brush | eraser | fill | sticker
    sticker: null,             // {type:'emoji',sym} | {type:'image',img}
  };

  let scale = 1;            // 백버퍼 = CSS px * scale
  let outlineImg = null;    // 현재 도안 이미지(리사이즈 시 다시 그림)
  let changeCb = null;

  /* ---------- 좌표 ---------- */
  function pos(e) {
    const r = stack.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * paint.width,
      y: (e.clientY - r.top) / r.height * paint.height,
    };
  }

  /* ---------- 크기 맞추기 ---------- */
  function fit() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = Math.min(dpr, MAXBACK / Math.max(w, h));
    const bw = Math.round(w * scale), bh = Math.round(h * scale);
    if (paint.width === bw && paint.height === bh) return;

    // 기존 칠/스티커 보존(리사이즈)
    const snapCanvas = (src) => { const t = document.createElement('canvas'); t.width = Math.max(1, src.width); t.height = Math.max(1, src.height); if (src.width) t.getContext('2d').drawImage(src, 0, 0); return t; };
    const tmpP = snapCanvas(paint), tmpO = snapCanvas(over);

    [paint, outline, over].forEach((c) => {
      c.width = bw; c.height = bh; c.style.width = w + 'px'; c.style.height = h + 'px';
    });
    stack.style.width = w + 'px'; stack.style.height = h + 'px';
    if (tmpP.width > 1) pctx.drawImage(tmpP, 0, 0, tmpP.width, tmpP.height, 0, 0, bw, bh);
    if (tmpO.width > 1) sctx.drawImage(tmpO, 0, 0, tmpO.width, tmpO.height, 0, 0, bw, bh);
    renderOutline();
  }

  /* ---------- 도안(outline) ---------- */
  function renderOutline() {
    octx.clearRect(0, 0, outline.width, outline.height);
    if (!outlineImg) return;
    const cw = outline.width, ch = outline.height;
    const r = Math.min(cw / outlineImg.width, ch / outlineImg.height);
    const dw = outlineImg.width * r, dh = outlineImg.height * r;
    octx.drawImage(outlineImg, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  function loadOutline(src, cb) {
    const img = new Image();
    img.onload = () => { outlineImg = img; renderOutline(); if (cb) cb(true); };
    img.onerror = () => { if (cb) cb(false); };
    img.src = src;
  }

  /* ---------- 히스토리 (스냅샷) ---------- */
  const HISTMAX = 12;
  let states = [], cur = -1;
  function snap() {
    try { return { u: pctx.getImageData(0, 0, paint.width, paint.height), o: sctx.getImageData(0, 0, over.width, over.height) }; }
    catch (e) { return null; }
  }
  function applyState(s) { if (!s) return; pctx.putImageData(s.u, 0, 0); sctx.putImageData(s.o, 0, 0); }
  function resetHistory() { const s = snap(); states = s ? [s] : []; cur = states.length - 1; fireChange(); }
  function commit() {
    const s = snap(); if (!s) return;
    states = states.slice(0, cur + 1);
    states.push(s);
    if (states.length > HISTMAX) states.shift();
    cur = states.length - 1;
    fireChange();
  }
  function undo() { if (cur > 0) { cur--; applyState(states[cur]); fireChange(); } }
  function redo() { if (cur < states.length - 1) { cur++; applyState(states[cur]); fireChange(); } }
  function fireChange() { if (changeCb) changeCb(); }

  /* ---------- 그리기 ---------- */
  let drawing = false, pid = null, penActive = false, last = null;
  function pressureOf(e) {
    if (e.pointerType === 'pen') return e.pressure > 0 ? e.pressure : 0.5;
    return e.pressure > 0 && e.pressure < 1 ? e.pressure : 0.5;
  }
  function radius(pr) {
    const b = state.brush, dev = state.size * scale;
    return Math.max(0.5, dev * b.sizeMul * (b.pressureW ? (0.3 + 0.7 * pr) : 1) / 2);
  }
  function eraserRadiusDev() { return state.size * ERASER_K / 2 * scale; }
  function drawDab(p, pr) {
    const b = state.brush;
    if (state.tool === 'eraser') {
      // 칠과 스티커 둘 다 지움(포인터 아래 무엇이든)
      [pctx, sctx].forEach((c) => {
        c.save();
        c.globalCompositeOperation = 'destination-out';
        c.beginPath(); c.arc(p.x, p.y, eraserRadiusDev(), 0, 6.2832);
        c.fillStyle = 'rgba(0,0,0,1)'; c.fill();
        c.restore();
      });
      return;
    }
    const alpha = b.baseAlpha * (b.pressureA ? (0.4 + 0.6 * pr) : 1);
    App.art.dab(pctx, b, p.x, p.y, radius(pr), state.color, alpha);
  }
  function strokeTo(p, pr) {
    const r = radius(pr);
    const spacing = Math.max(1, r * 2 * state.brush.spacing);
    const dx = p.x - last.x, dy = p.y - last.y;
    const d = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(d / spacing));
    for (let i = 1; i <= steps; i++) { const t = i / steps; drawDab({ x: last.x + dx * t, y: last.y + dy * t }, pr); }
    last = p;
  }

  /* ---------- 스티커 (도안 위 레이어에 찍음) ---------- */
  function stamp(p) {
    const s = state.sticker; if (!s) return;
    const size = state.size * scale * 4.5;
    if (s.type === 'emoji') {
      sctx.save();
      sctx.font = `${size}px "Apple Color Emoji","Noto Color Emoji",serif`;
      sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      sctx.fillText(s.sym, p.x, p.y);
      sctx.restore();
    } else if (s.type === 'image' && s.img) {
      const r = size / Math.max(s.img.width, s.img.height);
      const w = s.img.width * r, h = s.img.height * r;
      sctx.drawImage(s.img, p.x - w / 2, p.y - h / 2, w, h);
    }
  }

  /* ---------- 물통 채우기 (선/색 경계까지) ---------- */
  function floodFill(sx, sy, fill) {
    sx = Math.round(sx); sy = Math.round(sy);
    const w = paint.width, h = paint.height;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
    const img = pctx.getImageData(0, 0, w, h), p = img.data;
    const od = octx.getImageData(0, 0, w, h).data;
    const lineAt = (i) => od[i + 3] > 30 && (0.299 * od[i] + 0.587 * od[i + 1] + 0.114 * od[i + 2]) < 110;

    const si = (sy * w + sx) * 4;
    if (lineAt(si)) return; // 선 위를 탭하면 무시
    const tgt = [p[si], p[si + 1], p[si + 2], p[si + 3]];
    if (Math.abs(tgt[0] - fill[0]) < 4 && Math.abs(tgt[1] - fill[1]) < 4 && Math.abs(tgt[2] - fill[2]) < 4 && tgt[3] === 255) return;

    const tol = 42;
    const match = (i) =>
      !lineAt(i) &&
      Math.abs(p[i] - tgt[0]) <= tol && Math.abs(p[i + 1] - tgt[1]) <= tol &&
      Math.abs(p[i + 2] - tgt[2]) <= tol && Math.abs(p[i + 3] - tgt[3]) <= tol;

    const seen = new Uint8Array(w * h);
    const stk = [sy * w + sx];
    while (stk.length) {
      const idx = stk.pop();
      if (seen[idx]) continue;
      const i = idx * 4;
      if (!match(i)) continue;
      seen[idx] = 1;
      p[i] = fill[0]; p[i + 1] = fill[1]; p[i + 2] = fill[2]; p[i + 3] = 255;
      const x = idx % w, y = (idx - x) / w;
      if (x + 1 < w) stk.push(idx + 1);
      if (x > 0) stk.push(idx - 1);
      if (y + 1 < h) stk.push(idx + w);
      if (y > 0) stk.push(idx - w);
    }
    pctx.putImageData(img, 0, 0);
  }

  /* ---------- 커서 링(붓/지우개 크기 미리보기) ---------- */
  function cursorDia() {
    if (state.tool === 'eraser') return Math.max(8, state.size * ERASER_K);
    if (state.tool === 'brush') return Math.max(6, state.size * state.brush.sizeMul);
    return 0; // 물통·스티커는 표시 안 함
  }
  function updateCursor(e) {
    const dia = cursorDia();
    if (!dia) { cursor.hidden = true; return; }
    const r = stack.getBoundingClientRect();
    cursor.style.width = dia + 'px';
    cursor.style.height = dia + 'px';
    cursor.style.left = (e.clientX - r.left) + 'px';
    cursor.style.top = (e.clientY - r.top) + 'px';
    cursor.classList.toggle('eraser', state.tool === 'eraser');
    cursor.hidden = false;
  }
  function hideCursor() { cursor.hidden = true; }

  /* ---------- 포인터 ---------- */
  function down(e) {
    if (e.pointerType === 'pen') penActive = true;
    if (e.pointerType === 'touch' && penActive) return; // 손바닥 오터치 방지
    e.preventDefault();
    updateCursor(e);
    const p = pos(e);
    if (state.tool === 'fill') { U.sfxTap(); floodFill(p.x, p.y, state.rgb); commit(); return; }
    if (state.tool === 'sticker') { stamp(p); commit(); return; }
    drawing = true; pid = e.pointerId;
    try { stack.setPointerCapture(e.pointerId); } catch (_) {}
    last = p; drawDab(p, pressureOf(e));
  }
  function move(e) {
    updateCursor(e); // 그리는 중이 아니어도 링은 따라다님(펜/마우스 hover)
    if (!drawing || e.pointerId !== pid) return;
    if (e.pointerType === 'touch' && penActive) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (evs && evs.length) { for (const ev of evs) strokeTo(pos(ev), pressureOf(ev)); }
    else strokeTo(pos(e), pressureOf(e));
  }
  function up(e) {
    if (e.pointerType === 'pen') penActive = false;
    if (e.pointerType === 'touch') hideCursor(); // 터치는 hover 없음 → 떼면 숨김
    if (!drawing || e.pointerId !== pid) return;
    drawing = false; pid = null; last = null;
    commit();
  }

  stack.style.touchAction = 'none';
  stack.addEventListener('pointerdown', down);
  stack.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  stack.addEventListener('pointercancel', (e) => { hideCursor(); up(e); });
  stack.addEventListener('pointerleave', hideCursor);
  stack.addEventListener('contextmenu', (e) => e.preventDefault());

  const ro = new ResizeObserver(() => { fit(); resetHistory(); });
  ro.observe(host);
  fit(); resetHistory();

  /* ---------- 저장(합성: 칠 → 도안(multiply) → 스티커(위)) ---------- */
  function exportPNG() {
    const out = document.createElement('canvas');
    out.width = paint.width; out.height = paint.height;
    const c = out.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, out.width, out.height);
    c.drawImage(paint, 0, 0);
    c.globalCompositeOperation = 'multiply';
    c.drawImage(outline, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(over, 0, 0);
    return out.toDataURL('image/png');
  }

  return {
    el: stack,
    setColor(hex) { state.color = hex; state.rgb = U.hexToRgb(hex); },
    setBrush(key) { const b = App.art.BRUSHES.find((x) => x.key === key); if (b) { state.brush = b; state.tool = 'brush'; } },
    setSize(px) { state.size = px; },
    setTool(t) { state.tool = t; },
    getTool() { return state.tool; },
    setSticker(s) { state.sticker = s; state.tool = 'sticker'; },
    dropSticker(img, clientX, clientY) {
      const r = stack.getBoundingClientRect();
      const x = (clientX - r.left) / r.width * paint.width;
      const y = (clientY - r.top) / r.height * paint.height;
      const size = state.size * scale * 4.5;
      const rr = size / Math.max(img.width, img.height);
      const w = img.width * rr, h = img.height * rr;
      sctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      commit();
      state.sticker = { type: 'image', img }; state.tool = 'sticker'; // 이어서 더 찍기 가능
    },
    loadOutline(src, cb) { loadOutline(src, cb); },
    clearOutline() { outlineImg = null; octx.clearRect(0, 0, outline.width, outline.height); },
    clearPaint() { pctx.clearRect(0, 0, paint.width, paint.height); sctx.clearRect(0, 0, over.width, over.height); commit(); },
    undo, redo,
    canUndo() { return cur > 0; },
    canRedo() { return cur < states.length - 1; },
    onChange(cb) { changeCb = cb; },
    exportPNG,
    destroy() { ro.disconnect(); window.removeEventListener('pointerup', up); stack.remove(); },
  };
};
