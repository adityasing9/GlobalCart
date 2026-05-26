/* ═══════════════════════════════════════════
   GLOBALCART — SPA JavaScript Engine
   ═══════════════════════════════════════════ */

/* ── State ── */
let currentUser = null;
let cartCount = 0;
let searchTimeout = null;

/* ── API Helper ── */
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const themeBtn =
  document.getElementById(
    "themeToggle"
  );

if (
  localStorage.getItem(
    "theme"
  ) === "dark"
) {
  document.body.classList
    .add("dark");
}

themeBtn?.addEventListener(
  "click",
  () => {

    document.body.classList
      .toggle(
        "dark"
      );

    localStorage.setItem(
      "theme",

      document.body.classList
        .contains(
          "dark"
        )

        ? "dark"
        : "light"

    );

  });

/* ── Router ── */
const routes = {
  '/': renderHome,
  '/products': renderProducts,
  '/cart': renderCart,
  '/checkout': renderCheckout,
  '/orders': renderOrders,
  '/login': renderLogin,
  '/register': renderRegister,
  '/admin': renderAdmin,
};

async function navigate(path, pushState = true) {
  if (pushState) history.pushState({}, '', path);
  const app = document.getElementById('app');
  app.innerHTML = '<div class="page-loader"><div class="loader-ring"></div></div>';

  // Product detail route
  const productMatch = path.match(/^\/product\/(\d+)$/);
  if (productMatch) {
    await renderProductDetail(parseInt(productMatch[1]));
    return;
  }

  const handler = routes[path] || renderHome;
  try {
    await handler();
    updateNavActive(path);
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p>${e.message}</p></div>`;
  }
}

window.addEventListener('popstate', () => navigate(location.pathname, false));

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', scrollY > 20);
  });
  // Load user
  await refreshUser();
  await refreshCartBadge();
  await navigate(location.pathname, false);
});

function updateNavActive(path) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/* ── User State ── */
async function refreshUser() {
  try {
    const d = await api('GET', '/auth/me');
    currentUser = d.user;
  } catch { currentUser = null; }
  updateAuthUI();
}

function updateAuthUI() {
  const authArea = document.getElementById('authArea');
  const userArea = document.getElementById('userArea');
  const navOrders = document.getElementById('navOrders');
  const navAdmin = document.getElementById('navAdmin');
  const userChip = document.getElementById('userChip');

  if (currentUser) {
    authArea.style.display = 'none';
    userArea.style.display = 'flex';
    userArea.style.alignItems = 'center';
    userArea.style.gap = '10px';
    userChip.textContent = '👤 ' + currentUser.username;
    navOrders.style.display = '';
    navAdmin.style.display = currentUser.role === 'admin' ? '' : 'none';
  } else {
    authArea.style.display = 'flex';
    authArea.style.gap = '8px';
    userArea.style.display = 'none';
    navOrders.style.display = 'none';
    navAdmin.style.display = 'none';
  }
}

async function logout() {
  await api('POST', '/auth/logout');
  currentUser = null;
  cartCount = 0;
  updateAuthUI();
  updateCartBadge(0);
  toast('Logged out successfully', 'info');
  navigate('/');
}

async function refreshCartBadge() {
  if (!currentUser) return;
  try {
    const d = await api('GET', '/cart/');
    updateCartBadge(d.count);
  } catch { }
}

function updateCartBadge(n) {
  cartCount = n;
  const badge = document.getElementById('cartBadge');
  badge.textContent = n;
  badge.style.display = n > 0 ? 'flex' : 'none';
}

/* ── Toast ── */
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('fadeOut');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ── Modal ── */
function openModal(content) {
  document.getElementById('modalBox').innerHTML = content;
  document.getElementById('modalBackdrop').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modalBackdrop').style.display = 'none';
}

/* ── Mobile Nav ── */
function toggleMobile() {
  document.getElementById('navLinks').classList.toggle('open');
}

/* ── Search ── */
function handleSearch(e) {
  clearTimeout(searchTimeout);
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    navigate('/products?search=' + encodeURIComponent(q));
  }
}

/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
async function renderHome() {
  const [prodData, catData] = await Promise.all([
    api('GET', '/products/?'),
    api('GET', '/products/categories/all')
  ]);
  const products = prodData.products.slice(0, 8);
  const cats = catData.categories;

  document.getElementById('app').innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-badge">✦ New Digital Products Weekly</div>
      <h1> <span class="highlight">GlobalCart</span><br>Digital Marketplace</h1>
      <p>Premium ebooks, notes, AI resources & career tools — instantly downloaded after purchase.</p>
      <div class="hero-actions">
        <a href="/products" onclick="navigate('/products')" class="btn-solid btn-lg">Browse Products</a>
        <a href="/register" onclick="navigate('/register')" class="btn-outline btn-lg">Start Free</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item"><div class="stat-num">12K+</div><div class="stat-label">Products Sold</div></div>
        <div class="stat-item"><div class="stat-num">500+</div><div class="stat-label">Digital Items</div></div>
        <div class="stat-item"><div class="stat-num">4.8★</div><div class="stat-label">Avg Rating</div></div>
        <div class="stat-item"><div class="stat-num">99%</div><div class="stat-label">Satisfaction</div></div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Browse by <span>Category</span></h2>
      </div>
      <div class="category-filter">
        ${cats.map(c => `
          <button class="cat-btn" onclick="navigate('/products?category=${c.slug}')">
            ${c.icon} ${c.name}
          </button>
        `).join('')}
      </div>
      <div class="section-header" style="margin-top:40px">
        <h2 class="section-title">🔥 <span>Trending</span> Products</h2>
        <a href="/products" onclick="navigate('/products')" class="btn-outline">View All →</a>
      </div>
      <div class="product-grid" id="homeGrid">
        ${products.map(p => renderProductCard(p)).join('')}
      </div>
    </section>
  `;
}

/* ══════════════════════════════════════════
   PRODUCTS PAGE
══════════════════════════════════════════ */
async function renderProducts() {
  const params = new URLSearchParams(location.search);
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  const [prodData, catData] = await Promise.all([
    api('GET', `/products/?category=${category}&search=${encodeURIComponent(search)}`),
    api('GET', '/products/categories/all')
  ]);

  document.getElementById('app').innerHTML = `
    <div style="margin-top:64px; padding:40px 24px 80px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div class="section-header" style="margin-bottom:24px">
          <h2 class="section-title">All <span>Products</span></h2>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="searchBox" class="form-input" placeholder="Search..." 
              value="${search}" style="width:220px;" onkeyup="liveSearch(event)">
          </div>
        </div>
        <div class="category-filter" id="catFilter">
          <button class="cat-btn ${!category ? 'active' : ''}" onclick="filterCat('')">All</button>
          ${catData.categories.map(c => `
            <button class="cat-btn ${category === c.slug ? 'active' : ''}" onclick="filterCat('${c.slug}')">
              ${c.icon} ${c.name}
            </button>
          `).join('')}
        </div>
        <p style="color:var(--text-3);font-size:13px;margin-bottom:24px;">
          ${prodData.products.length} product${prodData.products.length !== 1 ? 's' : ''} found
        </p>
        <div class="product-grid" id="productsGrid">
          ${prodData.products.length ? prodData.products.map(p => renderProductCard(p)).join('')
      : `<div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try a different search or category</p>
               </div>`}
        </div>
      </div>
    </div>
  `;
}

function filterCat(slug) {
  const search = document.getElementById('searchBox')?.value || '';
  navigate(`/products?category=${slug}&search=${encodeURIComponent(search)}`);
}

function liveSearch(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const params = new URLSearchParams(location.search);
    params.set('search', e.target.value);
    navigate('/products?' + params.toString());
  }, 400);
}

