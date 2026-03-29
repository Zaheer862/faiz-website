// ============================================
//   F.AI.Z — Shop Script
// ============================================

const DELIVERY_COST = 4.99;
const FREE_DELIVERY_THRESHOLD = 100;
const WHATSAPP_NUMBER = '4407440423053';

const categoryIcons = {
  phones: 'fa-mobile-alt',
  tablets: 'fa-tablet-alt',
  covers: 'fa-shield-alt',
  accessories: 'fa-headphones-alt'
};

// ---- STATE ----
let allProducts = [];
let cart = loadCart();
let currentFilter = 'all';
let currentBrand = 'all';
let currentSeries = 'all';
let searchTerm = '';
// Track selected color/storage per product: { [id]: {colorIdx, storageIdx} }
const variantSel = {};


// ============================================
//   CART PERSISTENCE
// ============================================

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('faiz_cart')) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('faiz_cart', JSON.stringify(cart));
}


// ============================================
//   PRODUCTS
// ============================================

async function loadShopProducts() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  try {
    // Use admin-managed products from localStorage if available, otherwise fetch defaults
    const stored = localStorage.getItem('faiz_products');
    if (stored) {
      allProducts = JSON.parse(stored);
    } else {
      const res = await fetch('products.json');
      allProducts = await res.json();
    }
    renderProducts();
  } catch {
    grid.innerHTML = `
      <div class="products-loading">
        <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
        <span>Could not load products. Please try again later.</span>
      </div>`;
  }
}

function renderProducts() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  let filtered = currentFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === currentFilter);

  if (currentBrand !== 'all') {
    filtered = filtered.filter(p => p.brand === currentBrand);
  }

  if (currentSeries !== 'all') {
    filtered = filtered.filter(p => p.series === currentSeries);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="products-loading">
        <i class="fas fa-search" style="opacity:0.4"></i>
        <span>No products found. Try a different search or category.</span>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    const v = p.variants || {};
    const colors = v.colors || [];
    const storage = v.storage || [];
    if (!variantSel[p.id]) variantSel[p.id] = { colorIdx: 0, storageIdx: 0 };
    const sel = variantSel[p.id];
    const curStorage = storage[sel.storageIdx];
    const displayPrice = curStorage ? p.price + curStorage.priceAdder : p.price;

    // Color swatches (max 5 shown)
    const swatchHtml = colors.length > 1 ? `
      <div class="card-swatches">
        ${colors.slice(0,5).map((col, i) => `
          <span class="card-color-dot${i === sel.colorIdx ? ' active' : ''}"
                style="background:${escapeAttr(col.hex)}"
                title="${escapeAttr(col.name)}"
                data-hex="${escapeAttr(col.hex)}"
                data-image="${escapeAttr(col.image||'')}"
                onclick="event.stopPropagation();cardSelectColor(${p.id},${i},this)"></span>
        `).join('')}
        ${colors.length > 5 ? `<span class="card-more-colors">+${colors.length-5}</span>` : ''}
      </div>` : '';

    // Storage pills
    const storageHtml = storage.length > 1 ? `
      <div class="card-storage-pills">
        ${storage.map((s, i) => `
          <button class="card-storage-pill${i === sel.storageIdx ? ' active' : ''}"
                  onclick="event.stopPropagation();cardSelectStorage(${p.id},${i},this)">
            ${escapeHtml(s.capacity)}
          </button>
        `).join('')}
      </div>` : '';

    return `
    <div class="shop-product-card" onclick="window.location='product.html?id=${p.id}'" style="cursor:pointer">
      <div class="shop-product-img">
        ${p.image
          ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy" data-local="${escapeAttr(p.localImage||'')}" onerror="this.onerror=null;this.src='images/brand-placeholder/${(p.brand||'phone').toLowerCase()}.svg'">`
          : `<div class="img-placeholder"><i class="fas ${categoryIcons[p.category] || 'fa-box'}"></i></div>`
        }
        <span class="shop-product-badge">${escapeHtml(p.badge)}</span>
      </div>
      <div class="shop-product-body">
        <div class="shop-product-category">${p.brand ? escapeHtml(p.brand) + ' &middot; ' : ''}${escapeHtml(p.category)}</div>
        <div class="shop-product-name">${escapeHtml(p.name)}</div>
        ${swatchHtml}
        ${storageHtml}
        <div class="shop-product-footer">
          <span class="shop-product-price" id="card-price-${p.id}">&pound;${displayPrice.toFixed(2)}</span>
          <button class="add-to-cart-btn${inCart ? ' added' : ''}"
                  data-id="${p.id}"
                  onclick="event.stopPropagation();addToCart(${p.id})">
            <i class="fas ${inCart ? 'fa-check' : 'fa-cart-plus'}"></i>
            ${inCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}


