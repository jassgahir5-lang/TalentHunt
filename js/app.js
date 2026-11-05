// TalentHunt - Online Talent Hunt & Competition Management Platform
// Core Application Script & Mock Data Layer

const USE_MOCK = true;
const STORAGE_KEY_DATA = 'th_data';
const STORAGE_KEY_TOKEN = 'th_token';
const STORAGE_KEY_USER = 'th_user';
const STORAGE_KEY_LAST_ACTIVE = 'th_last_active';
const STORAGE_KEY_THEME = 'th_theme';
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

// --- Universal DOM Ready Helper ---
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    // If DOM is already interactive or complete, execute immediately
    setTimeout(fn, 0);
  }
}
window.onReady = onReady;

// --- Pure JavaScript SHA-256 (Never fails, works in any iframe / HTTP / HTTPS) ---
function sha256Sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isPrime = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);
  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function sha256(str) {
  return sha256Sync(str);
}

// --- Utilities ---
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(isoStr) {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getCategoryColor(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'singing': return '#ec4899';
    case 'dancing': return '#f97316';
    case 'coding': return '#3b82f6';
    case 'art & design':
    case 'art': return '#8b5cf6';
    case 'writing': return '#10b981';
    case 'quiz': return '#f59e0b';
    case 'photography': return '#06b6d4';
    default: return '#64748b';
  }
}

function getCategoryStripClass(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'singing': return 'cat-strip-singing';
    case 'dancing': return 'cat-strip-dancing';
    case 'coding': return 'cat-strip-coding';
    case 'art & design':
    case 'art': return 'cat-strip-art';
    case 'writing': return 'cat-strip-writing';
    case 'quiz': return 'cat-strip-quiz';
    case 'photography': return 'cat-strip-photography';
    default: return 'cat-strip-other';
  }
}

function getCategoryIcon(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'singing': return 'bi-mic';
    case 'dancing': return 'bi-person-walking';
    case 'coding': return 'bi-code-slash';
    case 'art & design':
    case 'art': return 'bi-palette';
    case 'writing': return 'bi-pen';
    case 'quiz': return 'bi-question-circle';
    case 'photography': return 'bi-camera';
    default: return 'bi-trophy';
  }
}

// --- Toast System ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const bgClass = type === 'success' ? 'text-bg-success' :
                  type === 'danger' || type === 'error' ? 'text-bg-danger' :
                  type === 'warning' ? 'text-bg-warning text-dark' : 'text-bg-primary';

  const icon = type === 'success' ? 'bi-check-circle-fill' :
               type === 'danger' || type === 'error' ? 'bi-exclamation-triangle-fill' :
               type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 shadow-lg show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icon} fs-5"></i>
        <span>${esc(message)}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  if (window.bootstrap && window.bootstrap.Toast) {
    const bsToast = new window.bootstrap.Toast(toastEl, { delay: 4500 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  } else {
    setTimeout(() => {
      toastEl.remove();
    }, 4500);
  }
}

// --- Button Loading State ---
function setBtnLoading(button, isLoading, originalHtml = '') {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      <span>Processing...</span>
    `;
  } else {
    button.disabled = false;
    button.innerHTML = originalHtml || button.dataset.originalHtml || 'Submit';
  }
}

// --- Validation Helpers ---
function markInvalid(inputElement, errorMsg) {
  if (!inputElement) return;
  inputElement.classList.add('is-invalid');
  let feedback = inputElement.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    inputElement.parentElement.appendChild(feedback);
  }
  feedback.textContent = errorMsg;
}

function clearInvalid(formElement) {
  if (!formElement) return;
  formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  formElement.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
}

// --- Confirmation Modal ---
function showConfirmModal(title, message, confirmBtnText = 'Confirm', onConfirm = () => {}) {
  let modalEl = document.getElementById('th-confirm-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'th-confirm-modal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content card-th-static">
          <div class="modal-header">
            <h5 class="modal-title font-weight-bold" id="th-confirm-title">Confirm Action</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="th-confirm-msg">
            Are you sure?
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="th-confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  document.getElementById('th-confirm-title').textContent = title;
  document.getElementById('th-confirm-msg').innerHTML = message;
  const confirmBtn = document.getElementById('th-confirm-btn');
  confirmBtn.textContent = confirmBtnText;

  if (window.bootstrap && window.bootstrap.Modal) {
    const bsModal = new window.bootstrap.Modal(modalEl);
    confirmBtn.onclick = () => {
      bsModal.hide();
      onConfirm();
    };
    bsModal.show();
  } else {
    if (confirm(title + '\n\n' + message.replace(/<[^>]+>/g, ''))) {
      onConfirm();
    }
  }
}

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', target);
  localStorage.setItem(STORAGE_KEY_THEME, target);
  updateThemeIcon(target);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark' 
    ? '<i class="bi bi-sun-fill text-warning fs-5"></i>' 
    : '<i class="bi bi-moon-stars-fill text-light fs-5"></i>';
}

// --- Session & Auth Helpers ---
function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function getToken() {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

function updateActivity() {
  localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
}

function checkInactivity() {
  const token = getToken();
  if (!token) return true;
  const lastActiveStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
  if (lastActiveStr) {
    const elapsed = Date.now() - parseInt(lastActiveStr, 10);
    if (elapsed > INACTIVITY_TIMEOUT_MS) {
      clearSession();
      sessionStorage.setItem('th_flash_msg', JSON.stringify({
        message: 'Session expired, please log in again',
        type: 'warning'
      }));
      window.location.href = 'login.html';
      return false;
    }
  }
  updateActivity();
  return true;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE);
}

function requireLogin(allowedRoles = []) {
  if (!checkInactivity()) return false;
  const user = getCurrentUser();
  if (!user) {
    const redirectUrl = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    window.location.href = `login.html?redirect=${redirectUrl}`;
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    sessionStorage.setItem('th_flash_msg', JSON.stringify({
      message: 'Access denied: You do not have permission to view that page.',
      type: 'danger'
    }));
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// Check flash messages on page load
function checkFlashMessages() {
  const flash = sessionStorage.getItem('th_flash_msg');
  if (flash) {
    sessionStorage.removeItem('th_flash_msg');
    try {
      const data = JSON.parse(flash);
      showToast(data.message, data.type);
    } catch (e) {}
  }
}

// --- Navigation Renderer ---
function renderNav(activePage = '') {
  initTheme();
  checkFlashMessages();
  updateActivity();

  const navContainer = document.getElementById('main-navbar');
  if (!navContainer) return;

  const user = getCurrentUser();

  let roleBadge = '';
  if (user) {
    const rClass = user.role === 'admin' ? 'badge-role-admin' :
                   user.role === 'judge' ? 'badge-role-judge' : 'badge-role-participant';
    const rLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    roleBadge = `<span class="badge ${rClass} ms-1 text-uppercase" style="font-size: 0.72rem;">${esc(rLabel)}</span>`;
  }

  const links = [
    { id: 'home', label: 'Home', href: 'index.html', icon: 'bi-house-door', show: true },
    { id: 'competitions', label: 'Competitions', href: 'competitions.html', icon: 'bi-trophy', show: true },
    { id: 'leaderboard', label: 'Leaderboard', href: 'leaderboard.html', icon: 'bi-bar-chart-line', show: true },
    { id: 'javacode', label: 'Java Backend', href: 'java-code.html', icon: 'bi-filetype-java text-warning', show: true },
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'bi-speedometer2', show: !!user },
    { id: 'entries', label: user && user.role === 'judge' ? 'Judge Panel' : 'Entries', href: 'entries.html', icon: 'bi-folder2-open', show: !!user },
    { id: 'users', label: 'Users', href: 'users.html', icon: 'bi-people', show: user && user.role === 'admin' }
  ];

  const linksHtml = links
    .filter(l => l.show)
    .map(l => {
      const activeClass = activePage === l.id ? 'active' : '';
      return `<li class="nav-item">
        <a class="nav-link ${activeClass} d-flex align-items-center gap-1" href="${l.href}">
          <i class="bi ${l.icon}"></i>
          <span>${l.label}</span>
        </a>
      </li>`;
    }).join('');

  const userSectionHtml = user ? `
    <div class="d-flex align-items-center gap-3">
      <div class="d-flex align-items-center gap-2 text-white">
        <div class="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center fw-bold" style="width: 34px; height: 34px; font-size: 0.85rem;">
          ${esc(user.name.charAt(0).toUpperCase())}
        </div>
        <div class="d-none d-sm-block text-start lh-sm">
          <div class="fw-semibold text-white" style="font-size: 0.9rem;">${esc(user.name)}</div>
          <div>${roleBadge}</div>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-light d-flex align-items-center gap-1" id="logout-btn" title="Log out">
        <i class="bi bi-box-arrow-right"></i>
        <span class="d-none d-md-inline">Logout</span>
      </button>
    </div>
  ` : `
    <div class="d-flex align-items-center gap-2">
      <a href="login.html" class="btn btn-sm btn-outline-light fw-medium">Log In</a>
      <a href="register.html" class="btn btn-sm btn-light fw-bold text-indigo">Sign Up</a>
    </div>
  `;

  navContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-talenthunt">
      <div class="container-xl">
        <a class="navbar-brand" href="index.html">
          <i class="bi bi-stars text-warning fs-4"></i>
          <span>TalentHunt</span>
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#thNavbarNav" aria-controls="thNavbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="thNavbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            ${linksHtml}
          </ul>
          <div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <button class="btn btn-link text-white p-1 text-decoration-none" id="theme-toggle-btn" title="Toggle Light/Dark Theme" type="button">
              <i class="bi bi-moon-stars-fill text-light fs-5"></i>
            </button>
            ${userSectionHtml}
          </div>
        </div>
      </div>
    </nav>
  `;

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
    updateThemeIcon(document.documentElement.getAttribute('data-bs-theme') || 'light');
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await api('/auth/logout', 'POST');
      } catch (e) {}
      clearSession();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 300);
    };
  }
}

