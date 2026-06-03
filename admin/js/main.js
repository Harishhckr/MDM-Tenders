// ============================================================
// Admin Portal — Main Entry Point (Robust Version)
// ============================================================
import { registerRoute, handleRoute, getCurrentRoute } from './router.js';
import { isLoggedIn, getApiBase, getApiMode, clearToken } from './utils/api.js';
import { renderLogin } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderScrapers } from './pages/Scrapers.js';
import { renderLogs } from './pages/Logs.js';
import { renderUsers } from './pages/Users.js';
import { renderSettings } from './pages/Settings.js';
import { renderTerminal } from './pages/Terminal.js';

console.log('[Main] Booting System...');

// ── Register Routes ──────────────────────────────────────────
registerRoute('/login', renderLogin);
registerRoute('/dashboard', renderDashboard);
registerRoute('/scrapers', renderScrapers);
registerRoute('/logs', renderLogs);
registerRoute('/users', renderUsers);
registerRoute('/settings', renderSettings);
registerRoute('/terminal', renderTerminal);

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
    try { localStorage.setItem('theme', next); } catch (e) { }
    renderTopbar();
}

function boot() {
    console.log('[Main] Initializing Boot Sequence...');
    initTheme();
    const app = document.getElementById('admin-app');
    if (!app) { console.error('[Main] #admin-app NOT FOUND!'); return; }

    try {
        const loggedIn = isLoggedIn();
        if (loggedIn) {
            app.classList.remove('logged-out');
            renderTopbar();
        } else {
            app.classList.add('logged-out');
            const topbar = document.getElementById('admin-topbar');
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
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; height:100%;">
                
                <!-- Left: Title & Theme Toggle -->
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:900; font-size:16px; letter-spacing:1px; margin-right:8px;">ADMIN</span>
                    <button class="bb-theme-toggle" id="adm-theme-toggle" title="Toggle Theme">
                        <i data-lucide="${currentTheme === 'dark' ? 'moon' : 'sun'}" style="width:16px;height:16px;"></i>
                    </button>
                </div>

                <!-- Center: Navigation Pills -->
                <div class="bb-nav-group hide-on-mobile">
                    <button class="bb-nav-item ${isActive('/dashboard')}" onclick="window.location.hash='#/dashboard'">Overview</button>
                    <button class="bb-nav-item ${isActive('/scrapers')}" onclick="window.location.hash='#/scrapers'">Scrapers</button>
                    <button class="bb-nav-item ${isActive('/logs')}" onclick="window.location.hash='#/logs'">Logs</button>
                    <button class="bb-nav-item ${isActive('/users')}" onclick="window.location.hash='#/users'">Users</button>
                    <button class="bb-nav-item ${isActive('/settings')}" onclick="window.location.hash='#/settings'">Settings</button>
                    <button class="bb-nav-item ${isActive('/terminal')}" onclick="window.location.hash='#/terminal'">Terminal</button>
                </div>

                <!-- Right: Profile & Actions -->
                <div style="display:flex; align-items:center; gap:16px;">
                    
                    <!-- Headless / Visible Toggle -->
                    <div style="display:flex;align-items:center;gap:10px; background:var(--bg-card); padding:4px 12px; border-radius:20px; border:1px solid var(--border-glass);" class="hide-on-mobile">
                        <span style="font-size:10px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Visible Browser</span>
                        <label class="adm-toggle">
                            <input type="checkbox" id="adm-headless-toggle" ${!isHeadless ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div id="backend-switcher" title="Switch between local and Render server" class="bb-backend-badge"
                        onclick="(function(){
                            const nextMode = localStorage.getItem('admin_api_backend') === 'local' ? 'remote' : 'local';
                            localStorage.setItem('admin_api_backend', nextMode);
                            window.location.reload();
                        })()">
                        <span style="width:6px;height:6px;border-radius:50%;background:${isLocal ? '#22c55e' : '#f97316'};display:inline-block;margin-right:4px;"></span>
                        ${isLocal ? 'LOCAL' : 'RENDER'}
                    </div>
                    
                    <button class="bb-profile-bubble" id="adm-profile-btn" title="Logout">AD</button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // ── Event Listeners ───────────────

        // Theme Toggle click
        document.getElementById('adm-theme-toggle')?.addEventListener('click', toggleTheme);

        // Headless (Visible Browser) Toggle click
        document.getElementById('adm-headless-toggle')?.addEventListener('change', (e) => {
            localStorage.setItem('admin_headless', e.target.checked ? 'false' : 'true');
        });

        // Logout handling
        document.getElementById('adm-profile-btn')?.addEventListener('click', () => {
            if (confirm("Are you sure you want to log out?")) {
                clearToken();
                window.location.hash = '#/login';
                window.location.reload();
            }
        });
    } catch (e) {
        console.error('[Topbar] Render Error:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