// ============================================
//   VARIANT SELECTION (card)
// ============================================

function cardSelectColor(productId, colorIdx, el) {
  if (!variantSel[productId]) variantSel[productId] = { colorIdx: 0, storageIdx: 0 };
  variantSel[productId].colorIdx = colorIdx;
  const card = el.closest('.shop-product-card');
  // Update active dot
  card.querySelectorAll('.card-color-dot').forEach((d, i) => d.classList.toggle('active', i === colorIdx));

  const hex = el.dataset.hex || '#1e2a3a';

  // Swap card image if this colour has its own image URL
  const colorImg = el.dataset.image;
  const imgEl = card.querySelector('.shop-product-img img');
  if (colorImg && imgEl) {
    imgEl.style.opacity = '0';
    imgEl.src = colorImg;
    imgEl.onload = () => { imgEl.style.opacity = '1'; };
    imgEl.onerror = () => { imgEl.style.opacity = '1'; };
  }

  // Update card image background glow to match selected colour
  const imgWrap = card.querySelector('.shop-product-img');
  if (imgWrap) {
    imgWrap.style.background = `radial-gradient(ellipse 90% 80% at 50% 50%, ${hex}88 0%, ${hex}22 60%, #111827 100%)`;
    imgWrap.style.transition = 'background 0.35s ease';
  }
}

function cardSelectStorage(productId, storageIdx, el) {
  if (!variantSel[productId]) variantSel[productId] = { colorIdx: 0, storageIdx: 0 };
  variantSel[productId].storageIdx = storageIdx;
  // Update active pill within this card
  const card = el.closest('.shop-product-card');
  card.querySelectorAll('.card-storage-pill').forEach((p, i) => p.classList.toggle('active', i === storageIdx));
  // Update price display
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const storage = product.variants?.storage || [];
  const adder = storage[storageIdx]?.priceAdder || 0;
  const priceEl = card.querySelector(`#card-price-${productId}`);
  if (priceEl) priceEl.textContent = `\u00A3${(product.price + adder).toFixed(2)}`;
}


// ============================================
//   CART LOGIC
// ============================================

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const sel = variantSel[productId] || { colorIdx: 0, storageIdx: 0 };
  const colors  = product.variants?.colors  || [];
  const storage = product.variants?.storage || [];
  const selColor   = colors[sel.colorIdx];
  const selStorage = storage[sel.storageIdx];
  const finalPrice = product.price + (selStorage?.priceAdder || 0);

  // Build a variant-aware key so same product with different variants = different cart entries
  const variantKey = `${productId}-${sel.colorIdx}-${sel.storageIdx}`;
  const existing = cart.find(c => c.variantKey === variantKey);
  const variantLabel = [selColor?.name, selStorage?.capacity].filter(Boolean).join(' / ');
  const displayName = variantLabel ? `${product.name} (${variantLabel})` : product.name;

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      variantKey,
      name: displayName,
      price: finalPrice,
      image: product.image || '',
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  renderProducts();
  showToast(`${product.name} added to cart`);

  // Bump animation on cart badge
  document.querySelectorAll('.cart-count').forEach(el => {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  });
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  saveCart();
  updateCartUI();
  renderProducts();
}

function updateQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  updateCartUI();
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getDeliveryCost() {
  if (cart.length === 0) return 0;
  return getCartSubtotal() >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
}

function getCartTotal() {
  return getCartSubtotal() + getDeliveryCost();
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}


// ============================================
//   CART UI
// ============================================

function updateCartUI() {
  const count = getCartItemCount();

  // Update badge counts
  document.querySelectorAll('#nav-cart-count, #mobile-cart-count').forEach(el => {
    el.textContent = count;
  });

  // Cart items — only present on shop.html, not homepage
  const itemsContainer = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-drawer-footer');
  if (!emptyEl || !itemsContainer || !footerEl) return;

  if (cart.length === 0) {
    emptyEl.style.display = '';
    itemsContainer.innerHTML = '';
    footerEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = '';

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image
          ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}">`
          : ''
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">&pound;${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)" aria-label="Decrease quantity">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)" aria-label="Increase quantity">+</button>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Totals
  const subtotal = getCartSubtotal();
  const delivery = getDeliveryCost();
  const total = subtotal + delivery;

  const deliveryText = delivery === 0
    ? 'FREE'
    : `\u00A3${delivery.toFixed(2)}`;

  document.getElementById('cart-subtotal').innerHTML = `&pound;${subtotal.toFixed(2)}`;
  document.getElementById('cart-delivery').textContent = deliveryText;
  document.getElementById('cart-total').innerHTML = `&pound;${total.toFixed(2)}`;
}


