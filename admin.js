const adminState = {
  loggedIn: false,
  user: null,
  staff: [],
  products: [],
  sellers: [],
  coupons: [],
};

window.adminState = adminState;

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const el = $('toast');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function saveStaff() {
  localStorage.setItem('rt_staff', JSON.stringify(adminState.staff));
}

function saveCoupons() {
  localStorage.setItem('rt_coupons', JSON.stringify(adminState.coupons));
}

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeAdminProduct(p, i) {
  return {
    id: p.id || ('p' + i),
    name: String(p.name || '').trim(),
    category: String(p.category || p.tag || 'clothes').trim(),
    seller: String(p.seller || p.agentName || 'Unknown').trim(),
    price: parseFloat(p.price || p.sellPrice || 0) || 0,
    featured: Boolean(p.featured),
    image: p.image || p.imageUrl || p.photo || '',
    link: p.link || p.litbuy || p.litbuy_link || p.agentUrl || '#',
    qc: Boolean(p.qc_available || p.qc),
    qcImages: Array.isArray(p.qc_images) ? p.qc_images : (Array.isArray(p.qcImages) ? p.qcImages : []),
    dateAdded: p.dateAdded || new Date().toISOString().slice(0, 10),
  };
}

async function loadAdminData() {
  try {
    const [pr, sr] = await Promise.allSettled([
      fetch('products.json').then(r => r.json()),
      fetch('sellers.json').then(r => r.json()),
    ]);

    adminState.products =
      pr.status === 'fulfilled' && Array.isArray(pr.value)
        ? pr.value.map(normalizeAdminProduct)
        : [];

    adminState.sellers =
      sr.status === 'fulfilled' && Array.isArray(sr.value)
        ? sr.value
        : [];
  } catch (e) {
    console.warn('loadAdminData error', e);
  }
}

function loadCoupons() {
  try {
    adminState.coupons = JSON.parse(localStorage.getItem('rt_coupons') || '[]');
  } catch (e) {
    adminState.coupons = [];
  }
}

function updateKPIs() {
  if ($('adminProducts')) $('adminProducts').textContent = adminState.products.length;
  if ($('adminSellers')) $('adminSellers').textContent = adminState.sellers.length;
  if ($('adminStaff')) $('adminStaff').textContent = adminState.staff.length;
  if ($('adminUsers')) $('adminUsers').textContent = '—';
}

function syncNav() {
  const navActions = $('adminNavActions');
  const navLogin = $('adminNavLogin');
  const navUserName = $('navUserName');
  const navUserRole = $('navUserRole');

  if (adminState.loggedIn && adminState.user) {
    if (navActions) navActions.style.display = 'flex';
    if (navLogin) navLogin.style.display = 'none';
    if (navUserName) navUserName.textContent = adminState.user.username || '—';
    if (navUserRole) navUserRole.textContent = adminState.user.role || '—';
  } else {
    if (navActions) navActions.style.display = 'none';
    if (navLogin) navLogin.style.display = 'flex';
  }
}

function showDashboard() {
  if ($('adminLogin')) $('adminLogin').style.display = 'none';
  if ($('adminDashboard')) $('adminDashboard').style.display = 'block';

  const badge = $('adminRoleBadge');
  if (badge && adminState.user) {
    const role = adminState.user.role || 'staff';
    badge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    badge.className = 'role-badge role-' + role;
  }

  syncNav();
  updateKPIs();
  renderAdminProductList();
  renderSellerList();
  renderStaffList();
  renderCouponList();
  loadSettingToggles();
}

function showLogin() {
  if ($('adminLogin')) $('adminLogin').style.display = 'block';
  if ($('adminDashboard')) $('adminDashboard').style.display = 'none';
  syncNav();
}

function adminLogout() {
  localStorage.removeItem('rt_admin_session');
  adminState.loggedIn = false;
  adminState.user = null;
  showLogin();
  toast('Logged out');
}

