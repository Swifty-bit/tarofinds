/* REP•TARO — Admin Panel JavaScript */

// Admin state
let adminState = {
  loggedIn: false,
  user: null,
  staff: [],
  products: [],
  sellers: []
};

// Default owner credentials (in production, use hashed passwords)
const DEFAULT_STAFF = [
  { username: 'owner', password: 'owner123', role: 'owner', id: 'staff_1' },
  { username: 'admin', password: 'admin123', role: 'admin', id: 'staff_2' }
];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

function initAdmin() {
  // Load staff from localStorage or use defaults
  const savedStaff = localStorage.getItem('rt_staff');
  if (savedStaff) {
    adminState.staff = JSON.parse(savedStaff);
  } else {
    adminState.staff = [...DEFAULT_STAFF];
    saveStaff();
  }

  // Load products and sellers
  loadAdminData();

  // Check if already logged in
  const session = localStorage.getItem('rt_admin_session');
  if (session) {
    const sessionData = JSON.parse(session);
    const staff = adminState.staff.find(s => s.username === sessionData.username);
    if (staff) {
      adminState.user = staff;
      adminState.loggedIn = true;
      showDashboard();
    }
  }

  // Update KPI stats
  updateKPIs();
}

function loadAdminData() {
  // Load products
  const savedProducts = localStorage.getItem('rt_products_override');
  if (savedProducts) {
    adminState.products = JSON.parse(savedProducts);
  } else {
    // Use PRODUCTS from app.js if available
    adminState.products = window.PRODUCTS || [];
  }

  // Load sellers
  const savedSellers = localStorage.getItem('rt_sellers_override');
  if (savedSellers) {
    adminState.sellers = JSON.parse(savedSellers);
  } else {
    adminState.sellers = window.SELLERS || [];
  }
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

// Login functionality
function adminLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  const staff = adminState.staff.find(s => s.username === username && s.password === password);

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

  // Update role badge
  const roleBadge = document.getElementById('adminRoleBadge');
  roleBadge.className = `role-badge role-${adminState.user.role}`;
  roleBadge.textContent = adminState.user.role.charAt(0).toUpperCase() + adminState.user.role.slice(1);

  // Show/hide staff section based on role
  const staffSection = document.getElementById('staffSection');
  if (adminState.user.role !== 'owner') {
    staffSection.style.display = 'none';
  }

  // Update lists
  updateProductList();
  updateSellerList();
  updateStaffList();
  updateKPIs();
}

function updateKPIs() {
  document.getElementById('adminProducts').textContent = adminState.products.length.toLocaleString();
  document.getElementById('adminSellers').textContent = adminState.sellers.length.toLocaleString();
  document.getElementById('adminStaff').textContent = adminState.staff.length.toLocaleString();
  document.getElementById('adminUsers').textContent = '0';
}

// Add Product
function addProduct() {
  const name = document.getElementById('addProdName').value.trim();
  const category = document.getElementById('addProdCategory').value;
  const price = parseFloat(document.getElementById('addProdPrice').value);
  const seller = document.getElementById('addProdSeller').value.trim();
  const link = document.getElementById('addProdLink').value.trim();
  const image = document.getElementById('addProdImage').value.trim();
  const qcInput = document.getElementById('addProdQC').value.trim();

  if (!name || !price) {
    toast('Please fill in required fields (Name and Price)');
    return;
  }

  const qcImages = qcInput ? qcInput.split(',').map(url => url.trim()).filter(url => url) : [];

  const newProduct = {
    id: 'p' + Date.now(),
    name,
    category,
    price,
    seller: seller || 'Unknown',
    link: link || '#',
    image: image || '',
    featured: false,
    qc: qcImages.length > 0,
    qcImages,
    dateAdded: new Date().toISOString().split('T')[0]
  };

  adminState.products.unshift(newProduct);
  saveProducts();
  updateProductList();
  updateKPIs();
  clearProductForm();
  toast('Product added successfully! ✓');

  // Refresh PRODUCTS in app.js if available
  if (window.PRODUCTS) {
    window.PRODUCTS = [...adminState.products];
  }
}

function clearProductForm() {
  document.getElementById('addProdName').value = '';
  document.getElementById('addProdPrice').value = '';
  document.getElementById('addProdSeller').value = '';
  document.getElementById('addProdLink').value = '';
  document.getElementById('addProdImage').value = '';
  document.getElementById('addProdQC').value = '';
}

// Add Seller
function addSeller() {
  const name = document.getElementById('addSellerName').value.trim();
  const link = document.getElementById('addSellerLink').value.trim();
  const logo = document.getElementById('addSellerLogo').value.trim();
  const description = document.getElementById('addSellerDesc').value.trim();
  const verified = document.getElementById('addSellerVerified').checked;

  if (!name || !link) {
    toast('Please fill in required fields (Name and Link)');
    return;
  }

  const newSeller = {
    id: 's' + Date.now(),
    name,
    link,
    logo: logo || '',
    description: description || '',
    verified,
    dateAdded: new Date().toISOString().split('T')[0]
  };

  adminState.sellers.unshift(newSeller);
  saveSellers();
  updateSellerList();
  updateKPIs();
  clearSellerForm();
  toast('Seller added successfully! ✓');

  // Refresh SELLERS in app.js if available
  if (window.SELLERS) {
    window.SELLERS = [...adminState.sellers];
  }
}

function clearSellerForm() {
  document.getElementById('addSellerName').value = '';
  document.getElementById('addSellerLink').value = '';
  document.getElementById('addSellerLogo').value = '';
  document.getElementById('addSellerDesc').value = '';
  document.getElementById('addSellerVerified').checked = true;
}

