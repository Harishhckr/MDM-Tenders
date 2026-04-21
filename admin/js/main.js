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
    renderTopbar();
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

    const currentTheme = document.documentElement.getAttribute('data-theme');

    topbar.innerHTML = `
        <div class="search-bar">
            <i data-lucide="search" style="width:16px;height:16px;"></i>
            <span>Search or type a command</span>
            <span style="margin-left:auto; font-size:10px; font-weight:700; opacity:0.5;">⌘F</span>
        </div>
        
        <div class="topbar-actions">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>Render</span>
            </div>
            
            <button class="btn-theme-toggle" id="adm-theme-toggle">
                <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" style="width:18px;height:18px;"></i>
            </button>

            <button class="btn-new-project">
                <i data-lucide="plus" style="width:16px;height:16px;"></i>
                New Project
            </button>

            <button class="btn-theme-toggle">
                <i data-lucide="bell" style="width:18px;height:18px;"></i>
            </button>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
