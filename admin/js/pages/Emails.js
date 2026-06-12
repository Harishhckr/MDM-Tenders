import { adminFetch, getApiBase } from '../utils/api.js?v=2.2';

export async function renderEmails() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
            <style>
                .log-scroll::-webkit-scrollbar { width: 3px; }
                .log-scroll::-webkit-scrollbar-track { background: transparent; }
                .log-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .glass-card { background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(25px); transition: 0.3s var(--ease); }
                .glass-card:hover { border-color: rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
                .pulse-dot { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: pulse 2.5s infinite; }
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }
                .adm-input { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); color: #fff; }
                .adm-input:focus { border-color: rgba(255,255,255,0.15); outline: none; }
            </style>
            
            <div class="anim-in" style="max-width: 1300px; margin: 0 auto; padding-bottom: 40px; padding-top: 10px;">
                
                <!-- COMPACT HEADER -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <div class="pulse-dot"></div>
                            <span style="font-size:9px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px;">Core Intelligence Operational</span>
                        </div>
                        <h1 style="font-size:28px; font-weight:900; color:var(--text-primary); margin:0; letter-spacing:-1px;">Email Control</h1>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <input type="date" id="sync-target-date" class="adm-input" style="height:40px; width:130px; border-radius:12px; padding:0 12px; font-size:10px; font-weight:700; border:1px solid rgba(255,255,255,0.08);">
                        <button id="adm-send-now-btn" class="bb-btn-secondary" style="height:40px; padding:0 20px; border-radius:12px; font-size:10px; font-weight:900; display:flex; align-items:center; gap:10px; letter-spacing:1px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-primary);">
                            <i data-lucide="zap" style="width:14px;height:14px;"></i>
                            SYNC ENGINE
                        </button>
                        <button id="adm-add-recipient-btn" class="bb-btn-primary" style="height:40px; padding:0 20px; border-radius:12px; font-size:10px; font-weight:900; display:flex; align-items:center; gap:10px; letter-spacing:1px; background:var(--text-primary); border:none; color:var(--bg-page);">
                            <i data-lucide="plus" style="width:14px;height:14px;"></i>
                            NEW NODE
                        </button>
                    </div>
                </div>

                <!-- COMPACT METRICS -->
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:32px;">
                    ${['Total Sent', 'Active Nodes', 'Delivery Rate', 'Health'].map((m, i) => `
                        <div class="glass-card" style="padding:16px 20px; border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:9px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px;">${m}</span>
                            <div style="font-size:18px; font-weight:900; color:var(--text-primary); letter-spacing:-0.5px;">
                                ${i === 0 ? '1.2k' : i === 1 ? '<span id="node-count-val">...</span>' : i === 2 ? '99.8%' : 'STABLE'}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:24px;">
                    
                    <!-- CONFIG (4 COL) -->
                    <div style="grid-column: span 4; display:flex; flex-direction:column; gap:24px;">
                        
                        <div class="glass-card" style="padding:24px; border-radius:20px;">
                            <h3 style="margin:0 0 24px 0; font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="settings-2" style="width:12px;height:12px;"></i>
                                Parameters
                            </h3>
                            
                            <div style="display:flex; flex-direction:column; gap:24px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.015); padding:16px; border-radius:14px; border:1px solid rgba(255,255,255,0.03);">
                                    <div>
                                        <div style="font-weight:900; font-size:12px; color:var(--text-primary);">Auto-Broadcast</div>
                                        <div style="font-size:9px; color:var(--text-tertiary); margin-top:2px;">Automated distribution</div>
                                    </div>
                                    <label class="adm-toggle" style="transform: scale(0.85);">
                                        <input type="checkbox" id="setting-report-enabled">
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="bb-input-group">
                                    <label style="font-size:9px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px; display:block; letter-spacing:1px;">Execution Protocol</label>
                                    <input type="time" id="setting-report-time" class="adm-input" style="height:44px; border-radius:12px; padding:0 16px; font-weight:800; font-size:14px; width:100%;">
                                </div>

                                <div class="bb-input-group">
                                    <label style="font-size:9px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px; display:block; letter-spacing:1px;">Identity Profile</label>
                                    <div style="display:flex; flex-direction:column; gap:10px;">
                                        <input type="text" id="setting-sender-name" class="adm-input" style="height:44px; border-radius:12px; padding:0 16px; font-weight:700; font-size:12px;" placeholder="Name Identifier">
                                        <input type="email" id="setting-sender-email" class="adm-input" style="height:44px; border-radius:12px; padding:0 16px; font-weight:700; font-size:12px;" placeholder="root@system.net">
                                    </div>
                                    
                                    <div style="margin-top:16px; padding:12px; background:rgba(255,255,255,0.01); border-radius:12px; border:1px solid rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center;">
                                        <span style="font-size:8px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px;">Latest Pulse</span>
                                        <span id="last-sync-val" style="font-size:9px; font-weight:900; color:var(--text-secondary); font-family:var(--font-mono);">NONE</span>
                                    </div>
                                </div>

                                <button id="adm-save-settings-btn" class="bb-btn-primary" style="width:100%; height:44px; border-radius:12px; font-weight:900; font-size:10px; letter-spacing:2px; background:var(--text-primary); border:none; color:var(--bg-page);">
                                    SYNC PARAMETERS
                                </button>
                            </div>
                        </div>

                    </div>

                    <!-- RECIPIENTS & HISTORY (8 COL) -->
                    <div style="grid-column: span 8; display:flex; flex-direction:column; gap:24px;">
                        
                        <!-- DIRECTORY -->
                        <div class="glass-card" style="padding:0; overflow:hidden; border-radius:20px;">
                            <div style="padding:16px 24px; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.01); display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <i data-lucide="fingerprint" style="width:14px; height:14px; color:var(--text-tertiary);"></i>
                                    <span style="font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:2px; color:var(--text-primary);">Distribution Registry</span>
                                </div>
                            </div>
                            <div style="overflow-x:auto;">
                                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                                    <thead>
                                        <tr style="background:rgba(255,255,255,0.01);">
                                            <th style="text-align:left; padding:12px 24px; color:var(--text-tertiary); font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; border-bottom:1px solid rgba(255,255,255,0.02);">Information</th>
                                            <th style="text-align:left; padding:12px 24px; color:var(--text-tertiary); font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; border-bottom:1px solid rgba(255,255,255,0.02);">Sector</th>
                                            <th style="text-align:center; padding:12px 24px; color:var(--text-tertiary); font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; border-bottom:1px solid rgba(255,255,255,0.02);">State</th>
                                            <th style="text-align:right; padding:12px 24px; color:var(--text-tertiary); font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; border-bottom:1px solid rgba(255,255,255,0.02);">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recipient-list-body"></tbody>
                </table>
            </div>
        </div>

        <!-- TRANSMISSIONS -->
        <div class="glass-card" style="padding:0; border-radius:18px;">
            <div style="padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.01); display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <i data-lucide="database" style="width:12px; height:12px; color:var(--text-tertiary);"></i>
                    <span style="font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:var(--text-primary);">Network Logs</span>
                </div>
                <button id="adm-clear-logs-btn" style="background:transparent; border:1px solid rgba(255,255,255,0.08); color:var(--text-tertiary); font-size:8px; font-weight:900; cursor:pointer; text-transform:uppercase; letter-spacing:1px; padding:3px 8px; border-radius:6px;">Purge</button>
            </div>
            <div style="max-height:220px; overflow-y:auto; padding:12px 20px;" id="email-log-list" class="log-scroll"></div>
        </div>

    </div>
</div>
</div>

                    </div>

                    <!-- RECIPIENTS & HISTORY (8 COL) -->
                    <div style="grid-column: span 8; display:flex; flex-direction:column; gap:32px;">
                        
                        <!-- DIRECTORY -->
                        <div class="glass-card" style="padding:0; overflow:hidden; border-radius:24px;">
                            <div style="padding:28px 36px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:14px;">
                                    <i data-lucide="fingerprint" style="width:18px; height:18px; color:var(--text-tertiary);"></i>
                                    <span style="font-weight:900; font-size:12px; text-transform:uppercase; letter-spacing:2px; color:var(--text-primary);">Distribution Registry</span>
                                </div>
                            </div>
                            <div style="overflow-x:auto;">
                                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                                    <thead>
                                        <tr style="background:rgba(255,255,255,0.01);">
                                            <th style="text-align:left; padding:20px 36px; color:var(--text-tertiary); font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,255,255,0.03);">Entity Information</th>
                                            <th style="text-align:left; padding:20px 36px; color:var(--text-tertiary); font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,255,255,0.03);">Sector</th>
                                            <th style="text-align:center; padding:20px 36px; color:var(--text-tertiary); font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,255,255,0.03);">State</th>
                                            <th style="text-align:right; padding:20px 36px; color:var(--text-tertiary); font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,255,255,0.03);">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recipient-list-body">
                                        <!-- Nodes -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- TRANSMISSIONS -->
                        <div class="glass-card" style="padding:0; border-radius:24px; position:relative;">
                            <div style="padding:28px 36px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:14px;">
                                    <i data-lucide="database" style="width:18px; height:18px; color:var(--text-tertiary);"></i>
                                    <span style="font-weight:900; font-size:12px; text-transform:uppercase; letter-spacing:2px; color:var(--text-primary);">Transmission Meta-Log</span>
                                </div>
                                <button id="adm-clear-logs-btn" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-tertiary); font-size:10px; font-weight:900; cursor:pointer; text-transform:uppercase; letter-spacing:1.5px; padding:6px 14px; border-radius:10px; transition:0.3s;" onmouseover="this.style.color='#fff'; this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.color='var(--text-tertiary)'; this.style.borderColor='rgba(255,255,255,0.1)'">Purge Audit Log</button>
                            </div>
                            <div style="max-height:540px; overflow-y:auto; padding:32px 36px;" id="email-log-list" class="log-scroll">
                                <!-- Streams -->
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- MODAL RE-DESIGN -->
            <div id="adm-email-modal" class="bb-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); backdrop-filter:blur(30px); z-index:3000; justify-content:center; align-items:center; padding:20px;">
                <div class="glass-card anim-in" style="width:100%; max-width:520px; border-radius:32px; padding:48px; border:1px solid rgba(255,255,255,0.1); box-shadow: 0 40px 150px rgba(0,0,0,1);">
                    <div style="margin-bottom:40px;">
                        <span style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:3px; margin-bottom:8px; display:block;">Protocol 0x82</span>
                        <h2 style="margin:0; font-size:32px; font-weight:900; color:var(--text-primary); letter-spacing:-1px;">Node Registration</h2>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="bb-input-group">
                            <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:10px; display:block; letter-spacing:1.5px;">Nominal Identity</label>
                            <input type="text" id="modal-r-name" class="adm-input" style="height:56px; border-radius:18px; font-weight:700; padding: 0 24px; color:var(--text-primary); background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);" placeholder="Systemic Designation">
                        </div>
                        <div class="bb-input-group">
                            <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:10px; display:block; letter-spacing:1.5px;">Network Address</label>
                            <input type="email" id="modal-r-email" class="adm-input" style="height:56px; border-radius:18px; font-weight:700; padding: 0 24px; color:var(--text-primary); background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);" placeholder="endpoint@node.sys">
                        </div>
                        <div class="bb-input-group" style="margin-bottom:12px;">
                            <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:10px; display:block; letter-spacing:1.5px;">Allocation Sector</label>
                            <input type="text" id="modal-r-dept" class="adm-input" style="height:56px; border-radius:18px; font-weight:700; padding: 0 24px; color:var(--text-primary); background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);" placeholder="Organizational Segment">
                        </div>

                        <div style="display:flex; gap:20px; margin-top:16px;">
                            <button onclick="document.getElementById('adm-email-modal').style.display='none'" style="flex:1; height:56px; border-radius:18px; font-weight:900; font-size:11px; letter-spacing:2px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:var(--text-primary); cursor:pointer;">DISCARD</button>
                            <button id="modal-r-save-btn" class="bb-btn-primary" style="flex:1; height:56px; border-radius:18px; font-weight:900; font-size:11px; letter-spacing:2px; background:var(--text-primary); color:var(--bg-page); border:none; cursor:pointer;">ENCODE NODE</button>
                        </div>
                    </div>
                </div>
            </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach listeners
    document.getElementById('adm-add-recipient-btn').addEventListener('click', () => {
        document.getElementById('adm-email-modal').style.display = 'flex';
    });
    document.getElementById('modal-r-save-btn').addEventListener('click', saveNewRecipient);
    document.getElementById('adm-save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('adm-send-now-btn').addEventListener('click', initiateGlobalSync);
    document.getElementById('adm-test-email-btn').addEventListener('click', sendDiagnosticEmail);
    document.getElementById('adm-clear-logs-btn').addEventListener('click', clearEmailLogs);

    // Dynamic Logic
    await Promise.all([
        loadRecipients(),
        loadLogs(),
        loadSettings()
    ]);
}

async function loadRecipients() {
    const list = document.getElementById('recipient-list-body');
    const nodeVal = document.getElementById('node-count-val');
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/recipients`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="padding:120px; text-align:center; color:var(--text-tertiary); font-family:var(--font-mono); font-size:11px; letter-spacing:2px; opacity:0.4;">DIRECTORY UNREGISTERED / EMPTY.</td></tr>';
            if (nodeVal) nodeVal.innerText = '0';
            return;
        }

        if (nodeVal) nodeVal.innerText = data.length;
        list.innerHTML = data.map(r => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.4s var(--ease);" onmouseover="this.style.background='rgba(255,255,255,0.01)'" onmouseout="this.style.background='transparent'">
                <td style="padding:12px 24px;">
                    <div style="font-weight:900; color:var(--text-primary); font-size:13px; letter-spacing:-0.2px;">${r.name}</div>
                    <div style="font-size:9px; color:var(--text-tertiary); margin-top:2px; font-family:var(--font-mono); opacity:0.6;">${r.email}</div>
                </td>
                <td style="padding:12px 24px;">
                    <span style="font-family:var(--font-mono); font-size:8px; font-weight:900; letter-spacing:1px; color:var(--text-secondary); background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:8px; border:1px solid rgba(255,255,255,0.04);">${(r.department || 'ROOT').toUpperCase()}</span>
                </td>
                <td style="padding:12px 24px; text-align:center;">
                    <label class="adm-toggle" style="transform: scale(0.75);">
                        <input type="checkbox" ${r.is_active ? 'checked' : ''} onchange="window._toggleRecipient('${r.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td style="padding:12px 24px; text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                        <button class="bb-btn-icon" onclick="window._sendQuickTest('${r.email}')" style="color:var(--text-tertiary); width:32px; height:32px; border-radius:8px;"><i data-lucide="send" style="width:12px;height:12px;"></i></button>
                        <button class="bb-btn-icon" onclick="window._deleteRecipient('${r.id}')" style="color:#ef4444; opacity:0.3; width:32px; height:32px; border-radius:8px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

async function loadLogs() {
    const logList = document.getElementById('email-log-list');
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/logs`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            logList.innerHTML = '<div style="padding:120px; text-align:center; color:var(--text-tertiary); font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; opacity:0.3; font-family:var(--font-mono);">STREAM NULL / NO DATA.</div>';
            return;
        }

        logList.innerHTML = data.map(log => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-radius:12px; margin-bottom:8px; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.02); transition: 0.2s var(--ease);" onmouseover="this.style.borderColor='rgba(255,255,255,0.08)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.02)'">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div style="width:32px; height:32px; border-radius:10px; background:rgba(255,255,255,0.01); display:flex; justify-content:center; align-items:center; border:1px solid rgba(255,255,255,0.03);">
                        <i data-lucide="${log.status === 'sent' ? 'shield-check' : 'shield-alert'}" style="width:14px; height:14px; color:${log.status === 'sent' ? 'var(--text-secondary)' : '#ef4444'};"></i>
                    </div>
                    <div>
                        <div style="font-size:12px; font-weight:900; color:var(--text-primary); letter-spacing:-0.1px;">${log.recipient}</div>
                        <div style="font-size:8px; color:var(--text-tertiary); margin-top:2px; font-family:var(--font-mono); font-weight:600; opacity:0.5;">${new Date(log.sent_at).toLocaleString()}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
                    <div style="font-size:8px; font-weight:900; color:${log.status === 'sent' ? 'var(--text-secondary)' : '#ef4444'}; text-transform:uppercase; letter-spacing:1px; background:rgba(255,255,255,0.02); padding:3px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.04);">${log.status}</div>
                    ${log.error_message ? `<div style="font-size:8px; color:#ef4444; opacity:0.6; font-family:var(--font-mono);">ERR: ${log.error_message.substring(0, 30)}...</div>` : ''}
                </div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

async function clearEmailLogs() {
    if (!confirm("Permanently purge all transmission artifacts?")) return;
    const baseUrl = getApiBase();
    try {
        await adminFetch(`${baseUrl}/admin/emails/logs`, { method: 'DELETE' });
        loadLogs();
        showToast("Archive purged successfully.");
    } catch (e) { showToast("Purge failed.", "error"); }
}

async function loadSettings() {
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/settings`);
        const data = await res.json();

        document.getElementById('setting-report-enabled').checked = data.daily_report_enabled;
        document.getElementById('setting-report-time').value = data.report_time;
        document.getElementById('setting-sender-name').value = data.sender_name || '';
        document.getElementById('setting-sender-email').value = data.sender_email || '';

        const lastSync = document.getElementById('last-sync-val');
        if (lastSync && data.last_report_sent_at) {
            const date = new Date(data.last_report_sent_at);
            lastSync.innerText = `${date.toLocaleDateString()} / ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            lastSync.style.color = 'var(--text-primary)';
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

async function saveSettings() {
    const btn = document.getElementById('adm-save-settings-btn');
    const baseUrl = getApiBase();
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;margin-right:8px;"></i> SYNCING...';
    if (window.lucide) window.lucide.createIcons();

    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/settings`, {
            method: 'PUT',
            body: {
                daily_report_enabled: document.getElementById('setting-report-enabled').checked,
                report_time: document.getElementById('setting-report-time').value,
                sender_name: document.getElementById('setting-sender-name').value,
                sender_email: document.getElementById('setting-sender-email').value
            }
        });
        if (!res.ok) throw new Error("Backend rejection");
        showToast("System configuration updated.");
    } catch (e) {
        showToast("Configuration sync failed.", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
        if (window.lucide) window.lucide.createIcons();
    }
}

async function saveNewRecipient() {
    const btn = document.getElementById('modal-r-save-btn');
    const name = document.getElementById('modal-r-name').value;
    const email = document.getElementById('modal-r-email').value;
    const dept = document.getElementById('modal-r-dept').value;
    const baseUrl = getApiBase();

    if (!name || !email) return showToast("Name and email are required", "error");

    btn.disabled = true;
    btn.innerHTML = 'PROCESSING...';

    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/recipients`, {
            method: 'POST',
            body: { name, email, department: dept }
        });
        if (res.ok) {
            document.getElementById('adm-email-modal').style.display = 'none';
            document.getElementById('modal-r-name').value = '';
            document.getElementById('modal-r-email').value = '';
            document.getElementById('modal-r-dept').value = '';
            loadRecipients();
            showToast("New recipient registered.");
        } else {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
        }
    } catch (e) {
        showToast(e.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'CONFIRM ENTRY';
    }
}

async function initiateGlobalSync() {
    const btn = document.getElementById('adm-send-now-btn');
    const dateInput = document.getElementById('sync-target-date');
    const targetDate = dateInput ? dateInput.value : '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="pulse-dot"></i> INITIALIZING...';
    }

    const baseUrl = getApiBase();
    try {
        const url = new URL(`${baseUrl}/admin/emails/trigger`);
        if (targetDate) url.searchParams.append('date', targetDate);

        const res = await adminFetch(url.toString(), { method: 'POST' });
        if (res.ok) {
            showToast(`Sync requested${targetDate ? ' for ' + targetDate : ''}`, 'success');
            setTimeout(loadLogs, 3000);
        }
    } catch (e) {
        showToast('Sync request failed', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="zap" style="width:14px;height:14px;"></i> SYNC ENGINE';
            lucide.createIcons();
        }
    }
}

async function sendDiagnosticEmail() {
    const email = document.getElementById('test-email-addr').value;
    if (!email) return;
    const btn = document.getElementById('adm-test-email-btn');
    const baseUrl = getApiBase();
    btn.disabled = true;

    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/send-test`, {
            method: 'POST',
            body: { email }
        });
        const data = await res.json();
        if (data.status === 'success') showToast("Diagnostic transmission confirmed!");
        else showToast("Transmission failure: " + data.message, "error");
        loadLogs();
    } catch (e) {
        showToast(e.message, "error");
    } finally {
        btn.disabled = false;
    }
}

