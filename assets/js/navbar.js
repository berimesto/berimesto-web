const path = window.location.pathname;
const navItems = [
  ['/', 'Главная'],
  ['/sklady/', 'Склады'],
  ['/access/', 'Доступ'],
  ['/account/', 'Личный кабинет'],
  ['/contacts/', 'Контакты']
];

export function renderNavbar() {
  const host = document.getElementById('bm-navbar');
  if (!host) return;
  host.innerHTML = `<nav class="bm-nav"><div class="bm-container bm-nav-inner">${navItems
    .map(([href, label]) => `<a class="bm-nav-link ${path === href ? 'is-active' : ''}" href="${href}">${label}</a>`)
    .join('')}</div></nav>`;
}
