const root = document.documentElement;
root.classList.add('has-js');

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

if (toggle && nav) {
  toggle.hidden = false;
  const setOpen = (open, restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? 'Close <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">+</span>';
    nav.classList.toggle('is-open', open);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
    if (event.matches) setOpen(false);
  });
}

const header = document.querySelector('.site-header');
let scrollQueued = false;
const updateScrollState = () => {
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
  root.style.setProperty('--scroll-progress', progress.toFixed(4));
  header?.classList.toggle('is-scrolled', window.scrollY > 10);
  scrollQueued = false;
};
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScrollState);
  }
}, { passive: true });
window.addEventListener('resize', updateScrollState, { passive: true });
updateScrollState();

const revealItems = [...document.querySelectorAll('[data-reveal]')];
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  revealItems.forEach((item, index) => {
    item.classList.add('will-reveal');
    if (index < 4) item.style.transitionDelay = `${index * 45}ms`;
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const sectionLinks = [...document.querySelectorAll('.about-index a[href^="#"]')];
if (sectionLinks.length && 'IntersectionObserver' in window) {
  const sections = sectionLinks
    .map(link => document.querySelector(link.hash))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(link => {
      if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -58% 0px', threshold: [0, .2, .5] });

  sections.forEach(section => sectionObserver.observe(section));
}

const flowLinks = [...document.querySelectorAll('#site-nav a[href^="#"]')];
if (flowLinks.length && 'IntersectionObserver' in window) {
  const flowSections = flowLinks
    .map(link => document.querySelector(link.hash))
    .filter(Boolean);

  const markFlow = (id) => {
    flowLinks.forEach(link => {
      if (id && link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const flowObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    markFlow(visible.target.id);
  }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4] });

  flowSections.forEach(section => flowObserver.observe(section));
}

const projectAccordions = [...document.querySelectorAll('.project-accordion')];
if (projectAccordions.length) {
  projectAccordions.forEach(project => {
    project.addEventListener('toggle', () => {
      if (!project.open) return;
      projectAccordions.forEach(other => {
        if (other !== project) other.open = false;
      });
    });
  });

  const openProjectFromHash = () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target?.matches('.project-accordion')) target.open = true;
  };

  openProjectFromHash();
  window.addEventListener('hashchange', openProjectFromHash);
}

// A short exit transition makes page-to-page navigation feel connected without hijacking scrolling.
document.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', event => {
    if (reducedMotion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    const sameDocument = destination.pathname === window.location.pathname && destination.search === window.location.search;
    if (sameDocument && destination.hash) return;

    event.preventDefault();
    root.classList.add('page-leaving');
    window.setTimeout(() => { window.location.href = destination.href; }, 150);
  });
});
