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

/* ── Currency ───────────────────────────────────────── */
const RATES = { CNY:1, USD:0.138, GBP:0.109, EUR:0.127, AUD:0.214, CAD:0.188, JPY:20.9, SGD:0.185 };
const SYMS  = { CNY:'¥', USD:'$', GBP:'£', EUR:'€', AUD:'A$', CAD:'C$', JPY:'¥', SGD:'S$' };
let activeCurr = localStorage.getItem('rt_currency') || 'USD';

function fmtPrice(cny) {
  const rate = RATES[activeCurr] || 1;
  const sym  = SYMS[activeCurr]  || '¥';
  const val  = cny * rate;
  return `${sym}${val < 10 ? val.toFixed(2) : Math.round(val)}`;
}

function setCurrency(code) {
  activeCurr = code;
  localStorage.setItem('rt_currency', code);
  const lbl = document.getElementById('currencyLabel');
  if (lbl) lbl.textContent = code;
  document.querySelectorAll('.product-price, .cat-card-price').forEach(el => {
    const raw = parseFloat(el.dataset.cny);
    if (!isNaN(raw)) el.textContent = fmtPrice(raw);
  });
  document.querySelectorAll('.curr-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.code === code);
  });
}

/* ── Currency Modal ──────────────────────────────────── */
function initCurrencyModal() {
  const btn   = document.getElementById('currencyBtn');
  const modal = document.getElementById('currencyModal');
  const close = document.getElementById('currencyClose');
  if (!btn || !modal) return;

  const lbl = document.getElementById('currencyLabel');
  if (lbl) lbl.textContent = activeCurr;

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

/* ── Sample Data ─────────────────────────────────────── */
const SAMPLE_PRODUCTS = [
  { id:1, name:'Nike Air Force 1 Low', seller:'SneakerKing',  price:178, cat:'Shoes',       img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', featured:true  },
  { id:2, name:'Jordan 1 Retro High OG', seller:'TopSeller', price:220, cat:'Shoes',        img:'https://images.unsplash.com/photo-1584735175315-9d5df23be78a?w=400&q=80', featured:true  },
  { id:3, name:'Stone Island Badge Hoodie', seller:'LuxReps', price:145, cat:'Tops',        img:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80', featured:true  },
  { id:4, name:'Balenciaga Triple S',     seller:'HighReps',  price:340, cat:'Shoes',       img:'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&q=80', featured:false },
  { id:5, name:'Moncler Jacket',          seller:'LuxReps',   price:520, cat:'Outerwear',   img:'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80', featured:true  },
  { id:6, name:'Chrome Hearts Tee',       seller:'HighReps',  price:85,  cat:'Tops',        img:'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&q=80', featured:false },
  { id:7, name:'Louis Vuitton Bag',       seller:'BagMaster', price:890, cat:'Accessories', img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', featured:true  },
  { id:8, name:'Essentials Hoodie',       seller:'TopSeller', price:95,  cat:'Tops',        img:'https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=400&q=80', featured:false },
  { id:9, name:'Yeezy Foam Runner',       seller:'SneakerKing', price:160, cat:'Shoes',     img:'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80', featured:false },
  { id:10, name:'Gucci Belt',             seller:'LuxReps',  price:120,  cat:'Accessories', img:'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80', featured:false },
  { id:11, name:'Palace Hoodie',          seller:'StreetRep', price:110, cat:'Tops',        img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80', featured:false },
  { id:12, name:'Dior B23 High',          seller:'HighReps',  price:290, cat:'Shoes',       img:'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80', featured:false },
];

const SAMPLE_SELLERS = [
  { name:'SneakerKing',  count:143, verified:true,  initials:'SK' },
  { name:'LuxReps',      count:98,  verified:true,  initials:'LR' },
  { name:'TopSeller',    count:211, verified:true,  initials:'TS' },
  { name:'HighReps',     count:76,  verified:false, initials:'HR' },
  { name:'BagMaster',    count:54,  verified:true,  initials:'BM' },
  { name:'StreetRep',    count:89,  verified:false, initials:'SR' },
];

const SAMPLE_CATEGORIES = [
  { name:'Shoes', count:487, emoji:'👟' },
  { name:'Tops', count:312, emoji:'👕' },
  { name:'Outerwear', count:156, emoji:'🧥' },
  { name:'Accessories', count:234, emoji:'👜' },
  { name:'Watches', count:89, emoji:'⌚' },
  { name:'Bottoms', count:198, emoji:'👖' },
  { name:'Bags', count:145, emoji:'🎒' },
  { name:'Jewelry', count:67, emoji:'💎' },
  { name:'Headwear', count:78, emoji:'🧢' },
  { name:'Sportswear', count:124, emoji:'🏃' },
];

const SAMPLE_GUIDES = [
  { title:'Beginner\'s Complete Rep Guide', author:'Admin', emoji:'📖' },
  { title:'How to Read QC Photos',          author:'TaroMod', emoji:'🔍' },
  { title:'Best Agents in 2025',            author:'Admin', emoji:'🚢' },
  { title:'Avoiding Customs Issues',        author:'TaroMod', emoji:'✈️' },
];

const SAMPLE_ANNOUNCEMENTS = [
  { title:'New Seller Verification System Live', text:'All verified sellers now display a checkmark.', icon:'🎉', tag:'update', time:'2 hours ago' },
  { title:'Site Maintenance Notice',             text:'Brief maintenance on Sunday 2–3AM UTC.',       icon:'🔧', tag:'alert',  time:'Yesterday' },
  { title:'100 Sellers Milestone!',              text:'We hit 100 verified sellers — thank you!',     icon:'🏆', tag:'news',   time:'3 days ago' },
];

/* ── Featured Product Grid ───────────────────────────── */
function buildFeaturedGrid() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = SAMPLE_PRODUCTS.filter(p => p.featured).slice(0, 8);
  grid.innerHTML = featured.map(p => `
    <div class="product-card" onclick="toast('Opening ${p.name}…')">
      <div class="product-thumb">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span class="product-price" data-cny="${p.price}">${fmtPrice(p.price)}</span>
          <span style="font-size:10px;color:var(--muted)">${p.seller}</span>
        </div>
      </div>
    </div>`).join('');
}

/* ── Best Sellers ────────────────────────────────────── */
function buildSellerList() {
  const el = document.getElementById('sellerList');
  if (!el) return;
  el.innerHTML = SAMPLE_SELLERS.map(s => `
    <a class="seller-row" href="sellers.html">
      <div class="s-avatar">${s.initials}</div>
      <div class="s-info">
        <div class="s-name">
          ${s.name}
          ${s.verified ? '<span class="vbadge">✓</span>' : ''}
        </div>
        <div class="s-count">${s.count} products listed</div>
      </div>
    </a>`).join('');
}

/* ── Category Marquee ────────────────────────────────── */
function buildMarquee() {
  const wrap = document.getElementById('categoryMarquee');
  if (!wrap) return;
  const doubled = [...SAMPLE_CATEGORIES, ...SAMPLE_CATEGORIES];
  const track = document.createElement('div');
  track.className = 'marquee-track';
  track.innerHTML = doubled.map(c => `
    <a class="marquee-chip" href="catalogue.html">
      <span>${c.emoji}</span>
      <span>${c.name}</span>
      <span class="marquee-count">${c.count}</span>
    </a>`).join('');
  wrap.appendChild(track);

  // Pause on hover
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

/* ── Community / Forum posts ─────────────────────────── */
function buildCommunity() {
  const guideEl = document.getElementById('guidesList');
  if (guideEl) {
    guideEl.innerHTML = SAMPLE_GUIDES.map(g => `
      <a class="forum-post" href="guides.html">
        <div class="fp-avatar">${g.emoji}</div>
        <div class="fp-info">
          <div class="fp-title">${g.title}</div>
          <div class="fp-by">by ${g.author}</div>
        </div>
      </a>`).join('');
  }

  const forumEl = document.getElementById('forumPosts');
  if (forumEl) {
    forumEl.innerHTML = `
      <div class="forum-post">
        <div class="fp-avatar">🔥</div>
        <div class="fp-info"><div class="fp-title">W2C these Jordan 1s?</div><div class="fp-by">by sneakerfan</div></div>
      </div>
      <div class="forum-post">
        <div class="fp-avatar">✅</div>
        <div class="fp-info"><div class="fp-title">SneakerKing haul — 10/10 QC</div><div class="fp-by">by repsonly</div></div>
      </div>
      <div class="forum-post">
        <div class="fp-avatar">❓</div>
        <div class="fp-info"><div class="fp-title">Best agent for sneakers 2025?</div><div class="fp-by">by newbuyer</div></div>
      </div>`;
  }
}

/* ── Announcements ───────────────────────────────────── */
function buildAnnouncements() {
  const el = document.getElementById('announcements');
  if (!el) return;
  el.innerHTML = SAMPLE_ANNOUNCEMENTS.map(a => `
    <div class="announce-item">
      <div class="a-icon">${a.icon}</div>
      <div class="a-body">
        <div class="ann-head">
          <span class="a-title">${a.title}</span>
          <span class="a-tag">${a.tag}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${a.text}</div>
        <div class="a-time">${a.time}</div>
      </div>
    </div>`).join('');
}

/* ── Stats Counter Animation ─────────────────────────── */
function animateCount(el, target, suffix = '') {
  let start = 0;
  const dur = 1200;
  const step = 16;
  const inc = target / (dur / step);
  const timer = setInterval(() => {
    start += inc;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.round(start).toLocaleString() + suffix;
  }, step);
}

function buildStats() {
  const pEl = document.getElementById('statProducts');
  const sEl = document.getElementById('statSellers');
  if (pEl) animateCount(pEl, SAMPLE_PRODUCTS.length * 40, '+');
  if (sEl) animateCount(sEl, SAMPLE_SELLERS.length * 17, '+');
}

/* ── Coupon Popup — always shows ─────────────────────── */
function initCouponPopup() {
  const modal = document.getElementById('couponModal');
  const closeBtn = document.getElementById('couponClose');
  const copyBtn  = document.getElementById('copyCodeBtn');
  const goBtn    = document.getElementById('couponGo');
  if (!modal) return;

  // Always show on page load
  setTimeout(() => modal.classList.add('active'), 600);

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = document.getElementById('couponCode')?.textContent;
      navigator.clipboard?.writeText(code).catch(() => {});
      copyBtn.textContent = 'Copied!';
      toast('Code copied! 🎉');
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  }

  if (goBtn) {
    goBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      window.open('https://m.litbuy.com/pages/register/index?inviteCode=REPTARO', '_blank');
    });
  }
}

/* ── Hero Search ─────────────────────────────────────── */
function initSearch() {
  function doSearch(query) {
    if (!query.trim()) return;
    toast(`Searching for "${query}"…`);
    setTimeout(() => window.location.href = `catalogue.html?q=${encodeURIComponent(query)}`, 500);
  }

  const heroInput = document.getElementById('heroSearchInput');
  const heroBtn   = document.getElementById('heroSearchBtn');
  if (heroInput && heroBtn) {
    heroBtn.addEventListener('click', () => doSearch(heroInput.value));
    heroInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(heroInput.value); });
  }

  const navInput = document.getElementById('searchInput');
  const navBtn   = document.querySelector('.nav-search-btn');
  if (navInput && navBtn) {
    navBtn.addEventListener('click', () => doSearch(navInput.value));
    navInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(navInput.value); });
  }
}

/* ── Profile Button ──────────────────────────────────── */
function initProfileBtn() {
  const btn = document.getElementById('profileBtn');
  if (btn) btn.addEventListener('click', () => window.location.href = 'profile.html');
}

/* ── Interactive Mouse-Following Orb ─────────────────── */
function initMouseOrb() {
  const orb = document.querySelector('.liquid-orb-3');
  if (!orb) return;
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function animate() {
    cx = lerp(cx, mx, 0.04);
    cy = lerp(cy, my, 0.04);
    orb.style.left = (cx - 225) + 'px';
    orb.style.top  = (cy - 225) + 'px';
    orb.style.transform = 'none';
    requestAnimationFrame(animate);
  })();
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCurrencyModal();
  initCouponPopup();
  initSearch();
  initProfileBtn();
  buildFeaturedGrid();
  buildSellerList();
  buildMarquee();
  buildCommunity();
  buildAnnouncements();
  buildStats();
  initMouseOrb();
});
