// ============================================================
// Admin Dashboard — Premium Hero Layout
// ============================================================
export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="anim-in">
            <div class="hero-tag">Tender Intelligence Platform</div>
            
            <h1 class="hero-title">
                Leonex Tenders,<br>
                intelligently sourced.
            </h1>
            
            <p class="hero-desc">
                One platform, multiple sources. Navigate enterprise master data management tenders, 
                leverage deeply integrated AI insights, and effortlessly automate your discovery 
                pipeline — while you focus on what matters.
            </p>

            <div class="hero-links">
                <a href="#/scrapers" class="hero-link">
                    MDM Tenders
                </a>
                <a href="#/scrapers" class="hero-link">
                    Google MDM Tenders
                </a>
                <a href="#/logs" class="hero-link">
                    Leonex AI
                </a>
                <a href="#" class="hero-link" style="margin-left:40px; color:var(--text-secondary);">
                    <i data-lucide="globe" style="width:18px;"></i>
                </a>
                <a href="#" class="hero-link" style="color:var(--text-secondary);">
                    <i data-lucide="linkedin" style="width:18px;"></i>
                </a>
            </div>
        </div>

        <div style="margin-top:80px; display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;" class="anim-in anim-d1">
            <div class="adm-card">
                <div class="section-header"><i data-lucide="database"></i> System Stats</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:var(--text-tertiary); margin-bottom:4px;">TOTAL TENDERS</div>
                        <div style="font-size:32px; font-weight:800;" id="dash-total">—</div>
                    </div>
                    <div>
                        <div style="font-size:11px; font-weight:800; color:var(--text-tertiary); margin-bottom:4px;">ACTIVE SOURCES</div>
                        <div style="font-size:32px; font-weight:800;" id="dash-sources">—</div>
                    </div>
                </div>
            </div>

            <div class="adm-card">
                <div class="section-header"><i data-lucide="activity"></i> Extraction Flow</div>
                <div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
                    The scraper pipeline is currently idle. Next scheduled synchronization in <strong>4 hours</strong>.
                </div>
                <button class="btn-admin btn-green" style="margin-top:20px;" onclick="window.location.hash='#/scrapers'">
                    Go to Scrapers Engine
                </button>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    fetchStats();
}

async function fetchStats() {
    try {
        const res = await fetch(`${window.API_BASE || ''}/stats`);
        const d = await res.json();
        document.getElementById('dash-total').textContent = d.total_tenders || 0;
        document.getElementById('dash-sources').textContent = Object.keys(d.tenders_by_source || {}).length;
    } catch(e) {}
}
