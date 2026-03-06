/* REP•TARO — app.js */

const SITE = {
  inviteUrl: 'https://m.litbuy.com/pages/register/index?inviteCode=REPTARO',
  inviteCode: 'REPTARO',
  coupon: {
    enabled: true,
    title: 'Welcome to REP•TARO!',
    message: 'Use the invite code below to register and start ordering with our trusted sellers.',
    button: 'Register Now',
    url: 'https://m.litbuy.com/pages/register/index?inviteCode=REPTARO',
  }
};

/* ── Currency rates (CNY base — all Weidian prices are in CNY) ── */
const RATES = { CNY:1, USD:0.138, GBP:0.109, EUR:0.127, AUD:0.214, CAD:0.188, JPY:20.9, SGD:0.185 };
const SYMBOLS = { CNY:'¥', USD:'$', GBP:'£', EUR:'€', AUD:'A$', CAD:'C$', JPY:'¥', SGD:'S$' };

let activeCurrency = localStorage.getItem('rt_currency') || 'CNY';

function setActiveCurrency(code) {
  activeCurrency = code;
  localStorage.setItem('rt_currency', code);
  document.querySelectorAll('#currencyLabel').forEach(el => el.textContent = code);
  document.querySelectorAll('.curr-opt').forEach(o => o.classList.toggle('active', o.dataset.code === code));
  refreshPrices();
}
function fmt(priceCNY) {
  const v = priceCNY * (RATES[activeCurrency] || 1);
  return `${SYMBOLS[activeCurrency] || '¥'}${v.toFixed(2)}`;
}
function refreshPrices() {
  if (document.body.dataset.page === 'catalogue') renderCatalogueCards();
  if (document.body.dataset.page === 'home') buildFeaturedGrid();
}

/* ── Default data ── */
const DEFAULT_PRODUCTS = [
  { id:'p1', name:"Under Armour Tee", category:'t-shirts & shorts', seller:'Yishan', price:42, featured:true, link:'https://weidian.com/item.html?itemID=7583312248', qc:true },
  { id:'p2', name:"Arc'teryx Beta LT Jacket", category:'puffer jackets and coats', seller:'WWTop', price:420, featured:true, link:'https://weidian.com/item.html?itemID=7581349191', qc:false },
  { id:'p3', name:'Nike Air Force 1 White', category:'shoes', seller:'MOMOKICK', price:280, featured:true, link:'https://momokick.x.yupoo.com/categories', qc:true },
  { id:'p4', name:'Balenciaga Triple S', category:'shoes', seller:'EVGA', price:550, featured:true, link:'#', qc:true },
  { id:'p5', name:'Chrome Hearts Ring', category:'accessories', seller:'JimiOptical', price:180, featured:true, link:'#', qc:false },
  { id:'p6', name:'Moncler Maya Jacket', category:'puffer jackets and coats', seller:'Koala', price:680, featured:true, link:'#', qc:true },
  { id:'p7', name:'AirPods Pro Clone', category:'electronics', seller:'OgWave', price:320, featured:true, link:'#', qc:false },
  { id:'p8', name:'Supreme Box Logo Hoodie', category:'hoodies', seller:'Husky', price:195, featured:true, link:'#', qc:true },
  { id:'p9', name:'Yeezy Boost 350 V2', category:'shoes', seller:'MOMOKICK', price:310, featured:false, link:'#', qc:true },
  { id:'p10', name:'Stone Island Badge Hoodie', category:'hoodies', seller:'Yishan', price:220, featured:false, link:'#', qc:false },
  { id:'p11', name:'Nike Dunk Low Panda', category:'shoes', seller:'WWTop', price:260, featured:false, link:'#', qc:true },
  { id:'p12', name:'Rolex Submariner', category:'accessories', seller:'K8', price:1800, featured:false, link:'#', qc:true },
];
const DEFAULT_SELLERS = [
  { id:'s1', name:'Yishan', description:'Good Essentials', link:'https://yishan-ess.x.yupoo.com/', logo:'', verified:true },
  { id:'s2', name:'WWTop', description:'Overall best shoe seller', link:'https://wwfake100.x.yupoo.com/categories', logo:'', verified:true },
  { id:'s3', name:'MOMOKICK', description:'Good for shoes overall', link:'https://momokick.x.yupoo.com/categories', logo:'', verified:true },
  { id:'s4', name:'EVGA', description:'Best for Balenciaga & Rick Owens', link:'#', logo:'', verified:true },
  { id:'s5', name:'Koala', description:'Best designer shoe seller', link:'#', logo:'', verified:true },
  { id:'s6', name:'Husky', description:'Huge catalogue, hit or miss', link:'#', logo:'', verified:true },
  { id:'s7', name:'K8', description:'Premium watch & jewellery reps', link:'#', logo:'', verified:true },
  { id:'s8', name:'JimiOptical', description:'Sunglasses & optical accessories', link:'#', logo:'', verified:false },
];

