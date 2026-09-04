/* MOGI — router + interactions. No framework, no build. */

/* ---- EDIT ME: Drop 0 holders. Fill `name` in as they come through. ---- */
const HOLDERS = Array.from({ length: 20 }, (_, i) => ({
  no: String(i + 1).padStart(2, '0'),
  name: 'Anonymous',
}));

/* ---- EDIT ME: the four in the boat. ---- */
const CREW = [
  { role: 'FOUNDER',      name: '[Name]', bio: '[EDIT] Started the notebook. Draws the face over and over until it looks right.' },
  { role: 'DESIGN',       name: '[Name]', bio: '[EDIT] Turns the sketch into a garment — patterns, weights, placement.' },
  { role: 'PRODUCTION',   name: '[Name]', bio: '[EDIT] Talks to the factories. Makes sure the stitching survives a wash.' },
  { role: 'IMAGE',        name: '[Name]', bio: '[EDIT] Shoots it, edits it, makes people stop scrolling.' },
];

/* ---------------- router ---------------- */
const ROUTES = { '': 'v-menu', '/': 'v-menu', '/about': 'v-about', '/stock': 'v-stock', '/owner': 'v-owner', '/drop0': 'v-drop0' };

function route() {
  const id = ROUTES[location.hash.slice(1)] || 'v-menu';
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.id === id));
  if (id !== 'v-about') document.body.classList.remove('sea-mode');
  window.scrollTo(0, 0);
  requestAnimationFrame(observeReveals);   // new view = new elements to watch
}
window.addEventListener('hashchange', route);

/* ---------------- about chapters ---------------- */
function showChapter(n) {
  document.querySelectorAll('#v-about .ch').forEach(c => c.classList.toggle('is-on', +c.dataset.ch === n));
  document.querySelectorAll('.rail__dot').forEach(d => d.classList.toggle('is-on', +d.dataset.ch === n));
  // chapter 3 takes the whole page under water
  document.body.classList.toggle('sea-mode', n === 2);
  document.getElementById('v-about').scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(observeReveals);   // let layout settle before measuring
}
document.querySelectorAll('.rail__dot').forEach(d => d.onclick = () => showChapter(+d.dataset.ch));
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => showChapter(+b.dataset.go));

/* ---------------- crewmate cards ---------------- */
const card = document.getElementById('crewCard');
function openCrew(i) {
  const c = CREW[i];
  if (!c) return;
  ccRole.textContent = c.role;
  ccName.textContent = c.name;
  ccBio.textContent = c.bio;
  card.hidden = false;
  document.querySelectorAll('.crew-hit').forEach(h => h.classList.toggle('is-sel', +h.dataset.crew === i));
}
document.querySelectorAll('.crew-hit').forEach(h => {
  const open = () => openCrew(+h.dataset.crew);
  h.addEventListener('click', open);
  h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});
document.querySelector('.crew-card__x').onclick = () => {
  card.hidden = true;
  document.querySelectorAll('.crew-hit').forEach(h => h.classList.remove('is-sel'));
};

/* ---------------- holder registry ---------------- */
document.getElementById('registry').innerHTML =
  HOLDERS.map(h => `<li><b>#${h.no}</b> ${h.name}</li>`).join('');

/* ---------------- scroll reveal ---------------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -12% 0px' });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}

/* ---------------- sticker parallax (menu only) ---------------- */
// ponytail: pointer-driven, not scroll — the menu doesn't scroll.
let raf = 0;
addEventListener('pointermove', e => {
  if (raf || !document.getElementById('v-menu').classList.contains('is-active')) return;
  raf = requestAnimationFrame(() => {
    const dx = (e.clientX / innerWidth - .5) * 2, dy = (e.clientY / innerHeight - .5) * 2;
    document.querySelectorAll('.sticker').forEach(s => {
      const p = +s.dataset.par * 60;
      s.style.translate = `${dx * p}px ${dy * p}px`;
    });
    raf = 0;
  });
});

route();
