// ============================================
//   F.AI.Z — Admin Panel Script
// ============================================

const STORAGE_KEY = 'faiz_products';
const PIN_KEY = 'faiz_admin_pin';
const SESSION_KEY = 'faiz_admin_session';
const DEFAULT_PIN = 'faiz2024';

// ---- STATE ----
let products = [];
let editingId = null;

// ============================================
//   AUTH
// ============================================

function getPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function adminLogin(pin) {
  if (pin === getPin()) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    return true;
  }
  return false;
}

function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-login').style.display = '';
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-input').focus();
}

function initAuth() {
  if (isLoggedIn()) {
    showAdmin();
  } else {
    document.getElementById('admin-login').style.display = '';
    document.getElementById('pin-input').focus();
  }

  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var pin = document.getElementById('pin-input').value;
    if (adminLogin(pin)) {
      showAdmin();
    } else {
      document.getElementById('login-error').style.display = '';
      document.getElementById('pin-input').value = '';
      document.getElementById('pin-input').focus();
    }
  });
}

function showAdmin() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-panel').style.display = '';
  loadProducts();
}


// ============================================
//   PIN CHANGE
// ============================================

function openPinModal() {
  document.getElementById('pin-modal-overlay').classList.add('open');
  document.getElementById('current-pin').value = '';
  document.getElementById('new-pin').value = '';
  document.getElementById('confirm-pin').value = '';
  document.getElementById('pin-error').style.display = 'none';
  document.getElementById('current-pin').focus();
}

function closePinModal() {
  document.getElementById('pin-modal-overlay').classList.remove('open');
}

function initPinChange() {
  document.getElementById('btn-change-pin').addEventListener('click', openPinModal);
  document.getElementById('pin-modal-close').addEventListener('click', closePinModal);

  document.getElementById('pin-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var current = document.getElementById('current-pin').value;
    var newPin = document.getElementById('new-pin').value;
    var confirm = document.getElementById('confirm-pin').value;
    var errEl = document.getElementById('pin-error');

    if (current !== getPin()) {
      errEl.textContent = 'Current PIN is incorrect.';
      errEl.style.display = '';
      return;
    }
    if (newPin.length < 4) {
      errEl.textContent = 'New PIN must be at least 4 characters.';
      errEl.style.display = '';
      return;
    }
    if (newPin !== confirm) {
      errEl.textContent = 'New PINs do not match.';
      errEl.style.display = '';
      return;
    }

    localStorage.setItem(PIN_KEY, newPin);
    closePinModal();
    showToast('PIN updated successfully', 'success');
  });
}


// ============================================
//   PRODUCTS — LOAD / SAVE
// ============================================

async function loadProducts() {
  var stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      products = JSON.parse(stored);
    } catch {
      products = [];
    }
  } else {
    // Load from products.json on first use
    try {
      var res = await fetch('products.json');
      products = await res.json();
      saveProducts();
    } catch {
      products = [];
    }
  }
  renderTable();
  updateStats();
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getNextId() {
  if (products.length === 0) return 1;
  return Math.max.apply(null, products.map(function(p) { return p.id; })) + 1;
}


// ============================================
//   RENDER TABLE
// ============================================

