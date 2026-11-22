// Интерактивная документация Cat-GDI8. Без JavaScript страница остаётся обычным текстом.
// Вход: разметка страницы и блоки #dx-*. Выход: поиск, колесо триггера, расчёт топлива, живые схемы, чек-лист.
(function () {
  'use strict';
  const EN = document.documentElement.lang === 'en';
  const L = (r, n) => (EN ? n : r);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = (v, d) => Number(v).toLocaleString(EN ? 'en-US' : 'ru-RU', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без памяти браузера тоже работает */ } }
  };

  // ---- поиск по разделам
  function initSearch() {
    const input = $('#dx-q'), box = $('#dx-res');
    if (!input) return;
    const index = [];
    $$('.doc section[id]').forEach((sec) => {
      const title = $('h2', sec).childNodes[0].textContent.trim();
      index.push({ id: sec.id, title, text: title });
      $$('h3, p, li, tr', sec).forEach((el) => {
        if (el.closest('.dx-panel')) return;
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (text) index.push({ id: sec.id, title, text });
      });
    });
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove('on'); box.innerHTML = ''; return; }
      const hits = index.filter((x) => x.text.toLowerCase().includes(q)).slice(0, 7);
      box.innerHTML = hits.length ? hits.map((h) => {
        const at = h.text.toLowerCase().indexOf(q), from = Math.max(0, at - 45);
        const part = h.text.slice(from, at) + '\u0000' + h.text.slice(at, at + q.length) + '\u0001' + h.text.slice(at + q.length, at + q.length + 70);
        return '<a href="#' + h.id + '"><b>' + esc(h.title) + '</b><span>' + (from ? '…' : '') + esc(part).replace('\u0000', '<mark>').replace('\u0001', '</mark>') + '…</span></a>';
      }).join('') : '<a href="#setup"><b>Ничего не нашлось</b><span>Попробуйте другое слово</span></a>';
      box.classList.add('on');
    };
    input.addEventListener('input', render);
    box.addEventListener('click', () => { box.classList.remove('on'); });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
      if (e.key === 'Escape') box.classList.remove('on');
    });
  }

  // ---- ползунки: подпись значения рядом
  function bind(root, update) {
    $$('input,select', root).forEach((el) => {
      const show = () => {
        const o = el.closest('label') && $('output', el.closest('label'));
        if (o) o.textContent = fmt(el.value, Number(el.dataset.d || 0)) + (el.dataset.u ? ' ' + el.dataset.u : '');
      };
      el.addEventListener('input', () => { show(); update(); });
      show();
    });
  }

  // ---- колесо триггера: угол, зубья, сигнал и такт цилиндра 1
  function initWheel() {
    const root = $('#dx-wheel');
    if (!root) return;
    const cv = $('canvas', root), ctx = cv.getContext('2d');
    const rpm = $('#w-rpm'), kind = $('#w-kind'), ang = $('#w-ang'), play = $('#w-play');
    const strokes = EN ? ['Intake', 'Compression', 'Power', 'Exhaust'] : ['Впуск', 'Сжатие', 'Рабочий ход', 'Выпуск'];
    let running = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, last = 0, visible = true;
    const wheel = () => { const [n, m] = kind.value.split('-').map(Number); return { n, m }; };
    const present = (i, w) => i < w.n - w.m;

    function draw() {
      const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const w = wheel(), a = Number(ang.value), crank = a % 360, step = 360 / w.n;
      const traceH = 70, cx = r.width / 2, cy = (r.height - traceH) / 2, R = Math.min(r.width * .38, cy - 10), rot = crank * Math.PI / 180;
      // диск
      ctx.fillStyle = '#1b1c20';
      for (let i = 0; i < w.n; i++) {
        if (!present(i, w)) continue;
        const t0 = (i * step) * Math.PI / 180 + rot - Math.PI / 2, t1 = t0 + (step * .5) * Math.PI / 180;
        ctx.beginPath(); ctx.arc(cx, cy, R, t0, t1); ctx.arc(cx, cy, R * .89, t1, t0, true); ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, R * .89, 0, Math.PI * 2); ctx.fillStyle = '#f1f1ee'; ctx.fill();
      ctx.strokeStyle = '#1b1c20'; ctx.lineWidth = 1.5; ctx.stroke();
      // датчик сверху
      ctx.fillStyle = '#e8661a'; ctx.beginPath(); ctx.moveTo(cx - 7, cy - R - 9); ctx.lineTo(cx + 7, cy - R - 9); ctx.lineTo(cx, cy - R + 1); ctx.closePath(); ctx.fill();
      // такт в центре
      ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.font = '700 ' + Math.max(14, R * .17) + 'px system-ui,sans-serif';
      ctx.fillText(strokes[Math.floor(a / 180) % 4], cx, cy - 2);
      ctx.fillStyle = '#666'; ctx.font = '12px system-ui,sans-serif';
      ctx.fillText(L('цилиндр 1 · ', 'cylinder 1 · ') + Math.round(a) + L('° из 720°', '° of 720°'), cx, cy + 17);
      // сигнал датчика за оборот
      const x0 = 6, tw = r.width - 12, top = r.height - traceH + 16, h = 30, sx = (deg) => x0 + deg / 360 * tw;
      ctx.fillStyle = '#666'; ctx.textAlign = 'left'; ctx.font = '12px system-ui,sans-serif'; ctx.fillText(L('Сигнал датчика за оборот', 'Sensor signal per revolution'), x0, top - 5);
      ctx.strokeStyle = '#1b1c20'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, top + h);
      for (let i = 0; i < w.n; i++) {
        if (!present(i, w)) continue;
        const s = sx(i * step), e = sx((i + .5) * step);
        ctx.lineTo(s, top + h); ctx.lineTo(s, top); ctx.lineTo(e, top); ctx.lineTo(e, top + h);
      }
      ctx.lineTo(x0 + tw, top + h); ctx.stroke();
      const gs = sx((w.n - w.m) * step - step * .5), ge = sx(360);
      ctx.fillStyle = 'rgba(232,102,26,.16)'; ctx.fillRect(gs, top - 2, ge - gs, h + 4);
      const pos = sx((360 - crank) % 360);
      ctx.strokeStyle = '#e8661a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pos, top - 3); ctx.lineTo(pos, top + h + 3); ctx.stroke();
    }

    function stats() {
      const v = Number(rpm.value), w = wheel(), usDeg = 60e6 / (v * 360), tooth = 60e6 / (v * w.n), gap = tooth * (w.m + 1);
      const f = (x) => x >= 1000 ? fmt(x / 1000, 2) + L(' мс', ' ms') : fmt(x, 1) + L(' мкс', ' µs');
      $('#w-tooth').textContent = f(tooth);
      $('#w-gap').textContent = f(gap);
      $('#w-deg').textContent = f(usDeg);
      $('#w-cycle').textContent = fmt(120000 / v, 1) + L(' мс', ' ms');
      $('#w-f').innerHTML = 't<sub>' + L('зуба', 'tooth') + '</sub> = 60 / (n × Z) = 60 / (<em>' + fmt(v) + '</em> × <em>' + w.n + '</em>) = <em>' + f(tooth) + '</em>';
    }

    function frame(t) {
      if (running && visible) {
        const dt = Math.min(50, t - last);
        ang.value = (Number(ang.value) + dt * .045) % 720;
        const o = $('output', ang.closest('label')); if (o) o.textContent = Math.round(ang.value) + '°';
        draw();
      }
      last = t;
      requestAnimationFrame(frame);
    }
    const setPlay = () => { play.textContent = running ? L('Пауза', 'Pause') : L('Вращать', 'Rotate'); };
    play.addEventListener('click', () => { running = !running; setPlay(); });
    ang.addEventListener('pointerdown', () => { running = false; setPlay(); });
    bind(root, () => { stats(); draw(); });
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(cv);
    window.addEventListener('resize', draw);
    setPlay(); stats(); draw(); requestAnimationFrame(frame);
  }

  // ---- расчёт воздуха, топлива и импульса форсунки
  function initFuel() {
    const root = $('#dx-fuel');
    if (!root) return;
    const n = (id) => Number($('#' + id).value);
    function update() {
      const Vc = n('f-vol') / n('f-cyl') / 1000, p = n('f-map') * 1000, T = n('f-t') + 273.15, ve = n('f-ve') / 100;
      const rho = p / (287.05 * T), air = rho * Vc * ve * 1e6, fuel = air / (14.7 * n('f-lam'));
      const flow = n('f-flow') * Math.sqrt(n('f-rail') / 100), open = fuel / flow, ms = open + n('f-dead');
      const rpm = n('f-rpm'), deg = ms * rpm * 6 / 1000, duty = ms / (120000 / rpm) * 100;
      const mg = L(' мг', ' mg'), msU = L(' мс', ' ms');
      $('#f-air').textContent = fmt(air, 0) + mg;
      $('#f-fuel').textContent = fmt(fuel, 1) + mg;
      $('#f-ms').textContent = fmt(ms, 2) + msU;
      $('#f-deg').textContent = fmt(deg, 0) + '°';
      $('#f-duty').textContent = fmt(duty, 0) + ' %';
      $('#f-deg').parentNode.classList.toggle('warn', deg > 180);
      $('#f-warn').textContent = deg > 180 ? L('Импульс длиннее такта впуска (180°). Нужна форсунка больше, давление выше или деление впрыска.', 'The pulse is longer than the intake stroke (180°). A larger injector, higher pressure or split injection is needed.') : L('Импульс помещается в такт впуска.', 'The pulse fits within the intake stroke.');
      $('#f-formula').innerHTML =
        'm<sub>' + L('возд', 'air') + '</sub> = P / (R·T) · V<sub>' + L('цил', 'cyl') + '</sub> · VE = <em>' + fmt(air, 0) + mg + '</em><br>' +
        'm<sub>' + L('топл', 'fuel') + '</sub> = m<sub>' + L('возд', 'air') + '</sub> / (' + L('14,7', '14.7') + ' · λ) = <em>' + fmt(fuel, 1) + mg + '</em><br>' +
        't = m<sub>' + L('топл', 'fuel') + '</sub> / (Q · √(P<sub>' + L('рампы', 'rail') + '</sub> / 100)) + t<sub>' + L('задержки', 'delay') + '</sub> = <em>' + fmt(ms, 2) + msU + '</em>';
    }
    bind(root, update); update();
  }

  // ---- структура момента: нажать на блок
  const FLOW = {
    'Рычаг': 'Переводит положение рычага и обороты в <b>запрос момента</b>. От него зависит всё ниже, но напрямую заслонкой он не управляет.',
    'Регулятор ХХ': 'Держит обороты холостого хода. Просит немного воздуха про запас, а быстрые поправки делает углом зажигания.',
    'Координация': 'Сравнивает запросы рычага и холостого хода. Побеждает больший, затем к нему применяются ограничения.',
    'Ограничения': 'Ограничитель оборотов, защиты, пуск и аварийные режимы. <b>Всегда главнее запроса</b>: момент снижается плавно.',
    'Целевой момент': 'Сколько момента нужно получить на валу с учётом трения и насосных потерь.',
    'Воздух · медленно': 'Заслонка, наддув и фазы. Точный, но медленный путь: коллектору нужно время наполниться.',
    'УОЗ · быстро': 'Отвод угла зажигания от оптимума. Меняет момент за один цикл, поэтому отвечает за быстрые изменения.',
    'Аварийная отсечка': 'Отдельная настройка, по умолчанию выключена. В обычной работе и ограничениях не используется.',
    'Lever': 'Turns lever position and rpm into a <b>torque request</b>. Everything below depends on it, but it does not drive the throttle directly.',
    'Idle controller': 'Holds idle speed. It asks for a little extra air and makes fast corrections with spark.',
    'Coordination': 'Compares the lever and idle requests. The larger one wins, then limits are applied.',
    'Limits': 'Rev limiter, protections, start and limp modes. <b>Always above the request</b>: torque is reduced smoothly.',
    'Torque target': 'The torque needed at the shaft, including friction and pumping losses.',
    'Air path · slow': 'Throttle, boost and cams. Accurate but slow: the manifold needs time to fill.',
    'Spark path · fast': 'Spark retard from optimum. Changes torque within one cycle, so it handles fast changes.',
    'Emergency cut': 'A separate setting, off by default. Not used in normal operation or limiting.'
  };
  function initFlow() {
    const flow = $('#torque .flow');
    if (!flow) return;
    const detail = document.createElement('div');
    detail.className = 'dx-detail'; detail.setAttribute('aria-live', 'polite');
    detail.innerHTML = L('Нажмите на любой блок схемы: появится, что он делает.', 'Click any block in the diagram to see what it does.');
    flow.after(detail);
    $$('.box', flow).forEach((box) => {
      const key = $('b', box).textContent.trim();
      if (!FLOW[key]) return;
      box.setAttribute('role', 'button'); box.tabIndex = 0;
      const pick = () => {
        $$('.box', flow).forEach((x) => x.classList.remove('dx-on'));
        box.classList.add('dx-on');
        detail.innerHTML = '<b>' + esc(key) + '.</b> ' + FLOW[key];
      };
      box.addEventListener('click', pick);
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  // ---- таблица -> вкладки по строкам
  function tabsFromTable(table, panelHtml) {
    const rows = $$('tbody tr', table).length ? $$('tbody tr', table) : $$('tr', table).slice(1);
    if (!rows.length) return;
    const wrap = table.closest('.table-scroll') || table;
    const tabs = document.createElement('div'); tabs.className = 'dx-tabs'; tabs.setAttribute('role', 'tablist');
    const panel = document.createElement('div'); panel.className = 'dx-panel'; panel.setAttribute('role', 'tabpanel');
    const pick = (i) => {
      $$('.dx-tab', tabs).forEach((b, k) => b.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      panel.innerHTML = panelHtml(Array.from(rows[i].cells), i, rows.length);
    };
    rows.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dx-tab'; b.setAttribute('role', 'tab'); b.textContent = r.cells[0].textContent.trim();
      b.addEventListener('click', () => pick(i));
      tabs.appendChild(b);
    });
    wrap.before(tabs); wrap.before(panel); wrap.hidden = true; pick(0);
  }
  function initTables() {
    const start = $('#start table');
    if (start) tabsFromTable(start, (c, i, n) => '<b>' + L('Шаг ', 'Step ') + (i + 1) + L(' из ', ' of ') + n + ': ' + esc(c[0].textContent.trim()) + '</b> ' + c[2].innerHTML +
      '<div class="dx-meter">' + Array.from({ length: n }, (_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join('') + '</div>' + esc(c[1].textContent.trim()));
    const prot = $('#protection table');
    if (prot) tabsFromTable(prot, (c, i, n) => '<b>' + esc(c[1].textContent.trim()) + '</b>' +
      '<div class="dx-meter">' + Array.from({ length: n }, (_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join('') + '</div>' + L('Примеры: ', 'Examples: ') + esc(c[2].textContent.trim()));
  }

  // ---- настройка: чек-лист с прогрессом в браузере читателя
  function initChecklist() {
    const list = $('#setup .steps-list');
    if (!list) return;
    const KEY = 'gdi8-docs:' + location.pathname, items = $$(':scope > li', list).filter((li) => !li.hidden);
    let done = new Set((store.get(KEY) || '').split(',').filter(Boolean).map(Number));
    const bar = document.createElement('div'); bar.className = 'dx-progress';
    bar.innerHTML = '<span></span><div><i></i></div><button type="button">' + L('Сбросить', 'Reset') + '</button>';
    list.before(bar);
    const paint = () => {
      items.forEach((li, i) => { li.classList.toggle('dx-done', done.has(i)); li.setAttribute('aria-checked', done.has(i) ? 'true' : 'false'); });
      $('span', bar).textContent = L('Пройдено ', 'Done ') + done.size + L(' из ', ' of ') + items.length;
      $('i', bar).style.width = (done.size / items.length * 100) + '%';
      store.set(KEY, Array.from(done).join(','));
    };
    items.forEach((li, i) => {
      li.classList.add('dx-check'); li.setAttribute('role', 'checkbox'); li.tabIndex = 0;
      const flip = () => { if (done.has(i)) done.delete(i); else done.add(i); paint(); };
      li.addEventListener('click', (e) => { if (!e.target.closest('a')) flip(); });
      li.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    });
    $('button', bar).addEventListener('click', () => { done = new Set(); paint(); });
    paint();
  }

  // ---- показать только шаги для выбранного мотора
  function applyConfig() {
    let c = {};
    try { c = JSON.parse(store.get('gdi8-config') || '{}'); } catch (e) { c = {}; }
    const inj = c.inj || 'gdi';
    const has = { di: inj !== 'pfi', pi: inj !== 'gdi', turbo: (c.air || 'na') !== 'na', cam: Number(c.cam || 0) > 0 };
    $$('[data-if]').forEach((el) => { el.hidden = !has[el.dataset.if]; });
  }

  applyConfig(); initFlow(); initTables(); initChecklist(); initSearch(); initWheel(); initFuel();
})();