window._sendQuickTest = async (email) => {
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/send-test`, {
            method: 'POST',
            body: { email }
        });
        if (res.ok) showToast(`High-priority test sent to ${email}`);
    } catch (e) { showToast("Signal failure", "error"); }
};

window._toggleRecipient = async (id, isActive) => {
    const baseUrl = getApiBase();
    try {
        await adminFetch(`${baseUrl}/admin/emails/recipients/${id}`, {
            method: 'PUT',
            body: { is_active: isActive }
        });
        showToast(`Node status synchronized.`);
    } catch (e) {
        showToast("Sync failed", "error");
        loadRecipients();
    }
};

window._deleteRecipient = async (id) => {
    if (!confirm("Permanently terminate this node?")) return;
    const baseUrl = getApiBase();
    try {
        await adminFetch(`${baseUrl}/admin/emails/recipients/${id}`, { method: 'DELETE' });
        loadRecipients();
        showToast("Node termination successful.");
    } catch (e) { showToast("Termination failed.", "error"); }
};

function showToast(msg, type = "success") {
    const toast = document.createElement('div');
    toast.style = `position:fixed; bottom:32px; right:32px; padding:12px 24px; border-radius:12px; background:${type === 'error' ? '#ef4444' : 'var(--text-primary)'}; color:${type === 'error' ? 'white' : 'var(--bg-page)'}; font-size:13px; font-weight:800; z-index:9999; box-shadow:0 15px 40px rgba(0,0,0,0.5); transform:translateY(150px); transition:0.4s var(--ease); border:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(10px);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateY(0)', 10);
    setTimeout(() => {
        toast.style.transform = 'translateY(150px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