function renderTable() {
  var tbody = document.getElementById('products-tbody');
  var empty = document.getElementById('admin-empty');

  if (products.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = products.map(function(p) {
    var imgHtml = p.image
      ? '<img class="product-thumb" src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(p.name) + '">'
      : '<div class="product-thumb-placeholder"><i class="fas fa-image"></i></div>';

    return '<tr data-id="' + p.id + '">' +
      '<td class="col-img">' + imgHtml + '</td>' +
      '<td class="col-name"><div class="product-name-cell">' + escapeHtml(p.name) + '</div><div class="product-desc-cell">' + escapeHtml(p.description) + '</div></td>' +
      '<td class="col-cat">' + escapeHtml(p.category) + '</td>' +
      '<td class="col-price">&pound;' + Number(p.price).toFixed(2) + '</td>' +
      '<td class="col-badge"><span class="badge-cell">' + escapeHtml(p.badge) + '</span></td>' +
      '<td class="col-actions"><div class="actions-cell">' +
        '<button class="action-btn" title="Edit" onclick="editProduct(' + p.id + ')"><i class="fas fa-pen"></i></button>' +
        '<button class="action-btn delete" title="Delete" onclick="confirmDelete(' + p.id + ')"><i class="fas fa-trash-alt"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function updateStats() {
  document.getElementById('stat-total').textContent = products.length;
  document.getElementById('stat-phones').textContent = products.filter(function(p) { return p.category === 'phones'; }).length;
  document.getElementById('stat-tablets').textContent = products.filter(function(p) { return p.category === 'tablets'; }).length;
  document.getElementById('stat-covers').textContent = products.filter(function(p) { return p.category === 'covers'; }).length;
  document.getElementById('stat-accessories').textContent = products.filter(function(p) { return p.category === 'accessories'; }).length;
}


// ============================================
//   PRODUCT MODAL — ADD / EDIT
// ============================================

function openProductModal(product) {
  editingId = product ? product.id : null;

  document.getElementById('modal-title').innerHTML = product
    ? '<i class="fas fa-pen"></i> Edit Product'
    : '<i class="fas fa-plus-circle"></i> Add Product';

  document.getElementById('save-btn').innerHTML = product
    ? '<i class="fas fa-save"></i> Update Product'
    : '<i class="fas fa-save"></i> Save Product';

  document.getElementById('edit-id').value = product ? product.id : '';
  document.getElementById('prod-name').value = product ? product.name : '';
  document.getElementById('prod-category').value = product ? product.category : '';
  document.getElementById('prod-price').value = product ? product.price : '';
  document.getElementById('prod-badge').value = product ? product.badge : '';
  document.getElementById('prod-desc').value = product ? product.description : '';
  document.getElementById('prod-image-url').value = '';
  document.getElementById('prod-image-file').value = '';

  // Show image preview if editing
  if (product && product.image) {
    showImagePreview(product.image);
    // If it looks like a URL (not base64), put it in the URL field
    if (!product.image.startsWith('data:')) {
      document.getElementById('prod-image-url').value = product.image;
    }
  } else {
    hideImagePreview();
  }

  // Clear errors
  document.querySelectorAll('#product-form .error').forEach(function(el) {
    el.classList.remove('error');
  });

  document.getElementById('product-modal-overlay').classList.add('open');
  document.getElementById('prod-name').focus();
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
  editingId = null;
}

function editProduct(id) {
  var product = products.find(function(p) { return p.id === id; });
  if (product) openProductModal(product);
}


// ============================================
//   IMAGE HANDLING
// ============================================

var currentImageData = '';

function showImagePreview(src) {
  currentImageData = src;
  var preview = document.getElementById('image-preview');
  document.getElementById('preview-img').src = src;
  preview.style.display = '';
}

function hideImagePreview() {
  currentImageData = '';
  var preview = document.getElementById('image-preview');
  document.getElementById('preview-img').src = '';
  preview.style.display = 'none';
}

function initImageHandling() {
  // Tab switching
  document.querySelectorAll('.img-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.img-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('tab-url').style.display = tab.dataset.tab === 'url' ? '' : 'none';
      document.getElementById('tab-upload').style.display = tab.dataset.tab === 'upload' ? '' : 'none';
    });
  });

  // URL input — preview on blur
  document.getElementById('prod-image-url').addEventListener('change', function() {
    var url = this.value.trim();
    if (url) {
      showImagePreview(url);
    }
  });

  // File upload
  document.getElementById('prod-image-file').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    readImageFile(file);
  });

  // Drag and drop
  var dropZone = document.getElementById('file-drop-zone');
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      readImageFile(file);
    }
  });

  // Clear image
  document.getElementById('clear-image').addEventListener('click', function() {
    hideImagePreview();
    document.getElementById('prod-image-url').value = '';
    document.getElementById('prod-image-file').value = '';
  });
}

function readImageFile(file) {
  // Limit file size to 2MB
  if (file.size > 2 * 1024 * 1024) {
    showToast('Image must be under 2MB', 'error');
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    showImagePreview(e.target.result);
    document.getElementById('prod-image-url').value = '';
  };
  reader.readAsDataURL(file);
}


// ============================================
//   PRODUCT FORM SUBMIT
// ============================================