const FORUM_POSTS = [
  { user:'Alex', title:'Staying safe with payment methods', time:'23 minutes ago', replies:14, cat:'Payments' },
  { user:'Sam', title:'Community haul — what did you get this month?', time:'5 minutes ago', replies:31, cat:'Hauls' },
  { user:'Mike', title:'Best shipping agent right now?', time:'1 hour ago', replies:8, cat:'Shipping' },
  { user:'Kim', title:'QC tips for first-time buyers', time:'2 hours ago', replies:22, cat:'Guides' },
  { user:'Jordan', title:'MOMOKICK review — Nike Dunk Low', time:'4 hours ago', replies:17, cat:'Reviews' },
  { user:'Taylor', title:'LitBuy vs Pandabuy — which agent is better?', time:'6 hours ago', replies:45, cat:'Agents' },
];

const ANNOUNCEMENTS = [
  { icon:'📢', title:'New sellers added — Koala and JimiOptical!', body:'We have onboarded 2 new verified sellers this week. Both have been reviewed by staff and have excellent track records.', time:'30 minutes ago', tag:'New' },
  { icon:'🔔', title:'Platform maintenance scheduled for Sunday 3AM UTC', body:'The site will be down for approximately 30 minutes for database upgrades and performance improvements.', time:'2 hours ago', tag:'Maintenance' },
  { icon:'✨', title:'QC photo feature now live on product pages', body:'Products with available QC photos now show a gallery on the detail view. Look for the "QC ✓" badge.', time:'Yesterday', tag:'Feature' },
  { icon:'💬', title:'Forums are now open to all registered members', body:'Join the community discussion. Share hauls, ask questions, and help others navigate the rep market.', time:'3 days ago', tag:'Community' },
  { icon:'🛡️', title:'Seller verification system update', body:'All sellers must now re-verify their identity. This improves buyer protection across the platform.', time:'1 week ago', tag:'Security' },
];

const ALERTS = [
  { icon:'⚠️', title:'WWTop — extended shipping delays', body:'Buyers are reporting 2–3 week extra delays from WWTop. Consider alternative agents or prepare for longer waits.', time:'1 hour ago', level:'warn' },
  { icon:'🚨', title:'Scam alert: fake REPTARO Discord', body:'There is a fake Discord server impersonating us. We do NOT have an official Discord. Do not send anyone money.', time:'Yesterday', level:'danger' },
  { icon:'✅', title:'LitBuy card payment issues resolved', body:'The card payment issues from last week have been fixed by LitBuy\'s team. All payment methods are now working.', time:'2 days ago', level:'success' },
  { icon:'ℹ️', title:'CNY exchange rate updated', body:'Exchange rates have been updated to reflect current market rates. Prices shown in non-CNY currencies are now more accurate.', time:'3 days ago', level:'info' },
  { icon:'⚠️', title:'Customs checks increased at UK borders', body:'UK customs has increased checks on packages from China. Consider splitting large orders and using lower declared values.', time:'5 days ago', level:'warn' },
];

/* ── State ── */
let PRODUCTS = [...DEFAULT_PRODUCTS];
let SELLERS = [...DEFAULT_SELLERS];