/* ── Product Card ── */
function renderProductCard(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  return `
    <div class="product-card" onclick="navigate('/product/${p.id}')">
      <div class="card-image-wrap">
        <img class="card-image" src="${p.image_url || 'https://via.placeholder.com/400x180?text=Product'}" 
             alt="${p.name}" onerror="this.src='https://via.placeholder.com/400x180?text=Product'">
        ${cats[0] ? `<span class="card-badge">${cats[0]}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-category">${cats[0] || 'Digital'}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-meta">
          <span class="card-rating">★ ${p.rating}</span>
          <span class="card-sales">${p.sales_count.toLocaleString()} sold</span>
        </div>
        <div class="card-footer">
          <div class="card-price"><span class="currency">₹</span>${p.price.toFixed(0)}</div>
          <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
            + Cart
          </button>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   PRODUCT DETAIL
══════════════════════════════════════════ */
async function renderProductDetail(id) {
  const { product: p } = await api('GET', `/products/${id}`);
  const cats = Array.isArray(p.categories) ? p.categories : [];

  document.getElementById('app').innerHTML = `
    <div class="product-detail">
      <div class="breadcrumb">
        <a href="/" onclick="navigate('/')">Home</a>
        <span class="sep">›</span>
        <a href="/products" onclick="navigate('/products')">Products</a>
        <span class="sep">›</span>
        <span class="current">${p.name}</span>
      </div>
      <div class="product-detail-grid">
        <div>
          <img class="detail-image" src="${p.image_url || 'https://via.placeholder.com/600x380?text=Product'}" 
               alt="${p.name}" onerror="this.src='https://via.placeholder.com/600x380?text=Product'">
        </div>
        <div class="detail-info">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${cats.map(c => `<span class="status-badge status-pending">${c}</span>`).join('')}
          </div>
          <h1 class="detail-title">${p.name}</h1>
          <div class="detail-rating">
            <span class="stars">${'★'.repeat(Math.round(p.rating))}</span>
            <span>${p.rating} rating</span>
            <span>·</span>
            <span>${p.sales_count.toLocaleString()} sold</span>
          </div>
          <p class="detail-desc">${p.description || 'Premium digital product. Instant download after purchase.'}</p>
          <div class="detail-price">₹${p.price.toFixed(0)}</div>
          <div style="background:var(--bg-3);border:1px solid var(--glass-border);border-radius:10px;padding:14px;">
            <div style="font-size:13px;color:var(--text-3);margin-bottom:8px;">What you'll get</div>
            <div style="font-size:14px;display:flex;flex-direction:column;gap:6px;">
              <span>📁 Instant digital download</span>
              <span>♾ Lifetime access</span>
              <span>🔒 Secure payment</span>
              <span>📱 Access on any device</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn-solid btn-lg" style="flex:1" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
              🛒 Add to Cart
            </button>
            <button class="btn-outline btn-lg" onclick="buyNow(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function buyNow(id, name) {
  await addToCart(id, name, false);
  navigate('/cart');
}

/* ══════════════════════════════════════════
   CART
══════════════════════════════════════════ */
async function addToCart(productId, name, showToast = true) {
  if (!currentUser) {
    toast('Please login to add to cart', 'error');
    navigate('/login');
    return;
  }
  try {
    await api('POST', '/cart/add', { product_id: productId, quantity: 1 });
    await refreshCartBadge();
    if (showToast) toast(`"${name}" added to cart!`, 'success');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function renderCart() {
  if (!currentUser) { navigate('/login'); return; }
  const { items, total, count } = await api('GET', '/cart/');

  document.getElementById('app').innerHTML = `
    <div class="cart-page">
      <h2 class="section-title" style="margin-bottom:8px">Your <span>Cart</span></h2>
      <p style="color:var(--text-3);font-size:14px;margin-bottom:0">${count} item${count !== 1 ? 's' : ''}</p>
      ${!items.length ? `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Discover amazing digital products</p>
          <button class="btn-solid btn-lg" onclick="navigate('/products')">Browse Products</button>
        </div>
      ` : `
        <div class="cart-grid">
          <div class="cart-items">
            ${items.map(item => `
              <div class="cart-item" id="ci-${item.id}">
                <img class="cart-item-img" src="${item.image_url || 'https://via.placeholder.com/80x60'}" 
                     alt="${item.name}" onerror="this.src='https://via.placeholder.com/80x60'">
                <div class="cart-item-info">
                  <div class="cart-item-name">${item.name}</div>
                  <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                </div>
                <div class="qty-control">
                  <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity - 1})">−</button>
                  <span class="qty-num">${item.quantity}</span>
                  <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div style="font-weight:700;min-width:80px;text-align:right;">₹${item.subtotal.toFixed(2)}</div>
                <button class="btn-danger" onclick="removeFromCart(${item.id})">✕</button>
              </div>
            `).join('')}
          </div>
          <div>
            <div class="order-summary">
              <div class="summary-title">Order Summary</div>
              ${items.map(i => `
                <div class="summary-row">
                  <span style="color:var(--text-2);font-size:13px">${i.name} × ${i.quantity}</span>
                  <span>₹${i.subtotal.toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="summary-total">
                <span>Total</span>
                <span class="amount">₹${total.toFixed(2)}</span>
              </div>
              <button class="btn-solid btn-lg" style="width:100%;margin-top:20px" onclick="navigate('/checkout')">
                Proceed to Checkout →
              </button>
              <button class="btn-outline" style="width:100%;margin-top:8px" onclick="navigate('/products')">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

async function updateQty(cartId, qty) {
  try {
    await api('PUT', '/cart/update', { cart_id: cartId, quantity: qty });
    await refreshCartBadge();
    await renderCart();
  } catch (e) { toast(e.message, 'error'); }
}

async function removeFromCart(cartId) {
  try {
    await api('DELETE', `/cart/remove/${cartId}`);
    await refreshCartBadge();
    toast('Item removed', 'info');
    await renderCart();
  } catch (e) { toast(e.message, 'error'); }
}

/* ══════════════════════════════════════════
   CHECKOUT
══════════════════════════════════════════ */
async function renderCheckout() {
  if (!currentUser) { navigate('/login'); return; }
  const { items, total } = await api('GET', '/cart/');
  if (!items.length) { navigate('/cart'); return; }

  document.getElementById('app').innerHTML = `
    <div class="checkout-page">
      <h2 class="section-title" style="margin-bottom:32px">Checkout</h2>
      <div class="checkout-grid">
        <div>
          <div class="panel">
            <div class="panel-title">Select Payment Method</div>
            <div class="payment-options">
              <div class="pay-option selected" id="po-razorpay" onclick="selectPay('razorpay')">
                <div class="pay-icon">🏦</div>
                <div class="pay-name">Razorpay</div>
                <div class="pay-sub">India — UPI, Cards, Net Banking</div>
              </div>
              <div class="pay-option" id="po-khalti" onclick="selectPay('khalti')">
                <div class="pay-icon">🔮</div>
                <div class="pay-name">Khalti</div>
                <div class="pay-sub">Nepal — Digital Wallet</div>
              </div>
              <div class="pay-option" id="po-card" onclick="selectPay('card')">
                <div class="pay-icon">💳</div>
                <div class="pay-name">Card</div>
                <div class="pay-sub">International — Visa, Mastercard</div>
              </div>
              <div class="pay-option" id="po-crypto" onclick="selectPay('crypto')">
                <div class="pay-icon">₿</div>
                <div class="pay-name">Crypto</div>
                <div class="pay-sub">BTC, ETH, USDT</div>
              </div>
            </div>

            <div id="paymentForm" style="margin-top:20px">
              <!-- Dynamic based on selection -->
            </div>
          </div>
        </div>

        <div>
          <div class="order-summary">
            <div class="summary-title">Order Summary</div>
            ${items.map(i => `
              <div class="summary-row">
                <span style="color:var(--text-2);font-size:13px">${i.name}</span>
                <span>₹${i.subtotal.toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="summary-total">
              <span>Total</span>
              <span class="amount">₹${total.toFixed(2)}</span>
            </div>
            <button class="btn-solid btn-lg" style="width:100%;margin-top:20px" 
                    id="payBtn" onclick="processPayment(${total})">
              Pay ₹${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render initial form
  window._selectedGateway = 'razorpay';
  renderPaymentForm('razorpay');
}

function selectPay(gateway) {
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('po-' + gateway).classList.add('selected');
  window._selectedGateway = gateway;
  renderPaymentForm(gateway);
}

function renderPaymentForm(gateway) {
  const container = document.getElementById('paymentForm');
  const forms = {
    razorpay: `
      <div class="form-group">
        <label class="form-label">UPI ID / Phone</label>
        <input class="form-input" placeholder="yourname@upi or 9876543210" id="pf-upi">
      </div>
      <p style="color:var(--text-3);font-size:12px;margin-top:4px;">🔒 Test mode — no real charges</p>`,
    khalti: `
      <div class="form-group">
        <label class="form-label">Khalti ID</label>
        <input class="form-input" placeholder="Khalti username or mobile" id="pf-khalti">
      </div>
      <p style="color:var(--text-3);font-size:12px;margin-top:4px;">🔮 Simulated — test mode</p>`,
    card: `
      <div class="form-group">
        <label class="form-label">Card Number</label>
        <input class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" id="pf-card" oninput="formatCard(this)">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Expiry</label>
          <input class="form-input" placeholder="MM/YY" maxlength="5" id="pf-exp">
        </div>
        <div class="form-group">
          <label class="form-label">CVV</label>
          <input class="form-input" placeholder="123" maxlength="3" id="pf-cvv" type="password">
        </div>
      </div>
      <p style="color:var(--text-3);font-size:12px;margin-top:4px;">💳 Simulated — no real charge</p>`,
    crypto: `
      <div style="background:var(--bg-3);border:1px solid var(--glass-border);border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:13px;color:var(--text-3);margin-bottom:8px">Send to wallet address</div>
        <div style="font-family:monospace;font-size:12px;color:var(--accent);word-break:break-all;background:var(--bg-2);padding:10px;border-radius:8px;">
          0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-top:8px;">₿ BTC · Ξ ETH · ₮ USDT accepted</div>
      </div>`
  };
  container.innerHTML = forms[gateway] || '';
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

async function processPayment(total) {
  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    // 1. Create order
    const orderData = await api('POST', '/orders/create');
    const orderId = orderData.order_id;

    // 2. Initiate payment
    const payData = await api('POST', '/payments/initiate', {
      order_id: orderId,
      gateway: window._selectedGateway,
      currency: window._selectedGateway === 'khalti' ? 'NPR' : 'INR'
    });

    // Simulate a brief "payment processing" animation
    btn.textContent = 'Verifying...';
    await new Promise(r => setTimeout(r, 1500));

    // 3. Confirm payment
    const confirmData = await api('POST', '/payments/confirm', {
      payment_id: payData.payment_id,
      transaction_id: payData.transaction_id
    });

    await refreshCartBadge();
    renderPaymentSuccess(confirmData);

  } catch (e) {
    btn.disabled = false;
    btn.textContent = `Pay ₹${total.toFixed(2)}`;
    toast(e.message, 'error');
  }
}

function renderPaymentSuccess(data) {
  document.getElementById('app').innerHTML = `
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon">✓</div>
        <div class="success-title">Payment Successful!</div>
        <p style="color:var(--text-2);margin-bottom:4px">Order #${data.order_id} confirmed</p>
        <p style="color:var(--text-3);font-size:13px">Your digital products are ready to download</p>
        
        <div class="downloads-list">
          ${data.downloads.map(item => `
            <div class="download-item">
              <div>
                <div class="download-name">${item.name}</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">Qty: ${item.quantity}</div>
              </div>
              <a class="download-btn" href="${item.file_url || '#'}" download>
                ⬇ Download
              </a>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">
          <button class="btn-outline" onclick="navigate('/orders')">View Orders</button>
          <button class="btn-solid" onclick="navigate('/products')">Shop More</button>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   ORDERS
══════════════════════════════════════════ */
async function renderOrders() {
  if (!currentUser) { navigate('/login'); return; }
  const { orders } = await api('GET', '/orders/');

  document.getElementById('app').innerHTML = `
    <div class="orders-page">
      <h2 class="section-title" style="margin-bottom:32px">My <span>Orders</span></h2>
      ${!orders.length ? `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here</p>
          <button class="btn-solid btn-lg" onclick="navigate('/products')">Browse Products</button>
        </div>
      ` : orders.map(order => `
        <div class="order-card">
          <div class="order-header">
            <div>
              <div class="order-id">Order #${order.id}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">
                ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span class="status-badge ${order.status === 'Confirmed' ? 'status-confirmed' : order.status === 'Cancelled' ? 'status-cancelled' : 'status-pending'}">
                ${order.status === 'Confirmed' ? '✓' : '○'} ${order.status}
              </span>
              <span style="font-family:var(--font-display);font-weight:700;color:var(--accent)">
                ₹${order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
          <div class="order-body">
            ${order.gateway ? `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span class="status-badge ${order.payment_status === 'Success' ? 'status-success' : 'status-pending'}">
                  💳 ${order.gateway} · ${order.payment_status || 'Pending'}
                </span>
              </div>` : ''}
            <div class="order-items-list">
              ${order.items.map(item => `
                <div class="order-item">
                  <img src="${item.image_url || 'https://via.placeholder.com/50x40'}" alt="${item.name}"
                       onerror="this.src='https://via.placeholder.com/50x40'">
                  <div class="order-item-name">${item.name}</div>
                  <div style="font-size:12px;color:var(--text-3)">×${item.quantity}</div>
                  <div style="font-weight:600;font-size:13px;">₹${(item.unit_price * item.quantity).toFixed(2)}</div>
                  ${order.status === 'Confirmed' ? `
                    <a class="download-btn" href="${item.file_url || '#'}" download>⬇ Download</a>
                  ` : `<span style="font-size:12px;color:var(--text-3)">Pending payment</span>`}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
async function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-mark">GC</div>
        </div>
        <div class="auth-title">Welcome Back</div>
        <div class="auth-sub">Sign in to your GlobalCart account</div>
        <div id="authError" style="display:none;background:rgba(255,82,82,0.1);border:1px solid rgba(255,82,82,0.3);border-radius:10px;padding:12px;font-size:13px;color:var(--error);margin-bottom:16px;"></div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="loginEmail" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="loginPw" placeholder="••••••••" onkeyup="if(event.key==='Enter')doLogin()">
        </div>
        <button class="btn-solid btn-lg" style="width:100%;margin-top:8px" onclick="doLogin()" id="loginBtn">
          Sign In
        </button>
        <div class="auth-footer">
          Don't have an account? <a href="/register" onclick="navigate('/register')">Sign up</a>
        </div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--glass-border)">
          <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:10px;">Demo credentials</div>
          <div style="background:var(--bg-3);border-radius:8px;padding:10px;font-size:12px;font-family:monospace;color:var(--text-2);">
            Admin: admin@globalcart.com / admin123
          </div>
        </div>
      </div>
    </div>
  `;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPw').value;
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('loginBtn');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  try {
    const d = await api('POST', '/auth/login', { email, password: pw });
    currentUser = d.user;
    updateAuthUI();
    await refreshCartBadge();
    toast(`Welcome back, ${d.user.username}! 👋`, 'success');
    navigate(d.user.role === 'admin' ? '/admin' : '/');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-mark">GC</div>
        </div>
        <div class="auth-title">Create Account</div>
        <div class="auth-sub">Join thousands of digital learners</div>
        <div id="authError" style="display:none;background:rgba(255,82,82,0.1);border:1px solid rgba(255,82,82,0.3);border-radius:10px;padding:12px;font-size:13px;color:var(--error);margin-bottom:16px;"></div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="regUser" placeholder="cooldev42">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="regEmail" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="regPw" placeholder="Min. 6 characters" onkeyup="if(event.key==='Enter')doRegister()">
        </div>
        <button class="btn-solid btn-lg" style="width:100%;margin-top:8px" onclick="doRegister()" id="regBtn">
          Create Account
        </button>
        <div class="auth-footer">
          Already have an account? <a href="/login" onclick="navigate('/login')">Sign in</a>
        </div>
      </div>
    </div>
  `;
}

async function doRegister() {
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPw').value;
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('regBtn');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Creating...';
  try {
    const d = await api('POST', '/auth/register', { username, email, password });
    currentUser = d.user;
    updateAuthUI();
    toast(`Welcome to GlobalCart, ${d.user.username}! 🎉`, 'success');
    navigate('/');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
async function renderAdmin() {
  if (!currentUser || currentUser.role !== 'admin') {
    toast('Admin access required', 'error');
    navigate('/');
    return;
  }

  const [prodData, orderData] = await Promise.all([
    api('GET', '/products/?'),
    api('GET', '/orders/')
  ]);

  const products = prodData.products;
  const orders = orderData.orders;
  const totalRevenue = orders.filter(o => o.status === 'Confirmed')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;

  document.getElementById('app').innerHTML = `
    <div class="admin-page">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <h2 class="section-title">Admin <span>Dashboard</span></h2>
        <button class="btn-solid" onclick="openAddProduct()">+ Add Product</button>
      </div>

      <div class="admin-stats-grid">
        <div class="stat-card">
          <div class="stat-card-label">Total Revenue</div>
          <div class="stat-card-value">₹${totalRevenue.toFixed(0)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Total Orders</div>
          <div class="stat-card-value">${orders.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Confirmed</div>
          <div class="stat-card-value">${confirmedOrders}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Products</div>
          <div class="stat-card-value">${products.length}</div>
        </div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab active" onclick="showAdminTab('products', this)">Products</button>
        <button class="admin-tab" onclick="showAdminTab('orders', this)">Orders</button>
      </div>

      <div id="adminTabProducts">
        <table class="admin-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Price</th><th>Sales</th><th>Rating</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td><img src="${p.image_url}" alt="" onerror="this.style.display='none'"></td>
                <td style="font-weight:500;max-width:200px">${p.name}</td>
                <td style="color:var(--accent);font-weight:600">₹${p.price}</td>
                <td style="color:var(--text-2)">${p.sales_count}</td>
                <td style="color:var(--accent)">★ ${p.rating}</td>
                <td>
                  <div style="display:flex;gap:8px;">
                    <button class="btn-outline" style="font-size:12px;padding:5px 10px" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="adminTabOrders" style="display:none">
        <table class="admin-table">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td style="font-weight:600">#${o.id}</td>
                <td>${o.username || 'User'}<br><span style="font-size:12px;color:var(--text-3)">${o.email || ''}</span></td>
                <td style="font-weight:600;color:var(--accent)">₹${o.total_amount.toFixed(2)}</td>
                <td style="font-size:13px;color:var(--text-2)">${o.gateway || '—'}</td>
                <td><span class="status-badge ${o.status === 'Confirmed' ? 'status-confirmed' : 'status-pending'}">${o.status}</span></td>
                <td style="font-size:13px;color:var(--text-3)">${new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('adminTabProducts').style.display = tab === 'products' ? '' : 'none';
  document.getElementById('adminTabOrders').style.display = tab === 'orders' ? '' : 'none';
}

async function openAddProduct() {
  const { categories } = await api('GET', '/products/categories/all');
  openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div class="modal-title">Add New Product</div>
      <button class="modal-close-btn" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input class="form-input" id="mp-name" placeholder="e.g. Python Crash Course">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-input" id="mp-desc" rows="3" placeholder="Describe the product..."></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Price (₹)</label>
        <input class="form-input" id="mp-price" type="number" placeholder="299">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-input" id="mp-cat">
          ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Image URL</label>
      <input class="form-input" id="mp-img" placeholder="https://...">
    </div>
    <div class="form-group">
      <label class="form-label">File URL / Download Path</label>
      <input class="form-input" id="mp-file" placeholder="/downloads/product.pdf">
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-solid" onclick="submitAddProduct()">Add Product</button>
    </div>
  `);
}

async function submitAddProduct() {
  try {
    await api('POST', '/products/', {
      name: document.getElementById('mp-name').value,
      description: document.getElementById('mp-desc').value,
      price: parseFloat(document.getElementById('mp-price').value),
      image_url: document.getElementById('mp-img').value,
      file_url: document.getElementById('mp-file').value,
      category_ids: [parseInt(document.getElementById('mp-cat').value)]
    });
    closeModal();
    toast('Product added successfully!', 'success');
    await renderAdmin();
  } catch (e) { toast(e.message, 'error'); }
}

async function editProduct(id) {
  const { product: p } = await api('GET', `/products/${id}`);
  openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div class="modal-title">Edit Product</div>
      <button class="modal-close-btn" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input class="form-input" id="ep-name" value="${p.name}">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-input" id="ep-desc" rows="3">${p.description || ''}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Price (₹)</label>
        <input class="form-input" id="ep-price" type="number" value="${p.price}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Image URL</label>
      <input class="form-input" id="ep-img" value="${p.image_url || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">File URL</label>
      <input class="form-input" id="ep-file" value="${p.file_url || ''}">
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-solid" onclick="submitEditProduct(${id})">Save Changes</button>
    </div>
  `);
}

async function submitEditProduct(id) {
  try {
    await api('PUT', `/products/${id}`, {
      name: document.getElementById('ep-name').value,
      description: document.getElementById('ep-desc').value,
      price: parseFloat(document.getElementById('ep-price').value),
      image_url: document.getElementById('ep-img').value,
      file_url: document.getElementById('ep-file').value
    });
    closeModal();
    toast('Product updated!', 'success');
    await renderAdmin();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/products/${id}`);
    toast('Product deleted', 'info');
    await renderAdmin();
  } catch (e) { toast(e.message, 'error'); }
}