async function loadOrBootstrapStaff() {
  const savedStaff = localStorage.getItem('rt_staff');

  if (!savedStaff) {
    adminState.staff = [];
    return;
  }

  try {
    adminState.staff = JSON.parse(savedStaff);
    let needsSave = false;

    for (const s of adminState.staff) {
      if (!s.hashed && s.password) {
        s.password = await hashPassword(s.password);
        s.hashed = true;
        needsSave = true;
      }
    }

    if (needsSave) saveStaff();
  } catch (e) {
    adminState.staff = [];
  }
}

function decodeInvitePayload(raw) {
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return JSON.parse(atob(normalized + pad));
}

async function completeInviteSignupFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawInvite = params.get('invite');
  if (!rawInvite) return false;

  let payload;
  try {
    payload = decodeInvitePayload(rawInvite);
  } catch (e) {
    history.replaceState(null, '', 'admin.html');
    toast('Invalid admin invite link');
    return false;
  }

  const desiredRole = String(payload.role || 'staff').toLowerCase();
  const discordId = String(payload.discord_id || '');

  let username = prompt(`Set up your ${desiredRole} account.\nChoose a username:`) || '';
  username = username.trim().toLowerCase();

  if (!username) {
    history.replaceState(null, '', 'admin.html');
    toast('Signup cancelled');
    return true;
  }

  if (adminState.staff.find(s => s.username === username && String(s.discord_id || '') !== discordId)) {
    history.replaceState(null, '', 'admin.html');
    toast('That username is already taken');
    return true;
  }

  const password = prompt('Choose a password (minimum 8 characters):') || '';
  if (password.length < 8) {
    history.replaceState(null, '', 'admin.html');
    toast('Password must be at least 8 characters');
    return true;
  }

  const existing = adminState.staff.find(s => String(s.discord_id || '') === discordId);
  const staffRecord = {
    id: existing?.id || ('staff_' + Date.now()),
    username,
    password: await hashPassword(password),
    hashed: true,
    role: desiredRole,
    discord_id: discordId,
    invited_by: String(payload.invited_by || ''),
    created_at: new Date().toISOString(),
  };

  if (existing) {
    adminState.staff = adminState.staff.map(s => String(s.discord_id || '') === discordId ? staffRecord : s);
  } else {
    adminState.staff.push(staffRecord);
  }

  saveStaff();
  adminState.user = staffRecord;
  adminState.loggedIn = true;
  localStorage.setItem('rt_admin_session', JSON.stringify({ username: staffRecord.username, role: staffRecord.role }));

  history.replaceState(null, '', 'admin.html');
  showDashboard();
  toast(`Admin account created for ${staffRecord.username}`);
  return true;
}

async function adminLogin(event) {
  if (event) event.preventDefault();

  const usernameInput = $('loginUsername');
  const passwordInput = $('loginPassword');
  const errorEl = $('loginError');
  const btn = $('loginBtn');

  const username = usernameInput?.value.trim().toLowerCase() || '';
  const password = passwordInput?.value || '';

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  if (!adminState.staff.length) {
    if (errorEl) {
      errorEl.textContent = 'No admin accounts exist yet on this browser. Use your Discord invite link first.';
      errorEl.style.display = 'block';
    }
    return false;
  }

  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = 'Please enter username and password';
      errorEl.style.display = 'block';
    }
    return false;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Logging in...';
  }

  try {
    const hashed = await hashPassword(password);
    const staff = adminState.staff.find(s => s.username === username && s.password === hashed);

    if (staff) {
      adminState.user = staff;
      adminState.loggedIn = true;
      localStorage.setItem('rt_admin_session', JSON.stringify({ username: staff.username, role: staff.role }));
      showDashboard();
      toast(`Welcome back, ${staff.username}!`);
      return false;
    }

    if (errorEl) {
      errorEl.textContent = 'Invalid username or password';
      errorEl.style.display = 'block';
    }
    return false;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }
}