function initProductForm() {
  document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('prod-name').value.trim();
    var category = document.getElementById('prod-category').value;
    var price = document.getElementById('prod-price').value;
    var badge = document.getElementById('prod-badge').value;
    var desc = document.getElementById('prod-desc').value.trim();

    // Validate
    var valid = true;
    var fields = [
      { el: document.getElementById('prod-name'), ok: !!name },
      { el: document.getElementById('prod-category'), ok: !!category },
      { el: document.getElementById('prod-price'), ok: price !== '' && Number(price) >= 0 },
      { el: document.getElementById('prod-badge'), ok: !!badge },
      { el: document.getElementById('prod-desc'), ok: !!desc }
    ];

    fields.forEach(function(f) {
      f.el.classList.toggle('error', !f.ok);
      if (!f.ok) valid = false;
    });

    if (!valid) return;

    // Determine image
    var image = currentImageData || document.getElementById('prod-image-url').value.trim() || '';

    var productData = {
      name: name,
      category: category,
      price: parseFloat(price),
      badge: badge,
      description: desc,
      image: image
    };

    if (editingId !== null) {
      // Update existing
      var idx = products.findIndex(function(p) { return p.id === editingId; });
      if (idx !== -1) {
        productData.id = editingId;
        products[idx] = productData;
      }
      showToast('Product updated', 'success');
    } else {
      // Add new
      productData.id = getNextId();
      products.push(productData);
      showToast('Product added', 'success');
    }

    saveProducts();
    renderTable();
    updateStats();
    closeProductModal();
  });
}


// ============================================
//   DELETE
// ============================================

var pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  var product = products.find(function(p) { return p.id === id; });
  document.getElementById('confirm-message').textContent = 'Delete "' + (product ? product.name : 'this product') + '"? This cannot be undone.';
  document.getElementById('confirm-modal-overlay').classList.add('open');
}

function initConfirmModal() {
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-modal-close').addEventListener('click', closeConfirmModal);

  document.getElementById('confirm-ok').addEventListener('click', function() {
    if (pendingDeleteId !== null) {
      products = products.filter(function(p) { return p.id !== pendingDeleteId; });
      saveProducts();
      renderTable();
      updateStats();
      showToast('Product deleted', 'success');
      pendingDeleteId = null;
    }
    closeConfirmModal();
  });
}

function closeConfirmModal() {
  document.getElementById('confirm-modal-overlay').classList.remove('open');
  pendingDeleteId = null;
}


// ============================================
//   IMPORT / EXPORT
// ============================================

function initImportExport() {
  // Export
  document.getElementById('btn-export').addEventListener('click', function() {
    var dataStr = JSON.stringify(products, null, 2);
    var blob = new Blob([dataStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Products exported as products.json', 'success');
  });

  // Import trigger
  document.getElementById('btn-import').addEventListener('click', function() {
    document.getElementById('import-file').click();
  });

  // Import handler
  document.getElementById('import-file').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(evt) {
      try {
        var data = JSON.parse(evt.target.result);
        if (!Array.isArray(data)) throw new Error('Not an array');

        // Validate structure
        var valid = data.every(function(item) {
          return item.name && item.category && typeof item.price === 'number';
        });

        if (!valid) throw new Error('Invalid product data');

        // Assign IDs if missing
        var maxId = 0;
        data.forEach(function(item) {
          if (item.id && item.id > maxId) maxId = item.id;
        });
        data.forEach(function(item) {
          if (!item.id) {
            maxId++;
            item.id = maxId;
          }
        });

        products = data;
        saveProducts();
        renderTable();
        updateStats();
        showToast('Imported ' + data.length + ' products', 'success');
      } catch (err) {
        showToast('Invalid JSON file. Check the format.', 'error');
      }
    };
    reader.readAsText(file);

    // Reset so same file can be re-selected
    this.value = '';
  });

  // Reset to default
  document.getElementById('btn-reset').addEventListener('click', function() {
    pendingDeleteId = null;
    document.getElementById('confirm-message').textContent = 'Reset all products to the original defaults? This will overwrite your changes.';
    document.getElementById('confirm-modal-overlay').classList.add('open');

    // Override confirm OK for this action
    var okBtn = document.getElementById('confirm-ok');
    var handler = function() {
      localStorage.removeItem(STORAGE_KEY);
      loadProducts();
      showToast('Products reset to defaults', 'success');
      closeConfirmModal();
      okBtn.removeEventListener('click', handler);
    };
    okBtn.addEventListener('click', handler);
  });
}


// ============================================
//   TOAST
// ============================================

function showToast(message, type) {
  var existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'admin-toast ' + (type || 'success');
  toast.innerHTML = '<i class="fas ' + (type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle') + '"></i> ' + escapeHtml(message);
  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}


// ============================================
//   UTILITIES
// ============================================

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// ============================================
//   INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  initAuth();
  initPinChange();
  initProductForm();
  initImageHandling();
  initConfirmModal();
  initImportExport();

  // Add product button
  document.getElementById('btn-add-product').addEventListener('click', function() {
    openProductModal(null);
  });

  // Modal close buttons
  document.getElementById('modal-close').addEventListener('click', closeProductModal);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
});