/* ── Helpers ── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

let toastTimer;
function toast(msg, dur = 2400) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(8px)'; }, dur);
}

const CAT_EMOJI = { 'clothes':'👕','t-shirts & shorts':'👕','shoes':'👟','accessories':'⌚','electronics':'🎧','hoodies':'🧥','puffer jackets and coats':'🧥','puffer jackets':'🧥' };
const CAT_BG = {
  'clothes':'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  't-shirts & shorts':'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  'shoes':'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  'accessories':'linear-gradient(135deg,#d1fae5,#a7f3d0)',
  'electronics':'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  'hoodies':'linear-gradient(135deg,#fef3c7,#fde68a)',
  'puffer jackets and coats':'linear-gradient(135deg,#e0f2fe,#bae6fd)',
  'puffer jackets':'linear-gradient(135deg,#e0f2fe,#bae6fd)',
};

/* ── Load JSON data ── */
async function loadData() {
  try {
    const [pr, sr] = await Promise.allSettled([
      fetch('products.json').then(r => r.json()),
      fetch('sellers.json').then(r => r.json()),
    ]);
    if (pr.status === 'fulfilled' && Array.isArray(pr.value)) {
      PRODUCTS = pr.value.map((p, i) => ({
        id: p.id || 'p' + i,
        name: p.name,
        category: (p.category || 'other').toLowerCase().trim(),
        seller: p.seller || '',
        price: parseFloat(p.price) || 0,
        featured: i < 12,
        image: p.image || '',
        link: p.litbuy || p.link || '#',
        qc: p.qc_available || false,
        qcImages: p.qc_images || [],
      }));
    }
    if (sr.status === 'fulfilled' && Array.isArray(sr.value)) {
      SELLERS = sr.value.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        logo: s.logo || '',
        link: s.link || '#',
        verified: true,
        dateAdded: s.dateAdded,
      }));
    }
  } catch (e) { /* keep defaults */ }
}

