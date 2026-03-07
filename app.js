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

/* ── i18n ── */
const LANGS = {
  en: { welcome:'Welcome to REP•TARO!', couponMsg:'Use the invite code below to register and start ordering with our trusted sellers.', register:'Register Now', dismiss:"Don't show again", copy:'Copy', language:'Language', currency:'Currency', selectLang:'Select Language', selectCurr:'Select Currency', next:'Next', back:'Back' },
  de: { welcome:'Willkommen bei REP•TARO!', couponMsg:'Verwende den Einladungscode unten, um dich zu registrieren und bei unseren vertrauenswürdigen Verkäufern zu bestellen.', register:'Jetzt registrieren', dismiss:'Nicht mehr anzeigen', copy:'Kopieren', language:'Sprache', currency:'Währung', selectLang:'Sprache wählen', selectCurr:'Währung wählen', next:'Weiter', back:'Zurück' },
  fi: { welcome:'Tervetuloa REP•TAROon!', couponMsg:'Käytä alla olevaa kutsukoodia rekisteröityäksesi ja aloittaaksesi tilaamisen luotetuilta myyjiltämme.', register:'Rekisteröidy nyt', dismiss:'Älä näytä uudelleen', copy:'Kopioi', language:'Kieli', currency:'Valuutta', selectLang:'Valitse kieli', selectCurr:'Valitse valuutta', next:'Seuraava', back:'Takaisin' },
  es: { welcome:'¡Bienvenido a REP•TARO!', couponMsg:'Usa el código de invitación a continuación para registrarte y comenzar a pedir con nuestros vendedores de confianza.', register:'Regístrate ahora', dismiss:'No mostrar de nuevo', copy:'Copiar', language:'Idioma', currency:'Moneda', selectLang:'Seleccionar idioma', selectCurr:'Seleccionar moneda', next:'Siguiente', back:'Atrás' },
  pl: { welcome:'Witamy w REP•TARO!', couponMsg:'Użyj poniższego kodu zaproszenia, aby się zarejestrować i zacząć zamawiać u naszych zaufanych sprzedawców.', register:'Zarejestruj się', dismiss:'Nie pokazuj ponownie', copy:'Kopiuj', language:'Język', currency:'Waluta', selectLang:'Wybierz język', selectCurr:'Wybierz walutę', next:'Dalej', back:'Wstecz' },
  fr: { welcome:'Bienvenue sur REP•TARO!', couponMsg:'Utilisez le code d\'invitation ci-dessous pour vous inscrire et commencer à commander auprès de nos vendeurs de confiance.', register:'S\'inscrire', dismiss:'Ne plus afficher', copy:'Copier', language:'Langue', currency:'Devise', selectLang:'Choisir la langue', selectCurr:'Choisir la devise', next:'Suivant', back:'Retour' },
  nl: { welcome:'Welkom bij REP•TARO!', couponMsg:'Gebruik de uitnodigingscode hieronder om te registreren en te beginnen met bestellen bij onze vertrouwde verkopers.', register:'Nu registreren', dismiss:'Niet meer tonen', copy:'Kopiëren', language:'Taal', currency:'Valuta', selectLang:'Selecteer taal', selectCurr:'Selecteer valuta', next:'Volgende', back:'Terug' },
  pt: { welcome:'Bem-vindo ao REP•TARO!', couponMsg:'Use o código de convite abaixo para se registrar e começar a pedir com nossos vendedores confiáveis.', register:'Registre-se agora', dismiss:'Não mostrar novamente', copy:'Copiar', language:'Idioma', currency:'Moeda', selectLang:'Selecionar idioma', selectCurr:'Selecionar moeda', next:'Próximo', back:'Voltar' },
};
const LANG_LABELS = { en:'🇬🇧 English', de:'🇩🇪 Deutsch', fi:'🇫🇮 Suomi', es:'🇪🇸 Español', pl:'🇵🇱 Polski', fr:'🇫🇷 Français', nl:'🇳🇱 Nederlands', pt:'🇵🇹 Português' };
let activeLang = localStorage.getItem('rt_lang') || 'en';
function t(key) { return (LANGS[activeLang] || LANGS.en)[key] || LANGS.en[key] || key; }
function setLang(code) { activeLang = code; localStorage.setItem('rt_lang', code); }

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

