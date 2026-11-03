// Adds the top bar (site name, light/dark switch, account link) to every page.
import { watchUser } from './firebase.js';

const root = new URL('../', import.meta.url).href;

const bar = document.createElement('header');
bar.className = 'topbar';
bar.innerHTML = `
  <a class="brand" href="${root}">🎮 My Online Games</a>
  <div class="right">
    <button class="theme-btn" type="button"></button>
    <a class="account-link" href="${root}account/">Sign in</a>
  </div>`;
document.body.prepend(bar);

// Light / dark switch
const themeBtn = bar.querySelector('.theme-btn');
function showThemeButton() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  themeBtn.textContent = dark ? '☀️' : '🌙';
  themeBtn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  themeBtn.setAttribute('aria-label', themeBtn.title);
}
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
  showThemeButton();
});
showThemeButton();

// Account link shows who is signed in
const accountLink = bar.querySelector('.account-link');
watchUser((user) => {
  accountLink.textContent = user ? `👤 ${user.displayName || user.email}` : 'Sign in';
});