function bindAdminEvents() {
  const loginForm = $('loginForm');
  const loginBtn = $('loginBtn');
  const logoutBtn = $('logoutBtn');

  if (loginForm) loginForm.addEventListener('submit', adminLogin);
  if (loginBtn) loginBtn.addEventListener('click', adminLogin);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      adminLogout();
    });
  }
}

function roleCanManageStaff() {
  return adminState.user && (adminState.user.role === 'owner' || adminState.user.role === 'dev');
}

function clearProductForm() {
  if ($('addProdName')) $('addProdName').value = '';
  if ($('addProdCategory')) $('addProdCategory').value = 'shoes';
  if ($('addProdPrice')) $('addProdPrice').value = '';
  if ($('addProdSeller')) $('addProdSeller').value = '';
  if ($('addProdLink')) $('addProdLink').value = '';
  if ($('addProdImage')) $('addProdImage').value = '';
  if ($('addProdQC')) $('addProdQC').value = '';
}

function clearSellerForm() {
  if ($('addSellerName')) $('addSellerName').value = '';
  if ($('addSellerLink')) $('addSellerLink').value = '';
  if ($('addSellerLogo')) $('addSellerLogo').value = '';
  if ($('addSellerDesc')) $('addSellerDesc').value = '';
  if ($('addSellerVerified')) $('addSellerVerified').checked = true;
}

function clearCouponForm() {
  if ($('newCouponTitle')) $('newCouponTitle').value = '';
  if ($('newCouponCode')) $('newCouponCode').value = '';
  if ($('newCouponMessage')) $('newCouponMessage').value = '';
  if ($('newCouponUrl')) $('newCouponUrl').value = '';
  if ($('newCouponButton')) $('newCouponButton').value = '';
}

function addProduct() {
  const name = $('addProdName')?.value.trim();
  const category = $('addProdCategory')?.value || 'shoes';
  const price = parseFloat($('addProdPrice')?.value || '0') || 0;
  const seller = $('addProdSeller')?.value.trim() || 'Unknown';
  const link = $('addProdLink')?.value.trim() || '#';
  const image = $('addProdImage')?.value.trim() || '';
  const qcRaw = $('addProdQC')?.value.trim() || '';

  if (!name || !price) {
    toast('Add a product name and price');
    return;
  }

  const qcImages = qcRaw
    ? qcRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  adminState.products.unshift({
    id: 'p' + Date.now(),
    name,
    category,
    price,
    seller,
    link,
    image,
    featured: false,
    qc: qcImages.length > 0,
    qcImages,
    dateAdded: new Date().toISOString().slice(0, 10),
  });

  updateKPIs();
  renderAdminProductList();
  clearProductForm();
  toast('Product added locally');
}

function addSeller() {
  const name = $('addSellerName')?.value.trim();
  const link = $('addSellerLink')?.value.trim();
  const logo = $('addSellerLogo')?.value.trim() || '';
  const description = $('addSellerDesc')?.value.trim() || '';
  const verified = Boolean($('addSellerVerified')?.checked);

  if (!name || !link) {
    toast('Add a seller name and link');
    return;
  }

  adminState.sellers.unshift({
    id: 's' + Date.now(),
    name,
    link,
    logo,
    description,
    verified,
    dateAdded: new Date().toISOString().slice(0, 10),
  });

  updateKPIs();
  renderSellerList();
  clearSellerForm();
  toast('Seller added locally');
}

function addStaff() {
  toast('Use the Discord /addstaff command to invite staff.');
}

function removeStaff(id) {
  adminState.staff = adminState.staff.filter(s => s.id !== id);
  saveStaff();
  updateKPIs();
  renderStaffList();
  toast('Staff removed locally');
}