/* ── Data (loaded from JSON files, no placeholders) ── */
const FORUM_POSTS = [];
const ANNOUNCEMENTS = [];
const ALERTS = [];

/* ── State ── */
let PRODUCTS = [];
let SELLERS = [];

function normalizeCategory(product = {}) {
  const rawCategory = String(product.category || product.tag || '').toLowerCase().trim();
  const name = String(product.name || '').toLowerCase().replace(/\n/g, ' ');

  const explicit = {
    'shoes': 'shoes',
    'shoe': 'shoes',
    'clothes': 'clothes',
    'clothing': 'clothes',
    't-shirts': 'clothes',
    't-shirts & shorts': 'clothes',
    'shorts': 'clothes',
    'hoodie': 'hoodies',
    'hoodies': 'hoodies',
    'jacket': 'jackets',
    'jackets': 'jackets',
    'puffer jackets': 'jackets',
    'puffer jackets and coats': 'jackets',
    'coat': 'jackets',
    'coats': 'jackets',
    'accessories': 'accessories',
    'accessory': 'accessories',
    'bags': 'accessories',
    'watches': 'accessories',
    'jewelry': 'accessories',
    'electronics': 'electronics',
  };

  if (explicit[rawCategory]) return explicit[rawCategory];

  if (/jordan|dunk|air max|air force|yeezy|samba|gazelle|sneaker|shoe|shoes|boot|trainer|b25/i.test(name)) return 'shoes';
  if (/hoodie|zip hoodie|pullover/i.test(name)) return 'hoodies';
  if (/jacket|puffer|coat|down jacket|canada goose|moncler|nuptse/i.test(name)) return 'jackets';
  if (/watch|bag|belt|hat|cap|sunglass|wallet|chain|ring|bracelet|necklace|beanie/i.test(name)) return 'accessories';
  if (/headphone|earphone|airpod|speaker|charger|phone|electronic/i.test(name)) return 'electronics';
  if (/t-shirt|tee|shorts|shirt|pants|trouser|jean|tracksuit|sweatpants|sweater|crewneck|polo/i.test(name)) return 'clothes';

  return 'clothes';
}

function getSavedProducts() {
  try {
    return JSON.parse(localStorage.getItem('rt_saved_items') || '[]');
  } catch (e) {
    return [];
  }
}

function isSavedProduct(productId) {
  return getSavedProducts().some(item => item.id === productId);
}

function toggleSavedProduct(product) {
  const saved = getSavedProducts();
  const existingIndex = saved.findIndex(item => item.id === product.id);

  if (existingIndex >= 0) {
    saved.splice(existingIndex, 1);
    localStorage.setItem('rt_saved_items', JSON.stringify(saved));
    toast('Removed from favourites');
  } else {
    saved.unshift({
      id: product.id,
      name: product.name,
      image: product.image,
      price: fmt(product.price),
      rawPrice: product.price,
      seller: product.seller,
      link: product.link
    });
    localStorage.setItem('rt_saved_items', JSON.stringify(saved));
    toast('Added to favourites');
  }

  if (document.body.dataset.page === 'catalogue') renderCatalogueCards();
}

function openProductModalFromEncoded(encoded) {
  try {
    const product = JSON.parse(decodeURIComponent(encoded));
    openProductModal(product);
  } catch (e) {
    console.warn('Bad product payload', e);
  }
}

function toggleSavedFromCard(event, encoded) {
  event.stopPropagation();
  try {
    const product = JSON.parse(decodeURIComponent(encoded));
    toggleSavedProduct(product);
  } catch (e) {
    console.warn('Bad save payload', e);
  }
}

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
      PRODUCTS = pr.value
        .map((p, i) => {
          const img = p.image || p.imageUrl || p.photo || '';
          const link = (p.link || p.litbuy || p.litbuy_link || p.agentUrl || '#')
            .replace(/inviteCode=SWIFTY/gi, 'inviteCode=REPTARO');

          const rawName = String(p.name || '').trim().replace(/\n/g, ' ');
          const normalizedCategory = normalizeCategory(p);

          return {
            id: p.id || ('p' + i),
            name: rawName,
            category: normalizedCategory,
            seller: p.seller || p.agentName || 'Unknown',
            price: parseFloat(p.price || p.sellPrice || 0) || 0,
            featured: p.featured === true || i < 24,
            image: img,
            link,
            qc: Boolean(p.qc_available || p.qc),
            qcImages: Array.isArray(p.qc_images) ? p.qc_images : (Array.isArray(p.qcImages) ? p.qcImages : []),
          };
        })
        .filter(p => p.name && p.image);
    }

    if (sr.status === 'fulfilled' && Array.isArray(sr.value)) {
      SELLERS = sr.value.map(s => ({
        id: s.id,
        name: s.name,
        description: String(s.description || '').replace(/\n/g, ' ').replace(/\n/g, ' '),
        logo: s.logo || '',
        link: String(s.link || '#').replace(/\\//g, '/'),
        verified: s.verified !== false,
        dateAdded: s.dateAdded,
      }));
    }
  } catch (e) {
    console.warn('loadData error:', e);
  }

  window.PRODUCTS = PRODUCTS;
  window.SELLERS = SELLERS;
}


