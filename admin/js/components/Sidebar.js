// ============================================================
// Admin Sidebar Component
// ============================================================
import { navigate } from '../router.js';
import { clearToken, getApiMode, setApiBackend } from '../utils/api.js';

export function renderAdminSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="brand">
            <div class="brand-icon"><i data-lucide="terminal"></i></div>
            <span class="brand-text">Leonex</span>
            <span class="brand-badge">Admin</span>
        </div>
        <div class="nav-section">
            <div class="nav-label">Monitor</div>
            <button class="nav-item" data-route="/dashboard" onclick="window.location.hash='#/dashboard'">
                <i data-lucide="layout-dashboard"></i> Dashboard
            </button>
            <button class="nav-item" data-route="/scrapers" onclick="window.location.hash='#/scrapers'">
                <i data-lucide="bot"></i> Scrapers
            </button>
            <button class="nav-item" data-route="/logs" onclick="window.location.hash='#/logs'">
                <i data-lucide="scroll-text"></i> Live Logs
            </button>
        </div>
        <div class="nav-section">
            <div class="nav-label">Manage</div>
            <button class="nav-item" data-route="/users" onclick="window.location.hash='#/users'">
                <i data-lucide="users"></i> Users
            </button>
        </div>
        <div class="sidebar-footer">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <span style="font-size:10px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-mono);">API</span>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span id="adm-api-label" style="font-size:10px;font-weight:600;color:${getApiMode() === 'local' ? 'var(--neon-green)' : 'var(--neon-orange)'};font-family:var(--font-mono);text-transform:uppercase;">${getApiMode()}</span>
                    <label class="adm-toggle">
                        <input type="checkbox" id="adm-api-toggle" ${getApiMode() === 'local' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <button class="nav-item" id="adm-logout-btn" style="color:var(--neon-red);">
                <i data-lucide="log-out"></i> Logout
            </button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('adm-api-toggle')?.addEventListener('change', (e) => {
        setApiBackend(e.target.checked ? 'local' : 'remote');
        window.location.reload();
    });

    document.getElementById('adm-logout-btn')?.addEventListener('click', () => {
        clearToken();
        window.location.hash = '#/login';
        window.location.reload();
    });
}
