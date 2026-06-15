import { navigate } from '../router.js';
import { getApiBackendMode, setApiBackend, getUserInfo, getUserRole, getSessionExpiry, clearTokens } from '../utils/api.js';

export function renderTopbar() {
    return `
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">
            <i data-lucide="menu" style="width:20px;height:20px;"></i>
        </button>
        <div class="search-bar" id="search-bar">
            <span class="search-icon"><i data-lucide="search" style="width:16px;height:16px;"></i></span>
            <input type="text" placeholder="Search or type a command" id="search-input">
            <span class="search-shortcut">⌘F</span>
        </div>
        <div class="topbar-actions">
            <!-- Backend Switcher -->
            <div id="backend-switcher" title="Switch between local (visible browser) and Render server" style="display:flex;align-items:center;gap:6px;background:var(--surface-2,rgba(255,255,255,0.05));border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:20px;padding:3px 4px;cursor:pointer;" onclick="(function(){
                const mode = localStorage.getItem('api_backend') === 'local' ? 'remote' : 'local';
                localStorage.setItem('api_backend', mode);
                document.getElementById('backend-dot').style.background = mode === 'local' ? '#22c55e' : '#f97316';
                document.getElementById('backend-label').textContent = mode === 'local' ? 'Local' : 'Render';
                document.getElementById('backend-icon').setAttribute('data-lucide', mode === 'local' ? 'monitor' : 'cloud');
                if(window.lucide) window.lucide.createIcons();
                window.location.reload();
            })()">
                <span id="backend-dot" style="width:8px;height:8px;border-radius:50%;background:${localStorage.getItem('api_backend') === 'local' ? '#22c55e' : '#f97316'};flex-shrink:0;"></span>
                <i id="backend-icon" data-lucide="${localStorage.getItem('api_backend') === 'local' ? 'monitor' : 'cloud'}" style="width:13px;height:13px;opacity:0.75;"></i>
                <span id="backend-label" style="font-size:11px;font-weight:600;letter-spacing:0.3px;color:var(--text-secondary);padding-right:4px;">${localStorage.getItem('api_backend') === 'local' ? 'Local' : 'Render'}</span>
            </div>
            <button class="theme-toggle" id="theme-btn" aria-label="Toggle Theme">
                <span class="icon-sun"><i data-lucide="sun" style="width:16px;height:16px;"></i></span>
                <span class="icon-moon"><i data-lucide="moon" style="width:16px;height:16px;"></i></span>
            </button>
            <button class="btn-primary" id="new-project-btn">
                <i data-lucide="plus" style="width:14px;height:14px;"></i> New Project
            </button>
            <div style="position:relative;">
                <button class="btn-icon notif-badge" id="notif-btn" aria-label="Notifications">
                    <i data-lucide="bell" style="width:18px;height:18px;"></i>
                    <span class="notif-dot"></span>
                </button>
                <!-- Notification Popup -->
                <div class="notif-popup" id="notif-popup" style="display:none;">
                    <div class="notif-popup-header">
                        <span style="font-size:15px; font-weight:700; color:var(--text-primary);">Notifications</span>
                        <button class="notif-clear-btn" id="notif-clear">Clear All</button>
                    </div>
                    <div class="notif-popup-list" id="notif-list">
                        <div class="notif-item unread">
                            <div class="notif-item-icon" style="background:var(--accent-green-dim); color:var(--accent-green);"><i data-lucide="check-circle" style="width:16px;height:16px;"></i></div>
                            <div class="notif-item-body">
                                <div class="notif-item-title">GEM Portal sync complete</div>
                                <div class="notif-item-desc">122 new tenders extracted successfully</div>
                                <div class="notif-item-time">2 minutes ago</div>
                            </div>
                        </div>
                        <div class="notif-item unread">
                            <div class="notif-item-icon" style="background:var(--accent-purple-dim); color:var(--accent-purple);"><i data-lucide="sparkles" style="width:16px;height:16px;"></i></div>
                            <div class="notif-item-body">
                                <div class="notif-item-title">AI Analysis ready</div>
                                <div class="notif-item-desc">MDM keyword matching found 34% surge in Data Center demand</div>
                                <div class="notif-item-time">15 minutes ago</div>
                            </div>
                        </div>
                        <div class="notif-item">
                            <div class="notif-item-icon" style="background:var(--accent-orange-dim); color:var(--accent-orange);"><i data-lucide="alert-triangle" style="width:16px;height:16px;"></i></div>
                            <div class="notif-item-body">
                                <div class="notif-item-title">TenderOnTime rate limited</div>
                                <div class="notif-item-desc">Scraper paused due to throttling. Will retry in 5 minutes.</div>
                                <div class="notif-item-time">1 hour ago</div>
                            </div>
                        </div>
                        <div class="notif-item">
                            <div class="notif-item-icon" style="background:var(--accent-blue-dim); color:var(--accent-blue);"><i data-lucide="download" style="width:16px;height:16px;"></i></div>
                            <div class="notif-item-body">
                                <div class="notif-item-title">Export completed</div>
                                <div class="notif-item-desc">Master data exported to tender_export.xlsx</div>
                                <div class="notif-item-time">3 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="user-info-panel" style="position:relative;">
                <button id="user-menu-btn" style="display:flex;align-items:center;gap:8px;background:transparent;border:1px solid var(--border-color);border-radius:20px;padding:4px 12px 4px 4px;cursor:pointer;transition:all 0.2s;">
                    <div id="user-avatar" style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;"></div>
                    <div style="text-align:left;">
                        <div id="user-name-label" style="font-size:11px;font-weight:700;color:var(--text-primary);line-height:1.2;"></div>
                        <div id="user-role-label" style="font-size:10px;font-weight:600;line-height:1.2;"></div>
                    </div>
                    <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5;"></i>
                </button>
                <!-- User dropdown -->
                <div id="user-dropdown" style="display:none;position:absolute;right:0;top:calc(100% + 8px);width:240px;background:var(--bg-surface,#111);border:1px solid var(--border-color);border-radius:12px;padding:8px;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
                    <div style="padding:10px 12px;border-bottom:1px solid var(--border-color);margin-bottom:6px;">
                        <div id="dropdown-email" style="font-size:12px;color:var(--text-secondary);word-break:break-all;"></div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                            <span id="dropdown-role-badge" style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;"></span>
                            <span id="dropdown-session" style="font-size:10px;color:var(--text-tertiary);"></span>
                        </div>
                    </div>
                    <button onclick="window._leonexLogout()" style="width:100%;text-align:left;padding:8px 12px;border-radius:8px;border:none;background:transparent;color:#ff6b6b;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,59,59,0.1)'" onmouseout="this.style.background='transparent'">
                        <i data-lucide="log-out" style="width:14px;height:14px;"></i> Sign out
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function initTopbarEvents() {
    // ── Populate User Info Panel (instant — reads from localStorage cache) ──
    const user = getUserInfo();
    const role = getUserRole();
    const expiry = getSessionExpiry();

    if (user) {
        const nameLabel = document.getElementById('user-name-label');
        const roleLabel = document.getElementById('user-role-label');
        const avatarEl = document.getElementById('user-avatar');
        const emailEl = document.getElementById('dropdown-email');
        const roleBadge = document.getElementById('dropdown-role-badge');
        const sessionEl = document.getElementById('dropdown-session');

        const initials = (user.email || 'U').charAt(0).toUpperCase();
        const isAdminRole = role === 'admin';
        const roleColor = isAdminRole ? '#7c5cfc' : '#22c55e';
        const roleBg = isAdminRole ? 'rgba(124,92,252,0.15)' : 'rgba(34,197,94,0.15)';
        const roleText = isAdminRole ? '⬡ ADMIN' : '◎ USER';

        if (avatarEl) {
            avatarEl.textContent = initials;
            avatarEl.style.background = roleBg;
            avatarEl.style.color = roleColor;
            avatarEl.style.border = `1px solid ${roleColor}44`;
        }
        if (nameLabel) nameLabel.textContent = user.email?.split('@')[0] || 'User';
        if (roleLabel) {
            roleLabel.textContent = roleText;
            roleLabel.style.color = roleColor;
        }
        if (emailEl) emailEl.textContent = user.email || '';
        if (roleBadge) {
            roleBadge.textContent = roleText;
            roleBadge.style.background = roleBg;
            roleBadge.style.color = roleColor;
        }
        if (sessionEl && expiry) {
            sessionEl.textContent = `Session: ${expiry.remainingLabel}`;
        }
    }

    // ── User Menu Dropdown ──────────────────────────────────────────────────
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userDropdown.style.display !== 'none';
            userDropdown.style.display = isOpen ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
                userDropdown.style.display = 'none';
            }
        });
    }

    // ── Logout Handler ──────────────────────────────────────────────────────
    window._leonexLogout = () => {
        clearTokens();
        navigate('/login');
    };

    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            import('../theme.js').then(({ toggleTheme }) => toggleTheme());
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
        });
    }

    // New Project → Notes page
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => navigate('/notes'));
    }

    // Notification popup toggle
    const notifBtn = document.getElementById('notif-btn');
    const notifPopup = document.getElementById('notif-popup');
    if (notifBtn && notifPopup) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notifPopup.style.display !== 'none';
            notifPopup.style.display = isVisible ? 'none' : 'flex';
            const dot = notifBtn.querySelector('.notif-dot');
            if (dot) dot.style.display = 'none';
        });
        document.addEventListener('click', (e) => {
            if (!notifPopup.contains(e.target) && e.target !== notifBtn) {
                notifPopup.style.display = 'none';
            }
        });
        const clearBtn = document.getElementById('notif-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const list = document.getElementById('notif-list');
                if (list) list.innerHTML = `
                    <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary);font-size:13px;">
                        <i data-lucide="bell-off" style="width:28px;height:28px;opacity:0.3;display:block;margin:0 auto 10px;"></i>
                        No new notifications
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
        }
    });
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
    });
}

// New Project → Notes page
const newProjectBtn = document.getElementById('new-project-btn');
if (newProjectBtn) {
    newProjectBtn.addEventListener('click', () => {
        navigate('/notes');
    });
}

// Notification popup toggle
const notifBtn = document.getElementById('notif-btn');
const notifPopup = document.getElementById('notif-popup');
if (notifBtn && notifPopup) {
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notifPopup.style.display !== 'none';
        notifPopup.style.display = isVisible ? 'none' : 'flex';
        // Remove dot on open
        const dot = notifBtn.querySelector('.notif-dot');
        if (dot) dot.style.display = 'none';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!notifPopup.contains(e.target) && e.target !== notifBtn) {
            notifPopup.style.display = 'none';
        }
    });
}
