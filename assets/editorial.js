document.documentElement.classList.add('has-js');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
if (toggle && navigation) {
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !toggle.contains(event.target) && !navigation.contains(event.target)) setMenu(false);
  });
  const desktop = window.matchMedia('(min-width: 761px)');
  desktop.addEventListener('change', event => { if (event.matches) setMenu(false); });
}
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reveals = [...document.querySelectorAll('[data-reveal]')];
if (!reducedMotion.matches && 'IntersectionObserver' in window && reveals.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
  document.documentElement.classList.add('motion-ready');
  reveals.forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.98) {
      element.classList.add('is-visible');
    } else {
      observer.observe(element);
    }
  });
} else {
  reveals.forEach(element => element.classList.add('is-visible'));
}