// --- Password Strength Calculator ---
function calculatePasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: 'Empty', class: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', class: 'strength-weak' };
  if (score === 2) return { score: 2, label: 'Fair', class: 'strength-fair' };
  if (score === 3) return { score: 3, label: 'Good', class: 'strength-good' };
  return { score: 4, label: 'Strong', class: 'strength-strong' };
}

// --- Mock Database Initialization & Seeds ---
function initMockDatabase() {
  const existing = localStorage.getItem(STORAGE_KEY_DATA);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.competitions) && parsed.users.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  // Exact precomputed SHA-256 hashes
  const adminHash = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121'; // Admin123!
  const judgeHash = 'c6ce5ac628b24ed47961678136b412081650f136cfcf2a54368af6301cc81b26'; // Judge123!
  const participantHash = '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97'; // Pass123!

  const users = [
    {
      id: 'u_admin',
      name: 'System Admin',
      email: 'admin@talenthunt.edu',
      passwordHash: adminHash,
      role: 'admin',
      status: 'approved',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'u_judge_1',
      name: 'Riya Sharma',
      email: 'riya@talenthunt.edu',
      passwordHash: judgeHash,
      role: 'judge',
      status: 'approved',
      createdAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'u_judge_2',
      name: 'Karan Mehta',
      email: 'karan@talenthunt.edu',
      passwordHash: judgeHash,
      role: 'judge',
      status: 'approved',
      createdAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'u_part_demo',
      name: 'Demo Participant',
      email: 'demo@talenthunt.edu',
      passwordHash: participantHash,
      role: 'participant',
      status: 'approved',
      createdAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'u_part_aman',
      name: 'Aman Verma',
      email: 'aman@talenthunt.edu',
      passwordHash: participantHash,
      role: 'participant',
      status: 'approved',
      createdAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'u_part_simran',
      name: 'Simran Kaur',
      email: 'simran@talenthunt.edu',
      passwordHash: participantHash,
      role: 'participant',
      status: 'approved',
      createdAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'u_part_rohan',
      name: 'Rohan Gupta',
      email: 'rohan@talenthunt.edu',
      passwordHash: participantHash,
      role: 'participant',
      status: 'approved',
      createdAt: '2026-01-05T00:00:00.000Z'
    }
  ];

  const now = new Date();
  const future10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future20 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future12 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future25 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const past5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const past2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const competitions = [
    {
      id: 'c_singing',
      title: 'Singing Star 2026',
      category: 'Singing',
      description: 'Showcase your vocal range, pitch perfection, and stage charisma in this solo singing extravaganza.',
      rules: '1. Video or audio performance must be between 2 to 4 minutes.\n2. Both classical and contemporary genres are welcome.\n3. Backing tracks or self-instrument accompaniment allowed.\n4. Original and cover performances accepted.',
      regDeadline: future10,
      subDeadline: future20,
      status: 'Open',
      assignedJudgeIds: ['u_judge_1', 'u_judge_2'],
      createdAt: '2026-01-10T00:00:00.000Z'
    },
    {
      id: 'c_coding',
      title: 'Code Sprint Hackathon',
      category: 'Coding',
      description: 'Solve real-world challenges through creative programming, algorithms, and clean full-stack architectural design.',
      rules: '1. Solutions must include a public repository link and video walkthrough.\n2. Projects must be original work created for this event.\n3. Clear documentation and test coverage are evaluated.\n4. Plagiarism leads to disqualification.',
      regDeadline: future12,
      subDeadline: future25,
      status: 'Open',
      assignedJudgeIds: ['u_judge_1', 'u_judge_2'],
      createdAt: '2026-01-11T00:00:00.000Z'
    },
    {
      id: 'c_art',
      title: 'Canvas Colours Exhibition',
      category: 'Art & Design',
      description: 'Digital art, traditional sketches, and UI/UX design showcase celebrating visual storytelling.',
      rules: '1. High-resolution submission link required.\n2. Concept note (100-300 words) explaining inspiration.\n3. Layer breakdown or progress snapshots required for digital works.\n4. No AI-generated artwork allowed.',
      regDeadline: future15,
      subDeadline: future30,
      status: 'Open',
      assignedJudgeIds: ['u_judge_1', 'u_judge_2'],
      createdAt: '2026-01-12T00:00:00.000Z'
    },
    {
      id: 'c_dance',
      title: 'Dance Fever Championship',
      category: 'Dancing',
      description: 'High energy solo dance showdown across classical, hip-hop, contemporary, and freestyle styles.',
      rules: '1. Routine duration between 90 seconds to 3 minutes.\n2. Proper lighting and clear framing in video recording.\n3. Judged on creativity, technique, choreography, and presentation.\n4. Submissions closed and results evaluated.',
      regDeadline: past5,
      subDeadline: past2,
      status: 'Published',
      assignedJudgeIds: ['u_judge_1', 'u_judge_2'],
      createdAt: '2026-01-05T00:00:00.000Z'
    }
  ];

  const registrations = [
    { id: 'reg_d1', competitionId: 'c_dance', participantId: 'u_part_simran', registeredAt: '2026-01-06T10:00:00Z' },
    { id: 'reg_d2', competitionId: 'c_dance', participantId: 'u_part_aman', registeredAt: '2026-01-06T11:00:00Z' },
    { id: 'reg_d3', competitionId: 'c_dance', participantId: 'u_part_rohan', registeredAt: '2026-01-06T12:00:00Z' },
    { id: 'reg_s1', competitionId: 'c_singing', participantId: 'u_part_aman', registeredAt: '2026-01-15T09:00:00Z' },
    { id: 'reg_s2', competitionId: 'c_singing', participantId: 'u_part_simran', registeredAt: '2026-01-16T14:00:00Z' },
    { id: 'reg_c1', competitionId: 'c_coding', participantId: 'u_part_rohan', registeredAt: '2026-01-17T11:30:00Z' },
    { id: 'reg_c2', competitionId: 'c_coding', participantId: 'u_part_demo', registeredAt: '2026-01-18T16:00:00Z' },
    { id: 'reg_a1', competitionId: 'c_art', participantId: 'u_part_demo', registeredAt: '2026-01-19T10:00:00Z' }
  ];

  const entries = [
    {
      id: 'e_dance_simran',
      competitionId: 'c_dance',
      participantId: 'u_part_simran',
      title: 'Classical Fusion Odyssey',
      description: 'A seamless blend of classical Bharatanatyam mudras set against modern ambient beats.',
      link: 'https://youtube.com/watch?v=dance-simran-simulated',
      submittedAt: '2026-01-08T18:00:00Z',
      updatedAt: '2026-01-08T18:00:00Z'
    },
    {
      id: 'e_dance_aman',
      competitionId: 'c_dance',
      participantId: 'u_part_aman',
      title: 'Urban Street Hip-Hop Groove',
      description: 'Fast-paced street isolation routine featuring popping, locking, and explosive footwork.',
      link: 'https://youtube.com/watch?v=dance-aman-simulated',
      submittedAt: '2026-01-08T19:30:00Z',
      updatedAt: '2026-01-08T19:30:00Z'
    },
    {
      id: 'e_dance_rohan',
      competitionId: 'c_dance',
      participantId: 'u_part_rohan',
      title: 'Contemporary Soul Express',
      description: 'An emotive lyrical contemporary performance depicting resilience and triumph.',
      link: 'https://youtube.com/watch?v=dance-rohan-simulated',
      submittedAt: '2026-01-08T20:15:00Z',
      updatedAt: '2026-01-08T20:15:00Z'
    },
    {
      id: 'e_singing_aman',
      competitionId: 'c_singing',
      participantId: 'u_part_aman',
      title: 'Acoustic Indie Sunset Melody',
      description: 'Self-composed acoustic guitar ballad recorded live with layered vocal harmonies.',
      link: 'https://soundcloud.com/aman-simulated-melody',
      submittedAt: '2026-01-20T15:00:00Z',
      updatedAt: '2026-01-20T15:00:00Z'
    },
    {
      id: 'e_coding_rohan',
      competitionId: 'c_coding',
      participantId: 'u_part_rohan',
      title: 'Algorithm Visualizer & Playground',
      description: 'Interactive web platform visualizing sorting, graph algorithms, and dynamic programming.',
      link: 'https://github.com/rohan-simulated/algo-vis',
      submittedAt: '2026-01-22T17:45:00Z',
      updatedAt: '2026-01-22T17:45:00Z'
    }
  ];

  const scores = [
    {
      id: 'sc_simran_1',
      entryId: 'e_dance_simran',
      judgeId: 'u_judge_1',
      creativity: 9,
      skill: 9,
      presentation: 10,
      total: 28,
      comments: 'Phenomenal expressive balance and superb rhythm control throughout the crescendo.',
      scoredAt: '2026-01-09T14:00:00Z'
    },
    {
      id: 'sc_simran_2',
      entryId: 'e_dance_simran',
      judgeId: 'u_judge_2',
      creativity: 9,
      skill: 9,
      presentation: 9,
      total: 27,
      comments: 'Graceful posture and flawless transition between the classical and contemporary segments.',
      scoredAt: '2026-01-09T15:00:00Z'
    },
    {
      id: 'sc_aman_1',
      entryId: 'e_dance_aman',
      judgeId: 'u_judge_1',
      creativity: 9,
      skill: 8,
      presentation: 9,
      total: 26,
      comments: 'Electrifying stage presence, high energy popping and sharp musicality.',
      scoredAt: '2026-01-09T14:15:00Z'
    },
    {
      id: 'sc_aman_2',
      entryId: 'e_dance_aman',
      judgeId: 'u_judge_2',
      creativity: 8,
      skill: 9,
      presentation: 8,
      total: 25,
      comments: 'Impressive technique and synchronization with complex beats.',
      scoredAt: '2026-01-09T15:20:00Z'
    },
    {
      id: 'sc_rohan_1',
      entryId: 'e_dance_rohan',
      judgeId: 'u_judge_1',
      creativity: 8,
      skill: 7,
      presentation: 8,
      total: 23,
      comments: 'Very emotive storytelling with nice floorwork transitions.',
      scoredAt: '2026-01-09T14:30:00Z'
    },
    {
      id: 'sc_rohan_2',
      entryId: 'e_dance_rohan',
      judgeId: 'u_judge_2',
      creativity: 7,
      skill: 8,
      presentation: 7,
      total: 22,
      comments: 'Good choreography and control, can refine the final landing posture.',
      scoredAt: '2026-01-09T15:35:00Z'
    }
  ];

  const announcements = [
    {
      id: 'ann_1',
      title: 'Welcome to TalentHunt Annual Cultural & Technical Extravaganza 2026!',
      content: 'We are thrilled to launch the online competition management platform. Check out active competitions in Singing, Coding, and Art. Ensure you register and submit before the designated deadlines!',
      authorName: 'System Admin',
      createdAt: '2026-01-05T08:00:00Z',
      priority: 'high'
    },
    {
      id: 'ann_2',
      title: 'Dance Fever Final Results Officially Published - Congratulations to the Winners!',
      content: 'The panel of judges has finalized their comprehensive evaluations for Dance Fever. Visit the Leaderboard to view the podium winners, full rank breakdown, and judge feedback.',
      authorName: 'System Admin',
      createdAt: '2026-01-10T12:00:00Z',
      priority: 'normal'
    }
  ];

  const initialData = {
    users,
    competitions,
    registrations,
    entries,
    scores,
    announcements,
    failedLogins: {},
    resetCodes: []
  };

  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(initialData));
  return initialData;
}

