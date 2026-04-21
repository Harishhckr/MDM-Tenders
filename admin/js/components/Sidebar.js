// ============================================================
// Admin Sidebar Component — Premium Style
// ============================================================
import { getApiMode } from '../utils/api.js';

export function renderAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    const path = window.location.hash || '#/dashboard';

    sidebar.innerHTML = `
        <div class="brand">
            <div class="brand-icon"><i data-lucide="shield-check"></i></div>
            <div class="brand-text">Leonex</div>
            <div class="brand-badge">Admin</div>
        </div>

        <div class="nav-section">
            <div class="nav-label">System</div>
            <a href="#/dashboard" class="nav-item ${path === '#/dashboard' ? 'active' : ''}">
                <i data-lucide="activity"></i> Dashboard
            </a>
            <a href="#/scrapers" class="nav-item ${path === '#/scrapers' ? 'active' : ''}">
                <i data-lucide="bot"></i> Scraper Engines
            </a>
            <a href="#/logs" class="nav-item ${path === '#/logs' ? 'active' : ''}">
                <i data-lucide="scroll-text"></i> System Logs
            </a>
        </div>

        <div class="nav-section">
            <div class="nav-label">Management</div>
            <a href="#/users" class="nav-item ${path === '#/users' ? 'active' : ''}">
                <i data-lucide="users"></i> User Access
            </a>
        </div>

        <div class="sidebar-footer">
            <button class="nav-item" id="admin-logout-btn" style="color:var(--accent-red); margin-top:0;">
                <i data-lucide="log-out"></i> Sign Out
            </button>
            <div style="margin-top:16px; padding:0 16px;">
                <div style="font-size:10px; color:var(--text-tertiary); text-transform:uppercase; font-weight:800; letter-spacing:0.05em;">API Environment</div>
                <div style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-top:4px; display:flex; align-items:center; gap:6px;">
                    <span style="width:6px; height:6px; border-radius:50%; background:var(--accent-purple);"></span>
                    ${getApiMode().toUpperCase()}
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        window.location.hash = '#/login';
        window.location.reload();
    });
}
