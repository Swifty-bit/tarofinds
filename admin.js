const adminState = {
  loggedIn: false,
  user: null,
  staff: [],
  products: [],
  sellers: [],
  coupons: [],
};

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

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadAdminData() {
  try {
    const [pr, sr] = await Promise.allSettled([
      fetch('products.json').then(r => r.json()),
      fetch('sellers.json').then(r => r.json()),
    ]);

    adminState.products = pr.status === 'fulfilled' && Array.isArray(pr.value) ? pr.value : [];
    adminState.sellers = sr.status === 'fulfilled' && Array.isArray(sr.value) ? sr.value : [];
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
  if ($('kpiProducts')) $('kpiProducts').textContent = adminState.products.length;
  if ($('kpiSellers')) $('kpiSellers').textContent = adminState.sellers.length;
  if ($('kpiStaff')) $('kpiStaff').textContent = adminState.staff.length;
  if ($('kpiCoupons')) $('kpiCoupons').textContent = adminState.coupons.length;
}

function showDashboard() {
  if ($('adminLogin')) $('adminLogin').style.display = 'none';
  if ($('adminDashboard')) $('adminDashboard').style.display = 'block';
  if ($('adminUserLabel')) $('adminUserLabel').textContent = `${adminState.user.username} (${adminState.user.role})`;
  updateKPIs();
}

function showLogin() {
  if ($('adminLogin')) $('adminLogin').style.display = 'block';
  if ($('adminDashboard')) $('adminDashboard').style.display = 'none';
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

async function adminLogin() {
  const username = $('loginUsername')?.value.trim().toLowerCase() || '';
  const password = $('loginPassword')?.value || '';
  const errorEl = $('loginError');
  const btn = $('loginBtn');

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  if (!adminState.staff.length) {
    if (errorEl) {
      errorEl.textContent = 'No admin accounts exist yet. Use your Discord invite link first.';
      errorEl.style.display = 'block';
    } else {
      toast('No admin accounts exist yet. Use your invite link first.');
    }
    return;
  }

  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = 'Please enter username and password';
      errorEl.style.display = 'block';
    }
    return;
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
    } else {
      if (errorEl) {
        errorEl.textContent = 'Invalid username or password';
        errorEl.style.display = 'block';
      }
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }
}

function bindAdminEvents() {
  const loginBtn = $('loginBtn');
  const logoutBtn = $('logoutBtn');
  const loginForm = $('loginForm');

  if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await adminLogin();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await adminLogin();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      adminLogout();
    });
  }

  const passwordInput = $('loginPassword');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await adminLogin();
      }
    });
  }
}

async function initAdmin() {
  bindAdminEvents();
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