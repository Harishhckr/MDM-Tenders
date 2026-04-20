// ============================================
// LEONEX TENDER — Settings Page
// Premium Glassmorphism Settings UI
// ============================================

export function renderSettings(container) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    container.innerHTML = `
        <div class="page-header anim-in">
            <div class="page-header-text">
                <h1>Settings</h1>
                <p>Configure your dashboard preferences and data management</p>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; max-width:900px;">

            <!-- Profile Section -->
            <div class="card glass-panel anim-in anim-d1" style="padding:28px; border-radius:20px; grid-column:span 2;">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:24px;">
                    <div style="width:64px; height:64px; border-radius:50%; overflow:hidden; border: 2px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <img src="src/assets/image.png" style="width:100%; height:100%; object-fit:cover;" alt="User Profile">
                    </div>
                    <div>
                        <div style="font-size:20px; font-weight:700; color:var(--text-primary);">Admin User</div>
                        <div style="font-size:14px; color:var(--text-tertiary); margin-top:2px;">admin@leonex.io</div>
                    </div>
                    <button class="btn-secondary" style="margin-left:auto; border-radius:100px; padding:8px 20px; font-size:13px;">Edit Profile</button>
                </div>
            </div>

            <!-- Appearance -->
            <div class="card glass-panel anim-in anim-d2" style="padding:28px; border-radius:20px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">
                    <i data-lucide="palette" style="width:20px;height:20px;color:var(--accent-purple);"></i>
                    <span style="font-size:16px; font-weight:600; color:var(--text-primary);">Appearance</span>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">Dark Mode</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Switch between light and dark themes</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="settings-theme-toggle" ${currentTheme === 'dark' ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">Animations</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Enable smooth transitions and effects</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Notifications -->
            <div class="card glass-panel anim-in anim-d2" style="padding:28px; border-radius:20px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">
                    <i data-lucide="bell" style="width:20px;height:20px;color:var(--accent-orange);"></i>
                    <span style="font-size:16px; font-weight:600; color:var(--text-primary);">Notifications</span>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">Scraper Alerts</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Notify when scrapers find new tenders</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">Error Reports</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Get notified when scrapers fail</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Data Management -->
            <div class="card glass-panel anim-in anim-d3" style="padding:28px; border-radius:20px; grid-column:span 2;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">
                    <i data-lucide="database" style="width:20px;height:20px;color:var(--accent-green);"></i>
                    <span style="font-size:16px; font-weight:600; color:var(--text-primary);">Data Management</span>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">Export All Data</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Download complete tender database as Excel</div>
                    </div>
                    <button class="btn-secondary" style="border-radius:100px; padding:8px 20px; font-size:13px;" id="settings-export">
                        <i data-lucide="download" style="width:14px;height:14px;"></i> Export
                    </button>
                </div>
                <div class="settings-row">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:var(--text-primary);">API Endpoint</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Backend connection URL</div>
                    </div>
                    <code style="font-size:12px; padding:6px 14px; background:var(--bg-hover); border-radius:8px; color:var(--text-secondary);">localhost:8000</code>
                </div>
                <div class="settings-row" style="border-bottom:none;">
                    <div>
                        <div style="font-size:14px; font-weight:500; color:#EF4444;">Clear All Data</div>
                        <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Permanently delete all scraped tender data</div>
                    </div>
                    <button class="btn-secondary" style="border-radius:100px; padding:8px 20px; font-size:13px; color:#EF4444; border-color:#EF4444;">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Clear
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Theme toggle
    const themeToggle = container.querySelector('#settings-theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const next = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.classList.add('theme-transition');
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('leonex-theme', next);
            setTimeout(() => document.documentElement.classList.remove('theme-transition'), 500);
        });
    }

    // Export
    const exportBtn = container.querySelector('#settings-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = 'http://localhost:8000/api/export';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
    }
}
