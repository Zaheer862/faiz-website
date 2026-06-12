// ============================================
//   F.AI.Z — Professional Script
// ============================================

// --- Category Icons ---
const categoryIcons = {
  phones: 'fa-mobile-alt',
  tablets: 'fa-tablet-alt',
  covers: 'fa-shield-alt',
  accessories: 'fa-headphones-alt'
};

// --- HTML escaping (products can come from localStorage via the admin panel) ---
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
const escapeAttr = escapeHtml;

// Best image for a product: self-hosted localImage first, remote URL second,
// brand placeholder last (GSMArena blocks hotlinking, so remote often 403s).
function productImgParts(p) {
  const local = p.localImage || '';
  const remote = (p.image && p.image !== local) ? p.image : '';
  const brand = (p.brand || '').toLowerCase();
  const known = ['apple', 'google', 'oneplus', 'samsung'];
  const ph = 'images/brand-placeholder/' + (known.includes(brand) ? brand : 'phone') + '.svg';
  return { src: local || remote || ph, fb: (local && remote) ? remote : '', ph };
}

// --- Load and render products ---
async function loadProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    // Use admin-managed products from localStorage if available, otherwise fetch defaults
    let products;
    const stored = localStorage.getItem('faiz_products');
    if (stored) {
      products = JSON.parse(stored);
    } else {
      const res = await fetch('products.json');
      products = await res.json();
    }

    const isHomepage = !window.location.pathname.includes('shop');
    const HOMEPAGE_LIMIT = 8;

    let filtered = filter === 'all'
      ? products
      : products.filter(p => p.category === filter);

    // On the homepage, show only the first 8 featured products
    if (isHomepage) {
      filtered = filtered.slice(0, HOMEPAGE_LIMIT);
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="products-loading">
          <i class="fas fa-box-open" style="opacity:0.5"></i>
          <span>No products in this category yet.</span>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const im = productImgParts(p);
      return `
      <div class="product-card animate-on-scroll">
        <div class="product-img">
          <img src="${escapeAttr(im.src)}" alt="${escapeAttr(p.name)}" loading="lazy" data-fb="${escapeAttr(im.fb)}"
               style="width:100%;height:100%;object-fit:cover;"
               onerror="if(this.dataset.fb){this.src=this.dataset.fb;this.dataset.fb='';}else{this.onerror=null;this.src='${im.ph}';}">
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span class="product-badge">${escapeHtml(p.badge)}</span>
            <span class="product-price">&pound;${p.price.toFixed(2)}</span>
          </div>
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="product-desc">${escapeHtml(p.description)}</div>
          <a href="https://wa.me/447440423053?text=${encodeURIComponent('Hi, I\'m interested in: ' + p.name + ' (£' + p.price.toFixed(2) + ')')}"
             target="_blank" class="product-enquire">
            <i class="fab fa-whatsapp"></i> Enquire on WhatsApp
          </a>
        </div>
      </div>
    `;}).join('');

    // Make product cards visible — stagger 80ms apart.
    // Using setTimeout instead of IntersectionObserver so cards always appear
    // even when the section is already in the viewport (e.g. after filter click).
    if (isHomepage) {
      grid.querySelectorAll('.animate-on-scroll').forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), 100 + i * 80);
      });
    } else {
      initScrollAnimations();
    }
  } catch (e) {
    grid.innerHTML = `
      <div class="products-loading">
        <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
        <span>Could not load products. Please try again later.</span>
      </div>`;
  }
}


// --- Filter buttons ---
function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadProducts(btn.dataset.filter);
    });
  });
}


// --- Hamburger menu ---
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
    // Hide sticky bar while nav is open to avoid overlap
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

  // Close when any nav link is tapped
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close when tapping outside the nav
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      closeMenu();
    }
  }, { passive: true });
}


// --- Scroll: active nav highlight ---
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', isActive);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(s => observer.observe(s));
}


