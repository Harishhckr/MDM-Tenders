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

// ── Boot ─────────────────────────────────────────────────────
function boot() {
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
    topbar.innerHTML = `
        <span class="topbar-title">Mission Control</span>
        <div class="topbar-right">
            <span class="api-badge">${mode === 'local' ? '⚡ LOCAL' : '☁ RENDER'} — ${getApiBase()}</span>
            <span class="live-dot"></span>
            <span class="live-label">Live</span>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
