/* Scroll sections (.story): the section title stays pinned while the section is on screen,
   and the sticky picture starts full width, then shrinks into its column as the text arrives.
   Sections with intro steps (.story-step.intro, pictures only) keep the picture big while the
   intro pictures change, and shrink it during the last intro step.
   One source of progress: the scroll position of the section. Work is done only on scroll/resize. */
(function () {
  var wideMq = window.matchMedia('(min-width: 981px)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.story'));
  if (!sections.length) return;
  var queued = false;

  function headerHeight() {
    var h = document.querySelector('.site-header');
    return h ? h.getBoundingClientRect().height : 64;
  }

  function clamp01(x) { return Math.min(1, Math.max(0, x)); }

  function update() {
    queued = false;
    var hdr = headerHeight();
    var vh = window.innerHeight;
    sections.forEach(function (sec) {
      var head = sec.querySelector('.story-head');
      var visual = sec.querySelector('.story-visual');
      var grid = sec.querySelector('.story-grid');
      var headH = head ? head.getBoundingClientRect().height : 0;
      sec.style.setProperty('--hdr', hdr + 'px');
      sec.style.setProperty('--head-h', headH + 'px');
      if (!visual || !grid) return;

      var intros = sec.querySelectorAll('.story-step.intro');
      var shrink = sec.classList.contains('scene') && wideMq.matches && !calmMq.matches;
      sec.classList.toggle('shrinks', shrink && !intros.length);
      sec.classList.toggle('shrinks-intro', shrink && intros.length > 0);
      if (!shrink) { visual.style.transform = ''; return; }

      // Full size: the width of the whole grid, but never taller than the free part of the screen.
      var w = visual.offsetWidth, h = visual.offsetHeight;
      var room = vh - hdr - headH - 32;
      var big = Math.max(1, Math.min(grid.clientWidth / w, room / h));
      var p;
      if (intros.length) {
        // Big while the intro pictures change; shrink while the last intro step passes the middle.
        var last = intros[intros.length - 1].getBoundingClientRect();
        p = clamp01((vh * 0.5 - last.top) / last.height);
      } else {
        // Shrink over the first 35% of a screen after the grid reaches the pinned title.
        var start = grid.getBoundingClientRect().top - (hdr + headH + 12);
        p = clamp01(-start / (vh * 0.35));
      }
      var s = big + (1 - big) * p;
      visual.style.transform = s > 1.001 ? 'scale(' + s.toFixed(4) + ')' : '';
    });
  }

  function queue() {
    if (!queued) { queued = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  if (wideMq.addEventListener) { wideMq.addEventListener('change', queue); calmMq.addEventListener('change', queue); }
  // Pages switch .scene on in their own scripts; run after them.
  window.addEventListener('load', queue);
  queue();
})();
