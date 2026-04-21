// ============================================================
// Admin Portal — Main Entry Point (Robust Version)
// ============================================================
import { registerRoute, handleRoute } from './router.js';
import { isLoggedIn, getApiBase, getApiMode, setApiBackend } from './utils/api.js';
import { renderAdminSidebar } from './components/Sidebar.js';
import { renderLogin } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderScrapers } from './pages/Scrapers.js';
import { renderLogs } from './pages/Logs.js';
import { renderUsers } from './pages/Users.js';

console.log('[Main] Booting System...');

// ── Register Routes ──────────────────────────────────────────
registerRoute('/login',     renderLogin);
registerRoute('/dashboard', renderDashboard);
registerRoute('/scrapers',  renderScrapers);
registerRoute('/logs',      renderLogs);
registerRoute('/users',     renderUsers);

function initTheme() {
    try {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) { console.warn('Theme init failed:', e); }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    renderTopbar();
}

function boot() {
    console.log('[Main] Initializing Boot Sequence...');
    initTheme();
    const app = document.getElementById('admin-app');
    if (!app) { console.error('[Main] #admin-app NOT FOUND!'); return; }

    try {
        const loggedIn = isLoggedIn();
        console.log('[Main] Auth State:', loggedIn ? 'LOGGED_IN' : 'GUEST');
        
        if (loggedIn) {
            app.classList.remove('logged-out');
            renderAdminSidebar();
            renderTopbar();
        } else {
            app.classList.add('logged-out');
            const sidebar = document.getElementById('admin-sidebar');
            const topbar = document.getElementById('admin-topbar');
            if (sidebar) sidebar.innerHTML = '';
            if (topbar) topbar.innerHTML = '';
        }
    } catch (err) {
        console.error('[Main] Boot Error:', err);
    }

    handleRoute();
}

function renderTopbar() {
    const topbar = document.getElementById('admin-topbar');
    if (!topbar) return;

    try {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const mode = getApiMode();
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';

        topbar.innerHTML = `
            <div class="topbar-actions" style="margin-left:auto; display:flex; align-items:center; gap:16px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">API</span>
                    <label class="adm-toggle">
                        <input type="checkbox" id="adm-api-toggle" ${mode === 'local' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span style="font-size:10px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">${mode}</span>
                </div>

                ${mode === 'local' ? `
                <div style="display:flex;align-items:center;gap:6px; margin-left: 12px;">
                    <span style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Visible Tab</span>
                    <label class="adm-toggle">
                        <input type="checkbox" id="adm-headless-toggle" ${!isHeadless ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                ` : ''}

                <div class="btn-new-project" style="cursor:default; margin-left: 12px; background:var(--bg-card); border:1px solid var(--border-glass); color:var(--text-primary); font-family:monospace; font-size:11px;">
                    <div class="status-dot"></div>
                    <span>${getApiBase()}</span>
                </div>

                <button class="btn-theme-toggle" id="adm-theme-toggle">
                    <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" style="width:18px;height:18px;"></i>
                </button>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);
        document.getElementById('adm-api-toggle')?.addEventListener('change', (e) => {
            setApiBackend(e.target.checked ? 'local' : 'remote');
            window.location.reload();
        });
        document.getElementById('adm-headless-toggle')?.addEventListener('change', (e) => {
            localStorage.setItem('admin_headless', e.target.checked ? 'false' : 'true');
        });
    } catch (e) { console.error('[Topbar] Render Error:', e); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
