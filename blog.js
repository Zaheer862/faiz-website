/* =====================================================
   BLOG.JS — F.AI.Z Tech Blog Dynamic Renderer
   ===================================================== */

(function () {
  'use strict';

  const CAT_ICONS = {
    phones: 'fa-mobile-alt', laptops: 'fa-laptop',
    cyber: 'fa-shield-alt', consoles: 'fa-gamepad', tips: 'fa-tools'
  };

  let allPosts = [], activeFilter = 'all', searchQuery = '';

  const grid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  const filterBtns = document.querySelectorAll('.blog-filter-btn');
  const searchInput = document.getElementById('blog-search');
  const resultsCount = document.getElementById('results-count');
  const featuredEl = document.getElementById('featured-post');
  const postCount = document.getElementById('post-count');

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('cat');
    if (catParam) {
      activeFilter = catParam;
      filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === catParam);
        btn.setAttribute('aria-selected', btn.dataset.cat === catParam);
      });
    }
    try {
      const res = await fetch('blog-posts.json?v=' + Date.now());
      const data = await res.json();
      allPosts = data.posts.sort((a, b) => b.id - a.id);
      if (postCount) postCount.textContent = allPosts.length;
      renderFeatured(allPosts[0]);
      render();
    } catch (err) {
      console.warn('Failed to load blog-posts.json', err);
      if (grid) grid.innerHTML = '<div class="blog-loading"><p style="color:var(--text-muted)">Could not load posts. Please try again.</p></div>';
    }
  }

  function renderFeatured(post) {
    if (!featuredEl || !post) return;
    featuredEl.innerHTML = `
      <div class="blog-featured-img">
        <img src="${post.image}" alt="${post.imageAlt}" loading="lazy">
        <span class="blog-featured-badge"><i class="fas fa-bolt"></i> Latest</span>
      </div>
      <div class="blog-featured-body">
        <span class="blog-category-pill cat-${post.category}">
          <i class="fas ${CAT_ICONS[post.category] || 'fa-tag'}"></i> ${post.categoryLabel}
        </span>
        <h2>${post.title}</h2>
        <p>${post.excerpt}</p>
        <div class="blog-card-footer">
          <span class="blog-source-badge"><i class="fas fa-external-link-alt"></i> ${post.sourceLabel} &mdash; ${post.dateDisplay}</span>
          <a href="${post.source}" target="_blank" rel="noopener" class="blog-read-link">Read Article <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`;
  }

  function getFiltered() {
    let posts = allPosts;
    if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return posts;
  }

  function render() {
    if (!grid) return;
    const posts = getFiltered();
    if (resultsCount) resultsCount.textContent = posts.length === allPosts.length ? posts.length + ' posts' : posts.length + ' of ' + allPosts.length + ' posts';
    if (posts.length === 0) { grid.innerHTML = ''; if (noResults) noResults.style.display = 'block'; return; }
    if (noResults) noResults.style.display = 'none';
    grid.innerHTML = posts.map((post, i) => buildCard(post, i)).join('');
  }

  function buildCard(post, index) {
    const delay = Math.min(index * 60, 300);
    return `<article class="blog-card-item" style="animation-delay:${delay}ms">
      <div class="blog-card-img">
        <img src="${post.image}" alt="${post.imageAlt}" loading="lazy">
        <span class="blog-category-pill cat-${post.category}"><i class="fas ${CAT_ICONS[post.category] || 'fa-tag'}"></i> ${post.categoryLabel}</span>
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span><i class="fas fa-calendar-alt"></i>${post.dateDisplay}</span>
          <span><i class="fas fa-clock"></i>${post.readTime}</span>
        </div>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="blog-card-footer">
          <span class="blog-source-badge"><i class="fas fa-external-link-alt"></i> ${post.sourceLabel}</span>
          <a href="${post.source}" target="_blank" rel="noopener" class="blog-read-link">Read More <i class="fas fa-arrow-right"></i></a>
        </div>
      </div></article>`;
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.cat;
      filterBtns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
      render();
    });
  });

  if (searchInput) {
    let searchDebounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => { searchQuery = searchInput.value; render(); }, 200);
    });
  }

  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('click', e => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
        nav.classList.remove('open'); hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      }
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open'); hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      });
    });
  }

  init();
})();

/* ===================================================
   HOMEPAGE BLOG SECTION — Dynamic loader
   =================================================== */
(function () {
  const homeGrid = document.querySelector('#blog .blog-grid');
  if (!homeGrid) return;
  const CAT_ICONS = { phones: 'fa-mobile-alt', laptops: 'fa-laptop', cyber: 'fa-shield-alt', consoles: 'fa-gamepad', tips: 'fa-tools' };
  fetch('blog-posts.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
      const posts = data.posts.sort((a, b) => b.id - a.id).slice(0, 3);
      homeGrid.innerHTML = posts.map(post => `
        <article class="blog-card animate-on-scroll">
          <div class="blog-img">
            <img src="${post.image}" alt="${post.imageAlt}" loading="lazy">
            <span class="blog-category">${post.categoryLabel}</span>
          </div>
          <div class="blog-body">
            <div class="blog-meta">
              <span><i class="fas fa-calendar-alt"></i> ${post.dateDisplay}</span>
              <span><i class="fas fa-clock"></i> ${post.readTime}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt.slice(0, 130)}…</p>
            <a href="${post.source}" target="_blank" rel="noopener" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
          </div>
        </article>`).join('');
    })
    .catch(() => {});
})();
