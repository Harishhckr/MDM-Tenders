import { navigate, getCurrentRoute } from '../router.js';

const navItems = [
    {
        section: 'MAIN',
        items: [
            { icon: 'layout-dashboard', label: 'Overview', route: '/overview' },
            { icon: 'folder', label: 'Tenders', route: '/tenders', badgeId: 'tender-count' },
            { icon: 'database', label: 'MDM Tenders', route: '/mdm-tenders' },
            { icon: 'sparkles', label: 'AI Insights', route: '/ai-overview' },
            { icon: 'bookmark', label: 'Bookmarks', route: '/bookmarks' },
            { icon: 'search', label: 'Google', route: '/google' }
        ]
    },
    {
        section: 'SOURCES',
        items: [
            { icon: 'globe', label: 'GEM Portal', route: '/gem-portal' },
            { icon: 'bar-chart-2', label: 'TenderOnTime', route: '/tender-on-time' },
            { icon: 'file-text', label: 'TenderDetails', route: '/tender-detail' },
            { icon: 'clock', label: 'Tender247', route: '/tender-247' },
            { icon: 'briefcase', label: 'BidTenders', route: '/bid-tenders' }
        ]
    }
];

// Sparkle cluster logo SVG
const logoSVG = `
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
  <path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25L19 3Z" fill="currentColor" opacity="0.7"/>
  <path d="M6 16L6.5 17.5L8 18L6.5 18.5L6 20L5.5 18.5L4 18L5.5 17.5L6 16Z" fill="currentColor" opacity="0.5"/>
</svg>`;

export function renderSidebar() {
    const currentRoute = getCurrentRoute();

    let navHTML = '';
    navItems.forEach(group => {
        if (group.section) {
            navHTML += `<div class="nav-section-title">${group.section}</div>`;
        }
        group.items.forEach(item => {
            const isActive = currentRoute === item.route ? 'active' : '';
            const badge = item.badgeId
                ? `<span class="nav-badge" id="${item.badgeId}">…</span>`
                : (item.badge ? `<span class="nav-badge">${item.badge}</span>` : '');
            navHTML += `
                <button class="nav-item ${isActive}" data-route="${item.route}" id="nav-${item.route.slice(1)}">
                    <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
                    <span class="nav-label">${item.label}</span>
                    ${badge}
                </button>`;
        });
    });

    return `
        <div class="sidebar-inner">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <div class="logo-icon">${logoSVG}</div>
                    <div class="logo-text">Leonex</div>
                </div>
            </div>
            <nav class="sidebar-nav-scroll">
                ${navHTML}
            </nav>
            <div class="sidebar-footer">
                <button class="nav-item" id="nav-settings" data-route="/settings">
                    <span class="nav-icon"><i data-lucide="settings"></i></span>
                    <span class="nav-label">Settings</span>
                </button>
                <button class="nav-item" id="logout-btn">
                    <span class="nav-icon"><i data-lucide="log-out"></i></span>
                    <span class="nav-label">Logout</span>
                </button>
            </div>
        </div>
    `;
}

export function initSidebarEvents() {
    document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.getAttribute('data-route'));
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('leonex-auth');
            navigate('/login');
        });
    }

    // Fetch live tender count for sidebar badge
    fetch('http://localhost:8000/api/stats')
        .then(r => r.json())
        .then(data => {
            const badge = document.getElementById('tender-count');
            if (badge) badge.textContent = data.total_tenders || '0';
        })
        .catch(() => {
            const badge = document.getElementById('tender-count');
            if (badge) badge.textContent = '—';
        });
}