/* ── Best Sellers Panel ── */
function buildSellerPanel() {
  const top = $('#bsTopSlot');
  const list = $('#sellerList');
  const bsLabel = document.querySelector('.bs-label');
  if (top) top.style.display = 'none';
  if (bsLabel) bsLabel.style.display = 'none';
  if (!list || !SELLERS.length) return;
  const avatarHtml = s => {
    if (s.logo && s.logo.trim() && !s.logo.startsWith('data:image/jpeg;base64')) {
      return `<img src="${esc(s.logo)}" alt="${esc(s.name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-weight:700">${s.name.substring(0,2).toUpperCase()}</span>`;
    }
    return `<span style="font-weight:700">${s.name.substring(0,2).toUpperCase()}</span>`;
  };
  list.innerHTML = SELLERS.slice(0, 8).map(s => `
    <a class="seller-row" href="${esc(s.link)}" target="_blank" rel="noopener">
      <div class="s-avatar">${avatarHtml(s)}</div>
      <div class="s-info">
        <div class="s-name">${esc(s.name)}${s.verified ? '<span class="vbadge">✓</span>' : ''}</div>
        <div class="s-count">${esc(s.description)}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
    </a>`).join('');
}

/* ── Forum Posts ── */
function buildForumPosts() {
  const el = $('#forumPosts');
  if (!el) return;
  if (!FORUM_POSTS.length) {
    el.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--muted);font-size:13px;">No forum posts yet.</div>';
    return;
  }
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
  if (!ANNOUNCEMENTS.length) {
    el.innerHTML = '<div style="padding:16px 0;text-align:center;color:var(--muted);font-size:13px;">No announcements yet.</div>';
    return;
  }
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
  const mainImage = product.image;
  
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
          <button class="btn btn-ghost" onclick="saveProduct()">💾 Save</button>
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

function saveProduct() {
  if (!currentProduct) return;
  toggleSavedProduct(currentProduct);
}


/* ── CATALOGUE PAGE ── */
let catState = { cat:'all', q:'', sort:'default' };

