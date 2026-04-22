// ============================================================
// Admin Settings Page
// ============================================================

export async function renderSettings(container) {
    container.innerHTML = `
        <div class="section-title anim-in">
            <i data-lucide="settings"></i> System Settings
        </div>

        <div class="adm-card anim-in anim-d1" style="background:var(--bg-card); border:1px solid var(--border-glass); border-radius:4px; padding:32px; max-width:800px;">
            <h3 style="font-size:18px; font-weight:800; margin-bottom:24px; color:var(--text-primary);">Preferences</h3>
            
            <div style="display:flex; flex-direction:column; gap:24px;">
                <!-- Headless Mode -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:24px; border-bottom:1px solid var(--border-subtle);">
                    <div>
                        <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">Headless Scraper Mode</div>
                        <div style="font-size:13px; color:var(--text-tertiary);">Run extraction engines without visible browser windows. Disabling this helps debug captcha blocks.</div>
                    </div>
                    <label class="adm-toggle">
                        <input type="checkbox" id="settings-headless-toggle" ${localStorage.getItem('admin_headless') !== 'false' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <!-- API Backend -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:24px; border-bottom:1px solid var(--border-subtle);">
                    <div>
                        <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">Local Development Mode</div>
                        <div style="font-size:13px; color:var(--text-tertiary);">Connect Admin Portal to local backend (localhost:8000) instead of production Render server.</div>
                    </div>
                    <label class="adm-toggle">
                        <input type="checkbox" id="settings-api-toggle" ${localStorage.getItem('admin_api_backend') === 'local' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div style="margin-top:32px; padding:16px; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); border-radius:4px; display:flex; gap:16px; align-items:flex-start;">
                <i data-lucide="info" style="color:#3b82f6; width:20px; height:20px; flex-shrink:0; margin-top:2px;"></i>
                <div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
                    <strong style="color:var(--text-primary);">Mixed Content Warning:</strong> If you are accessing this portal via <code style="background:var(--bg-page); padding:2px 6px; border-radius:4px;">https://</code> (like GitHub Pages) and you switch to Local Mode, your browser will block the connection to <code style="background:var(--bg-page); padding:2px 6px; border-radius:4px;">http://localhost:8000</code>. To use Local Mode, please run the frontend locally (e.g., using Live Server).
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Event Listeners
    document.getElementById('settings-headless-toggle')?.addEventListener('change', (e) => {
        localStorage.setItem('admin_headless', e.target.checked ? 'true' : 'false');
    });

    document.getElementById('settings-api-toggle')?.addEventListener('change', (e) => {
        localStorage.setItem('admin_api_backend', e.target.checked ? 'local' : 'remote');
        window.location.reload();
    });
}

