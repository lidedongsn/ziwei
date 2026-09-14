export function initTheme($) {
  try { document.body.classList.toggle('dark', localStorage.getItem('theme') === 'dark'); } catch {}
  $('theme').onclick = () => {
    const dark = document.body.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  };
}
