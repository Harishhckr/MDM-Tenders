// ============================================================
// Admin Sidebar — Matched to Design Image
// ============================================================
import { getApiMode } from '../utils/api.js';

export function renderAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    const path = window.location.hash || '#/dashboard';

    sidebar.innerHTML = `
        <div class="brand">
            <div class="brand-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
            </div>
            <div class="brand-text">Leonex</div>
        </div>

        <div class="nav-section">
            <div class="nav-label">Main</div>
            <a href="#/dashboard" class="nav-item ${path === '#/dashboard' ? 'active' : ''}">
                <i data-lucide="layout-grid"></i> Overview
            </a>
            <a href="#/scrapers" class="nav-item ${path === '#/scrapers' ? 'active' : ''}">
                <i data-lucide="bot"></i> Scrapers
                <span class="badge-count" id="sidebar-tender-count">...</span>
            </a>
            <a href="#/logs" class="nav-item ${path === '#/logs' ? 'active' : ''}">
                <i data-lucide="scroll-text"></i> Live Logs
            </a>
        </div>

        <div class="nav-section" style="margin-top:20px;">
            <div class="nav-label">Management</div>
            <a href="#/users" class="nav-item ${path === '#/users' ? 'active' : ''}">
                <i data-lucide="users"></i> User Access
            </a>
        </div>

        <div class="sidebar-footer">
            <a href="#/settings" class="nav-item ${path === '#/settings' ? 'active' : ''}">
                <i data-lucide="settings"></i> Settings
            </a>
            <button class="nav-item" id="admin-logout-btn" style="color:var(--accent-red); cursor:pointer; background:none; border:none; width:100%;">
                <i data-lucide="log-out"></i> Logout
            </button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Fetch live count for the badge
    fetchCount();

    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        window.location.hash = '#/login';
        window.location.reload();
    });
}

async function fetchCount() {
    const el = document.getElementById('sidebar-tender-count');
    if (!el) return;
    try {
        const res = await fetch(`${window.API_BASE || ''}/stats`);
        const d = await res.json();
        el.textContent = d.total_tenders || 0;
    } catch(e) { el.textContent = '0'; }
}
