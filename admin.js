/* REP•TARO — Admin Panel JavaScript */

/* ── Password Hashing (SHA-256 via Web Crypto API) ── */
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password + 'rt_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Default staff bootstrapped with hashed passwords
// Plain text defaults: owner=owner123, admin=admin123
// These are ONLY used on first run then hashed+stored
const DEFAULT_STAFF_PLAIN = [
  { username: 'owner', password: 'owner123', role: 'owner', id: 'staff_1' },
  { username: 'admin', password: 'admin123', role: 'admin', id: 'staff_2' }
];

let adminState = {
  loggedIn: false,
  user: null,
  staff: [],
  products: [],
  sellers: [],
  coupons: []
};

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', async () => {
  await initAdmin();
});

async function initAdmin() {
  await loadOrBootstrapStaff();
  await loadAdminData();
  loadCoupons();

  const session = localStorage.getItem('rt_admin_session');
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      const staff = adminState.staff.find(s => s.username === sessionData.username);
      if (staff) {
        adminState.user = staff;
        adminState.loggedIn = true;
        showDashboard();
      }
    } catch(e) {}
  }
  updateKPIs();
}

async function loadOrBootstrapStaff() {
  const savedStaff = localStorage.getItem('rt_staff');
  if (savedStaff) {
    try {
      adminState.staff = JSON.parse(savedStaff);
      // Migrate any plain-text passwords (no 'hashed' flag) to hashed
      let needsSave = false;
      for (const s of adminState.staff) {
        if (!s.hashed) {
          s.password = await hashPassword(s.password);
          s.hashed = true;
          needsSave = true;
        }
      }
      if (needsSave) saveStaff();
    } catch(e) {
      adminState.staff = [];
    }
  } else {
    // Bootstrap default staff with hashed passwords
    adminState.staff = [];
    for (const s of DEFAULT_STAFF_PLAIN) {
      adminState.staff.push({
        ...s,
        password: await hashPassword(s.password),
        hashed: true
      });
    }
    saveStaff();
  }
}

async function loadAdminData() {
  // Try window globals first (set by app.js after fetch)
  if (window.PRODUCTS && window.PRODUCTS.length > 0) {
    adminState.products = window.PRODUCTS;
  } else {
    // Fetch directly
    const savedProducts = localStorage.getItem('rt_products_override');
    if (savedProducts) {
      try { adminState.products = JSON.parse(savedProducts); } catch(e) {}
    } else {
      try {
        const r = await fetch('products.json');
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) adminState.products = data;
        }
      } catch(e) {}
    }
  }

  if (window.SELLERS && window.SELLERS.length > 0) {
    adminState.sellers = window.SELLERS;
  } else {
    const savedSellers = localStorage.getItem('rt_sellers_override');
    if (savedSellers) {
      try { adminState.sellers = JSON.parse(savedSellers); } catch(e) {}
    } else {
      try {
        const r = await fetch('sellers.json');
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) adminState.sellers = data;
        }
      } catch(e) {}
    }
  }
}

function loadCoupons() {
  const stored = localStorage.getItem('rt_coupons');
  if (stored) {
    try { adminState.coupons = JSON.parse(stored); return; } catch(e) {}
  }
  // Default coupon
  adminState.coupons = [{
    id: 'c_default',
    enabled: true,
    title: 'Welcome to REP•TARO!',
    message: 'Use the invite code below to register and start ordering with our trusted sellers.',
    code: 'REPTARO',
    url: 'https://m.litbuy.com/pages/register/index?inviteCode=REPTARO',
    button: 'Register Now',
  }];
  saveCoupons();
}

function saveCoupons() {
  localStorage.setItem('rt_coupons', JSON.stringify(adminState.coupons));
}

function saveStaff() {
  localStorage.setItem('rt_staff', JSON.stringify(adminState.staff));
}

function saveProducts() {
  localStorage.setItem('rt_products_override', JSON.stringify(adminState.products));
}

