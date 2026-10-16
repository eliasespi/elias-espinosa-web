const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.hidden = false;
  document.documentElement.classList.add('has-js');
  const setOpen = (open, restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? 'Close <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">+</span>';
    nav.classList.toggle('is-open', open);
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setOpen(false); });
}

// Small, one-time entrances. Content is always present, even without motion or JS.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const entrances = new Set();
if ('IntersectionObserver' in window && Element.prototype.animate) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (reducedMotion.matches) return;
      const animation = entry.target.animate(
        [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
      entrances.add(animation);
      animation.finished.then(() => entrances.delete(animation), () => entrances.delete(animation));
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.feature, .section-heading, .project-row, .about-stories > section, .project-description, .project-facts, .contact-card, .hello').forEach(el => reveal.observe(el));
}
reducedMotion.addEventListener('change', event => {
  if (event.matches) entrances.forEach(animation => animation.cancel());
});

const header = document.querySelector('.site-header');
let scrollQueued = false;
const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
  scrollQueued = false;
};
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateHeader); }
}, { passive: true });
updateHeader();

// The About page keeps its local navigation in sync with the section in view.
const sectionLinks = [...document.querySelectorAll('.about-index a[href^="#"]')];
if (sectionLinks.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const current = entries.find(entry => entry.isIntersecting);
    if (!current) return;
    sectionLinks.forEach(link => {
      if (link.hash === '#' + current.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('.about-stories > section').forEach(section => sectionObserver.observe(section));
}