function initCataloguePage() {
  if(document.body.dataset.page !== 'catalogue') return;
  const urlQ = new URLSearchParams(window.location.search);
  catState.cat = (urlQ.get('category')||'all').toLowerCase();
  catState.q = urlQ.get('q')||'';
  // If a specific category is selected via URL, update the filter chips
  if(catState.cat !== 'all') {
    document.querySelectorAll('.filter-chip[data-cat]').forEach(c =>
      c.classList.toggle('active', c.dataset.cat === catState.cat));
  }
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

function catCardHtml(p) {
  const cat = (p.category || '').toLowerCase();
  const bg = CAT_BG[cat] || 'linear-gradient(135deg,#e2e8f0,#cbd5e1)';
  const emoji = CAT_EMOJI[cat] || '📦';
  const hasQC = p.qc && p.qcImages && p.qcImages.length > 0;
  const encoded = encodeURIComponent(JSON.stringify(p));
  const saved = isSavedProduct(p.id);

  return `
    <div class="cat-card" onclick="openProductModalFromEncoded('${encoded}')">
      <div class="cat-card-thumb" style="background:${bg};position:relative;overflow:hidden;">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.querySelector('.img-fallback').style.display='flex'">` : ''}
        <div class="img-fallback" style="display:${p.image ? 'none' : 'flex'};position:absolute;inset:0;align-items:center;justify-content:center;font-size:48px;">${emoji}</div>
        ${hasQC ? '<div style="position:absolute;top:8px;right:8px;background:var(--green);color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;">QC ✓</div>' : ''}
        <button class="fav-btn ${saved ? 'active' : ''}" onclick="toggleSavedFromCard(event, '${encoded}')" aria-label="Favourite item">
          ${saved ? '♥' : '♡'}
        </button>
      </div>
      <div class="cat-card-info">
        <div class="cat-card-name" title="${esc(p.name)}">${esc(p.name)}</div>
        <div class="cat-card-seller">${esc(p.seller || 'Unknown')}</div>
        <div class="cat-card-meta">
          <span class="cat-card-price">${fmt(p.price)}</span>
          <a href="${esc(p.link)}" target="_blank" onclick="event.stopPropagation()" class="btn btn-primary" style="font-size:11px;padding:4px 10px;height:auto">View →</a>
        </div>
      </div>
    </div>
  `;
}


function renderCatalogueCards() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const catMap = {
    clothes: ['clothes'],
    shoes: ['shoes'],
    accessories: ['accessories'],
    electronics: ['electronics'],
    hoodies: ['hoodies'],
    jackets: ['jackets'],
  };

  let filtered = PRODUCTS.filter(p => {
    const category = String(p.category || '').toLowerCase();
    const queryBlob = `${p.name || ''} ${p.seller || ''} ${p.category || ''}`.toLowerCase();

    const catMatch =
      catState.cat === 'all' ||
      (catMap[catState.cat] || [catState.cat]).includes(category);

    const qMatch =
      !catState.q || queryBlob.includes(catState.q.toLowerCase());

    return catMatch && qMatch;
  });

  if (catState.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (catState.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (catState.sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const count = document.getElementById('catalogueCount');
  if (count) count.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  const badge = document.getElementById('badgeProducts');
  if (badge) badge.textContent = `${PRODUCTS.length.toLocaleString()} total`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">No products found</div>
        <button class="btn btn-ghost" onclick="
          catState.q='';
          catState.cat='all';
          document.getElementById('catalogueSearch').value='';
          document.querySelectorAll('.filter-chip').forEach((c,i)=>c.classList.toggle('active', i===0));
          renderCatalogueCards();
        ">Clear filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(catCardHtml).join('');
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
      return `<div class="seller-card">
        <div class="sc-avatar">${sellerAvatarHtml(s)}</div>
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
  if(!ANNOUNCEMENTS.length) {
    list.innerHTML='<div class="empty-state"><div class="empty-icon">📣</div><div class="empty-text">No announcements yet. Check back soon!</div></div>';
    return;
  }
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
  if(!ALERTS.length) {
    list.innerHTML='<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-text">No alerts right now. Everything looks good!</div></div>';
    return;
  }
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

/* ── Welcome Popup ── */
function initCoupon() {
  const modal = $('#couponModal');
  if (!modal) return;
  const settings = JSON.parse(localStorage.getItem('rt_settings')||'{}');
  if (settings.coupon === false) return;
  const dismissed = localStorage.getItem('rt_coupon_dismissed');
  if (dismissed) return;
  const coupons = getActiveCoupons().filter(c => c.enabled);
  const coupon = coupons[0] || { title:'Welcome to REP•TARO!', message:'Use the invite code below to register.', code: SITE.inviteCode, url: SITE.coupon.url, button:'Register Now' };

  let step = 1; // 1=platform, 2=main coupon

  function renderStep() {
    const box = modal.querySelector('.coupon-box');
    if (!box) return;

    if (step === 1) {
      // Platform selection: PC or Mobile
      box.innerHTML = `
        <div class="coupon-bg"></div>
        <button class="coupon-x" onclick="document.getElementById('couponModal').classList.remove('active')">✕</button>
        <div class="coupon-inner" style="text-align:center;">
          <div class="coupon-tag">👋 Welcome to REP•TARO</div>
          <h3 style="margin-bottom:6px;">How are you browsing?</h3>
          <p style="font-size:13px;opacity:0.8;margin-bottom:20px;">We'll tailor your experience for you</p>
          <div style="display:flex;gap:14px;justify-content:center;margin-bottom:20px;">
            <button class="platform-big-btn" onclick="pickPlatform('desktop')">
              <span style="font-size:40px;">🖥️</span>
              <span style="font-weight:800;font-size:15px;">Desktop</span>
              <span style="font-size:11px;opacity:0.7;">PC / Mac</span>
            </button>
            <button class="platform-big-btn" onclick="pickPlatform('mobile')">
              <span style="font-size:40px;">📱</span>
              <span style="font-weight:800;font-size:15px;">Mobile</span>
              <span style="font-size:11px;opacity:0.7;">Phone / Tablet</span>
            </button>
          </div>
        </div>`;
    } else {
      // Main coupon: language, currency, invite code, discord
      const langOpts = Object.entries(LANG_LABELS).map(([code,label])=>
        `<option value="${code}" ${activeLang===code?'selected':''}>${label}</option>`).join('');
      const currOpts = Object.entries(SYMBOLS).map(([code,sym])=>
        `<option value="${code}" ${activeCurrency===code?'selected':''}>${sym} ${code}</option>`).join('');

      box.innerHTML = `
        <div class="coupon-bg"></div>
        <button class="coupon-x" id="couponClose">✕</button>
        <div class="coupon-inner">
          <div class="coupon-tag">🎁 Special Offer</div>
          <h3>${coupon.title}</h3>
          <p>${coupon.message}</p>

          <div class="coupon-selects-row">
            <div class="coupon-select-wrap">
              <label>🌍 Language</label>
              <select id="couponLangSel" class="coupon-sel">${langOpts}</select>
            </div>
            <div class="coupon-select-wrap">
              <label>💱 Currency</label>
              <select id="couponCurrSel" class="coupon-sel">${currOpts}</select>
            </div>
          </div>

          <div class="coupon-code-box">
            <span id="couponCodeDisplay">${coupon.code}</span>
            <button class="copy-btn" id="copyCodeBtn">${t('copy')}</button>
          </div>

          <div class="coupon-actions" style="flex-direction:column;gap:8px;margin-top:14px;">
            <button class="c-btn-white" id="couponGo">${coupon.button}</button>
            <a href="https://discord.gg/PEWPebhG" target="_blank" class="c-btn-discord" id="discordJoin">
              <svg width="18" height="14" viewBox="0 0 24 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 5.833-.32 10.034.099 14.181a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 11.578c-1.183 0-2.157-1.086-2.157-2.419 0-1.332.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.332.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z"/></svg>
              Join our Discord
            </a>
            <button class="c-btn-outline c-btn-sm" id="couponDismiss">${t('dismiss')}</button>
          </div>
        </div>`;

      // Language change
      document.getElementById('couponLangSel')?.addEventListener('change', e => {
        setLang(e.target.value);
      });
      // Currency change
      document.getElementById('couponCurrSel')?.addEventListener('change', e => {
        setActiveCurrency(e.target.value);
      });
      box.querySelector('#couponClose')?.addEventListener('click',()=>modal.classList.remove('active'));
      box.querySelector('#copyCodeBtn')?.addEventListener('click',()=>{
        navigator.clipboard?.writeText(coupon.code).then(()=>toast('Code copied! 📋')).catch(()=>{});
      });
      box.querySelector('#couponGo')?.addEventListener('click',()=>{
        window.open(coupon.url,'_blank'); modal.classList.remove('active');
      });
      box.querySelector('#couponDismiss')?.addEventListener('click',()=>{
        localStorage.setItem('rt_coupon_dismissed','1'); modal.classList.remove('active');
      });
    }
  }

  window.pickPlatform = function(type) {
    localStorage.setItem('rt_platform', type);
    step = 2;
    renderStep();
  };

  modal.addEventListener('click',(e)=>{if(e.target===modal)modal.classList.remove('active');});
  renderStep();
  setTimeout(()=>{modal.classList.add('active');},1000);
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

/* ── Scrolling Category Marquee ── */
function buildCategoryMarquee() {
  const el = $('#categoryMarquee');
  if (!el) return;
  
  const categoryGroups = {
    'shoes': { name: 'SHOES', icon: '👟', products: [] },
    'hoodies': { name: 'HOODIES', icon: '🧥', products: [] },
    'jackets': { name: 'JACKETS', icon: '🧥', products: [] },
    'accessories': { name: 'ACCESSORIES', icon: '⌚', products: [] },
    'clothes': { name: 'CLOTHES', icon: '👕', products: [] },
    'electronics': { name: 'ELECTRONICS', icon: '🎧', products: [] }
  };
  
  PRODUCTS.forEach(p => {
    const cat = (p.category || '').toLowerCase();
    if (categoryGroups[cat]) categoryGroups[cat].products.push(p);
  });
  
  const rows = Object.entries(categoryGroups)
    .filter(([_, data]) => data.products.length > 0)
    .map(([cat, data]) => {
      const items = [...data.products.slice(0, 12), ...data.products.slice(0, 12)];
      return `
        <div class="category-row">
          <div class="category-row-header">
            <h3>${data.icon} ${data.name}</h3>
            <a href="catalogue.html?category=${cat}" class="view-all-link">View All →</a>
          </div>
          <div class="category-row-track">
            ${items.map(p => `
              <div class="marquee-item" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
                <div class="marquee-item-name">${esc(p.name)}</div>
                <div class="marquee-item-price">${fmt(p.price)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  
  el.innerHTML = rows;
  
  document.querySelectorAll('.category-row-track').forEach(track => {
    track.parentElement.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    track.parentElement.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  });
}

/* ── Featured Grid (home page) ── */
function buildFeaturedGrid() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = PRODUCTS.filter(p => p.featured).slice(0, 12);
  if (!featured.length) { grid.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">No featured products yet.</div>'; return; }
  grid.innerHTML = featured.map(p => {
    const cat = (p.category || '').toLowerCase();
    const bg = CAT_BG[cat] || 'linear-gradient(135deg,#e2e8f0,#cbd5e1)';
    const emoji = CAT_EMOJI[cat] || '📦';
    return `<div class="product-card" onclick="openProductModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">
      <div class="product-thumb" style="background:${bg};position:relative;overflow:hidden;">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.querySelector('.pf').style.display='flex'">` : ''}
        <div class="pf" style="display:${p.image?'none':'flex'};position:absolute;inset:0;align-items:center;justify-content:center;font-size:36px;">${emoji}</div>
      </div>
      <div class="product-info">
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-price">${fmt(p.price)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── Maintenance Mode ── */
function checkMaintenanceMode() {
  const settings = JSON.parse(localStorage.getItem('rt_settings') || '{}');
  if (!settings.maintenance) return;
  if (document.body.dataset.page === 'admin') return;
  // Show maintenance overlay
  const banner = document.createElement('div');
  banner.id = 'maintenanceBanner';
  banner.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0f172a,#1e3a8a);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:white;padding:40px;';
  banner.innerHTML = `
    <div style="font-size:64px;margin-bottom:24px;">🔧</div>
    <h1 style="font-family:Outfit,sans-serif;font-size:32px;font-weight:900;margin-bottom:12px;">Under Maintenance</h1>
    <p style="color:rgba(255,255,255,0.7);max-width:400px;font-size:16px;line-height:1.6;">REP•TARO is currently undergoing scheduled maintenance. We'll be back shortly!</p>
    <div style="margin-top:32px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:16px 28px;font-size:14px;color:rgba(255,255,255,0.6);">Staff? <a href="admin.html" style="color:#60a5fa;font-weight:700;">Go to Admin Panel →</a></div>
  `;
  document.body.appendChild(banner);
}

/* ── Coupon helpers ── */
function getActiveCoupons() {
  const stored = localStorage.getItem('rt_coupons');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  // Default single coupon from SITE config
  return [{
    id: 'c_default',
    enabled: SITE.coupon.enabled,
    title: SITE.coupon.title,
    message: SITE.coupon.message,
    code: SITE.inviteCode,
    url: SITE.coupon.url,
    button: SITE.coupon.button,
  }];
}

/* ── Sellers Page avatar fix ── */
function sellerAvatarHtml(s) {
  if (s.logo && s.logo.trim() && !s.logo.startsWith('data:image/jpeg;base64')) {
    return `<img src="${esc(s.logo)}" alt="${esc(s.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-weight:700">${s.name.substring(0,2).toUpperCase()}</span>`;
  }
  return `<span style="font-weight:700">${s.name.substring(0,2).toUpperCase()}</span>`;
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadData();
  checkMaintenanceMode();
  updateStats();
  buildFeaturedGrid();
  buildSellerPanel();
  buildCategoryMarquee();
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
