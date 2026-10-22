/* Yandex Metrika goals for clicks. The goal "request sent" is the visit of /thanks.html (set up in Metrika).
   Goal identifiers to create in Metrika as "JavaScript event": write_to_us, download, email. */
(function () {
  var COUNTER = 113736844;
  function goal(name) {
    if (typeof window.ym === 'function') window.ym(COUNTER, 'reachGoal', name);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.classList.contains('fab')) goal('write_to_us');
    else if (/^mailto:/i.test(href)) goal('email');
    else if (a.hasAttribute('download') || /\.(exe|bin|zip)(\?|$)/i.test(href) || /releases\/.*download/i.test(href)) goal('download');
  });
})();
