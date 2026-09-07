/* ============================================
   ADMIN PANEL - STEM IoT Shop
   Auth + UI Helpers (dữ liệu thật nằm trong store.js dùng chung)
   ============================================ */

// ============== AUTH ==============
const AUTH_KEY = 'stem_admin_auth';

const ADMIN_ACCOUNT = {
  username: 'admin',
  password: 'admin123',
  name: 'Administrator',
  role: 'Super Admin',
  avatar: 'AD'
};

function login(username, password) {
  if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
    const session = { ...ADMIN_ACCOUNT, username, loginAt: Date.now() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

function requireAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    window.location.href = 'login.html';
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    logout();
    return null;
  }
}

function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ============== DATA (dùng store.js dùng chung — KHÔNG còn data giả riêng) ==============
function getData(key, fallback = []) {
  switch (key) {
    case 'products': return getStoreProducts();
    case 'orders': return getStoreOrders();
    case 'users': return getStoreUsers();
    case 'cart': return getStoreCart();
    case 'categories': return STORE_CATEGORIES;
    default: return fallback;
  }
}

function setData(key, data) {
  switch (key) {
    case 'products': saveStoreProducts(data); notifyStoreChanged(); break;
    case 'orders': saveStoreOrders(data); notifyStoreChanged(); break;
    case 'users': saveStoreUsers(data); notifyStoreChanged(); break;
    case 'cart': writeJSON(STORE_KEYS.cart, data); notifyStoreChanged(); break;
  }
}

function initData() { /* dữ liệu thật tự khởi tạo trong store.js — không cần seed giả */ }

function resetData() {
  resetStore();
  showToast('Đã reset về dữ liệu gốc', 'success');
  setTimeout(() => window.location.reload(), 600);
}

// ============== FORMATTERS ==============
function fmtVND(n) {
  if (n == null || isNaN(n)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function fmtDate(t) {
  if (!t) return '-';
  const d = new Date(t);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(t) {
  if (!t) return '-';
  const d = new Date(t);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(t) {
  if (!t) return '-';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return d + ' ngày trước';
  if (h > 0) return h + ' giờ trước';
  if (m > 0) return m + ' phút trước';
  return 'Vừa xong';
}

function escapeHtml(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Lấy tên hiển thị của sản phẩm (name có thể là object đa ngôn ngữ hoặc string)
function prodName(p) {
  if (p == null) return '';
  if (typeof p.name === 'string') return p.name;
  return p.name.vi || p.name.en || p.name.ja || '';
}

function prodDesc(p) {
  if (p == null) return '';
  if (typeof p.description === 'string') return p.description;
  return (p.description && (p.description.vi || p.description.en)) || '';
}
// ============== STATUS BADGES ==============
const ORDER_STATUS = {
  pending: { label: 'Chờ xử lý', cls: 'badge-warning' },
  processing: { label: 'Đang xử lý', cls: 'badge-info' },
  shipping: { label: 'Đang giao', cls: 'badge-info' },
  completed: { label: 'Hoàn thành', cls: 'badge-success' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' }
};

const PAYMENT_STATUS = {
  paid: { label: 'Đã thanh toán', cls: 'badge-success' },
  unpaid: { label: 'Chưa thanh toán', cls: 'badge-warning' },
  refunded: { label: 'Đã hoàn tiền', cls: 'badge-info' }
};

const USER_STATUS = {
  active: { label: 'Hoạt động', cls: 'badge-success' },
  inactive: { label: 'Không hoạt động', cls: 'badge-danger' }
};

const USER_ROLE = {
  customer: { label: 'Khách hàng', cls: 'badge-info' },
  vip: { label: 'VIP', cls: 'badge-purple' },
  admin: { label: 'Admin', cls: 'badge-dark' }
};

function badge(status, type) {
  const map = {
    order: ORDER_STATUS,
    payment: PAYMENT_STATUS,
    user: USER_STATUS,
    role: USER_ROLE
  };
  const item = map[type] && map[type][status];
  if (!item) return `<span class="badge badge-gray"><span class="badge-dot"></span>${escapeHtml(status)}</span>`;
  return `<span class="badge ${item.cls}"><span class="badge-dot"></span>${item.label}</span>`;
}

// ============== TOAST ==============
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ============== MODAL ==============
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('show');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('show');
}

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('show');
  }
});

// ============== CONFIRM ==============
function confirmAction(message) {
  return window.confirm(message);
}

// ============== SIDEBAR ==============
function buildSidebar(active) {
  const session = getSession();
  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
      href: 'dashboard.html'
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      href: 'products.html'
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
      href: 'orders.html'
    },
    {
      id: 'users',
      label: 'Khách hàng',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      href: 'users.html'
    },
    {
      id: 'storefront',
      label: 'Xem cửa hàng',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
      href: '../index.html',
      target: '_blank'
    }
  ];

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="logo-mark">ST</div>
        <div>
          <h2>STEM IoT Admin</h2>
          <p>Quản trị SaaS</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${items.map(it => `
          <a href="${it.href}" class="${active === it.id ? 'active' : ''}" ${it.target ? `target="${it.target}" rel="noopener"` : ''}>
            <span class="nav-icon">${it.icon}</span>
            <span>${it.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        ${session ? `
          <div class="user-info">
            <div class="user-avatar">${session.avatar || 'AD'}</div>
            <div class="user-meta">
              <div class="name">${escapeHtml(session.name)}</div>
              <div class="role">${escapeHtml(session.role)}</div>
            </div>
          </div>
          <button class="logout-btn" onclick="logout()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Đăng xuất</span>
          </button>
        ` : ''}
      </div>
    </aside>
  `;
}

function buildTopbar(title, actions = '') {
  return `
    <div class="topbar">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('show')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <h1 class="page-title">${title}</h1>
        <span class="sync-pill" title="Dữ liệu được đồng bộ liên tục với trang bán hàng">
          <span class="pulse-dot"></span>
          <span>Thời gian thực</span>
        </span>
      </div>
      <div class="topbar-actions">
        ${actions}
      </div>
    </div>
  `;
}

function renderLayout(active, title, content, actions = '') {
  const session = getSession();
  if (!session && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
    return;
  }
  const root = document.getElementById('app') || document.body;
  root.innerHTML = `
    <div class="admin-layout">
      ${buildSidebar(active)}
      <div class="main-content">
        ${buildTopbar(title, actions)}
        <div class="page-content">${content}</div>
      </div>
    </div>
    <div id="toastContainer" class="toast-container"></div>
  `;
}
// ============== LIVE SYNC ==============
function triggerAdminRefresh() {
  if (typeof renderAllAdmin === 'function') {
    try {
      renderAllAdmin();
    } catch (e) {
      console.warn('renderAllAdmin error:', e);
    }
  }
}

// Trang chủ (hoặc tab admin khác) thay đổi dữ liệu -> trang hiện tại tự refresh
window.addEventListener('storage', (event) => {
  if (!event.key || [STORE_KEYS.products, STORE_KEYS.orders, STORE_KEYS.users, STORE_KEYS.cart, STORE_KEYS.seeded].includes(event.key)) {
    triggerAdminRefresh();
  }
});

// Admin hoặc trang chủ vừa phát tín hiệu đồng bộ
window.addEventListener('store-changed', () => {
  triggerAdminRefresh();
});

// Khi admin chuyển tab quay lại trang này -> cập nhật ngay số liệu mới nhất
window.addEventListener('focus', () => {
  triggerAdminRefresh();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    triggerAdminRefresh();
  }
});