function renderAdminProductList() {
  const list = $('adminProductList');
  if (!list) return;

  const q = ($('prodSearch')?.value || '').toLowerCase();
  const items = adminState.products.filter(p =>
    !q || `${p.name} ${p.seller} ${p.category}`.toLowerCase().includes(q)
  );

  if (!items.length) {
    list.innerHTML = `<div style="padding:18px;color:var(--muted)">No products found.</div>`;
    return;
  }

  list.innerHTML = items.map(p => `
    <div style="display:flex;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);">
      <div style="width:60px;height:60px;border-radius:10px;overflow:hidden;background:var(--surface2);flex-shrink:0;">
        ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">` : ''}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;">${p.name}</div>
        <div style="font-size:12px;color:var(--muted);">${p.category} · ${p.seller}</div>
      </div>
      <div style="font-weight:800;color:var(--blue);">¥${Number(p.price || 0).toFixed(2)}</div>
    </div>
  `).join('');
}

function renderSellerList() {
  const list = $('adminSellerList');
  if (!list) return;

  if (!adminState.sellers.length) {
    list.innerHTML = `<div style="color:var(--muted)">No sellers yet.</div>`;
    return;
  }

  list.innerHTML = adminState.sellers.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:12px;">
      <div>
        <div style="font-weight:700;">${s.name}</div>
        <div style="font-size:12px;color:var(--muted);">${s.description || 'No description'}</div>
      </div>
      <div style="font-size:12px;">${s.verified ? '✅ Verified' : '❌ Unverified'}</div>
    </div>
  `).join('');
}

