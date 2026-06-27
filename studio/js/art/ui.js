/* 도구 바 + 도안/스티커 시트 빌더 (그리기·색칠 모드 공용) */
window.App = window.App || {};
App.art = App.art || {};

App.art.buildToolbar = function (engine, opts) {
  const U = App.util;
  const PALETTE = ['#ff5a5f', '#ff9f1c', '#ffd23f', '#3ec46d', '#4d96ff', '#5b6cff',
                   '#a26bff', '#ff7eb9', '#8b5a2b', '#000000', '#ffffff', '#9aa0a6'];
  const sheetHost = document.getElementById('studioView');
  const root = U.el('div', 'tb');

  const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  function pickFile(cb) {
    const inp = U.el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) U.fileToDataURL(f, cb); inp.remove(); };
    inp.click();
  }

  /* ---------- 색상 줄 ---------- */
  const colors = U.el('div', 'tb-row colors');
  function selColor(b) { colors.querySelectorAll('.swatch').forEach((s) => s.classList.remove('sel')); b.classList.add('sel'); }
  let firstSwatch = null;
  PALETTE.forEach((c, i) => {
    const b = U.el('button', 'swatch'); b.style.background = c;
    if (c === '#ffffff') b.classList.add('is-white');
    b.onclick = () => { engine.setColor(c); selColor(b); afterColor(); U.sfxTap(); };
    colors.appendChild(b);
    if (i === 0) firstSwatch = b;
  });
  const customLabel = U.el('label', 'swatch custom'); customLabel.textContent = '🎨';
  const colorInput = U.el('input'); colorInput.type = 'color'; colorInput.value = '#ff5a5f';
  colorInput.oninput = () => { engine.setColor(colorInput.value); customLabel.style.background = colorInput.value; selColor(customLabel); afterColor(); };
  customLabel.appendChild(colorInput);
  colors.appendChild(customLabel);

  /* ---------- 도구 줄 ---------- */
  const brushRow = U.el('div', 'tb-row scrollrow');   // 화구(가로 스크롤)
  const actions = U.el('div', 'tb-row actions');       // 나머지 도구(줄바꿈, 항상 보임)
  const toolBtns = [];
  const brushBtnByKey = {};
  let lastBrushKey = opts.coloring ? 'colored' : 'pen';
  function setActive(btn) { toolBtns.forEach((b) => b.classList.remove('active')); if (btn) btn.classList.add('active'); }

  const brushes = U.el('div', 'brushes');
  App.art.BRUSHES.forEach((br) => {
    const b = U.el('button', 'tbtn brush');
    b.innerHTML = `<span class="bi">${br.icon}</span><span class="bl">${br.name}</span>`;
    b.onclick = () => { lastBrushKey = br.key; engine.setBrush(br.key); setActive(b); autofillOff(); U.sfxTap(); };
    brushes.appendChild(b); toolBtns.push(b); brushBtnByKey[br.key] = b;
  });
  brushRow.appendChild(brushes);

  const eraser = U.el('button', 'tbtn'); eraser.innerHTML = `<span class="bi">🧽</span><span class="bl">지우개</span>`;
  eraser.onclick = () => { engine.setTool('eraser'); setActive(eraser); autofillOff(); U.sfxTap(); };
  const fill = U.el('button', 'tbtn'); fill.innerHTML = `<span class="bi">🪣</span><span class="bl">물통</span>`;
  fill.onclick = () => { engine.setTool('fill'); setActive(fill); autofillOff(); U.sfxTap(); };
  actions.appendChild(eraser); actions.appendChild(fill); toolBtns.push(eraser, fill);

  // 굵기
  const sizeWrap = U.el('div', 'size-wrap');
  const sizeDot = U.el('span', 'size-dot');
  const size = U.el('input', 'size-slider'); size.type = 'range'; size.min = 4; size.max = 60; size.value = 16;
  const setDot = () => { const v = +size.value; sizeDot.style.width = v + 'px'; sizeDot.style.height = v + 'px'; };
  size.oninput = () => { engine.setSize(+size.value); setDot(); };
  setDot();
  sizeWrap.appendChild(sizeDot); sizeWrap.appendChild(size);
  actions.appendChild(sizeWrap);

  // 자동칠 토글 / 도안 (색칠 모드)
  let autofillBtn = null;
  function autofillOff() { if (autofillBtn) autofillBtn.classList.remove('on'); }
  function afterColor() {
    if (opts.coloring && autofillBtn && autofillBtn.classList.contains('on')) return; // 자동칠 유지
    if (engine.getTool() === 'eraser') { engine.setBrush(lastBrushKey); setActive(brushBtnByKey[lastBrushKey]); }
  }

  if (opts.coloring) {
    autofillBtn = U.el('button', 'tbtn toggle on');
    autofillBtn.innerHTML = `<span class="bi">🪄</span><span class="bl">자동칠</span>`;
    autofillBtn.onclick = () => {
      const on = !autofillBtn.classList.contains('on');
      autofillBtn.classList.toggle('on', on);
      if (on) { engine.setTool('fill'); setActive(fill); }
      else { engine.setBrush(lastBrushKey); setActive(brushBtnByKey[lastBrushKey]); }
      U.sfxTap();
    };
    const tmplBtn = U.el('button', 'tbtn'); tmplBtn.innerHTML = `<span class="bi">🖼️</span><span class="bl">도안</span>`;
    tmplBtn.onclick = () => { openTemplates(); U.sfxTap(); };
    actions.appendChild(autofillBtn); actions.appendChild(tmplBtn);
  }
  if (opts.stickers) {
    const stk = U.el('button', 'tbtn sticker-btn'); stk.innerHTML = `<span class="bi">🌟</span><span class="bl">스티커</span>`;
    stk.onclick = () => { openStickers(); U.sfxTap(); };
    actions.appendChild(stk);
  }

  const clear = U.el('button', 'tbtn danger'); clear.innerHTML = `<span class="bi">🗑️</span><span class="bl">전체</span>`;
  clear.onclick = () => { if (confirm('그림을 전부 지울까요?')) { engine.clearPaint(); U.sfxTap(); } };
  actions.appendChild(clear);

  root.appendChild(colors); root.appendChild(brushRow); root.appendChild(actions);

  // 초기 선택
  engine.setColor(PALETTE[0]); selColor(firstSwatch); engine.setSize(16);
  if (opts.coloring) { engine.setTool('fill'); setActive(fill); }     // 자동칠 ON
  else { engine.setBrush('pen'); setActive(brushBtnByKey['pen']); }   // 그리기: 펜

  /* ---------- 시트 공통 ---------- */
  function sheetHeader(title, onClose) {
    const h = U.el('div', 'sheet-head');
    h.appendChild(U.el('span', 'sheet-title', title));
    const x = U.el('button', 'sheet-close', '✕'); x.onclick = onClose;
    h.appendChild(x);
    return h;
  }
  function overlay() {
    const ov = U.el('div', 'sheet-ov');
    const sheet = U.el('div', 'sheet');
    ov.appendChild(sheet);
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    sheetHost.appendChild(ov);
    return { ov, sheet };
  }

  /* ---------- 도안 시트 ---------- */
  function selectTemplate(src) {
    engine.loadOutline(src, () => engine.clearPaint());
    if (opts.coloring && autofillBtn && autofillBtn.classList.contains('on')) { engine.setTool('fill'); setActive(fill); }
  }
  function openTemplates() {
    const { ov, sheet } = overlay();
    sheet.appendChild(sheetHeader('도안 고르기', () => ov.remove()));
    const grid = U.el('div', 'sheet-grid');

    App.art.TEMPLATES.forEach((t) => {
      const cell = U.el('button', 'tcell');
      if (t.type === 'image') { const im = U.el('img'); im.src = t.src; cell.appendChild(im); }
      else cell.innerHTML = t.svg;
      cell.appendChild(U.el('span', 'tcell-label', t.name));
      cell.onclick = () => { selectTemplate(t.type === 'svg' ? svgURL(t.svg) : t.src); ov.remove(); };
      grid.appendChild(cell);
    });
    const blank = U.el('button', 'tcell');
    blank.innerHTML = `<div class="blank">⬜</div>`; blank.appendChild(U.el('span', 'tcell-label', '백지'));
    blank.onclick = () => { engine.clearOutline(); engine.clearPaint(); ov.remove(); };
    grid.appendChild(blank);

    U.load('studio_templates', []).forEach((src) => {
      const cell = U.el('button', 'tcell'); const im = U.el('img'); im.src = src; cell.appendChild(im);
      cell.appendChild(U.el('span', 'tcell-label', '내 도안'));
      cell.onclick = () => { selectTemplate(src); ov.remove(); };
      grid.appendChild(cell);
    });
    const add = U.el('button', 'tcell add'); add.innerHTML = `<div class="add-in">➕<br>내 도안<br>추가</div>`;
    add.onclick = () => pickFile((src) => {
      if (!src) return;
      const list = U.load('studio_templates', []); list.push(src); U.save('studio_templates', list);
      selectTemplate(src); ov.remove();
    });
    grid.appendChild(add);
    sheet.appendChild(grid);
  }

  /* ---------- 스티커 시트 ---------- */
  function openStickers() {
    const { ov, sheet } = overlay();
    sheet.appendChild(sheetHeader('스티커 고르기', () => ov.remove()));
    const tabs = U.el('div', 'tabs');
    const grid = U.el('div', 'sheet-grid stickers');

    function showCat(cat) {
      grid.innerHTML = '';
      cat.items.forEach((sym) => {
        const b = U.el('button', 'scell', sym);
        b.onclick = () => { engine.setSticker({ type: 'emoji', sym }); U.sfxTap(); ov.remove(); };
        grid.appendChild(b);
      });
      U.load('studio_stickers', []).forEach((src) => {
        const b = U.el('button', 'scell'); const im = U.el('img'); im.src = src; b.appendChild(im);
        b.onclick = () => { const img = new Image(); img.onload = () => engine.setSticker({ type: 'image', img }); img.src = src; ov.remove(); };
        grid.appendChild(b);
      });
      const add = U.el('button', 'scell add', '➕');
      add.onclick = () => pickFile((src) => {
        if (!src) return;
        const l = U.load('studio_stickers', []); l.push(src); U.save('studio_stickers', l);
        const img = new Image(); img.onload = () => engine.setSticker({ type: 'image', img }); img.src = src; ov.remove();
      });
      grid.appendChild(add);
    }

    App.art.STICKERS.forEach((c, i) => {
      const t = U.el('button', 'tab', c.cat);
      t.onclick = () => { tabs.querySelectorAll('.tab').forEach((x) => x.classList.remove('active')); t.classList.add('active'); showCat(c); };
      tabs.appendChild(t);
      if (i === 0) t.classList.add('active');
    });
    showCat(App.art.STICKERS[0]);
    sheet.appendChild(tabs); sheet.appendChild(grid);
  }

  return {
    el: root,
    openTemplates,
    destroy() { document.querySelectorAll('.sheet-ov').forEach((s) => s.remove()); },
  };
};