// ============================================
//   CART DRAWER OPEN/CLOSE
// ============================================

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}


// ============================================
//   CHECKOUT
// ============================================

function openCheckout() {
  closeCart();
  document.getElementById('checkout-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  showStep('step-shipping');
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function showStep(stepId) {
  document.querySelectorAll('.checkout-step').forEach(el => {
    el.style.display = 'none';
  });
  document.getElementById(stepId).style.display = '';
}

function handleShippingSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // Clear previous errors
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  const fields = {
    fname: form.querySelector('#ship-fname'),
    lname: form.querySelector('#ship-lname'),
    email: form.querySelector('#ship-email'),
    phone: form.querySelector('#ship-phone'),
    address: form.querySelector('#ship-address'),
    city: form.querySelector('#ship-city'),
    postcode: form.querySelector('#ship-postcode')
  };

  let valid = true;
  Object.values(fields).forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      valid = false;
    }
  });

  // Basic email check
  if (fields.email.value && !fields.email.value.includes('@')) {
    fields.email.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  // Build review
  const address2 = document.getElementById('ship-address2').value.trim();
  const addressHtml = `
    <strong>${escapeHtml(fields.fname.value)} ${escapeHtml(fields.lname.value)}</strong><br>
    ${escapeHtml(fields.address.value)}<br>
    ${address2 ? escapeHtml(address2) + '<br>' : ''}
    ${escapeHtml(fields.city.value)}, ${escapeHtml(fields.postcode.value)}<br>
    ${escapeHtml(fields.phone.value)}<br>
    ${escapeHtml(fields.email.value)}
  `;
  document.getElementById('review-address').innerHTML = addressHtml;

  // Review items
  document.getElementById('review-items').innerHTML = cart.map(item => `
    <div class="review-item">
      <div class="review-item-img">
        ${item.image ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}">` : ''}
      </div>
      <div class="review-item-info">
        <div class="review-item-name">${escapeHtml(item.name)}</div>
        <div class="review-item-qty">Qty: ${item.qty}</div>
      </div>
      <div class="review-item-price">&pound;${(item.price * item.qty).toFixed(2)}</div>
    </div>
  `).join('');

  // Review totals
  const subtotal = getCartSubtotal();
  const delivery = getDeliveryCost();
  const total = subtotal + delivery;
  const deliveryText = delivery === 0 ? 'FREE' : `\u00A3${delivery.toFixed(2)}`;

  document.getElementById('review-subtotal').innerHTML = `&pound;${subtotal.toFixed(2)}`;
  document.getElementById('review-delivery').textContent = deliveryText;
  document.getElementById('review-total').innerHTML = `&pound;${total.toFixed(2)}`;

  showStep('step-review');
}

function placeOrder() {
  const fname = document.getElementById('ship-fname').value.trim();
  const lname = document.getElementById('ship-lname').value.trim();
  const email = document.getElementById('ship-email').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const address2 = document.getElementById('ship-address2').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const postcode = document.getElementById('ship-postcode').value.trim();
  const notes = document.getElementById('ship-notes').value.trim();

  const subtotal = getCartSubtotal();
  const delivery = getDeliveryCost();
  const total = subtotal + delivery;

  // Build WhatsApp message
  let msg = `*NEW ONLINE ORDER -- F.AI.Z*\n\n`;
  msg += `*Customer:* ${fname} ${lname}\n`;
  msg += `*Phone:* ${phone}\n`;
  msg += `*Email:* ${email}\n\n`;
  msg += `*Deliver To:*\n${address}\n`;
  if (address2) msg += `${address2}\n`;
  msg += `${city}, ${postcode}\n\n`;
  msg += `*Items:*\n`;

  cart.forEach(item => {
    msg += `- ${item.name} x ${item.qty} -- £${(item.price * item.qty).toFixed(2)}\n`;
  });

  msg += `\n*Subtotal:* £${subtotal.toFixed(2)}\n`;
  msg += `*Delivery:* ${delivery === 0 ? 'FREE' : '£' + delivery.toFixed(2)}\n`;
  msg += `*Total:* £${total.toFixed(2)}\n`;

  if (notes) {
    msg += `\n*Notes:* ${notes}\n`;
  }

  msg += `\nPlease confirm my order and payment details. Thank you!`;

  // Show confirmation
  document.getElementById('confirmation-details').innerHTML = `
    <strong>Order Summary:</strong><br>
    ${cart.map(item => `${escapeHtml(item.name)} × ${item.qty} — £${(item.price * item.qty).toFixed(2)}`).join('<br>')}<br><br>
    <strong>Total:</strong> £${total.toFixed(2)}<br>
    <strong>Delivering to:</strong> ${escapeHtml(address)}, ${escapeHtml(city)} ${escapeHtml(postcode)}
  `;

  showStep('step-confirmation');

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  renderProducts();

  // Open WhatsApp with order
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}


// ============================================
//   FILTERS & SEARCH
// ============================================

function initShopFilters() {
  document.querySelectorAll('#shop-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#shop-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProducts();
    });
  });
}

const BRAND_SERIES = {
  Samsung: [
    { value: 'S Series', label: 'S Series' },
    { value: 'Note Series', label: 'Note' },
    { value: 'Z Series', label: 'Z Fold & Flip' },
    { value: 'A Series', label: 'A Series' },
    { value: 'Tab S Series', label: 'Tab S' },
    { value: 'Tab A Series', label: 'Tab A' },
    { value: 'Galaxy Buds', label: 'Buds' },
    { value: 'Galaxy Watch', label: 'Watch' },
    { value: 'Accessories', label: 'Accessories' },
  ],
  Apple: [
    { value: 'iPhone 16 Series', label: 'iPhone 16' },
    { value: 'iPhone 15 Series', label: 'iPhone 15' },
    { value: 'iPhone 14 Series', label: 'iPhone 14' },
    { value: 'iPhone 13 Series', label: 'iPhone 13' },
    { value: 'iPhone 12 Series', label: 'iPhone 12' },
    { value: 'iPhone SE', label: 'SE' },
    { value: 'iPad Pro', label: 'iPad Pro' },
    { value: 'iPad Air', label: 'iPad Air' },
    { value: 'iPad', label: 'iPad' },
    { value: 'iPad mini', label: 'iPad mini' },
    { value: 'Apple Watch', label: 'Watch' },
    { value: 'AirPods', label: 'AirPods' },
    { value: 'Accessories', label: 'Accessories' },
  ],
};

function updateSeriesRow(brand) {
  const seriesRow = document.getElementById('series-filters');
  if (!seriesRow) return;
  const series = BRAND_SERIES[brand];
  if (!series) { seriesRow.style.display = 'none'; return; }

  seriesRow.innerHTML = `<span class="brand-filter-label">Series:</span>
    <button class="series-btn active" data-series="all">All</button>
    ${series.map(s => `<button class="series-btn" data-series="${s.value}">${s.label}</button>`).join('')}`;
  seriesRow.style.display = 'flex';
  initSeriesFilters();
}

function initBrandFilters() {
  document.querySelectorAll('#brand-filters .brand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#brand-filters .brand-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBrand = btn.dataset.brand;
      currentSeries = 'all';
      updateSeriesRow(currentBrand);
      renderProducts();
    });
  });
}

function initSeriesFilters() {
  document.querySelectorAll('#series-filters .series-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#series-filters .series-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSeries = btn.dataset.series;
      renderProducts();
    });
  });
}

function initShopSearch() {
  const input = document.getElementById('shop-search');
  if (!input) return;

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchTerm = input.value.trim();
      renderProducts();
    }, 250);
  });
}


// ============================================
//   TOAST
// ============================================

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${escapeHtml(message)}`;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 2500);
}


// ============================================
//   HAMBURGER MENU
// ============================================

function initMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}


// ============================================
//   HEADER SCROLL
// ============================================

function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const update = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}


// ============================================
//   UTILITIES
// ============================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// ============================================
//   INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadShopProducts();
  initShopFilters();
  initBrandFilters();
  initSeriesFilters();
  initShopSearch();
  initMenu();
  initHeaderScroll();
  updateCartUI();

  // Cart open/close
  document.getElementById('nav-cart-btn').addEventListener('click', e => {
    e.preventDefault();
    openCart();
  });
  document.getElementById('mobile-cart-btn').addEventListener('click', e => {
    e.preventDefault();
    openCart();
  });
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Checkout
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('checkout-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCheckout();
  });

  // Shipping form
  document.getElementById('shipping-form').addEventListener('submit', handleShippingSubmit);

  // Edit shipping from review
  document.getElementById('edit-shipping-btn').addEventListener('click', () => {
    showStep('step-shipping');
  });

  // Place order
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
});
