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
        const isLocal = mode === 'local';

        topbar.innerHTML = `
            <div class="topbar-actions" style="margin-left:auto; display:flex; align-items:center; gap:20px;">
                
                <!-- Backend Switcher (Matches User UI) -->
                <div id="backend-switcher" title="Switch between local (visible browser) and Render server" 
                    style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:4px 8px;cursor:pointer;"
                    onclick="(function(){
                        const nextMode = localStorage.getItem('admin_api_backend') === 'local' ? 'remote' : 'local';
                        localStorage.setItem('admin_api_backend', nextMode);
                        window.location.reload();
                    })()">
                    <span id="backend-dot" style="width:8px;height:8px;border-radius:50%;background:${isLocal ? '#22c55e' : '#f97316'};flex-shrink:0;"></span>
                    <i data-lucide="${isLocal ? 'monitor' : 'cloud'}" style="width:14px;height:14px;opacity:0.8;"></i>
                    <span id="backend-label" style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:var(--text-secondary);padding-right:4px;text-transform:uppercase;">
                        ${isLocal ? 'Local' : 'Render'}
                    </span>
                </div>

                ${isLocal ? `
                <div style="display:flex;align-items:center;gap:10px; background:rgba(255,255,255,0.03); padding:4px 12px; border-radius:20px; border:1px solid var(--border-glass);">
                    <span style="font-size:10px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Visible Browser</span>
                    <label class="adm-toggle">
                        <input type="checkbox" id="adm-headless-toggle" ${!isHeadless ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                ` : ''}

                <div class="btn-new-project" style="cursor:default; background:var(--bg-card); border:1px solid var(--border-glass); color:var(--text-primary); font-family:monospace; font-size:11px; padding:6px 14px; border-radius:12px;">
                    <span style="opacity:0.5; margin-right:6px;">API_URL:</span>
                    <span style="color:var(--text-primary); font-weight:600;">${getApiBase().replace('https://','').replace('http://','')}</span>
                </div>

                <button class="btn-theme-toggle" id="adm-theme-toggle" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glass);">
                    <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" style="width:18px;height:18px;"></i>
                </button>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);
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
