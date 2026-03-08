/* =====================================================
   TAROFINDS — app.js
   ===================================================== */

/* ── Toast ─────────────────────────────────────────── */
function toast(msg, dur = 2600) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(8px)';
  }, dur);
}

/* ── Currency / Preferences ────────────────────────── */
const RATES = { CNY:1, USD:0.138, GBP:0.109, EUR:0.127, AUD:0.214, CAD:0.188, JPY:20.9, SGD:0.185 };
const SYMS  = { CNY:'¥', USD:'$', GBP:'£', EUR:'€', AUD:'A$', CAD:'C$', JPY:'¥', SGD:'S$' };
let activeCurr = localStorage.getItem('rt_currency') || 'USD';
let activeLang = localStorage.getItem('rt_language') || 'English';
let activePlatform = localStorage.getItem('rt_platform') || 'LitBuy';

function fmtPrice(cny) {
  const rate = RATES[activeCurr] || 1;
  const sym  = SYMS[activeCurr] || '¥';
  const val = Number(cny || 0) * rate;
  return `${sym}${val < 10 ? val.toFixed(2) : Math.round(val)}`;
}

function setCurrency(code) {
  activeCurr = code;
  localStorage.setItem('rt_currency', code);
  const lbl = document.getElementById('currencyLabel');
  if (lbl) lbl.textContent = code;
  document.querySelectorAll('.product-price, .cat-card-price').forEach(el => {
    const raw = parseFloat(el.dataset.cny);
    if (!Number.isNaN(raw)) el.textContent = fmtPrice(raw);
  });
  document.querySelectorAll('.curr-opt, .welcome-currency .welcome-opt').forEach(o => {
    const codeMatch = o.dataset.code || o.dataset.value;
    o.classList.toggle('active', codeMatch === code);
  });
}

