// Load in <head> (not as a module) so the right theme is applied before the page draws.
(function () {
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', t);
})();
