// ============================================================
// Admin Portal — Main Entry Point
// ============================================================
import { registerRoute, handleRoute } from './router.js';
import { isLoggedIn, getApiBase, getApiMode, setApiBackend } from './utils/api.js';
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

// ── Theme & Settings ────────────────────────────────────────
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

function toggleVisibleTab(enabled) {
    localStorage.setItem('visible_tab', enabled);
    console.log('Visible Tab mode:', enabled);
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
    const apiMode = getApiMode();
    const apiBase = getApiBase();
    const isVisibleTab = localStorage.getItem('visible_tab') === 'true';

    topbar.innerHTML = `
        <div class="search-container">
            <i data-lucide="search"></i>
            <input type="text" class="search-input" placeholder="Quick Search (Tender ID, Source, or Log)...">
            <span class="search-kb">⌘K</span>
        </div>
        
        <div class="topbar-right">
            <!-- Visible Tab Toggle -->
            <div class="toggle-wrap">
                <span class="toggle-label">Visible Tab</span>
                <label class="adm-switch">
                    <input type="checkbox" id="adm-visible-toggle" ${isVisibleTab ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Backend Info -->
            <div class="backend-card">
                <div class="backend-status">
                    <div class="status-dot" style="background:${apiMode === 'local' ? 'var(--accent-green)' : 'var(--accent-orange)'}"></div>
                    <span>${apiMode.toUpperCase()}</span>
                </div>
                <div class="backend-url">${apiBase.replace('https://', '').replace('/api', '')}</div>
                <button class="btn-icon" id="adm-api-mode-toggle" title="Switch Backend">
                    <i data-lucide="refresh-ccw" style="width:14px;height:14px;"></i>
                </button>
            </div>
            
            <button class="btn-icon" id="adm-theme-toggle" title="Toggle Theme">
                <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" style="width:20px;height:20px;"></i>
            </button>

            <button class="btn-icon" title="Notifications">
                <i data-lucide="bell" style="width:20px;height:20px;"></i>
            </button>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();

    // Event Bindings
    document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);
    
    document.getElementById('adm-visible-toggle')?.addEventListener('change', (e) => {
        toggleVisibleTab(e.target.checked);
    });

    document.getElementById('adm-api-mode-toggle')?.addEventListener('click', () => {
        const nextMode = apiMode === 'local' ? 'remote' : 'local';
        setApiBackend(nextMode);
        window.location.reload();
    });
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
