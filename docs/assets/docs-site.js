// Каталог документации Cat-GDI8: общий поиск по страницам, меню на телефоне, живой пример датчика температуры.
// Вход: window.DOCS_INDEX (собирает tools/py/build_site_docs.py), data-root у body. Выход: поведение страницы.
(function () {
  'use strict';
  const EN = document.documentElement.lang === 'en';
  const L = (r, n) => (EN ? n : r);
  const $ = (s, r) => (r || document).querySelector(s);
  const fmt = (v, d) => Number(v).toLocaleString(EN ? 'en-US' : 'ru-RU', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const toggle = $('.ds-toggle'), side = $('.ds-side');
  if (toggle) toggle.addEventListener('click', () => {
    const open = side.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  const on = $('.ds-side a.on');
  if (on && side.scrollHeight > side.clientHeight) side.scrollTop = Math.max(0, on.offsetTop - side.offsetTop - 120);

  const input = $('#ds-q'), box = $('#ds-res'), root = document.body.dataset.root || '';
  if (input && window.DOCS_INDEX) {
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove('on'); box.innerHTML = ''; return; }
      const score = (p) => (p.t.toLowerCase().includes(q) ? 0 : 1);
      const hits = window.DOCS_INDEX.filter((p) => (p.t + ' ' + p.x).toLowerCase().includes(q)).sort((a, b) => score(a) - score(b)).slice(0, 8);
      box.innerHTML = hits.length ? hits.map((h) => {
        const at = h.x.toLowerCase().indexOf(q);
        const bit = at < 0 ? h.x.slice(0, 90) : h.x.slice(Math.max(0, at - 40), at) + '\u0000' + h.x.slice(at, at + q.length) + '\u0001' + h.x.slice(at + q.length, at + q.length + 60);
        return '<a href="' + root + h.u + '"><b>' + esc(h.t) + '</b><span>' + esc(bit).replace('\u0000', '<mark>').replace('\u0001', '</mark>') + '…</span></a>';
      }).join('') : '<a href="' + root + 'index.html"><b>' + L('Ничего не нашлось', 'Nothing found') + '</b><span>' + L('Откройте каталог', 'Open the catalog') + '</span></a>';
      box.classList.add('on');
    };
    input.addEventListener('input', render);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
      if (e.key === 'Escape') box.classList.remove('on');
    });
  }

  // ---- переключатели «вариант -> описание»
  document.querySelectorAll('.dx-switch').forEach((sw) => {
    const btns = sw.querySelectorAll('.dx-tab'), panels = sw.querySelectorAll('[data-p]');
    const pick = (k) => {
      btns.forEach((b) => b.setAttribute('aria-selected', b.dataset.k === k ? 'true' : 'false'));
      panels.forEach((x) => { x.hidden = x.dataset.p !== k; });
    };
    btns.forEach((b) => b.addEventListener('click', () => pick(b.dataset.k)));
    pick(btns[0].dataset.k);
  });

  // ---- сколько вспышек в секунду
  const rate = $('#dx-rate');
  if (rate) {
    const rpm = $('#r-rpm'), cyl = $('#r-cyl');
    const up = () => {
      const f = Number(rpm.value) / 120 * Number(cyl.value);
      $('#r-fires').textContent = fmt(f); $('#r-gap').textContent = fmt(1000 / f, 1) + L(' мс', ' ms');
      [rpm, cyl].forEach((el) => { $('output', el.closest('label')).textContent = fmt(el.value) + (el.dataset.u ? ' ' + el.dataset.u : ''); });
    };
    [rpm, cyl].forEach((el) => el.addEventListener('input', up)); up();
  }

  // ---- конструктор мотора: что понадобится и где настраивается
  const cfg = $('#dx-config');
  if (cfg) {
    const m = (t0, d0, u, t1, d1) => { const t = EN ? t1 : t0, d = EN ? d1 : d0; return '<a href="' + root + 'modules/' + u + '.html"><b>' + t + '</b>' + d + '</a>'; };
    const up = () => {
      const inj = $('#c-inj').value, air = $('#c-air').value, thr = $('#c-thr').value, cam = Number($('#c-cam').value), o = [];
      o.push(m('Триггер', 'датчики коленвала и распредвала', 'trigger', 'Trigger', 'crank and cam sensors'), m('Катушки', 'по одной на цилиндр', 'actuators', 'Coils', 'one per cylinder'), m('Заслонки: ' + thr, 'электронный дроссель', 'actuators', 'Throttles: ' + thr, 'electronic throttle'));
      o.push(m('Насос подкачки', 'топливо из бака', 'actuators', 'Lift pump', 'fuel from the tank'));
      if (inj !== 'pfi') o.push(m('Форсунки GDI', 'высоковольтный привод', 'actuators', 'GDI injectors', 'high-voltage drive'), m('ТНВД', 'высокое давление', 'actuators', 'HP pump', 'high pressure'), m('Датчик рампы', 'давление топлива', 'sensors', 'Rail sensor', 'fuel pressure'));
      if (inj !== 'gdi') o.push(m('Форсунки PFI', 'во впускном канале', 'actuators', 'PFI injectors', 'in the intake port'));
      if (inj === 'hyb') o.push(m('Деление топлива', 'между двумя форсунками', 'fuel', 'Fuel split', 'between two injectors'));
      if (air !== 'na') o.push(m(air === 't2' ? 'Наддув: 2 вестгейта' : 'Наддув: вестгейт', 'цель и защита', 'boost', air === 't2' ? 'Boost: 2 wastegates' : 'Boost: wastegate', 'target and protection'));
      if (cam) o.push(m('Фазовращатели: ' + cam, 'нужно давление масла', 'actuators', 'Cam phasers: ' + cam, 'oil pressure required'));
      o.push(m('Датчики', 'ОЖ, воздух, MAP, рычаг', 'sensors', 'Sensors', 'coolant, air, MAP, lever'), m('Зажигание', 'углы и детонация', 'ignition', 'Ignition', 'timing and knock'));
      $('#c-out').innerHTML = '<h3 style="margin-top:0">' + L('Понадобится: ', 'You will need: ') + o.length + '</h3><div class="dx-need">' + o.join('') + '</div>';
    };
    const ids = { inj: '#c-inj', air: '#c-air', thr: '#c-thr', cam: '#c-cam' };
    try {
      const saved = JSON.parse(localStorage.getItem('gdi8-config') || '{}');
      Object.keys(ids).forEach((k) => { if (saved[k] && $(ids[k] + ' option[value="' + saved[k] + '"]')) $(ids[k]).value = saved[k]; });
    } catch (e) { /* без памяти браузера тоже работает */ }
    const save = () => {
      const o = {}; Object.keys(ids).forEach((k) => { o[k] = $(ids[k]).value; });
      try { localStorage.setItem('gdi8-config', JSON.stringify(o)); } catch (e) { /* не сохранилось - не страшно */ }
    };
    cfg.querySelectorAll('select').forEach((el) => el.addEventListener('change', () => { save(); up(); })); up();
  }

  // ---- структурная схема: увеличить, двигать мышью или пальцем
  const shots = document.querySelectorAll('.dx-diagram button');
  if (shots.length) {
    const dlg = document.createElement('dialog');
    dlg.className = 'dx-zoom';
    dlg.innerHTML = '<div class="dx-zoom-bar"><b></b><span><button type="button" data-z="-">−</button><button type="button" data-z="0">100%</button><button type="button" data-z="+">+</button><button type="button" data-z="x">' + L('Закрыть', 'Close') + '</button></span></div><div class="dx-zoom-view"><img alt=""></div>';
    document.body.appendChild(dlg);
    const view = $('.dx-zoom-view', dlg), pic = $('img', dlg);
    let z = 1, px = 0, py = 0, drag = null;
    const apply = () => { pic.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(' + z + ')'; $('[data-z="0"]', dlg).textContent = Math.round(z * 100) + '%'; };
    const zoomAt = (k, cx, cy) => { const n = Math.min(6, Math.max(0.5, z * k)); px = cx - (cx - px) * n / z; py = cy - (cy - py) * n / z; z = n; apply(); };
    const reset = () => { z = 1; px = 0; py = 0; apply(); };
    shots.forEach((b) => b.addEventListener('click', () => {
      const im = $('img', b); pic.src = im.src; pic.alt = im.alt; $('b', dlg).textContent = b.closest('section').querySelector('h2').textContent; reset(); dlg.showModal();
    }));
    dlg.addEventListener('click', (ev) => {
      const k = ev.target.dataset && ev.target.dataset.z; const r = view.getBoundingClientRect();
      if (k === 'x' || ev.target === dlg) dlg.close(); else if (k === '0') reset(); else if (k === '+') zoomAt(1.3, r.width / 2, r.height / 2); else if (k === '-') zoomAt(1 / 1.3, r.width / 2, r.height / 2);
    });
    view.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = view.getBoundingClientRect(); zoomAt(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
    view.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX - px, y: ev.clientY - py }; view.setPointerCapture(ev.pointerId); });
    view.addEventListener('pointermove', (ev) => { if (drag) { px = ev.clientX - drag.x; py = ev.clientY - drag.y; apply(); } });
    ['pointerup', 'pointercancel'].forEach((n) => view.addEventListener(n, () => { drag = null; }));
  }

  // ---- главная каталога: картинка рядом меняется вместе со ступенью
  const story = $('.ds-story');
  if (story && 'IntersectionObserver' in window) {
    const pics = story.querySelectorAll('.ds-story-pic img');
    const io = new IntersectionObserver((list) => list.forEach((x) => {
      if (x.isIntersecting) pics.forEach((p, i) => p.classList.toggle('on', i === Number(x.target.dataset.pic)));
    }), { rootMargin: '-40% 0px -50% 0px' });
    story.querySelectorAll('.ds-level').forEach((s) => io.observe(s));
  }

  // ---- датчик температуры: R(T) по β и делитель с опорным резистором 10 кОм от 5 В
  const ntc = $('#dx-ntc');
  if (ntc) {
    const T = $('#n-t'), R25 = $('#n-r25'), B = $('#n-b'), cv = $('#n-chart'), RREF = 10000, VREF = 5;
    const res = (t) => Number(R25.value) * Math.exp(Number(B.value) * (1 / (t + 273.15) - 1 / 298.15));
    const ohm = (r) => r >= 1000 ? fmt(r / 1000, 2) + L(' кОм', ' kΩ') : fmt(r, 0) + L(' Ом', ' Ω');
    function draw() {
      const b = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, c = cv.getContext('2d');
      cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, b.width, b.height);
      const LX = 40, Rr = 8, Tp = 22, Bt = 30, x = (t) => LX + (t + 40) / 170 * (b.width - LX - Rr), y = (v) => Tp + (5 - v) / 5 * (b.height - Tp - Bt);
      const volt = (t) => VREF * res(t) / (res(t) + RREF);
      c.strokeStyle = '#e5e5df'; c.fillStyle = '#666'; c.font = '12px system-ui,sans-serif'; c.lineWidth = 1;
      c.textAlign = 'right';
      for (let v = 0; v <= 5; v++) { c.beginPath(); c.moveTo(LX, y(v)); c.lineTo(b.width - Rr, y(v)); c.stroke(); c.fillText(v + (EN ? ' V' : ' В'), LX - 5, y(v) + 4); }
      c.textAlign = 'center';
      for (let t = -40; t <= 120; t += 40) c.fillText(t + '°', x(t), b.height - 10);
      c.strokeStyle = '#1b1c20'; c.lineWidth = 2; c.beginPath();
      for (let t = -40; t <= 130; t += 2) { if (t === -40) c.moveTo(x(t), y(volt(t))); else c.lineTo(x(t), y(volt(t))); }
      c.stroke();
      const t = Number(T.value); c.fillStyle = '#e8661a'; c.beginPath(); c.arc(x(t), y(volt(t)), 6, 0, Math.PI * 2); c.fill();
    }
    function update() {
      const t = Number(T.value), r = res(t), v = VREF * r / (r + RREF);
      $('#n-r').textContent = ohm(r); $('#n-v').textContent = fmt(v, 2) + L(' В', ' V');
      $('#n-s').textContent = t < 10 ? L('Холодный', 'Cold') : t < 75 ? L('Прогрев', 'Warming up') : t <= 105 ? L('Рабочая', 'Normal') : L('Перегрев', 'Overheat');
      $('#n-f').innerHTML = 'V = 5 · R / (R + 10 ' + L('кОм', 'kΩ') + ') = 5 · <em>' + ohm(r) + '</em> / (<em>' + ohm(r) + '</em> + 10 ' + L('кОм', 'kΩ') + ') = <em>' + fmt(v, 2) + L(' В', ' V') + '</em>';
      draw();
    }
    [T, R25, B].forEach((el) => {
      const out = $('output', el.closest('label'));
      const show = () => { out.textContent = fmt(el.value) + ' ' + el.dataset.u; };
      el.addEventListener('input', () => { show(); update(); }); show();
    });
    window.addEventListener('resize', draw); update();
  }
})();