/* ── Featured Product Grid ── */
function buildFeaturedGrid() {
  const grid = $('#featuredGrid');
  if (!grid) return;
  const featured = PRODUCTS.filter(p => p.featured).slice(0, 8);
  grid.innerHTML = featured.map(p => {
    const hasQC = p.qc && p.qcImages && p.qcImages.length > 0;
    const imgSrc = p.image || 'https://via.placeholder.com/400x400/2563eb/ffffff?text=' + encodeURIComponent(p.name.substring(0, 20));
    
    return `
      <div class="product-card" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <div class="product-thumb" style="position:relative;overflow:hidden;background:linear-gradient(135deg,#dbeafe,#bfdbfe);">
          <img src="${esc(imgSrc)}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
          ${hasQC ? '<div class="qc-badge" style="position:absolute;top:8px;right:8px;background:var(--green);color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;">QC ✓</div>' : ''}
        </div>
        <div class="product-info">
          <div class="product-name" title="${esc(p.name)}">${esc(p.name)}</div>
          <div class="product-meta">
            <span class="product-price">${fmt(p.price)}</span>
            <span style="font-size:11px;color:var(--muted);">${esc(p.seller)}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── Best Sellers Panel ── */
function buildSellerPanel() {
  const top = $('#bsTopSlot');
  const list = $('#sellerList');
  if (!top || !list || !SELLERS.length) return;
  const [first, ...rest] = SELLERS;
  const initials = n => n.substring(0, 2).toUpperCase();
  const avatarHtml = s => s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" onerror="this.style.display='none'">` : `<span>${initials(s.name)}</span>`;
  top.innerHTML = `
    <a class="bs-top" href="${esc(first.link)}" target="_blank" rel="noopener">
      <div class="bs-avatar-lg">${avatarHtml(first)}</div>
      <div>
        <div class="s-name">${esc(first.name)} <span class="vbadge">✓</span></div>
        <div class="s-count">Featured Seller</div>
      </div>
    </a>`;
  list.innerHTML = rest.slice(0, 6).map((s, i) => `
    <a class="seller-row" href="${esc(s.link)}" target="_blank" rel="noopener">
      <div class="s-avatar">${avatarHtml(s)}</div>
      <div class="s-info">
        <div class="s-name">${esc(s.name)}${s.verified ? '<span class="vbadge">✓</span>' : ''}</div>
        <div class="s-count">${[193,618,273,782,309,441][i]||0} Products</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
    </a>`).join('');
}

/* ── Forum Posts ── */
function buildForumPosts() {
  const el = $('#forumPosts');
  if (!el) return;
  el.innerHTML = FORUM_POSTS.map(p => `
    <a class="forum-post" href="forums.html">
      <div class="fp-avatar">${p.user.substring(0,2).toUpperCase()}</div>
      <div class="fp-info">
        <div class="fp-title">${esc(p.title)}</div>
        <div class="fp-by">${esc(p.user)} · ${esc(p.time)} · ${p.replies} replies</div>
      </div>
    </a>`).join('');
}

/* ── Announcements ── */
function buildAnnouncements() {
  const el = $('#announcements');
  if (!el) return;
  el.innerHTML = ANNOUNCEMENTS.slice(0, 3).map(a => `
    <a class="announce-item" href="announcements.html">
      <div class="a-icon">${a.icon}</div>
      <div class="a-body">
        <div class="a-title">${esc(a.title)}</div>
        <div class="a-time">${esc(a.time)}</div>
      </div>
      <span class="a-tag">${esc(a.tag)}</span>
    </a>`).join('');
}

/* ── Product Detail Modal ── */
let currentProduct = null;

function openProductModal(product) {
  currentProduct = product;
  let existing = document.getElementById('productModal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.className = 'modal-backdrop active';
  
  const hasQC = product.qc && product.qcImages && product.qcImages.length > 0;
  const mainImage = product.image || 'https://via.placeholder.com/600x400/2563eb/ffffff?text=' + encodeURIComponent(product.name.substring(0, 30));
  
  let qcGalleryHtml = '';
  if (hasQC) {
    qcGalleryHtml = `
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--line);">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">
          QC Photos (${product.qcImages.length})
        </div>
        <div class="qc-gallery">
          ${product.qcImages.map((img, i) => `
            <div class="qc-thumb" onclick="showQCImage('${esc(img)}', ${i})">
              <img src="${esc(img)}" alt="QC ${i+1}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px;max-height:90vh;overflow:auto;">
      <div class="modal-head">
        <h3>${esc(product.name)}</h3>
        <button class="modal-x" onclick="closeProductModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="product-detail-image">
          <img src="${esc(mainImage)}" alt="${esc(product.name)}" style="width:100%;max-height:400px;object-fit:contain;border-radius:12px;background:var(--surface2);">
        </div>
        <div style="margin-top:16px;">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <span class="badge badge-blue">${esc(product.category)}</span>
            ${hasQC ? '<span class="badge badge-green">QC ✓</span>' : ''}
            <span style="margin-left:auto;font-size:24px;font-weight:800;color:var(--blue);">${fmt(product.price)}</span>
          </div>
          <div style="font-size:14px;color:var(--muted);margin-bottom:8px;">Seller: <strong style="color:var(--text);">${esc(product.seller)}</strong></div>
        </div>
        ${qcGalleryHtml}
        <div style="margin-top:20px;display:flex;gap:10px;">
          <a href="${esc(product.link)}" target="_blank" rel="noopener" class="btn btn-primary" style="flex:1;justify-content:center;">View Product →</a>
          <button class="btn btn-ghost" onclick="copyProductLink('${esc(product.link)}')">Copy Link</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeProductModal(); });
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
  }
  currentProduct = null;
}

function showQCImage(src, index) {
  let viewer = document.getElementById('qcViewer');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'qcViewer';
    viewer.className = 'modal-backdrop';
    document.body.appendChild(viewer);
  }
  
  const currentImages = currentProduct?.qcImages || [];
  
  viewer.innerHTML = `
    <div style="position:relative;max-width:90vw;max-height:90vh;">
      <button onclick="document.getElementById('qcViewer').classList.remove('active')" style="position:absolute;top:-40px;right:0;background:rgba(0,0,0,0.7);border:none;color:white;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;z-index:10;">✕</button>
      <img src="${esc(src)}" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="display:flex;justify-content:center;gap:10px;margin-top:15px;">
        ${currentImages.length > 1 ? `
          <button onclick="prevQCImage(${index})" style="background:rgba(0,0,0,0.5);border:none;color:white;padding:8px 16px;border-radius:20px;cursor:pointer;">← Prev</button>
          <span style="color:white;padding:8px 16px;">${index + 1} / ${currentImages.length}</span>
          <button onclick="nextQCImage(${index})" style="background:rgba(0,0,0,0.5);border:none;color:white;padding:8px 16px;border-radius:20px;cursor:pointer;">Next →</button>
        ` : ''}
      </div>
    </div>
  `;
  viewer.classList.add('active');
  viewer.onclick = e => { if (e.target === viewer) viewer.classList.remove('active'); };
}

