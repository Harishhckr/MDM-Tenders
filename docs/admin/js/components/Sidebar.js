// ============================================================
// Admin Sidebar Component — Premium Monochrome
// ============================================================
import { navigate, getCurrentRoute } from '../router.js';
import { clearToken } from '../utils/api.js';

const navGroups = [
    {
        section: 'MAIN',
        items: [
            { icon: 'layout-dashboard', label: 'Overview', route: '/dashboard' },
            { icon: 'bot', label: 'Scrapers', route: '/scrapers', badgeId: 'sc-badge' },
            { icon: 'scroll-text', label: 'Live Logs', route: '/logs' }
        ]
    },
    {
        section: 'MANAGEMENT',
        items: [
            { icon: 'users', label: 'User Access', route: '/users' },
            { icon: 'settings', label: 'Settings', route: '/settings' }
        ]
    }
];

export function renderAdminSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    const currentRoute = getCurrentRoute();
    const currentPath = currentRoute ? currentRoute.path : '#/dashboard';

    let navHTML = '';
    navGroups.forEach(group => {
        navHTML += `<div class="nav-section-title">${group.section}</div>`;
        group.items.forEach(item => {
            const isActive = currentPath.includes(item.route) ? 'active' : '';
            // Live badge count logic could go here
            const badge = item.badgeId ? `<span class="nav-badge" id="${item.badgeId}">—</span>` : '';
            
            navHTML += `
                <button class="nav-item ${isActive}" onclick="window.location.hash='#${item.route}'">
                    <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
                    <span class="nav-label">${item.label}</span>
                    ${badge}
                </button>`;
        });
    });

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <div class="logo-icon"><i data-lucide="shield-check"></i></div>
                <div class="logo-text">Admin</div>
            </div>
        </div>
        <nav class="sidebar-nav">
            ${navHTML}
        </nav>
        <div class="sidebar-footer">
            <button class="nav-item nav-item-logout" id="adm-logout-btn">
                <span class="nav-icon"><i data-lucide="log-out"></i></span>
                <span class="nav-label">Logout</span>
            </button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('adm-logout-btn')?.addEventListener('click', () => {
        clearToken();
        window.location.hash = '#/login';
        window.location.reload();
    });
}