// Add Staff
function addStaff() {
  if (adminState.user.role !== 'owner') {
    toast('Only owner can add staff');
    return;
  }

  const username = document.getElementById('newStaffUser').value.trim();
  const password = document.getElementById('newStaffPass').value;
  const role = document.getElementById('newStaffRole').value;

  if (!username || !password) {
    toast('Please enter username and password');
    return;
  }

  if (adminState.staff.find(s => s.username === username)) {
    toast('Username already exists');
    return;
  }

  const newStaff = {
    id: 'staff_' + Date.now(),
    username,
    password,
    role
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
  if (adminState.user.role !== 'owner') {
    toast('Only owner can remove staff');
    return;
  }

  const staff = adminState.staff.find(s => s.id === staffId);
  if (staff && staff.role === 'owner') {
    toast('Cannot remove owner');
    return;
  }

  adminState.staff = adminState.staff.filter(s => s.id !== staffId);
  saveStaff();
  updateStaffList();
  updateKPIs();
  toast('Staff member removed');
}

// Update Lists
function updateProductList() {
  const list = document.getElementById('adminProductList');
  if (!list) return;

  const searchTerm = document.getElementById('prodSearch')?.value.toLowerCase() || '';
  const filtered = adminState.products.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.seller.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm)
  );

  list.innerHTML = filtered.slice(0, 50).map(p => `
    <div class="admin-product-item" onclick="editProduct('${p.id}')">
      <img src="${p.image || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%23e2e8f0%22 width=%2250%22 height=%2250%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%2294a3b8%22 font-size=%2210%22>📦</text></svg>'}" alt="${p.name}">
      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.category} • ${p.seller} • ¥${p.price}</div>
      </div>
      <div style="display:flex;gap:4px;">
        ${p.qc ? '<span class="badge badge-green">QC</span>' : ''}
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');

  if (filtered.length === 0) {
    list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);">No products found</div>';
  }
}

function updateSellerList() {
  const list = document.getElementById('adminSellerList');
  if (!list) return;

  list.innerHTML = adminState.sellers.map(s => `
    <div class="staff-item">
      <div class="staff-avatar">${s.name.substring(0, 2).toUpperCase()}</div>
      <div class="staff-info">
        <div class="staff-name">${s.name} ${s.verified ? '✓' : ''}</div>
        <div class="staff-role">${s.description || 'No description'}</div>
      </div>
      <div class="staff-actions">
        <a href="${s.link}" target="_blank" class="btn btn-ghost btn-sm">View</a>
        <button class="btn btn-danger btn-sm" onclick="deleteSeller('${s.id}')">Delete</button>
      </div>
    </div>
  `).join('');
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

// Delete functions
function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  adminState.products = adminState.products.filter(p => p.id !== productId);
  saveProducts();
  updateProductList();
  updateKPIs();
  toast('Product deleted');
}

function deleteSeller(sellerId) {
  if (!confirm('Are you sure you want to delete this seller?')) return;
  adminState.sellers = adminState.sellers.filter(s => s.id !== sellerId);
  saveSellers();
  updateSellerList();
  updateKPIs();
  toast('Seller deleted');
}

// Export functions
function exportProducts() {
  const dataStr = JSON.stringify(adminState.products, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Products exported!');
}

function exportSellers() {
  const dataStr = JSON.stringify(adminState.sellers, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sellers.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Sellers exported!');
}

// Upload JSON
function uploadJSON(type, input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) {
        toast('Invalid JSON format');
        return;
      }

      if (type === 'products') {
        adminState.products = data;
        saveProducts();
        updateProductList();
        if (window.PRODUCTS) window.PRODUCTS = [...data];
      } else {
        adminState.sellers = data;
        saveSellers();
        updateSellerList();
        if (window.SELLERS) window.SELLERS = [...data];
      }

      updateKPIs();
      toast(`${type} uploaded successfully!`);
    } catch (err) {
      toast('Error parsing JSON file');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// Settings toggles
function toggleSetting(setting) {
  const toggle = document.getElementById(setting + 'Toggle');
  const isOn = toggle.classList.toggle('on');

  // Save setting to localStorage
  const settings = JSON.parse(localStorage.getItem('rt_settings') || '{}');
  settings[setting] = isOn;
  localStorage.setItem('rt_settings', JSON.stringify(settings));

  toast(`${setting} ${isOn ? 'enabled' : 'disabled'}`);
}

function clearCache() {
  // Clear all override data
  localStorage.removeItem('rt_products_override');
  localStorage.removeItem('rt_sellers_override');
  toast('Cache cleared! Reloading...');
  setTimeout(() => location.reload(), 1000);
}

function resetData() {
  if (!confirm('WARNING: This will reset ALL data to defaults. Continue?')) return;
  if (!confirm('Are you absolutely sure? This cannot be undone.')) return;

  localStorage.removeItem('rt_products_override');
  localStorage.removeItem('rt_sellers_override');
  localStorage.removeItem('rt_staff');
  localStorage.removeItem('rt_settings');

  toast('All data reset! Reloading...');
  setTimeout(() => location.reload(), 1000);
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
  const prodSearch = document.getElementById('prodSearch');
  if (prodSearch) {
    prodSearch.addEventListener('input', () => updateProductList());
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any modals or clear forms
    if (document.activeElement.tagName === 'INPUT') {
      document.activeElement.blur();
    }
  }
});