function prevQCImage(currentIdx) {
  if (!currentProduct || !currentProduct.qcImages) return;
  const newIdx = currentIdx > 0 ? currentIdx - 1 : currentProduct.qcImages.length - 1;
  showQCImage(currentProduct.qcImages[newIdx], newIdx);
}

function nextQCImage(currentIdx) {
  if (!currentProduct || !currentProduct.qcImages) return;
  const newIdx = currentIdx < currentProduct.qcImages.length - 1 ? currentIdx + 1 : 0;
  showQCImage(currentProduct.qcImages[newIdx], newIdx);
}

function copyProductLink(link) {
  navigator.clipboard?.writeText(link).then(() => toast('Link copied! 📋')).catch(() => toast('Failed to copy'));
}

/* ── CATALOGUE PAGE ── */
let catState = { cat:'all', q:'', sort:'default' };

function initCataloguePage() {
  if(document.body.dataset.page !== 'catalogue') return;
  const urlQ = new URLSearchParams(window.location.search);
  catState.cat = (urlQ.get('category')||'all').toLowerCase();
  catState.q = urlQ.get('q')||'';
  const si=$('#catalogueSearch');
  if(si){ si.value=catState.q; si.addEventListener('input',()=>{catState.q=si.value;renderCatalogueCards();}); }
  const searchBtn=$('#catalogueSearchBtn');
  if(searchBtn) searchBtn.addEventListener('click',()=>renderCatalogueCards());
  const sortSel=$('#sortSelect');
  if(sortSel) sortSel.addEventListener('change',()=>{catState.sort=sortSel.value;renderCatalogueCards();});
  document.querySelectorAll('.filter-chip[data-cat]').forEach(c=>{
    c.addEventListener('click',()=>{
      catState.cat=c.dataset.cat;
      document.querySelectorAll('.filter-chip[data-cat]').forEach(x=>x.classList.toggle('active',x===c));
      renderCatalogueCards();
    });
  });
  // set active chip
  document.querySelectorAll('.filter-chip[data-cat]').forEach(c=>c.classList.toggle('active',c.dataset.cat===catState.cat));
  renderCatalogueCards();
}