function getDb() {
  const raw = localStorage.getItem(STORAGE_KEY_DATA);
  if (!raw) return initMockDatabase();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      return initMockDatabase();
    }
    return parsed;
  } catch (e) {
    return initMockDatabase();
  }
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(db));
}

// --- Mock API Engine ---
async function mockApiHandler(path, method, body, currentUser) {
  let db = getDb();

  const cleanEmail = (e) => (e || '').trim().toLowerCase();

  // POST /api/auth/register
  if (path === '/auth/register' && method === 'POST') {
    const { name, email, password, role } = body || {};
    if (!name || !email || !password || !role) {
      throw { status: 400, message: 'All fields are required.' };
    }
    const emailNorm = cleanEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      throw { status: 400, message: 'Invalid email address format.' };
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw { status: 400, message: 'Password must be at least 8 characters with at least one letter and one number.' };
    }
    if (!['participant', 'judge'].includes(role)) {
      throw { status: 400, message: 'Invalid role selection.' };
    }
    if (db.users.some(u => cleanEmail(u.email) === emailNorm)) {
      throw { status: 400, message: 'An account with this email already exists.' };
    }

    const passwordHash = sha256Sync(password);
    const newUser = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: emailNorm,
      passwordHash,
      role,
      status: role === 'judge' ? 'pending' : 'approved',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDb(db);

    if (role === 'judge') {
      return {
        message: 'Registration successful! Your judge account requires admin approval before you can log in.',
        requiresApproval: true
      };
    }

    const token = 'th_tok_' + Math.random().toString(36).substr(2) + Date.now();
    return {
      message: 'Registration successful! Welcome to TalentHunt.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      token
    };
  }

  // POST /api/auth/login
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required.' };
    }
    const emailNorm = cleanEmail(email);

    const lockInfo = db.failedLogins[emailNorm] || { count: 0, lockedUntil: 0 };
    if (lockInfo.lockedUntil && Date.now() < lockInfo.lockedUntil) {
      const remainingSeconds = Math.ceil((lockInfo.lockedUntil - Date.now()) / 1000);
      const remainingMin = Math.ceil(remainingSeconds / 60);
      throw {
        status: 429,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMin} minute(s) (${remainingSeconds}s).`
      };
    }

    const user = db.users.find(u => cleanEmail(u.email) === emailNorm);
    const pwdHash = sha256Sync(password);

    if (!user || user.passwordHash !== pwdHash) {
      lockInfo.count = (lockInfo.count || 0) + 1;
      if (lockInfo.count >= 5) {
        lockInfo.lockedUntil = Date.now() + 5 * 60 * 1000;
        lockInfo.count = 0;
        db.failedLogins[emailNorm] = lockInfo;
        saveDb(db);
        throw {
          status: 429,
          message: 'Too many failed login attempts. Your account has been locked for 5 minutes.'
        };
      }
      db.failedLogins[emailNorm] = lockInfo;
      saveDb(db);
      throw { status: 401, message: 'Invalid email or password.' };
    }

    delete db.failedLogins[emailNorm];
    saveDb(db);

    if (user.role === 'judge' && user.status !== 'approved') {
      throw { status: 403, message: 'Your judge account is waiting for admin approval.' };
    }

    const token = 'th_tok_' + Math.random().toString(36).substr(2) + Date.now();
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    };
  }

  // POST /api/auth/logout
  if (path === '/auth/logout' && method === 'POST') {
    return { message: 'Logged out successfully' };
  }

  // POST /api/auth/forgot
  if (path === '/auth/forgot' && method === 'POST') {
    const { email } = body || {};
    if (!email) throw { status: 400, message: 'Email is required.' };
    const emailNorm = cleanEmail(email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const userExists = db.users.some(u => cleanEmail(u.email) === emailNorm);
    if (userExists) {
      db.resetCodes.push({
        email: emailNorm,
        code,
        expiresAt,
        used: false
      });
      saveDb(db);
    }

    return {
      message: 'If this email is registered, a code has been generated.',
      code: userExists ? code : '******'
    };
  }

  // POST /api/auth/reset
  if (path === '/auth/reset' && method === 'POST') {
    const { email, code, newPassword } = body || {};
    if (!email || !code || !newPassword) {
      throw { status: 400, message: 'All fields are required.' };
    }
    const emailNorm = cleanEmail(email);

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw { status: 400, message: 'Password must be at least 8 characters with at least one letter and one number.' };
    }

    const record = db.resetCodes
      .slice()
      .reverse()
      .find(r => r.email === emailNorm && r.code === code.trim());

    if (!record) {
      throw { status: 400, message: 'Invalid reset code. Please check and try again.' };
    }
    if (record.used) {
      throw { status: 400, message: 'This reset code has already been used.' };
    }
    if (Date.now() > record.expiresAt) {
      throw { status: 400, message: 'This reset code has expired (valid for 10 minutes).' };
    }

    const user = db.users.find(u => cleanEmail(u.email) === emailNorm);
    if (!user) {
      throw { status: 400, message: 'Unable to reset password.' };
    }

    user.passwordHash = sha256Sync(newPassword);
    record.used = true;
    saveDb(db);

    return { message: 'Password has been reset successfully. Please log in.' };
  }

  // GET /api/public/stats
  if (path === '/public/stats' && method === 'GET') {
    const competitionsCount = db.competitions.length;
    const participantsCount = db.users.filter(u => u.role === 'participant').length;
    const judgesCount = db.users.filter(u => u.role === 'judge' && u.status === 'approved').length;
    const entriesCount = db.entries.length;
    return { competitionsCount, participantsCount, judgesCount, entriesCount };
  }

  // GET /api/announcements
  if (path === '/announcements' && method === 'GET') {
    return db.announcements.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // POST /api/announcements (admin)
  if (path === '/announcements' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can post announcements.' };
    }
    const { title, content, priority } = body || {};
    if (!title || !content) throw { status: 400, message: 'Title and content are required.' };

    const newAnn = {
      id: 'ann_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      priority: priority === 'high' ? 'high' : 'normal'
    };
    db.announcements.unshift(newAnn);
    saveDb(db);
    return newAnn;
  }

  // GET /api/competitions
  if (path === '/competitions' && method === 'GET') {
    const list = db.competitions.map(comp => {
      const regList = db.registrations.filter(r => r.competitionId === comp.id);
      const entList = db.entries.filter(e => e.competitionId === comp.id);
      const isRegistered = currentUser && currentUser.role === 'participant'
        ? regList.some(r => r.participantId === currentUser.id)
        : false;

      const judgeNames = (comp.assignedJudgeIds || []).map(jid => {
        const j = db.users.find(u => u.id === jid);
        return j ? j.name : 'Unknown';
      });

      return {
        ...comp,
        registeredCount: regList.length,
        entriesCount: entList.length,
        judgesCount: (comp.assignedJudgeIds || []).length,
        judgeNames,
        isRegistered
      };
    });
    return list;
  }

  // POST /api/competitions (admin)
  if (path === '/competitions' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can create competitions.' };
    }
    const { title, category, description, rules, regDeadline, subDeadline, assignedJudgeIds } = body || {};
    if (!title || !category || !regDeadline || !subDeadline) {
      throw { status: 400, message: 'Title, category, and deadlines are required.' };
    }
    if (new Date(subDeadline) < new Date(regDeadline)) {
      throw { status: 400, message: 'Submission deadline cannot be before registration deadline.' };
    }

    const newComp = {
      id: 'c_' + Date.now(),
      title: title.trim(),
      category: category.trim(),
      description: description || '',
      rules: rules || '',
      regDeadline,
      subDeadline,
      status: 'Open',
      assignedJudgeIds: Array.isArray(assignedJudgeIds) ? assignedJudgeIds : [],
      createdAt: new Date().toISOString()
    };
    db.competitions.push(newComp);
    saveDb(db);
    return newComp;
  }

  // PUT /api/competitions/{id} (admin)
  const compMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)$/);
  if (compMatch) {
    const compId = compMatch[1];
    const compIndex = db.competitions.findIndex(c => c.id === compId);
    if (compIndex === -1) throw { status: 404, message: 'Competition not found.' };

    if (method === 'GET') {
      const comp = db.competitions[compIndex];
      const judgeNames = (comp.assignedJudgeIds || []).map(jid => {
        const j = db.users.find(u => u.id === jid);
        return j ? j.name : 'Unknown';
      });
      return { ...comp, judgeNames };
    }

    if (method === 'PUT') {
      if (!currentUser || currentUser.role !== 'admin') {
        throw { status: 403, message: 'Only admins can update competitions.' };
      }
      const { title, category, description, rules, regDeadline, subDeadline } = body || {};
      if (!title || !category || !regDeadline || !subDeadline) {
        throw { status: 400, message: 'Title, category, and deadlines are required.' };
      }
      if (new Date(subDeadline) < new Date(regDeadline)) {
        throw { status: 400, message: 'Submission deadline cannot be before registration deadline.' };
      }

      const comp = db.competitions[compIndex];
      comp.title = title.trim();
      comp.category = category.trim();
      comp.description = description || '';
      comp.rules = rules || '';
      comp.regDeadline = regDeadline;
      comp.subDeadline = subDeadline;
      saveDb(db);
      return comp;
    }

    if (method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') {
        throw { status: 403, message: 'Only admins can delete competitions.' };
      }
      db.competitions.splice(compIndex, 1);
      const deletedEntryIds = db.entries
        .filter(e => e.competitionId === compId)
        .map(e => e.id);

      db.registrations = db.registrations.filter(r => r.competitionId !== compId);
      db.entries = db.entries.filter(e => e.competitionId !== compId);
      db.scores = db.scores.filter(s => !deletedEntryIds.includes(s.entryId));
      saveDb(db);
      return { message: 'Competition and all related records deleted.' };
    }
  }

  // POST /api/competitions/{id}/status (admin)
  const statusMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/status$/);
  if (statusMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can modify competition status.' };
    }
    const comp = db.competitions.find(c => c.id === statusMatch[1]);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const { status } = body || {};
    if (!['Open', 'Closed'].includes(status)) {
      throw { status: 400, message: 'Status must be Open or Closed.' };
    }
    comp.status = status;
    saveDb(db);
    return comp;
  }

  // POST /api/competitions/{id}/publish (admin)
  const publishMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/publish$/);
  if (publishMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can publish results.' };
    }
    const comp = db.competitions.find(c => c.id === publishMatch[1]);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const compEntryIds = db.entries.filter(e => e.competitionId === comp.id).map(e => e.id);
    const hasScores = db.scores.some(s => compEntryIds.includes(s.entryId));

    if (!hasScores) {
      throw { status: 400, message: 'Cannot publish results: At least one entry must be scored by a judge first.' };
    }

    comp.status = 'Published';
    saveDb(db);
    return { message: 'Results published successfully!', competition: comp };
  }

  // PUT /api/competitions/{id}/judges (admin)
  const judgesMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/judges$/);
  if (judgesMatch && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can assign judges.' };
    }
    const comp = db.competitions.find(c => c.id === judgesMatch[1]);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const { judgeIds } = body || {};
    comp.assignedJudgeIds = Array.isArray(judgeIds) ? judgeIds : [];
    saveDb(db);
    return comp;
  }

  // POST /api/competitions/{id}/register (participant)
  const regMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/register$/);
  if (regMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'participant') {
      throw { status: 403, message: 'Only participants can register for competitions.' };
    }
    const comp = db.competitions.find(c => c.id === regMatch[1]);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    if (comp.status !== 'Open') {
      throw { status: 400, message: `Cannot register: Competition is ${comp.status}.` };
    }

    const today = new Date().toISOString().split('T')[0];
    if (today > comp.regDeadline) {
      throw { status: 400, message: 'Registration deadline has passed for this competition.' };
    }

    const alreadyRegistered = db.registrations.some(
      r => r.competitionId === comp.id && r.participantId === currentUser.id
    );
    if (alreadyRegistered) {
      throw { status: 400, message: 'You are already registered for this competition.' };
    }

    const newReg = {
      id: 'reg_' + Date.now(),
      competitionId: comp.id,
      participantId: currentUser.id,
      registeredAt: new Date().toISOString()
    };
    db.registrations.push(newReg);
    saveDb(db);
    return { message: 'Registered successfully!', registration: newReg };
  }

  // GET /api/entries/mine (participant)
  if (path === '/entries/mine' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'participant') {
      throw { status: 403, message: 'Only participants have personal entries.' };
    }

    const myRegs = db.registrations.filter(r => r.participantId === currentUser.id);
    const result = myRegs.map(reg => {
      const comp = db.competitions.find(c => c.id === reg.competitionId) || {};
      const entry = db.entries.find(e => e.competitionId === comp.id && e.participantId === currentUser.id) || null;
      let scoreInfo = null;

      if (entry) {
        const entryScores = db.scores.filter(s => s.entryId === entry.id);
        if (entryScores.length > 0) {
          const avg = entryScores.reduce((acc, s) => acc + s.total, 0) / entryScores.length;
          scoreInfo = {
            count: entryScores.length,
            average: parseFloat(avg.toFixed(1)),
            comments: entryScores.map(s => s.comments).filter(Boolean)
          };
        }
      }

      let rank = null;
      if (comp.status === 'Published' && entry) {
        const allCompEntries = db.entries.filter(e => e.competitionId === comp.id);
        const ranked = allCompEntries.map(e => {
          const scs = db.scores.filter(s => s.entryId === e.id);
          const avg = scs.length > 0 ? scs.reduce((a, b) => a + b.total, 0) / scs.length : 0;
          return { entryId: e.id, avg };
        }).sort((a, b) => b.avg - a.avg);

        const rIndex = ranked.findIndex(r => r.entryId === entry.id);
        if (rIndex !== -1) rank = rIndex + 1;
      }

      return {
        registrationId: reg.id,
        registeredAt: reg.registeredAt,
        competition: comp,
        entry,
        scoreInfo,
        rank
      };
    });

    return result;
  }

  // PUT /api/entries/{id} (participant submit/edit)
  const entryPutMatch = path.match(/^\/entries\/([a-zA-Z0-9_-]+)$/);
  if (entryPutMatch && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'participant') {
      throw { status: 403, message: 'Only participants can submit or edit entries.' };
    }
    const entryId = entryPutMatch[1];
    const { competitionId, title, description, link } = body || {};

    if (!title || !link) {
      throw { status: 400, message: 'Title and link are required.' };
    }
    if (!/^https?:\/\//i.test(link.trim())) {
      throw { status: 400, message: 'Link must start with http:// or https://' };
    }

    let entry = db.entries.find(e => e.id === entryId);
    let compId = entry ? entry.competitionId : competitionId;
    const comp = db.competitions.find(c => c.id === compId);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const today = new Date().toISOString().split('T')[0];
    if (today > comp.subDeadline) {
      throw { status: 400, message: 'Submission deadline has passed for this competition.' };
    }

    if (entry) {
      const hasScores = db.scores.some(s => s.entryId === entry.id);
      if (hasScores) {
        throw { status: 400, message: 'This entry has already been scored by a judge and cannot be modified.' };
      }
      entry.title = title.trim();
      entry.description = (description || '').trim();
      entry.link = link.trim();
      entry.updatedAt = new Date().toISOString();
    } else {
      entry = {
        id: 'e_' + Date.now(),
        competitionId: compId,
        participantId: currentUser.id,
        title: title.trim(),
        description: (description || '').trim(),
        link: link.trim(),
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.entries.push(entry);
    }
    saveDb(db);
    return entry;
  }

  // GET /api/judge/competitions (judge)
  if (path === '/judge/competitions' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'judge') {
      throw { status: 403, message: 'Only judges can access assigned competitions.' };
    }
    const assigned = db.competitions.filter(c => (c.assignedJudgeIds || []).includes(currentUser.id));
    return assigned;
  }

  // GET /api/competitions/{id}/entries (judge/admin)
  const compEntriesMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/entries$/);
  if (compEntriesMatch && method === 'GET') {
    if (!currentUser || (currentUser.role !== 'judge' && currentUser.role !== 'admin')) {
      throw { status: 403, message: 'Access denied.' };
    }
    const compId = compEntriesMatch[1];
    const comp = db.competitions.find(c => c.id === compId);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const compEntries = db.entries.filter(e => e.competitionId === compId);
    const enriched = compEntries.map(e => {
      const part = db.users.find(u => u.id === e.participantId) || { name: 'Unknown Participant' };
      const entryScores = db.scores.filter(s => s.entryId === e.id);
      const myScore = currentUser.role === 'judge'
        ? entryScores.find(s => s.judgeId === currentUser.id)
        : null;
      const avg = entryScores.length > 0
        ? entryScores.reduce((acc, s) => acc + s.total, 0) / entryScores.length
        : 0;

      return {
        ...e,
        participantName: part.name,
        participantEmail: part.email,
        scoresCount: entryScores.length,
        averageScore: parseFloat(avg.toFixed(1)),
        myScore
      };
    });

    return enriched;
  }

  // POST /api/entries/{id}/score (judge)
  const scoreMatch = path.match(/^\/entries\/([a-zA-Z0-9_-]+)\/score$/);
  if (scoreMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'judge') {
      throw { status: 403, message: 'Only judges can score entries.' };
    }
    const entryId = scoreMatch[1];
    const entry = db.entries.find(e => e.id === entryId);
    if (!entry) throw { status: 404, message: 'Entry not found.' };

    const comp = db.competitions.find(c => c.id === entry.competitionId);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    if (!(comp.assignedJudgeIds || []).includes(currentUser.id)) {
      throw { status: 403, message: 'You are not assigned as a judge for this competition.' };
    }

    if (comp.status === 'Published') {
      throw { status: 400, message: 'Cannot score: Competition results are already published.' };
    }

    const { creativity, skill, presentation, comments } = body || {};
    const c = parseFloat(creativity);
    const s = parseFloat(skill);
    const p = parseFloat(presentation);

    if (isNaN(c) || isNaN(s) || isNaN(p) || c < 0 || c > 10 || s < 0 || s > 10 || p < 0 || p > 10) {
      throw { status: 400, message: 'Scores for Creativity, Skill, and Presentation must each be between 0 and 10.' };
    }

    const total = parseFloat((c + s + p).toFixed(1));

    const existingScoreIndex = db.scores.findIndex(sc => sc.entryId === entryId && sc.judgeId === currentUser.id);
    if (existingScoreIndex !== -1) {
      throw { status: 400, message: 'You have already submitted a score for this entry.' };
    }

    const newScore = {
      id: 'sc_' + Date.now(),
      entryId,
      judgeId: currentUser.id,
      creativity: c,
      skill: s,
      presentation: p,
      total,
      comments: (comments || '').trim(),
      scoredAt: new Date().toISOString()
    };
    db.scores.push(newScore);
    saveDb(db);
    return newScore;
  }

  // GET /api/competitions/{id}/leaderboard
  const leaderMatch = path.match(/^\/competitions\/([a-zA-Z0-9_-]+)\/leaderboard$/);
  if (leaderMatch && method === 'GET') {
    const compId = leaderMatch[1];
    const comp = db.competitions.find(c => c.id === compId);
    if (!comp) throw { status: 404, message: 'Competition not found.' };

    const isPrivileged = currentUser && (currentUser.role === 'admin' || currentUser.role === 'judge');
    if (comp.status !== 'Published' && !isPrivileged) {
      return {
        competition: comp,
        isProvisional: true,
        rankings: [],
        message: 'Results for this competition have not been published yet.'
      };
    }

    const compEntries = db.entries.filter(e => e.competitionId === compId);
    const rankings = compEntries.map(e => {
      const part = db.users.find(u => u.id === e.participantId) || { name: 'Unknown' };
      const eScores = db.scores.filter(s => s.entryId === e.id);
      const avg = eScores.length > 0
        ? eScores.reduce((acc, s) => acc + s.total, 0) / eScores.length
        : 0;

      return {
        entryId: e.id,
        title: e.title,
        link: e.link,
        participantName: part.name,
        judgesCount: eScores.length,
        averageScore: parseFloat(avg.toFixed(1))
      };
    })
    .filter(r => r.judgesCount > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    return {
      competition: comp,
      isProvisional: comp.status !== 'Published',
      rankings
    };
  }

  // GET /api/dashboard (role-based)
  if (path === '/dashboard' && method === 'GET') {
    if (!currentUser) throw { status: 401, message: 'Unauthorized.' };

    const announcements = db.announcements.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    if (currentUser.role === 'admin') {
      const participants = db.users.filter(u => u.role === 'participant').length;
      const approvedJudges = db.users.filter(u => u.role === 'judge' && u.status === 'approved').length;
      const pendingJudges = db.users.filter(u => u.role === 'judge' && u.status === 'pending').length;
      const competitions = db.competitions.length;
      const registrations = db.registrations.length;
      const entries = db.entries.length;
      const scores = db.scores.length;

      const barLabels = db.competitions.map(c => c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title);
      const barRegs = db.competitions.map(c => db.registrations.filter(r => r.competitionId === c.id).length);
      const barEntries = db.competitions.map(c => db.entries.filter(e => e.competitionId === c.id).length);

      const categoriesMap = {};
      db.registrations.forEach(r => {
        const c = db.competitions.find(comp => comp.id === r.competitionId);
        const cat = c ? c.category : 'Other';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });

      return {
        role: 'admin',
        stats: {
          participants,
          judges: approvedJudges,
          pendingJudges,
          competitions,
          registrations,
          entries,
          scores
        },
        chartData: {
          bar: { labels: barLabels, registrations: barRegs, entries: barEntries },
          doughnut: {
            labels: Object.keys(categoriesMap),
            data: Object.values(categoriesMap)
          }
        },
        announcements
      };
    }

    if (currentUser.role === 'judge') {
      const assignedComps = db.competitions.filter(c => (c.assignedJudgeIds || []).includes(currentUser.id));
      const assignedCompIds = assignedComps.map(c => c.id);
      const totalEntries = db.entries.filter(e => assignedCompIds.includes(e.competitionId));
      const myScores = db.scores.filter(s => s.judgeId === currentUser.id);
      const scoredCount = myScores.length;
      const waitingCount = Math.max(0, totalEntries.length - scoredCount);

      const compLabels = assignedComps.map(c => c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title);
      const scoredPerComp = [];
      const waitingPerComp = [];

      assignedComps.forEach(c => {
        const compEnts = db.entries.filter(e => e.competitionId === c.id);
        const scored = compEnts.filter(e => db.scores.some(s => s.entryId === e.id && s.judgeId === currentUser.id)).length;
        scoredPerComp.push(scored);
        waitingPerComp.push(Math.max(0, compEnts.length - scored));
      });

      return {
        role: 'judge',
        stats: {
          assignedCompetitions: assignedComps.length,
          totalEntriesToJudge: totalEntries.length,
          scoredEntries: scoredCount,
          pendingReviews: waitingCount
        },
        chartData: {
          stackedBar: {
            labels: compLabels,
            scored: scoredPerComp,
            waiting: waitingPerComp
          }
        },
        announcements
      };
    }

    if (currentUser.role === 'participant') {
      const myRegs = db.registrations.filter(r => r.participantId === currentUser.id);
      const myEntries = db.entries.filter(e => e.participantId === currentUser.id);
      const submittedCount = myEntries.length;
      const pendingCount = Math.max(0, myRegs.length - submittedCount);

      const resultsList = [];
      myRegs.forEach(reg => {
        const comp = db.competitions.find(c => c.id === reg.competitionId);
        if (!comp) return;
        const entry = db.entries.find(e => e.competitionId === comp.id && e.participantId === currentUser.id);
        if (!entry) return;

        const entryScores = db.scores.filter(s => s.entryId === entry.id);
        const avg = entryScores.length > 0 ? entryScores.reduce((a, b) => a + b.total, 0) / entryScores.length : 0;

        let rank = 'Provisional';
        if (comp.status === 'Published') {
          const compEnts = db.entries.filter(e => e.competitionId === comp.id);
          const ranked = compEnts.map(e => {
            const scs = db.scores.filter(s => s.entryId === e.id);
            const a = scs.length > 0 ? scs.reduce((x, y) => x + y.total, 0) / scs.length : 0;
            return { id: e.id, avg: a };
          }).sort((x, y) => y.avg - x.avg);
          const rIndex = ranked.findIndex(x => x.id === entry.id);
          rank = rIndex !== -1 ? `#${rIndex + 1}` : 'N/A';
        }

        resultsList.push({
          competitionTitle: comp.title,
          entryTitle: entry.title,
          status: comp.status,
          averageScore: parseFloat(avg.toFixed(1)),
          rank
        });
      });

      return {
        role: 'participant',
        stats: {
          registeredCompetitions: myRegs.length,
          entriesSubmitted: submittedCount,
          pendingSubmissions: pendingCount,
          completedResults: resultsList.filter(r => r.status === 'Published').length
        },
        chartData: {
          doughnut: {
            labels: ['Submitted Entries', 'Pending Submissions'],
            data: [submittedCount, pendingCount]
          }
        },
        resultsList,
        announcements
      };
    }
  }

  // GET /api/users (admin)
  if (path === '/users' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can view user management.' };
    }
    return db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt
    }));
  }

  // POST /api/users (admin add judge directly)
  if (path === '/users' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can add users.' };
    }
    const { name, email, password, role } = body || {};
    if (!name || !email || !password || !role) {
      throw { status: 400, message: 'All fields are required.' };
    }
    const emailNorm = cleanEmail(email);
    if (db.users.some(u => cleanEmail(u.email) === emailNorm)) {
      throw { status: 400, message: 'Email is already registered.' };
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw { status: 400, message: 'Password must be at least 8 characters with letters and numbers.' };
    }

    const passwordHash = sha256Sync(password);
    const newUser = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      email: emailNorm,
      passwordHash,
      role,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  }

  // POST /api/users/{id}/approve (admin)
  const approveMatch = path.match(/^\/users\/([a-zA-Z0-9_-]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can approve users.' };
    }
    const user = db.users.find(u => u.id === approveMatch[1]);
    if (!user) throw { status: 404, message: 'User not found.' };
    user.status = 'approved';
    saveDb(db);
    return user;
  }

  // DELETE /api/users/{id} (admin)
  const delUserMatch = path.match(/^\/users\/([a-zA-Z0-9_-]+)$/);
  if (delUserMatch && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw { status: 403, message: 'Only admins can remove users.' };
    }
    const userId = delUserMatch[1];
    const user = db.users.find(u => u.id === userId);
    if (!user) throw { status: 404, message: 'User not found.' };

    if (user.role === 'admin') {
      throw { status: 400, message: 'Admin cannot be removed.' };
    }

    db.users = db.users.filter(u => u.id !== userId);
    const userEntryIds = db.entries.filter(e => e.participantId === userId).map(e => e.id);
    db.registrations = db.registrations.filter(r => r.participantId !== userId);
    db.entries = db.entries.filter(e => e.participantId !== userId);
    db.scores = db.scores.filter(s => !userEntryIds.includes(s.entryId) && s.judgeId !== userId);
    db.competitions.forEach(c => {
      c.assignedJudgeIds = (c.assignedJudgeIds || []).filter(jid => jid !== userId);
    });
    saveDb(db);
    return { message: 'User and all related records removed.' };
  }

  throw { status: 404, message: `Endpoint not found: ${method} ${path}` };
}

// --- Unified API Function ---
async function api(path, method = 'GET', body = null) {
  updateActivity();
  const token = getToken();
  const currentUser = getCurrentUser();

  if (USE_MOCK) {
    // Fast mock response
    try {
      return await mockApiHandler(path, method, body, currentUser);
    } catch (err) {
      if (err && err.status === 401) {
        clearSession();
      }
      throw err;
    }
  } else {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-Auth-Token'] = token;
    }
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
    }

    const options = { method, headers };
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch('/api' + path, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
          window.location.href = 'login.html?expired=1';
        }
        throw {
          status: response.status,
          message: data.message || `Request failed with status ${response.status}`
        };
      }
      return data;
    } catch (networkError) {
      if (networkError.status) throw networkError;
      throw {
        status: 0,
        message: 'Cannot reach the server, please check your network connection.'
      };
    }
  }
}

// Initialize theme on script load
onReady(() => {
  initTheme();
});
