// ============================================
//   F.AI.Z — Repair Prices Page Script
// ============================================


// --- Price tab switching ---
function initPriceTabs() {
  const tabs = document.querySelectorAll('.price-tab');
  const panels = document.querySelectorAll('.price-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const panel = document.getElementById('tab-' + target);
      if (panel) {
        panel.classList.add('active');
        // Re-trigger scroll animations for newly visible rows
        initScrollAnimations();
      }
    });
  });
}


// --- Header scroll style ---
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const update = () => header.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', update, { passive: true });
  update();
}


// --- Mobile hamburger menu ---
function initMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  const mobileCta = document.getElementById('mobile-cta-bar');
  if (!hamburger || !nav) return;

  const openMenu = () => {
    nav.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (mobileCta) mobileCta.style.opacity = '0';
  };

  const closeMenu = () => {
    nav.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (mobileCta) mobileCta.style.opacity = '';
  };

  hamburger.addEventListener('click', () => {
    nav.classList.contains('open') ? closeMenu() : openMenu();
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      closeMenu();
    }
  }, { passive: true });
}


// --- Scroll animations ---
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll:not(.visible)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  elements.forEach(el => observer.observe(el));
}


// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initPriceTabs();
  initHeaderScroll();
  initMenu();
  initScrollAnimations();
});