function renderCatalogueCards() {
  const grid = document.getElementById('productGrid');
  if(!grid) return;
  const catMap = { clothes:['clothes','shirt','t-shirts','t-shirts & shorts'], shoes:['shoes','shoe'], accessories:['accessories','accessory'], electronics:['electronics'], hoodies:['hoodies','hoodie'], jackets:['jacket','puffer','coat'] };
  let filtered = PRODUCTS.filter(p => {
    let catMatch = catState.cat === 'all';
    if(!catMatch){ const terms=catMap[catState.cat]||[catState.cat]; catMatch=terms.some(t=>p.category.includes(t)); }
    const qMatch = !catState.q || (p.name+p.seller+p.category).toLowerCase().includes(catState.q.toLowerCase());
    return catMatch && qMatch;
  });
  if(catState.sort==='price-asc') filtered.sort((a,b)=>a.price-b.price);
  else if(catState.sort==='price-desc') filtered.sort((a,b)=>b.price-a.price);
  else if(catState.sort==='name') filtered.sort((a,b)=>a.name.localeCompare(b.name));
  const count=document.getElementById('catalogueCount');
  if(count) count.textContent=`${filtered.length} product${filtered.length!==1?'s':''}`;
  if(!filtered.length){ grid.innerHTML=`<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No products found</div><button class="btn btn-ghost" onclick="catState.q='';catState.cat='all';document.querySelectorAll('.filter-chip').forEach((c,i)=>c.classList.toggle('active',i===0));renderCatalogueCards()">Clear filters</button></div>`; return; }
  grid.innerHTML = filtered.map(p=>{
    const cat=(p.category||'').toLowerCase();
    const bg=CAT_BG[cat]||'linear-gradient(135deg,#e2e8f0,#cbd5e1)';
    const emoji=CAT_EMOJI[cat]||'📦';
    const hasQC = p.qc && p.qcImages && p.qcImages.length > 0;
    
    let imgHtml = '';
    if (p.image) {
      imgHtml = `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.querySelector('.img-fallback').style.display='flex'">`;
    }
    
    return `<div class="cat-card" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <div class="cat-card-thumb" style="background:${bg};position:relative;overflow:hidden;">
        ${imgHtml}
        <div class="img-fallback" style="display:${p.image ? 'none' : 'flex'};position:absolute;inset:0;align-items:center;justify-content:center;font-size:48px;">${emoji}</div>
        ${hasQC ? '<div style="position:absolute;top:8px;right:8px;background:var(--green);color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;">QC ✓</div>' : ''}
      </div>
      <div class="cat-card-info">
        <div class="cat-card-name" title="${esc(p.name)}">${esc(p.name)}</div>
        <div class="cat-card-seller">${esc(p.seller)}</div>
        <div class="cat-card-meta">
          <span class="cat-card-price">${fmt(p.price)}</span>
          <div style="display:flex;gap:4px;align-items:center">
            <a href="${esc(p.link)}" target="_blank" onclick="event.stopPropagation()" class="btn btn-primary" style="font-size:11px;padding:4px 10px;height:auto">View →</a>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── SELLERS PAGE ── */
function initSellersPage() {
  if(document.body.dataset.page !== 'sellers') return;
  const grid=$('#sellersGrid');
  if(!grid) return;
  function render(term='') {
    const list=SELLERS.filter(s=>!term||(s.name+s.description).toLowerCase().includes(term));
    const count=document.getElementById('sellersCount');
    if(count) count.textContent=list.length;
    grid.innerHTML=list.map(s=>{
      const init=s.name.substring(0,2).toUpperCase();
      const avatar=s.logo?`<img src="${esc(s.logo)}" alt="${esc(s.name)}" onerror="this.style.display='none'">${init}`:init;
      return `<div class="seller-card">
        <div class="sc-avatar">${avatar}</div>
        <h3>${esc(s.name)}${s.verified?' <span class="vbadge">✓</span>':''}</h3>
        <p>${esc(s.description)}</p>
        <a href="${esc(s.link)}" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;justify-content:center">Visit Store →</a>
      </div>`;
    }).join('');
  }
  render();
  $('#sellerSearch')?.addEventListener('input',e=>render(e.target.value.toLowerCase()));
}

/* ── ADMIN PAGE ── */
function initAdminPage() {
  if(document.body.dataset.page !== 'admin') return;
  const sp=$('#adminProducts'),ss=$('#adminSellers');
  if(sp) sp.textContent=PRODUCTS.length;
  if(ss) ss.textContent=SELLERS.length;
  const ct=$('#couponAdminToggle');
  if(ct){ ct.classList.toggle('on',SITE.coupon.enabled); ct.addEventListener('click',()=>{ SITE.coupon.enabled=!SITE.coupon.enabled; ct.classList.toggle('on',SITE.coupon.enabled); toast(SITE.coupon.enabled?'Coupon popup enabled':'Coupon popup disabled'); }); }
}

/* ── ANNOUNCEMENTS PAGE ── */
function initAnnouncementsPage() {
  if(document.body.dataset.page !== 'announcements') return;
  const list=$('#announcementsList');
  if(!list) return;
  list.innerHTML=ANNOUNCEMENTS.map(a=>`
    <div class="ann-card ann-level-${a.tag.toLowerCase()}">
      <div class="ann-icon">${a.icon}</div>
      <div class="ann-body">
        <div class="ann-head"><span class="ann-title">${esc(a.title)}</span><span class="ann-badge ann-badge-${a.tag.toLowerCase()}">${esc(a.tag)}</span></div>
        <p class="ann-text">${esc(a.body)}</p>
        <div class="ann-time">🕒 ${esc(a.time)}</div>
      </div>
    </div>`).join('');
}

/* ── ALERTS PAGE ── */
function initAlertsPage() {
  if(document.body.dataset.page !== 'alerts') return;
  const list=$('#alertsList');
  if(!list) return;
  list.innerHTML=ALERTS.map(a=>`
    <div class="alert-card alert-${a.level}">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-body">
        <div class="alert-title">${esc(a.title)}</div>
        <p class="alert-text">${esc(a.body)}</p>
        <div class="alert-time">🕒 ${esc(a.time)}</div>
      </div>
    </div>`).join('');
}

/* ── NAV ── */
function initNav() {
  const page=document.body?.dataset?.page||'home';
  const map={home:'index.html',catalogue:'catalogue.html',sellers:'sellers.html',guides:'guides.html',tools:'tools.html',profile:'profile.html',admin:'admin.html',forums:'forums.html',announcements:'announcements.html',alerts:'alerts.html'};
  document.querySelectorAll('.bnav-item').forEach(a=>{
    const href=a.getAttribute('href')||'';
    a.classList.toggle('active',href.includes(map[page]||'__none__'));
  });
  document.querySelectorAll('#currencyLabel').forEach(el=>el.textContent=activeCurrency);
}

/* ── Update Stats ── */
function updateStats() {
  const statProducts = document.getElementById('statProducts');
  const statSellers = document.getElementById('statSellers');
  if (statProducts) statProducts.textContent = PRODUCTS.length;
  if (statSellers) statSellers.textContent = SELLERS.length;
}

/* ── Coupon Popup ── */
function initCoupon() {
  const modal = $('#couponModal');
  if (!modal) return;
  if (!SITE.coupon.enabled) return;
  const dismissed = localStorage.getItem('rt_coupon_dismissed');
  if (dismissed) return;

  const titleEl = $('#couponTitle');
  const msgEl = $('#couponMessage');
  const codeEl = $('#couponCode');
  if (titleEl) titleEl.textContent = SITE.coupon.title;
  if (msgEl) msgEl.textContent = SITE.coupon.message;
  if (codeEl) codeEl.textContent = SITE.inviteCode;

  const closeModal = () => { modal.classList.remove('active'); };

  const closeBtn = $('#couponClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const copyBtn = $('#copyCodeBtn');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(SITE.inviteCode).then(() => toast('Code copied!')).catch(() => {});
  });

  const goBtn = $('#couponGo');
  if (goBtn) goBtn.addEventListener('click', () => { window.open(SITE.coupon.url, '_blank'); closeModal(); });

  const dismissBtn = $('#couponDismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', () => { localStorage.setItem('rt_coupon_dismissed', '1'); closeModal(); });

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  setTimeout(() => { modal.classList.add('active'); }, 1500);
}

/* ── Currency Selector ── */
function initCurrency() {
  const btn = $('#currencyBtn');
  const modal = $('#currencyModal');
  if (!btn || !modal) return;

  btn.addEventListener('click', () => modal.classList.add('active'));

  const closeBtn = $('#currencyClose');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  document.querySelectorAll('.curr-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.code === activeCurrency);
    opt.addEventListener('click', () => {
      setActiveCurrency(opt.dataset.code);
      modal.classList.remove('active');
    });
  });
}

/* ── Profile Button ── */
function initProfile() {
  const btn = $('#profileBtn');
  if (!btn) return;
  btn.addEventListener('click', () => { window.location.href = 'profile.html'; });
}

/* ── Search ── */
function initSearch() {
  const input = $('#searchInput');
  const btn = document.querySelector('.nav-search-btn');
  if (!input) return;

  const doSearch = () => {
    const q = input.value.trim();
    if (q) window.location.href = 'catalogue.html?q=' + encodeURIComponent(q);
  };

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  if (btn) btn.addEventListener('click', doSearch);
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadData();
  updateStats();
  buildFeaturedGrid();
  buildSellerPanel();
  buildForumPosts();
  buildAnnouncements();
  initCoupon();
  initCurrency();
  initProfile();
  initSearch();
  initCataloguePage();
  initSellersPage();
  initAdminPage();
  initAnnouncementsPage();
  initAlertsPage();
  initNav();
  if(document.getElementById('year')) document.getElementById('year').textContent=new Date().getFullYear();
});
