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
import { renderSettings } from './pages/Settings.js';

console.log('[Main] Booting System...');

// ── Register Routes ──────────────────────────────────────────
registerRoute('/login',     renderLogin);
registerRoute('/dashboard', renderDashboard);
registerRoute('/scrapers',  renderScrapers);
registerRoute('/logs',      renderLogs);
registerRoute('/users',     renderUsers);
registerRoute('/settings',  renderSettings);

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
            <div style="display:flex; align-items:center; gap:16px;">
                <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px; border-right:1px solid var(--border-glass); padding-right:16px;">
                    <i data-lucide="clock" style="width:14px;height:14px;"></i>
                    <span id="adm-live-clock">--:--:--</span>
                </div>
                <div style="font-size:12px; font-weight:600; color:var(--text-tertiary);">
                    ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

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

                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="btn-new-project" style="cursor:default; background:var(--bg-card); border:1px solid var(--border-glass); color:var(--text-primary); font-family:monospace; font-size:11px; padding:6px 14px; border-radius:12px;">
                        <span style="opacity:0.5; margin-right:6px;">API_URL:</span>
                        <span style="color:var(--text-primary); font-weight:600;">${getApiBase().replace('https://','').replace('http://','')}</span>
                    </div>
                    ${isLocal ? `
                    <button id="adm-local-help-btn" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); padding:6px 10px; border-radius:10px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="help-circle" style="width:14px;height:14px;"></i> Not Loading?
                    </button>
                    ` : ''}
                </div>

                <button class="btn-theme-toggle" id="adm-theme-toggle" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glass);">
                    <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" style="width:18px;height:18px;"></i>
                </button>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();

        // Inject Help Modal
        if (isLocal && !document.getElementById('adm-local-help-modal')) {
            const modal = document.createElement('div');
            modal.id = 'adm-local-help-modal';
            modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
            modal.innerHTML = `
                <div style="background:var(--bg-card); border:1px solid var(--border-glass); width:500px; border-radius:20px; padding:32px; position:relative;">
                    <h2 style="font-size:20px; font-weight:800; margin-bottom:16px; color:#ef4444; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="alert-triangle"></i> Why is Data Not Loading?
                    </h2>
                    <p style="color:var(--text-secondary); font-size:14px; line-height:1.6; margin-bottom:20px;">
                        Your web browser is strictly blocking the GitHub Pages website from talking to your local Python server. This is a built-in security feature called <strong>Mixed Content</strong> (HTTPS trying to fetch HTTP). Since I cannot override your browser's security via code, you must manually allow it:
                    </p>
                    <ol style="color:var(--text-primary); font-size:14px; line-height:1.8; margin-left:20px; margin-bottom:24px;">
                        <li>Click the <strong>Settings icon (Lock/Tune)</strong> on the left side of your URL bar.</li>
                        <li>Click <strong>Site settings</strong>.</li>
                        <li>Scroll down to <strong>Insecure content</strong> and change it from <em>Block</em> to <strong>Allow</strong>.</li>
                        <li>Come back to this page and reload.</li>
                    </ol>
                    <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:12px; margin-bottom:24px; font-size:13px; color:var(--text-secondary);">
                        <strong>Note:</strong> Make sure your python backend is actually running in your terminal! (<code style="background:#000; padding:2px 6px; border-radius:4px; color:#10b981;">uvicorn app.main:app</code>)
                    </div>
                    <button onclick="document.getElementById('adm-local-help-modal').style.display='none'" style="width:100%; height:44px; background:var(--text-primary); color:var(--bg-page); border:none; border-radius:10px; font-weight:700; cursor:pointer;">Got it, Close</button>
                </div>
            `;
            document.body.appendChild(modal);
            if (window.lucide) window.lucide.createIcons();
        }

        document.getElementById('adm-local-help-btn')?.addEventListener('click', () => {
            const m = document.getElementById('adm-local-help-modal');
            if (m) m.style.display = 'flex';
        });

        // Start clock
        setInterval(() => {
            const clock = document.getElementById('adm-live-clock');
            if (clock) clock.innerText = new Date().toLocaleTimeString();
        }, 1000);

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