function saveSellers() {
  localStorage.setItem('rt_sellers_override', JSON.stringify(adminState.sellers));
}

/* ── Login ── */
async function adminLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.querySelector('#adminLogin .btn-primary');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    errorEl.style.display = 'block';
    return;
  }

  if (btn) { btn.textContent = 'Logging in…'; btn.disabled = true; }

  const hashed = await hashPassword(password);
  const staff = adminState.staff.find(s => s.username === username && s.password === hashed);

  if (btn) { btn.textContent = 'Login'; btn.disabled = false; }

  if (staff) {
    adminState.user = staff;
    adminState.loggedIn = true;
    localStorage.setItem('rt_admin_session', JSON.stringify({ username: staff.username, role: staff.role }));
    errorEl.style.display = 'none';
    showDashboard();
    toast(`Welcome back, ${staff.username}! 👋`);
  } else {
    errorEl.textContent = 'Invalid username or password';
    errorEl.style.display = 'block';
  }
}

// Allow pressing Enter in password field
document.addEventListener('DOMContentLoaded', () => {
  const pwField = document.getElementById('loginPassword');
  if (pwField) pwField.addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
  const userField = document.getElementById('loginUsername');
  if (userField) userField.addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
});

function adminLogout() {
  adminState.loggedIn = false;
  adminState.user = null;
  localStorage.removeItem('rt_admin_session');
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  toast('Logged out successfully');
}

function showDashboard() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';

  const roleBadge = document.getElementById('adminRoleBadge');
  if (roleBadge) {
    roleBadge.className = `role-badge role-${adminState.user.role}`;
    roleBadge.textContent = adminState.user.role.charAt(0).toUpperCase() + adminState.user.role.slice(1);
  }

  // Update top-right user info
  const navUserName = document.getElementById('navUserName');
  if (navUserName) navUserName.textContent = adminState.user.username;
  const navUserRole = document.getElementById('navUserRole');
  if (navUserRole) navUserRole.textContent = adminState.user.role;

  const staffSection = document.getElementById('staffSection');
  if (staffSection && adminState.user.role !== 'owner') {
    staffSection.style.display = 'none';
  }

  updateProductList();
  updateSellerList();
  updateStaffList();
  updateCouponList();
  updateKPIs();
}

function updateKPIs() {
  const el = id => document.getElementById(id);
  if (el('adminProducts')) el('adminProducts').textContent = adminState.products.length.toLocaleString();
  if (el('adminSellers')) el('adminSellers').textContent = adminState.sellers.length.toLocaleString();
  if (el('adminStaff')) el('adminStaff').textContent = adminState.staff.length.toLocaleString();
  if (el('adminUsers')) el('adminUsers').textContent = '0';
}

/* ── Add Product ── */
function addProduct() {
  const name = document.getElementById('addProdName').value.trim();
  const category = document.getElementById('addProdCategory').value;
  const price = parseFloat(document.getElementById('addProdPrice').value);
  const seller = document.getElementById('addProdSeller').value.trim();
  const link = document.getElementById('addProdLink').value.trim();
  const image = document.getElementById('addProdImage').value.trim();
  const qcInput = document.getElementById('addProdQC').value.trim();

  if (!name || !price) { toast('Please fill in required fields (Name and Price)'); return; }

  const qcImages = qcInput ? qcInput.split(',').map(u => u.trim()).filter(u => u) : [];
  const newProduct = {
    id: 'p' + Date.now(), name, category, price, seller: seller || 'Unknown',
    link: link || '#', image: image || '', featured: false,
    qc: qcImages.length > 0, qcImages,
    dateAdded: new Date().toISOString().split('T')[0]
  };

  adminState.products.unshift(newProduct);
  saveProducts();
  updateProductList();
  updateKPIs();
  clearProductForm();
  toast('Product added successfully! ✓');
  if (window.PRODUCTS) window.PRODUCTS = [...adminState.products];
}