// --- Header style on scroll ---
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const update = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}


// --- Scroll animations ---
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll:not(.visible)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger the animations
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}


// --- Hero particles ---
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (4 + Math.random() * 4) + 's';
    particle.style.width = (2 + Math.random() * 3) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}


// --- Smooth anchor scroll ---
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href.length < 2) return; // bare "#" is not a valid selector
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}


// --- FAQ accordion ---
function initFAQ() {
  const buttons = document.querySelectorAll('.faq-question');
  buttons.forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));
      buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));

      // Toggle current
      if (!wasActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}


// --- Hero stats counter animation ---
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-num[data-count]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}


// --- Hero Device Rotator ---
function initDeviceRotator() {
  const img   = document.getElementById('heroDeviceImg');
  const pill  = document.getElementById('heroDevicePill');
  const glow  = document.getElementById('heroDeviceGlow');
  if (!img) return;

  // The carousel is display:none on phones — don't preload or rotate there
  if (window.matchMedia('(max-width: 600px)').matches) return;

  const devices = [
    {
      src:   'images/site/hero-s25ultra.png',
      alt:   'Samsung Galaxy S25 Ultra',
      pill:  '<i class="fas fa-bolt"></i> Same-Day Available',
      blend: false,
      glow:  'rgba(14,165,233,0.35)'
    },
    {
      src:   'images/site/hero-iphone.jpg',
      alt:   'Apple iPhone',
      pill:  '<i class="fab fa-apple"></i> iPhones Repaired',
      blend: false,
      glow:  'rgba(200,200,200,0.2)'
    },
    {
      src:   'images/site/hero-android.jpg',
      alt:   'Android Phone Repair',
      pill:  '<i class="fas fa-mobile-alt"></i> All Brands Repaired',
      blend: false,
      glow:  'rgba(52,168,83,0.28)'
    },
    {
      src:   'images/site/hero-s25.png',
      alt:   'Samsung Galaxy S25',
      pill:  '<i class="fas fa-mobile-alt"></i> New Phones In Stock',
      blend: false,
      glow:  'rgba(14,165,233,0.35)'
    },
    {
      src:   'images/site/hero-watch.jpg',
      alt:   'Smartwatch Repair',
      pill:  '<i class="fas fa-clock"></i> Smartwatches Too',
      blend: false,
      glow:  'rgba(234,179,8,0.28)'
    },
    {
      src:   'images/site/hero-console.jpg',
      alt:   'PlayStation Console Repair',
      pill:  '<i class="fas fa-gamepad"></i> Consoles Repaired',
      blend: false,
      glow:  'rgba(0,114,198,0.35)'
    }
  ];

  let idx = 0;

  // Preload all images silently
  devices.forEach(d => { const i = new Image(); i.src = d.src; });

  function switchDevice() {
    idx = (idx + 1) % devices.length;
    const dev = devices[idx];

    // Fade out
    img.style.opacity = '0';
    if (pill) pill.style.opacity = '0';

    setTimeout(() => {
      img.src = dev.src;
      img.alt = dev.alt;
      img.style.mixBlendMode = dev.blend ? 'multiply' : 'normal';

      if (pill) {
        pill.innerHTML = dev.pill;
        pill.style.opacity = '1';
      }

      if (glow) {
        glow.style.background = `radial-gradient(circle, ${dev.glow} 0%, transparent 75%)`;
      }

      img.style.opacity = '1';
    }, 380);
  }

  // Add CSS transition if not already there
  img.style.transition = 'opacity 0.38s ease';
  if (pill) pill.style.transition = 'opacity 0.38s ease';

  setInterval(switchDevice, 3500);
}


// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initFilters();
  initMenu();
  initScrollSpy();
  initHeaderScroll();
  initScrollAnimations();
  initParticles();
  initSmoothScroll();
  initFAQ();
  initStatCounters();
  initDeviceRotator();
});