function renderStaffList() {
  const list = $('staffList');
  if (!list) return;

  if (!adminState.staff.length) {
    list.innerHTML = `<div style="color:var(--muted)">No local admin accounts on this browser yet.</div>`;
    return;
  }

  list.innerHTML = adminState.staff.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;">
      <div>
        <div style="font-weight:700;">${s.username}</div>
        <div style="font-size:12px;color:var(--muted);">${s.role} · ${s.discord_id || 'no discord id'}</div>
      </div>
      ${roleCanManageStaff() ? `<button class="btn btn-danger btn-sm" type="button" onclick="removeStaff('${s.id}')">Remove</button>` : ''}
    </div>
  `).join('');
}

function addCoupon() {
  const title = $('newCouponTitle')?.value.trim();
  const code = ($('newCouponCode')?.value || '').trim().toUpperCase();
  const message = $('newCouponMessage')?.value.trim() || '';
  const url = $('newCouponUrl')?.value.trim() || '#';
  const button = $('newCouponButton')?.value.trim() || 'Register Now';

  if (!title || !code) {
    toast('Add a coupon title and code');
    return;
  }

  adminState.coupons.unshift({
    id: 'c_' + Date.now(),
    enabled: true,
    title,
    code,
    message,
    url,
    button,
  });

  saveCoupons();
  renderCouponList();
  updateKPIs();
  clearCouponForm();
  toast('Coupon added');
}

function deleteCoupon(id) {
  adminState.coupons = adminState.coupons.filter(c => c.id !== id);
  saveCoupons();
  renderCouponList();
  updateKPIs();
  toast('Coupon deleted');
}

function toggleCoupon(id) {
  adminState.coupons = adminState.coupons.map(c =>
    c.id === id ? { ...c, enabled: !c.enabled } : c
  );
  saveCoupons();
  renderCouponList();
  toast('Coupon updated');
}

function renderCouponList() {
  const list = $('couponList');
  if (!list) return;

  if (!adminState.coupons.length) {
    list.innerHTML = `<div style="color:var(--muted)">No coupons yet.</div>`;
    return;
  }

  list.innerHTML = adminState.coupons.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:12px;">
      <div>
        <div style="font-weight:700;">${c.title}</div>
        <div style="font-size:12px;color:var(--muted);">Code: ${c.code}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-sm btn-ghost" type="button" onclick="toggleCoupon('${c.id}')">${c.enabled ? 'Disable' : 'Enable'}</button>
        <button class="btn btn-danger btn-sm" type="button" onclick="deleteCoupon('${c.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function exportProducts() {
  const blob = new Blob([JSON.stringify(adminState.products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.json';
  a.click();
  URL.revokeObjectURL(url);
}

function exportSellers() {
  const blob = new Blob([JSON.stringify(adminState.sellers, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sellers.json';
  a.click();
  URL.revokeObjectURL(url);
}

function uploadJSON(kind, input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');

      if (kind === 'products') {
        adminState.products = data.map(normalizeAdminProduct);
        renderAdminProductList();
      } else if (kind === 'sellers') {
        adminState.sellers = data;
        renderSellerList();
      }

      updateKPIs();
      toast(`${kind} uploaded locally`);
    } catch (e) {
      toast(`Invalid ${kind}.json file`);
    }
  };
  reader.readAsText(file);
}

function toggleSetting(name) {
  const key = 'rt_setting_' + name;
  const el =
    name === 'coupon' ? $('couponToggle') :
    name === 'maintenance' ? $('maintenanceToggle') :
    $('registrationToggle');

  const next = !(localStorage.getItem(key) === '1');
  localStorage.setItem(key, next ? '1' : '0');

  if (el) el.classList.toggle('on', next);
  toast('Setting updated');
}

function loadSettingToggles() {
  const settings = [
    ['coupon', 'couponToggle', true],
    ['maintenance', 'maintenanceToggle', false],
    ['registration', 'registrationToggle', true],
  ];

  for (const [key, id, def] of settings) {
    const el = $(id);
    if (!el) continue;
    const raw = localStorage.getItem('rt_setting_' + key);
    const on = raw === null ? def : raw === '1';
    el.classList.toggle('on', on);
  }
}

function clearCache() {
  toast('No remote cache to clear on static hosting');
}

function resetData() {
  if (!confirm('Reset all local admin data on this browser?')) return;
  localStorage.removeItem('rt_staff');
  localStorage.removeItem('rt_admin_session');
  localStorage.removeItem('rt_coupons');
  toast('Local admin data reset. Reloading...');
  setTimeout(() => location.reload(), 700);
}

async function initAdmin() {
  bindAdminEvents();

  const prodSearch = $('prodSearch');
  if (prodSearch) {
    prodSearch.addEventListener('input', renderAdminProductList);
  }

  await loadOrBootstrapStaff();
  await loadAdminData();
  loadCoupons();

  const inviteUsed = await completeInviteSignupFromUrl();
  if (inviteUsed) return;

  const session = localStorage.getItem('rt_admin_session');
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      const staff = adminState.staff.find(s => s.username === sessionData.username);
      if (staff) {
        adminState.user = staff;
        adminState.loggedIn = true;
        showDashboard();
        return;
      }
    } catch (e) {}
  }

  showLogin();
  updateKPIs();
}

document.addEventListener('DOMContentLoaded', initAdmin);

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.showDashboard = showDashboard;
window.clearProductForm = clearProductForm;
window.clearSellerForm = clearSellerForm;
window.addProduct = addProduct;
window.addSeller = addSeller;
window.addStaff = addStaff;
window.removeStaff = removeStaff;
window.exportProducts = exportProducts;
window.exportSellers = exportSellers;
window.uploadJSON = uploadJSON;
window.toggleSetting = toggleSetting;
window.clearCache = clearCache;
window.resetData = resetData;
window.addCoupon = addCoupon;
window.deleteCoupon = deleteCoupon;
window.toggleCoupon = toggleCoupon;
window.clearCouponForm = clearCouponForm;
window.changePassword = async function changePassword() {
  if (!adminState.user) return;

  const newPass = prompt('Enter your new password (minimum 8 characters):') || '';
  if (newPass.length < 8) {
    toast('Password must be at least 8 characters');
    return;
  }

  const hashed = await hashPassword(newPass);
  adminState.staff = adminState.staff.map(s =>
    s.id === adminState.user.id ? { ...s, password: hashed, hashed: true } : s
  );
  adminState.user.password = hashed;
  saveStaff();
  toast('Password changed');
};