function clearProductForm() {
  ['addProdName','addProdPrice','addProdSeller','addProdLink','addProdImage','addProdQC']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ── Add Seller ── */
function addSeller() {
  const name = document.getElementById('addSellerName').value.trim();
  const link = document.getElementById('addSellerLink').value.trim();
  const logo = document.getElementById('addSellerLogo').value.trim();
  const description = document.getElementById('addSellerDesc').value.trim();
  const verified = document.getElementById('addSellerVerified').checked;

  if (!name || !link) { toast('Please fill in required fields (Name and Link)'); return; }

  const newSeller = {
    id: 's' + Date.now(), name, link, logo: logo || '',
    description: description || '', verified,
    dateAdded: new Date().toISOString().split('T')[0]
  };

  adminState.sellers.unshift(newSeller);
  saveSellers();
  updateSellerList();
  updateKPIs();
  clearSellerForm();
  toast('Seller added successfully! ✓');
  if (window.SELLERS) window.SELLERS = [...adminState.sellers];
}

function clearSellerForm() {
  ['addSellerName','addSellerLink','addSellerLogo','addSellerDesc']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const v = document.getElementById('addSellerVerified');
  if (v) v.checked = true;
}

/* ── Add Staff ── */
async function addStaff() {
  if (adminState.user.role !== 'owner') { toast('Only owner can add staff'); return; }

  const username = document.getElementById('newStaffUser').value.trim();
  const password = document.getElementById('newStaffPass').value;
  const role = document.getElementById('newStaffRole').value;

  if (!username || !password) { toast('Please enter username and password'); return; }
  if (adminState.staff.find(s => s.username === username)) { toast('Username already exists'); return; }

  const newStaff = {
    id: 'staff_' + Date.now(), username,
    password: await hashPassword(password),
    hashed: true, role
  };

  adminState.staff.push(newStaff);
  saveStaff();
  updateStaffList();
  updateKPIs();

  document.getElementById('newStaffUser').value = '';
  document.getElementById('newStaffPass').value = '';
  document.getElementById('newStaffRole').value = 'staff';
  toast(`Staff member ${username} added as ${role}`);
}

function removeStaff(staffId) {
  if (adminState.user.role !== 'owner') { toast('Only owner can remove staff'); return; }
  const staff = adminState.staff.find(s => s.id === staffId);
  if (staff && staff.role === 'owner') { toast('Cannot remove owner'); return; }
  adminState.staff = adminState.staff.filter(s => s.id !== staffId);
  saveStaff();
  updateStaffList();
  updateKPIs();
  toast('Staff member removed');
}

/* ── Coupon Management ── */
function updateCouponList() {
  const list = document.getElementById('couponList');
  if (!list) return;
  if (!adminState.coupons.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">No coupons yet. Add one above.</div>';
    return;
  }
  list.innerHTML = adminState.coupons.map(c => `
    <div class="staff-item" style="flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px;">
        <div class="s-toggle ${c.enabled ? 'on' : ''}" onclick="toggleCoupon('${c.id}')" style="flex-shrink:0;"></div>
        <div>
          <div style="font-weight:700;font-size:14px;">${c.title || 'Untitled'}</div>
          <div style="font-size:12px;color:var(--muted);">Code: <code style="background:var(--surface2);padding:2px 6px;border-radius:4px;">${c.code || '—'}</code> · <a href="${c.url}" target="_blank" style="color:var(--blue);">link ↗</a></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" onclick="editCouponForm('${c.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${c.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function addCoupon() {
  const title = document.getElementById('newCouponTitle').value.trim();
  const message = document.getElementById('newCouponMessage').value.trim();
  const code = document.getElementById('newCouponCode').value.trim();
  const url = document.getElementById('newCouponUrl').value.trim();
  const button = document.getElementById('newCouponButton').value.trim();

  if (!title || !code) { toast('Title and Code are required'); return; }

  const newCoupon = {
    id: 'c_' + Date.now(), enabled: true,
    title, message: message || '', code, url: url || '#', button: button || 'Register Now'
  };

  adminState.coupons.push(newCoupon);
  saveCoupons();
  updateCouponList();
  clearCouponForm();
  toast('Coupon added! ✓');
}

function editCouponForm(couponId) {
  const c = adminState.coupons.find(x => x.id === couponId);
  if (!c) return;
  document.getElementById('newCouponTitle').value = c.title || '';
  document.getElementById('newCouponMessage').value = c.message || '';
  document.getElementById('newCouponCode').value = c.code || '';
  document.getElementById('newCouponUrl').value = c.url || '';
  document.getElementById('newCouponButton').value = c.button || '';
  // Remove old and re-add on save
  adminState.coupons = adminState.coupons.filter(x => x.id !== couponId);
  saveCoupons();
  updateCouponList();
  document.getElementById('newCouponTitle').focus();
  toast('Editing coupon — update fields and click Add Coupon');
}

function toggleCoupon(couponId) {
  const c = adminState.coupons.find(x => x.id === couponId);
  if (!c) return;
  c.enabled = !c.enabled;
  saveCoupons();
  updateCouponList();
  toast(`Coupon ${c.enabled ? 'enabled' : 'disabled'}`);
}

function deleteCoupon(couponId) {
  if (!confirm('Delete this coupon?')) return;
  adminState.coupons = adminState.coupons.filter(c => c.id !== couponId);
  saveCoupons();
  updateCouponList();
  toast('Coupon deleted');
}

function clearCouponForm() {
  ['newCouponTitle','newCouponMessage','newCouponCode','newCouponUrl','newCouponButton']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ── Update Lists ── */
function updateProductList() {
  const list = document.getElementById('adminProductList');
  if (!list) return;
  const searchTerm = document.getElementById('prodSearch')?.value.toLowerCase() || '';
  const filtered = adminState.products.filter(p =>
    (p.name||'').toLowerCase().includes(searchTerm) ||
    (p.seller||'').toLowerCase().includes(searchTerm) ||
    (p.category||'').toLowerCase().includes(searchTerm)
  );
  list.innerHTML = filtered.slice(0, 50).map(p => `
    <div class="admin-product-item" onclick="editProduct('${p.id}')">
      <img src="${p.image || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%23e2e8f0%22 width=%2250%22 height=%2250%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%2294a3b8%22 font-size=%2210%22>📦</text></svg>'}" alt="${p.name}">
      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.category} · ${p.seller} · ¥${p.price}</div>
      </div>
      <div style="display:flex;gap:4px;">
        ${p.qc ? '<span class="badge badge-green">QC</span>' : ''}
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('') || '<div style="padding:40px;text-align:center;color:var(--muted);">No products found</div>';
}

function updateSellerList() {
  const list = document.getElementById('adminSellerList');
  if (!list) return;
  if (!adminState.sellers.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">No sellers yet.</div>';
    return;
  }
  list.innerHTML = adminState.sellers.map(s => {
    const hasLogo = s.logo && s.logo.trim() && !s.logo.startsWith('data:');
    const avatar = hasLogo
      ? `<img src="${s.logo}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-weight:700;">${s.name.substring(0,2).toUpperCase()}</span>`
      : `<span style="font-weight:700;">${s.name.substring(0,2).toUpperCase()}</span>`;
    return `
      <div class="staff-item">
        <div class="staff-avatar">${avatar}</div>
        <div class="staff-info">
          <div class="staff-name">${s.name} ${s.verified ? '✓' : ''}</div>
          <div class="staff-role">${s.description || 'No description'}</div>
        </div>
        <div class="staff-actions">
          <a href="${s.link}" target="_blank" class="btn btn-ghost btn-sm">View</a>
          <button class="btn btn-danger btn-sm" onclick="deleteSeller('${s.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function updateStaffList() {
  const list = document.getElementById('staffList');
  if (!list) return;
  list.innerHTML = adminState.staff.map(s => `
    <div class="staff-item">
      <div class="staff-avatar">${s.username.substring(0, 2).toUpperCase()}</div>
      <div class="staff-info">
        <div class="staff-name">${s.username}</div>
        <div class="staff-role"><span class="role-badge role-${s.role}">${s.role}</span></div>
      </div>
      ${s.role !== 'owner' ? `
        <div class="staff-actions">
          <button class="btn btn-danger btn-sm" onclick="removeStaff('${s.id}')">Remove</button>
        </div>
      ` : '<span style="font-size:12px;color:var(--muted);">Owner</span>'}
    </div>
  `).join('');
}

/* ── Edit Product ── */
function editProduct(productId) {
  const p = adminState.products.find(x => x.id === productId);
  if (!p) return;
  document.getElementById('addProdName').value = p.name || '';
  document.getElementById('addProdCategory').value = p.category || 'shoes';
  document.getElementById('addProdPrice').value = p.price || '';
  document.getElementById('addProdSeller').value = p.seller || '';
  document.getElementById('addProdLink').value = p.link || '';
  document.getElementById('addProdImage').value = p.image || '';
  document.getElementById('addProdQC').value = (p.qcImages || []).join(', ');
  adminState.products = adminState.products.filter(x => x.id !== productId);
  saveProducts();
  updateProductList();
  updateKPIs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Editing product — update fields and click Add Product');
}

/* ── Change Password ── */
async function changePassword() {
  // Use a modal-style approach instead of prompt() so password is never exposed
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:18px;padding:32px;width:90%;max-width:420px;box-shadow:0 25px 50px rgba(0,0,0,0.2);">
      <h3 style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;margin-bottom:20px;">🔑 Change Password</h3>
      <div class="form-group"><label>Current Password</label><input type="password" id="cpCurrent" placeholder="Current password" autocomplete="current-password"/></div>
      <div class="form-group"><label>New Password</label><input type="password" id="cpNew" placeholder="New password (min 6 chars)" autocomplete="new-password"/></div>
      <div class="form-group"><label>Confirm New Password</label><input type="password" id="cpConfirm" placeholder="Confirm new password" autocomplete="new-password"/></div>
      <div id="cpError" style="color:var(--red);font-size:13px;margin-bottom:12px;display:none;"></div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary" id="cpSaveBtn" onclick="saveNewPassword()">Save Password</button>
        <button class="btn btn-ghost" onclick="this.closest('[style*=fixed]').remove()">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('cpCurrent')?.focus(), 100);
}

async function saveNewPassword() {
  const current = document.getElementById('cpCurrent')?.value;
  const newPass = document.getElementById('cpNew')?.value;
  const confirm2 = document.getElementById('cpConfirm')?.value;
  const errorEl = document.getElementById('cpError');

  const showErr = msg => { if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; } };

  if (!current || !newPass || !confirm2) { showErr('All fields required'); return; }
  if (newPass.length < 6) { showErr('Password must be at least 6 characters'); return; }
  if (newPass !== confirm2) { showErr('Passwords do not match'); return; }

  const hashedCurrent = await hashPassword(current);
  if (hashedCurrent !== adminState.user.password) { showErr('Current password is incorrect'); return; }

  const hashedNew = await hashPassword(newPass);
  const staff = adminState.staff.find(s => s.username === adminState.user.username);
  if (staff) {
    staff.password = hashedNew;
    staff.hashed = true;
    adminState.user.password = hashedNew;
    saveStaff();
    document.querySelector('[style*="fixed"][style*="z-index:99999"]')?.remove();
    toast('Password changed successfully! 🔐');
  }
}

/* ── Delete functions ── */
function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  adminState.products = adminState.products.filter(p => p.id !== productId);
  saveProducts();
  updateProductList();
  updateKPIs();
  toast('Product deleted');
}

function deleteSeller(sellerId) {
  if (!confirm('Delete this seller?')) return;
  adminState.sellers = adminState.sellers.filter(s => s.id !== sellerId);
  saveSellers();
  updateSellerList();
  updateKPIs();
  toast('Seller deleted');
}

/* ── Export functions ── */
function exportProducts() {
  const blob = new Blob([JSON.stringify(adminState.products, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'products.json' });
  a.click(); URL.revokeObjectURL(a.href);
  toast('Products exported!');
}

function exportSellers() {
  const blob = new Blob([JSON.stringify(adminState.sellers, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'sellers.json' });
  a.click(); URL.revokeObjectURL(a.href);
  toast('Sellers exported!');
}

/* ── Upload JSON ── */
function uploadJSON(type, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) { toast('Invalid JSON format'); return; }
      if (type === 'products') {
        adminState.products = data; saveProducts(); updateProductList();
        if (window.PRODUCTS) window.PRODUCTS = [...data];
      } else {
        adminState.sellers = data; saveSellers(); updateSellerList();
        if (window.SELLERS) window.SELLERS = [...data];
      }
      updateKPIs();
      toast(`${type} uploaded successfully!`);
    } catch(err) { toast('Error parsing JSON file'); }
  };
  reader.readAsText(file);
  input.value = '';
}

/* ── Settings toggles (with maintenance mode) ── */
function toggleSetting(setting) {
  const toggle = document.getElementById(setting + 'Toggle');
  if (!toggle) return;
  const isOn = toggle.classList.toggle('on');
  const settings = JSON.parse(localStorage.getItem('rt_settings') || '{}');
  settings[setting] = isOn;
  localStorage.setItem('rt_settings', JSON.stringify(settings));
  toast(`${setting.charAt(0).toUpperCase() + setting.slice(1)} ${isOn ? 'enabled' : 'disabled'}`);

  // Apply maintenance mode visually immediately
  if (setting === 'maintenance') {
    const banner = document.getElementById('maintenanceBanner');
    if (isOn && !banner) {
      const b = document.createElement('div');
      b.id = 'maintenanceBanner';
      b.style.cssText = 'position:fixed;top:var(--navbar-h);left:0;right:0;z-index:5000;background:#f59e0b;color:#92400e;text-align:center;padding:10px 16px;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:10px;';
      b.innerHTML = '🔧 <span>Maintenance Mode is ON — Visitors see a maintenance page</span> <button onclick="this.parentElement.remove()" style="background:rgba(0,0,0,0.15);border:none;color:inherit;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">Dismiss</button>';
      document.body.appendChild(b);
    } else if (!isOn && banner) {
      banner.remove();
    }
  }
}

// Load current setting states on dashboard show
function loadSettingToggles() {
  const settings = JSON.parse(localStorage.getItem('rt_settings') || '{}');
  ['coupon', 'maintenance', 'registration'].forEach(s => {
    const toggle = document.getElementById(s + 'Toggle');
    if (!toggle) return;
    if (s === 'coupon') {
      toggle.classList.toggle('on', settings[s] !== false); // default ON
    } else if (s === 'registration') {
      toggle.classList.toggle('on', settings[s] !== false); // default ON
    } else {
      toggle.classList.toggle('on', !!settings[s]); // default OFF
    }
  });
}

function clearCache() {
  localStorage.removeItem('rt_products_override');
  localStorage.removeItem('rt_sellers_override');
  toast('Cache cleared! Reloading...');
  setTimeout(() => location.reload(), 1000);
}

function resetData() {
  if (!confirm('WARNING: This will reset ALL data to defaults. Continue?')) return;
  if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
  ['rt_products_override','rt_sellers_override','rt_staff','rt_settings','rt_coupons']
    .forEach(k => localStorage.removeItem(k));
  toast('All data reset! Reloading...');
  setTimeout(() => location.reload(), 1000);
}

/* ── Search ── */
document.addEventListener('DOMContentLoaded', () => {
  const prodSearch = document.getElementById('prodSearch');
  if (prodSearch) prodSearch.addEventListener('input', () => updateProductList());
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.activeElement.tagName === 'INPUT') {
    document.activeElement.blur();
  }
});
