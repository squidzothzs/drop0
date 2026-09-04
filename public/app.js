/* MOGI — router + interactions. No framework, no build. */

/* ---- EDIT ME: Drop 0 holders. Fill `name` in as they come through. ---- */
const HOLDERS = Array.from({ length: 20 }, (_, i) => ({
  no: String(i + 1).padStart(2, '0'),
  name: 'Anonymous',
}));

/* The four seats. One filled, three open — see the crewmates chapter. */
const CREW = [
  { role: 'DIRECTION',  bio: 'Drawing, art direction and every graphic MOGI puts out. Filled.' },
  { role: 'DESIGN',     bio: 'Seat open. Patterns, weights and placement - turning drawings into garments.' },
  { role: 'PRODUCTION', bio: 'Seat open. Sourcing, sampling, print and quality control.' },
  { role: 'IMAGE',      bio: 'Seat open. Photography, styling and how each drop is shot.' },
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
function closeCrew() {
  card.hidden = true;
  document.querySelectorAll('.crew-hit').forEach(h => h.classList.remove('is-sel'));
}

function openCrew(i, el) {
  const c = CREW[i];
  if (!c) return;
  if (!card.hidden && el.classList.contains('is-sel')) return closeCrew();   // same seat again = close
  ccRole.textContent = c.role;
  ccBio.textContent = c.bio;
  card.hidden = false;                       // unhide first so the card can be measured
  // park it just above the crewmate that was tapped, kept inside the sea.
  // .sea is scaled mid-flood, so divide the measured offsets back out by that scale.
  const sea = card.parentElement;
  const box = sea.getBoundingClientRect();
  const k = box.width / sea.offsetWidth || 1;
  const hit = el.getBoundingClientRect();
  const x = (hit.left - box.left + hit.width / 2) / k - card.offsetWidth / 2;
  const y = (hit.top - box.top) / k - card.offsetHeight - 14;
  card.style.left = Math.max(12, Math.min(x, sea.offsetWidth - card.offsetWidth - 12)) + 'px';
  card.style.top = Math.max(12, y) + 'px';
  document.querySelectorAll('.crew-hit').forEach(h => h.classList.toggle('is-sel', +h.dataset.crew === i));
}
document.querySelectorAll('.crew-hit').forEach(h => {
  const open = () => openCrew(+h.dataset.crew, h);
  h.addEventListener('click', open);
  h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});
document.querySelector('.crew-card__x').onclick = closeCrew;

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
