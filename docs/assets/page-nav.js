/* Page menu for long pages. Built from the sections marked data-nav="Title":
   on wide screens a card on the left (shown between the hero and the footer) with the steps of the
   current section; on narrow screens a row of links under the header. Content sections that should
   make room for the card carry the class rail-pad. Work is done only on scroll, resize and step changes. */
(function () {
  var secs = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var header = document.querySelector('.site-header');
  if (secs.length < 2 || !header) return;
  var ru = document.documentElement.lang === 'ru';

  var nav = document.createElement('nav');
  nav.className = 'page-nav';
  nav.setAttribute('aria-label', ru ? 'На этой странице' : 'On this page');
  var title = document.createElement('span');
  title.className = 'page-nav-title';
  title.textContent = ru ? 'На странице' : 'On this page';
  nav.appendChild(title);

  var items = secs.map(function (sec, i) {
    if (!sec.id) sec.id = 'part-' + (i + 1);
    var a = document.createElement('a');
    a.href = '#' + sec.id;
    var num = document.createElement('i');
    num.textContent = (i < 9 ? '0' : '') + (i + 1);
    a.appendChild(num);
    a.appendChild(document.createTextNode(sec.getAttribute('data-nav')));
    nav.appendChild(a);

    // Steps of a scroll section, or the subheadings of a text section.
    var steps = Array.prototype.slice.call(sec.querySelectorAll('.story-step:not(.intro), .stage'));
    var story = steps.length > 0;
    if (!story) steps = Array.prototype.slice.call(sec.querySelectorAll('h3'));
    var buttons = [];
    if (steps.length > 1) {
      var sub = document.createElement('div');
      sub.className = 'page-nav-sub';
      steps.forEach(function (step) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = (story ? step.querySelector('h3') : step).textContent;
        b.addEventListener('click', function () {
          step.scrollIntoView({ behavior: 'smooth', block: story ? 'center' : 'start' });
        });
        sub.appendChild(b);
        buttons.push(b);
      });
      nav.appendChild(sub);
    }
    return { a: a, sec: sec, steps: steps, story: story, buttons: buttons };
  });
  header.appendChild(nav);
  document.body.classList.add('has-page-nav');

  var hero = document.querySelector('.tp-hero, .product-hero');
  var footer = document.querySelector('.footer');
  var queued = false;

  function update() {
    queued = false;
    var line = window.innerHeight * 0.4;
    var cur = null;
    items.forEach(function (it) { if (it.sec.getBoundingClientRect().top <= line) cur = it; });
    items.forEach(function (it) {
      var on = it === cur;
      it.a.classList.toggle('on', on);
      if (on) it.a.setAttribute('aria-current', 'true'); else it.a.removeAttribute('aria-current');
      var mark = -1;
      if (on) it.steps.forEach(function (s, i) {
        if (it.story ? s.classList.contains('active') : s.getBoundingClientRect().top <= line) mark = i;
      });
      it.buttons.forEach(function (b, i) { b.classList.toggle('on', i === mark); });
    });
    var past = !hero || hero.getBoundingClientRect().bottom < window.innerHeight * 0.5;
    var room = !footer || footer.getBoundingClientRect().top > nav.getBoundingClientRect().bottom + 24;
    nav.classList.toggle('show', past && room);
  }
  function queue() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  // Scroll sections switch .active a moment after the scroll; follow them.
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(queue);
    items.forEach(function (it) {
      if (it.story) it.steps.forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ['class'] }); });
    });
  }
  queue();
})();
