document.documentElement.classList.add("js");

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const header = document.querySelector(".site-header");
const onScroll = () => {
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 4);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

const setOpen = (open) => {
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.textContent = open ? "Close" : "Menu";
  nav.classList.toggle("is-open", open);
};

toggle?.addEventListener("click", () => {
  setOpen(toggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setOpen(false);
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setOpen(false));
});

const reveals = document.querySelectorAll(".reveal");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => observer.observe(el));
}
