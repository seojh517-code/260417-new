/* 메인 — 홈(모드 선택) ↔ 스튜디오 전환, 상단 버튼(되돌리기/다시실행/저장) */
(function () {
  const U = App.util;
  const byId = (id) => document.getElementById(id);
  const home = byId('home'), studioView = byId('studioView');
  const area = byId('canvasArea'), toolbar = byId('toolbar'), title = byId('studioTitle');
  const undoBtn = byId('undoBtn'), redoBtn = byId('redoBtn');

  let engine = null, ui = null;

  function openMode(mode) {
    home.hidden = true; studioView.hidden = false;
    title.textContent = mode === 'draw' ? '🎨 그리기' : '🖍️ 색칠하기';

    engine = App.art.createEngine(area);
    ui = App.art.buildToolbar(engine, { coloring: mode === 'coloring', stickers: true });
    toolbar.appendChild(ui.el);

    engine.onChange(refreshTop);
    refreshTop();
    enableCanvasDrop();

    if (mode === 'coloring') ui.openTemplates(); // 시작 시 도안 고르기
  }

  // 캔버스에 스티커/이미지를 끌어다 놓으면 그 자리에 바로 붙임
  function enableCanvasDrop() {
    const stop = (e) => { e.preventDefault(); };
    area.addEventListener('dragover', (e) => { stop(e); area.classList.add('dropping'); });
    area.addEventListener('dragleave', () => area.classList.remove('dropping'));
    area.addEventListener('drop', (e) => {
      stop(e); area.classList.remove('dropping');
      if (!engine) return;
      const dt = e.dataTransfer; if (!dt) return;
      const file = (dt.files && [...dt.files].find((x) => x.type.indexOf('image/') === 0)) ||
        ((dt.items && [...dt.items].find((x) => x.type && x.type.indexOf('image/') === 0)) || {}).getAsFile?.();
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => { engine.dropSticker(img, e.clientX, e.clientY); U.sfxGood(); };
        img.src = r.result;
        const l = U.load('studio_stickers', []); l.push(r.result); if (l.length > 60) l.shift(); U.save('studio_stickers', l);
      };
      r.readAsDataURL(file);
    });
  }

  function back() {
    if (ui) { ui.destroy(); ui = null; }
    if (engine) { engine.destroy(); engine = null; }
    toolbar.innerHTML = '';
    studioView.hidden = true; home.hidden = false;
  }

  function refreshTop() {
    if (!engine) return;
    undoBtn.disabled = !engine.canUndo();
    redoBtn.disabled = !engine.canRedo();
  }

  function save() {
    if (!engine) return;
    const url = engine.exportPNG();
    const a = U.el('a'); a.href = url; a.download = '내그림.png';
    document.body.appendChild(a); a.click(); a.remove();
    U.sfxGood();
  }

  byId('modeDraw').onclick = () => { U.sfxTap(); openMode('draw'); };
  byId('modeColor').onclick = () => { U.sfxTap(); openMode('coloring'); };
  byId('homeBtn').onclick = () => { U.sfxTap(); back(); };
  undoBtn.onclick = () => { if (engine) { engine.undo(); U.sfxTap(); } };
  redoBtn.onclick = () => { if (engine) { engine.redo(); U.sfxTap(); } };
  byId('saveBtn').onclick = save;
})();