/* ── Base data / fallbacks ─────────────────────────── */
const SAMPLE_PRODUCTS = [
  { id:1, name:'Nike Air Force 1 Low', seller:'SneakerKing', price:178, category:'shoes', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', link:'#', featured:true },
  { id:2, name:'Jordan 1 Retro High OG', seller:'TopSeller', price:220, category:'shoes', image:'https://images.unsplash.com/photo-1584735175315-9d5df23be78a?w=400&q=80', link:'#', featured:true },
  { id:3, name:'Stone Island Badge Hoodie', seller:'LuxReps', price:145, category:'tops', image:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80', link:'#', featured:true },
  { id:4, name:'Moncler Jacket', seller:'LuxReps', price:520, category:'outerwear', image:'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80', link:'#', featured:true },
  { id:5, name:'Louis Vuitton Bag', seller:'BagMaster', price:890, category:'accessories', image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', link:'#', featured:true },
  { id:6, name:'Essentials Hoodie', seller:'StreetRep', price:95, category:'tops', image:'https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=400&q=80', link:'#', featured:false },
];

const SAMPLE_SELLERS = [
  { id:'s1', name:'SneakerKing', description:'Sneakers and sportswear.', logo:'', link:'#' },
  { id:'s2', name:'LuxReps', description:'Luxury clothing and outerwear.', logo:'', link:'#' },
  { id:'s3', name:'TopSeller', description:'Popular all-round seller.', logo:'', link:'#' },
  { id:'s4', name:'BagMaster', description:'Bags and accessories.', logo:'', link:'#' },
  { id:'s5', name:'StreetRep', description:'Streetwear basics.', logo:'', link:'#' },
];

const SAMPLE_GUIDES = [
  { title:'Complete Beginner Guide', author:'Admin', emoji:'📖' },
  { title:'How to Read QC Photos', author:'TaroMod', emoji:'🔍' },
  { title:'How to Choose a Seller', author:'Admin', emoji:'🏪' },
  { title:'Shipping Basics', author:'TaroMod', emoji:'📦' },
];

const SAMPLE_ANNOUNCEMENTS = [
  { title:'New Seller Verification System Live', text:'All verified sellers now display a checkmark.', icon:'🎉', tag:'update', time:'2 hours ago' },
  { title:'Site Maintenance Notice', text:'Brief maintenance on Sunday 2–3AM UTC.', icon:'🔧', tag:'alert', time:'Yesterday' },
  { title:'100 Sellers Milestone!', text:'We hit 100 verified sellers — thank you!', icon:'🏆', tag:'news', time:'3 days ago' },
];

let PRODUCTS_CACHE = null;
let SELLERS_CACHE = null;

function getAdminSession() {
  try { return JSON.parse(localStorage.getItem('rt_admin_session') || 'null'); } catch { return null; }
}

function isStaffLoggedIn() {
  return Boolean(getAdminSession()?.username);
}

function readOverride(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveProductOverrides(products) {
  PRODUCTS_CACHE = products;
  localStorage.setItem('rt_products_override', JSON.stringify(products));
}

async function getProducts() {
  if (PRODUCTS_CACHE) return PRODUCTS_CACHE;
  const override = readOverride('rt_products_override');
  if (override) { PRODUCTS_CACHE = override; return PRODUCTS_CACHE; }
  try {
    const res = await fetch('products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('products.json');
    PRODUCTS_CACHE = await res.json();
  } catch {
    PRODUCTS_CACHE = SAMPLE_PRODUCTS;
  }
  return PRODUCTS_CACHE;
}

async function getSellers() {
  if (SELLERS_CACHE) return SELLERS_CACHE;
  const override = readOverride('rt_sellers_override');
  if (override) { SELLERS_CACHE = override; return SELLERS_CACHE; }
  try {
    const res = await fetch('sellers.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('sellers.json');
    SELLERS_CACHE = await res.json();
  } catch {
    SELLERS_CACHE = SAMPLE_SELLERS;
  }
  return SELLERS_CACHE;
}

function initialsFor(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'TF';
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}


function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readCoupons() {
  try {
    const parsed = JSON.parse(localStorage.getItem('rt_coupons') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureMaintenanceGate() {
  const maintenanceOn = localStorage.getItem('rt_setting_maintenance') === '1';
  if (!maintenanceOn || isStaffLoggedIn() || document.body.dataset.page === 'admin') return false;
  document.body.innerHTML = `
    <div class="page" style="min-height:100vh;display:grid;place-items:center;">
      <div class="card" style="max-width:720px;width:100%;text-align:center;padding:28px;">
        <div style="font-size:48px;margin-bottom:10px">🛠️</div>
        <h1 style="margin-bottom:10px">Maintenance mode is on</h1>
        <p style="color:var(--muted);margin-bottom:16px">The site is temporarily hidden for visitors while updates are being made.</p>
        <p style="color:var(--muted);font-size:13px">Staff can still access the admin panel and public pages while logged in.</p>
        <div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="btn btn-primary" href="admin.html">Staff login</a>
          <a class="btn btn-ghost" href="index.html">Reload</a>
        </div>
      </div>
    </div>`;
  return true;
}

function productAdminActions(productId) {
  if (!isStaffLoggedIn()) return '';
  return `<div class="staff-card-actions" style="position:absolute;top:10px;right:10px;display:flex;gap:6px;z-index:3;">
    <button type="button" class="btn btn-ghost btn-sm" onclick="event.preventDefault();event.stopPropagation();staffEditProduct('${escapeHtml(productId)}')">Edit</button>
    <button type="button" class="btn btn-danger btn-sm" onclick="event.preventDefault();event.stopPropagation();staffDeleteProduct('${escapeHtml(productId)}')">Delete</button>
  </div>`;
}

async function staffDeleteProduct(id) {
  if (!isStaffLoggedIn()) return;
  const products = await getProducts();
  const target = products.find(p => String(p.id) === String(id));
  if (!target) return;
  if (!confirm(`Delete ${target.name}?`)) return;
  saveProductOverrides(products.filter(p => String(p.id) !== String(id)));
  toast('Product deleted');
  await initHomePage();
  await initCataloguePage();
}

async function staffEditProduct(id) {
  if (!isStaffLoggedIn()) return;
  const products = await getProducts();
  const target = products.find(p => String(p.id) === String(id));
  if (!target) return;
  const name = prompt('Edit product name', target.name);
  if (name === null) return;
  const priceRaw = prompt('Edit product price (CNY)', target.price);
  if (priceRaw === null) return;
  const seller = prompt('Edit seller', target.seller || 'Unknown');
  if (seller === null) return;
  const category = prompt('Edit category', target.category || 'other');
  if (category === null) return;
  const link = prompt('Edit product link', target.link || '#');
  if (link === null) return;
  const image = prompt('Edit image link', target.image || '');
  if (image === null) return;
  const next = products.map(p => String(p.id) === String(id) ? { ...p, name: name.trim() || p.name, price: parseFloat(priceRaw || p.price) || p.price, seller: seller.trim() || p.seller, category: category.trim() || p.category, link: link.trim() || '#', image: image.trim() || p.image } : p);
  saveProductOverrides(next);
  toast('Product updated');
  await initHomePage();
  await initCataloguePage();
}
window.staffDeleteProduct = staffDeleteProduct;
window.staffEditProduct = staffEditProduct;

/* ── Shared UI ─────────────────────────────────────── */
function initCurrencyModal() {
  const btn = document.getElementById('currencyBtn');
  const modal = document.getElementById('currencyModal');
  const close = document.getElementById('currencyClose');
  const lbl = document.getElementById('currencyLabel');
  if (lbl) lbl.textContent = activeCurr;
  if (!btn || !modal) return;

  btn.addEventListener('click', () => modal.classList.add('active'));
  if (close) close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
  modal.querySelectorAll('.curr-opt').forEach(o => {
    if (o.dataset.code === activeCurr) o.classList.add('active');
    o.addEventListener('click', () => {
      setCurrency(o.dataset.code);
      modal.classList.remove('active');
      toast(`Currency set to ${o.dataset.code}`);
    });
  });
}

function initProfileBtn() {
  const btn = document.getElementById('profileBtn');
  if (btn) btn.addEventListener('click', () => window.location.href = 'profile.html');
}

function initSearch() {
  function doSearch(query) {
    const q = query.trim();
    if (!q) return;
    window.location.href = `catalogue.html?q=${encodeURIComponent(q)}`;
  }

  const heroInput = document.getElementById('heroSearchInput');
  const heroBtn = document.getElementById('heroSearchBtn');
  if (heroInput && heroBtn) {
    heroBtn.addEventListener('click', () => doSearch(heroInput.value));
    heroInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(heroInput.value); });
  }

  const navInput = document.getElementById('searchInput');
  const navBtn = document.querySelector('.nav-search-btn');
  if (navInput && navBtn) {
    navBtn.addEventListener('click', () => doSearch(navInput.value));
    navInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(navInput.value); });
  }
}

function injectBottomNav() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const page = document.body.dataset.page || 'home';
  const items = [
    ['index.html', '🏠', 'Home', 'home'],
    ['catalogue.html', '📋', 'Catalogue', 'catalogue'],
    ['sellers.html', '🏆', 'Sellers', 'sellers'],
    ['guides.html', '📖', 'Guides', 'guides'],
    ['announcements.html', '📣', 'News', 'announcements'],
    ['tools.html', '🔧', 'Tools', 'tools'],
    ['admin.html', '⚙️', 'Admin', 'admin'],
  ];
  nav.innerHTML = items.map(([href, icon, label, key]) => `
    <a class="bnav-item ${page === key ? 'active' : ''}" href="${href}">
      <span class="bnav-icon">${icon}</span>
      <span>${label}</span>
    </a>
  `).join('');
}

function initMouseOrb() {
  const orb = document.querySelector('.liquid-orb-3');
  if (!orb) return;
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  const lerp = (a, b, t) => a + (b - a) * t;
  (function animate() {
    cx = lerp(cx, mx, 0.04);
    cy = lerp(cy, my, 0.04);
    orb.style.left = (cx - 225) + 'px';
    orb.style.top = (cy - 225) + 'px';
    orb.style.transform = 'none';
    requestAnimationFrame(animate);
  })();
}

/* ── Home ──────────────────────────────────────────── */
function buildStats(productCount, sellerCount) {
  const pEl = document.getElementById('statProducts');
  const sEl = document.getElementById('statSellers');
  const animate = (el, target, suffix = '') => {
    if (!el) return;
    let start = 0;
    const dur = 1200;
    const step = 16;
    const inc = target / (dur / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = Math.round(start).toLocaleString() + suffix;
    }, step);
  };
  animate(pEl, productCount, '+');
  animate(sEl, sellerCount, '+');
}

function buildFeaturedGrid(products) {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = products.filter(p => p.featured).slice(0, 8);
  grid.innerHTML = featured.map(p => `
    <a class="product-card" href="${p.link || `catalogue.html?q=${encodeURIComponent(p.name)}`}" target="_blank" rel="noopener noreferrer" style="position:relative">
      ${productAdminActions(p.id)}
      <div class="product-thumb"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span class="product-price" data-cny="${p.price}">${fmtPrice(p.price)}</span>
          <span style="font-size:10px;color:var(--muted)">${p.seller}</span>
        </div>
      </div>
    </a>
  `).join('');
}

function buildSellerList(products, sellers) {
  const el = document.getElementById('sellerList');
  if (!el) return;
  const counts = products.reduce((acc, p) => {
    acc[p.seller] = (acc[p.seller] || 0) + 1;
    return acc;
  }, {});
  const ranked = sellers
    .map(s => ({ ...s, count: counts[s.name] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  el.innerHTML = ranked.map(s => `
    <a class="seller-row" href="sellers.html?seller=${encodeURIComponent(s.name)}">
      <div class="s-avatar">${initialsFor(s.name)}</div>
      <div class="s-info">
        <div class="s-name">${s.name}<span class="vbadge">✓</span></div>
        <div class="s-count">${s.count} products listed</div>
      </div>
    </a>
  `).join('');
}

function buildMarquee(products) {
  const wrap = document.getElementById('categoryMarquee');
  if (!wrap) return;
  const categories = Object.entries(products.reduce((acc, p) => {
    const key = (p.category || 'other').trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({
    name,
    count,
    emoji: ({ shoes:'👟', tops:'👕', outerwear:'🧥', accessories:'👜', bags:'🎒', watches:'⌚', bottoms:'👖', jewelry:'💎', other:'✨' })[name.toLowerCase()] || '✨'
  }));
  const doubled = [...categories, ...categories];
  wrap.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'marquee-track';
  track.innerHTML = doubled.map(c => `
    <a class="marquee-chip" href="catalogue.html?category=${encodeURIComponent(c.name)}">
      <span>${c.emoji}</span>
      <span>${c.name}</span>
      <span class="marquee-count">${c.count}</span>
    </a>
  `).join('');
  wrap.appendChild(track);
  track.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
  track.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
}

function buildCommunity() {
  const guideEl = document.getElementById('guidesList');
  if (guideEl) {
    guideEl.innerHTML = SAMPLE_GUIDES.map(g => `
      <a class="forum-post" href="guides.html">
        <div class="fp-avatar">${g.emoji}</div>
        <div class="fp-info"><div class="fp-title">${g.title}</div><div class="fp-by">by ${g.author}</div></div>
      </a>
    `).join('');
  }
  const forumEl = document.getElementById('forumPosts');
  if (forumEl) {
    forumEl.innerHTML = `
      <a class="forum-post" href="guides.html">
        <div class="fp-avatar">🆕</div>
        <div class="fp-info"><div class="fp-title">New buyer checklist</div><div class="fp-by">Updated guide</div></div>
      </a>
      <a class="forum-post" href="announcements.html">
        <div class="fp-avatar">📣</div>
        <div class="fp-info"><div class="fp-title">Latest platform news</div><div class="fp-by">Site announcement</div></div>
      </a>
      <a class="forum-post" href="guides.html">
        <div class="fp-avatar">📦</div>
        <div class="fp-info"><div class="fp-title">Shipping help</div><div class="fp-by">Guide collection</div></div>
      </a>`;
  }
}

function buildAnnouncements() {
  const el = document.getElementById('announcements');
  if (!el) return;
  el.innerHTML = SAMPLE_ANNOUNCEMENTS.map(a => `
    <div class="announce-item">
      <div class="a-icon">${a.icon}</div>
      <div class="a-body">
        <div class="ann-head"><span class="a-title">${a.title}</span><span class="a-tag">${a.tag}</span></div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${a.text}</div>
        <div class="a-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

function initCouponPopup() {
  if (localStorage.getItem('rt_setting_coupon') === '0') return;
  const modal = document.getElementById('couponModal');
  const closeBtn = document.getElementById('couponClose');
  const copyBtn = document.getElementById('copyCodeBtn');
  const goBtn = document.getElementById('couponGo');
  if (!modal) return;

  const coupons = readCoupons().filter(c => c.enabled !== false);
  const activeCoupon = coupons[0] || null;
  if (activeCoupon) {
    const titleEl = document.getElementById('couponTitle');
    const msgEl = document.getElementById('couponMessage');
    const codeEl = document.getElementById('couponCode');
    const goBtnText = document.getElementById('couponGo');
    const nameMeta = activeCoupon.couponName || activeCoupon.title;
    const agentMeta = activeCoupon.agentName ? ` · Agent: ${activeCoupon.agentName}` : '';
    if (titleEl) titleEl.textContent = activeCoupon.title || 'Welcome to TAROFINDS!';
    if (msgEl) msgEl.textContent = `${activeCoupon.message || 'Use the invite code below to register and start ordering with our trusted sellers.'}${nameMeta ? ` · ${nameMeta}` : ''}${agentMeta}`;
    if (codeEl) codeEl.textContent = activeCoupon.code || 'REPTARO';
    if (goBtnText) goBtnText.textContent = activeCoupon.buttonName || activeCoupon.button || 'Register Now';
    if (activeCoupon.photoLink) {
      const box = modal.querySelector('.coupon-inner');
      if (box && !box.querySelector('.coupon-photo')) {
        box.insertAdjacentHTML('afterbegin', `<img class="coupon-photo" src="${escapeHtml(activeCoupon.photoLink)}" alt="coupon image" style="width:100%;max-height:170px;object-fit:cover;border-radius:18px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.12)">`);
      }
    }
  }

  const langLabel = document.getElementById('couponLanguageLabel');
  const currLabel = document.getElementById('couponCurrencyLabel');
  const platformLabel = document.getElementById('couponPlatformLabel');
  if (langLabel) langLabel.textContent = activeLang;
  if (currLabel) currLabel.textContent = activeCurr;
  if (platformLabel) platformLabel.textContent = activePlatform;

  document.querySelectorAll('.welcome-language .welcome-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === activeLang);
    opt.addEventListener('click', () => {
      activeLang = opt.dataset.value;
      localStorage.setItem('rt_language', activeLang);
      if (langLabel) langLabel.textContent = activeLang;
      document.querySelectorAll('.welcome-language .welcome-opt').forEach(x => x.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  document.querySelectorAll('.welcome-currency .welcome-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === activeCurr);
    opt.addEventListener('click', () => {
      setCurrency(opt.dataset.value);
      if (currLabel) currLabel.textContent = activeCurr;
    });
  });

  document.querySelectorAll('.welcome-platform .welcome-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === activePlatform);
    opt.addEventListener('click', () => {
      activePlatform = opt.dataset.value;
      localStorage.setItem('rt_platform', activePlatform);
      if (platformLabel) platformLabel.textContent = activePlatform;
      document.querySelectorAll('.welcome-platform .welcome-opt').forEach(x => x.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  setTimeout(() => modal.classList.add('active'), 450);
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = document.getElementById('couponCode')?.textContent || (activeCoupon?.code || 'REPTARO');
      navigator.clipboard?.writeText(code).catch(() => {});
      copyBtn.textContent = 'Copied!';
      toast('Code copied! 🎉');
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
    });
  }

  if (goBtn) {
    goBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      const targetUrl = activeCoupon?.buttonLink || activeCoupon?.url || 'https://m.litbuy.com/pages/register/index?inviteCode=REPTARO';
      window.open(targetUrl, '_blank');
    });
  }
}

/* ── Catalogue ─────────────────────────────────────── */
async function initCataloguePage() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const products = await getProducts();
  const input = document.getElementById('catalogueSearchInput');
  const searchBtn = document.getElementById('catalogueSearchBtn');
  const chipsWrap = document.getElementById('catalogueChips');
  const countEl = document.getElementById('catalogueCount');
  const sortEl = document.getElementById('sortSelect');
  const titleEl = document.getElementById('catalogueTitle');

  const queryParam = getParam('q');
  const categoryParam = getParam('category');
  if (input && queryParam) input.value = queryParam;

  const categories = ['all', ...new Set(products.map(p => (p.category || 'other').toLowerCase()))].slice(0, 16);
  let activeCategory = categoryParam ? categoryParam.toLowerCase() : 'all';

  if (chipsWrap) {
    chipsWrap.innerHTML = categories.map(cat => `
      <button class="filter-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">${cat === 'all' ? 'All' : cat}</button>
    `).join('');
    chipsWrap.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        activeCategory = chip.dataset.category;
        chipsWrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        render();
      });
    });
  }

  function render() {
    const q = (input?.value || queryParam || '').trim().toLowerCase();
    let filtered = products.filter(p => {
      const matchesQuery = !q || [p.name, p.seller, p.category].join(' ').toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'all' || (p.category || 'other').toLowerCase() === activeCategory;
      return matchesQuery && matchesCategory;
    });

    const sort = sortEl?.value || 'featured';
    if (sort === 'price-asc') filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'seller') filtered.sort((a, b) => a.seller.localeCompare(b.seller));
    if (sort === 'featured') filtered.sort((a, b) => Number(b.featured) - Number(a.featured));

    if (titleEl) {
      if (q) titleEl.textContent = `Catalogue · “${input.value.trim()}”`;
      else if (activeCategory !== 'all') titleEl.textContent = `Catalogue · ${activeCategory}`;
      else titleEl.textContent = 'Catalogue';
    }
    if (countEl) countEl.textContent = `${filtered.length.toLocaleString()} products`;

    grid.innerHTML = filtered.map(p => `
      <a class="cat-card" href="${p.link || '#'}" target="_blank" rel="noopener noreferrer" style="position:relative">
        ${productAdminActions(p.id)}
        <div class="cat-card-thumb"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
        <div class="cat-card-info">
          <div class="cat-card-name">${p.name}</div>
          <div class="cat-card-seller">${p.seller} · ${(p.category || 'other')}</div>
          <div class="cat-card-meta">
            <span class="cat-card-price product-price" data-cny="${p.price}">${fmtPrice(p.price)}</span>
            ${p.qc_available ? '<span class="badge badge-green">QC</span>' : '<span class="badge badge-blue">Link</span>'}
          </div>
        </div>
      </a>
    `).join('') || '<div class="empty-state">No products found. Try a different search or category.</div>';
  }

  if (searchBtn && input) searchBtn.addEventListener('click', render);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
  if (sortEl) sortEl.addEventListener('change', render);
  render();
}

/* ── Sellers ───────────────────────────────────────── */
async function initSellersPage() {
  const grid = document.getElementById('sellersGrid');
  if (!grid) return;
  const sellers = await getSellers();
  const products = await getProducts();
  const input = document.getElementById('sellerSearch');
  const focusSeller = getParam('seller').toLowerCase();
  if (input && focusSeller) input.value = getParam('seller');

  const counts = products.reduce((acc, p) => {
    acc[p.seller] = (acc[p.seller] || 0) + 1;
    return acc;
  }, {});

  function render() {
    const q = (input?.value || '').trim().toLowerCase();
    const filtered = sellers.filter(s => {
      const hay = [s.name, s.description].join(' ').toLowerCase();
      return !q || hay.includes(q);
    }).sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));

    const badge1 = document.getElementById('badgeSellers');
    const badge2 = document.getElementById('badgeSellers2');
    if (badge1) badge1.textContent = filtered.length;
    if (badge2) badge2.textContent = `${filtered.length} sellers`;

    grid.innerHTML = filtered.map(s => `
      <div class="seller-card">
        <div class="sc-avatar">${s.logo ? `<img src="${s.logo}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover">` : initialsFor(s.name)}</div>
        <h3>${s.name}</h3>
        <p>${s.description || 'Trusted marketplace seller.'}</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <a class="btn btn-primary btn-sm" href="${s.link || '#'}" target="_blank" rel="noopener noreferrer">Open Seller</a>
          <a class="btn btn-ghost btn-sm" href="catalogue.html?q=${encodeURIComponent(s.name)}">View Products (${counts[s.name] || 0})</a>
        </div>
      </div>
    `).join('') || '<div class="empty-state">No sellers found.</div>';
  }

  if (input) {
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
  }
  render();
}

/* ── Home bootstrap ────────────────────────────────── */
async function initHomePage() {
  if (document.body.dataset.page !== 'home') return;
  const [products, sellers] = await Promise.all([getProducts(), getSellers()]);
  buildFeaturedGrid(products);
  buildSellerList(products, sellers);
  buildMarquee(products);
  buildCommunity();
  buildAnnouncements();
  buildStats(products.length, sellers.length);
}

/* ── Init ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (ensureMaintenanceGate()) return;
  injectBottomNav();
  initCurrencyModal();
  initCouponPopup();
  initSearch();
  initProfileBtn();
  initMouseOrb();
  await initHomePage();
  await initCataloguePage();
  await initSellersPage();
});
