// ============================================================
// Admin Portal — Main Entry Point & Topbar Logic
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

// ── Boot ─────────────────────────────────────────────────────
function boot() {
    const app = document.getElementById('admin-app');
    window.API_BASE = getApiBase(); // Set global for components

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
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    topbar.innerHTML = `
        <div class="top-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search or type a command">
            <span class="shortcut">⌘F</span>
        </div>
        
        <div class="topbar-right">
            <div class="env-badge">
                <span class="env-dot"></span>
                <span>${mode === 'local' ? 'Localhost' : 'Render'}</span>
            </div>
            
            <button class="theme-btn" id="adm-theme-toggle" title="Toggle Theme">
                <i data-lucide="${isDark ? 'sun' : 'moon'}"></i>
            </button>
            
            <button class="btn-new-proj">
                <i data-lucide="plus"></i> New Project
            </button>
            
            <button class="notif-btn">
                <i data-lucide="bell"></i>
            </button>
            
            <div class="user-avatar" title="Admin User">H</div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Theme Toggle Handler
    document.getElementById('adm-theme-toggle')?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('admin_theme', next);
        renderTopbar(); // Refresh icons
    });
}

// Initial Theme Load
const savedTheme = localStorage.getItem('admin_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
