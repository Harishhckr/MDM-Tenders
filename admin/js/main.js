// ============================================================
// Admin Portal — Main Entry Point
// ============================================================
import { registerRoute, handleRoute } from './router.js';
import { isLoggedIn, getApiBase, getApiMode } from './utils/api.js';
import { renderAdminSidebar } from './components/Sidebar.js';
import { renderLogin } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderScrapers } from './pages/Scrapers.js';
import { renderLogs } from './pages/Logs.js';
import { renderUsers } from './pages/Users.js';

// ── Register Routes ──────────────────────────────────────────
registerRoute('/login',     renderLogin);
registerRoute('/dashboard', renderDashboard);
registerRoute('/scrapers',  renderScrapers);
registerRoute('/logs',      renderLogs);
registerRoute('/users',     renderUsers);

// ── Theme Management ────────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    renderTopbar(); // Update icon
}

// ── Boot ─────────────────────────────────────────────────────
function boot() {
    initTheme();
    const app = document.getElementById('admin-app');

    if (isLoggedIn()) {
        app.classList.remove('logged-out');
        renderAdminSidebar();
        renderTopbar();
    } else {
        app.classList.add('logged-out');
    }

    handleRoute();
}

function renderTopbar() {
    const topbar = document.getElementById('admin-topbar');
    if (!topbar) return;

    const mode = getApiMode();
    const currentTheme = document.documentElement.getAttribute('data-theme');

    topbar.innerHTML = `
        <span class="topbar-title">Mission Control</span>
        <div class="topbar-right">
            <span class="api-badge">${mode === 'local' ? '⚡ LOCAL' : '☁ RENDER'} — ${getApiBase()}</span>
            
            <button id="adm-theme-toggle" title="Toggle Theme">
                <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
            </button>

            <div style="display:flex; align-items:center; gap:8px;">
                <span class="live-dot"></span>
                <span class="live-label">Live</span>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();

    // Bind theme toggle
    document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
