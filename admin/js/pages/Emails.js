import { adminFetch, getApiBase } from '../utils/api.js?v=2.2';

export async function renderEmails() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
        <div class="anim-in" style="max-width: 1400px; margin: 0 auto; padding-bottom: 60px;">
            <!-- HEADER AREA -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px; padding: 0 4px;">
                <div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                        <div style="width:32px; height:4px; background:var(--neon-cyan); border-radius:2px;"></div>
                        <span style="font-size:11px; font-weight:900; color:var(--neon-cyan); text-transform:uppercase; letter-spacing:2px;">Reporting Engine</span>
                    </div>
                    <h1 style="font-size:36px; font-weight:900; color:var(--text-primary); margin:0; letter-spacing:-1px; line-height:1;">Email Management</h1>
                </div>
                <div style="display:flex; gap:16px;">
                    <button id="adm-send-now-btn" class="bb-btn-secondary" style="height:48px; padding:0 24px; border-radius:14px; font-size:12px; font-weight:800; display:flex; align-items:center; gap:12px; letter-spacing:0.5px; border:1px solid var(--border-glass); background:rgba(255,255,255,0.02);">
                        <i data-lucide="zap" style="width:18px;height:18px; color:var(--neon-cyan);"></i>
                        TRIGGER SYNC
                    </button>
                    <button id="adm-add-recipient-btn" class="bb-btn-primary" style="height:48px; padding:0 24px; border-radius:14px; font-size:12px; font-weight:900; display:flex; align-items:center; gap:12px; letter-spacing:0.5px; box-shadow: 0 8px 20px rgba(255,255,255,0.05);">
                        <i data-lucide="user-plus" style="width:18px;height:18px;"></i>
                        NEW RECIPIENT
                    </button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:32px;">
                <!-- LEFT COLUMN: RECIPIENTS (8 COL) -->
                <div style="grid-column: span 8; display:flex; flex-direction:column; gap:32px;">
                    
                    <div class="bb-card" style="padding:0; overflow:hidden; border:1px solid var(--border-glass); backdrop-filter: blur(20px);">
                        <div style="padding:24px 32px; border-bottom:1px solid var(--border-glass); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <i data-lucide="users" style="width:18px; height:18px; color:var(--text-tertiary);"></i>
                                <span style="font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:var(--text-secondary);">Direct Distribution List</span>
                            </div>
                            <span id="recipient-count-badge" class="badge" style="background:rgba(0,243,255,0.1); color:var(--neon-cyan); border:1px solid rgba(0,243,255,0.2); font-weight:800; padding:4px 10px; border-radius:8px;">0 Members</span>
                        </div>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                                <thead>
                                    <tr style="background:rgba(255,255,255,0.01);">
                                        <th style="text-align:left; padding:18px 32px; color:var(--text-tertiary); font-weight:800; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Target Identity</th>
                                        <th style="text-align:left; padding:18px 32px; color:var(--text-tertiary); font-weight:800; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Department</th>
                                        <th style="text-align:center; padding:18px 32px; color:var(--text-tertiary); font-weight:800; font-size:10px; text-transform:uppercase; letter-spacing:1px;">State</th>
                                        <th style="text-align:right; padding:18px 32px; color:var(--text-tertiary); font-weight:800; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Control</th>
                                    </tr>
                                </thead>
                                <tbody id="recipient-list-body">
                                    <tr><td colspan="4" style="padding:100px; text-align:center; color:var(--text-tertiary); font-family:var(--font-mono); font-size:12px; letter-spacing:1px;">INITIALIZING SECURE DIRECTORY...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- HISTORY: FULL WIDTH WITHIN LEFT COL -->
                    <div class="bb-card" style="padding:0; border:1px solid var(--border-glass); backdrop-filter: blur(20px);">
                        <div style="padding:24px 32px; border-bottom:1px solid var(--border-glass); background:rgba(255,255,255,0.02); display:flex; align-items:center; gap:12px;">
                            <i data-lucide="activity" style="width:18px; height:18px; color:var(--text-tertiary);"></i>
                            <span style="font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:var(--text-secondary);">Transmission Network History</span>
                        </div>
                        <div style="max-height:500px; overflow-y:auto; padding:20px 32px;" id="email-log-list">
                            <!-- Logs here -->
                        </div>
                    </div>

                </div>

                <!-- RIGHT COLUMN: CONFIG (4 COL) -->
                <div style="grid-column: span 4; display:flex; flex-direction:column; gap:32px;">
                    
                    <div class="bb-card" style="border:1px solid var(--border-glass); padding:32px; backdrop-filter: blur(20px); position:relative;">
                        <div style="position:absolute; top:32px; right:32px;"><i data-lucide="cpu" style="width:24px; height:24px; color:rgba(255,255,255,0.03);"></i></div>
                        <h3 style="margin:0 0 32px 0; font-size:14px; font-weight:900; color:var(--text-primary); text-transform:uppercase; letter-spacing:2px; display:flex; align-items:center; gap:12px;">
                            Core Configuration
                        </h3>
                        
                        <div style="display:flex; flex-direction:column; gap:28px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:20px; border-radius:18px; border:1px solid var(--border-glass);">
                                <div>
                                    <div style="font-weight:800; font-size:13px; color:var(--text-primary); letter-spacing:0.5px;">Auto-Broadcast</div>
                                    <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Post-scrape distribution</div>
                                </div>
                                <label class="adm-toggle">
                                    <input type="checkbox" id="setting-report-enabled">
                                    <span class="slider" style="background-color: var(--neon-cyan);"></span>
                                </label>
                            </div>

                            <div class="bb-input-group">
                                <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:10px; display:block; letter-spacing:1px;">Execution Window</label>
                                <div style="position:relative;">
                                    <input type="time" id="setting-report-time" class="adm-input" style="height:52px; border-radius:14px; padding:0 20px; font-weight:700; font-size:15px; width:100%; background:rgba(255,255,255,0.02); border:1px solid var(--border-glass);">
                                    <i data-lucide="clock" style="position:absolute; right:20px; top:17px; width:18px; height:18px; color:var(--text-tertiary); pointer-events:none;"></i>
                                </div>
                            </div>

                            <div class="bb-input-group">
                                <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:10px; display:block; letter-spacing:1px;">System Identity</label>
                                <div style="display:flex; flex-direction:column; gap:12px;">
                                    <input type="text" id="setting-sender-name" class="adm-input" style="height:52px; border-radius:14px; padding:0 20px; font-weight:600; background:rgba(255,255,255,0.02); border:1px solid var(--border-glass);" placeholder="Display Name">
                                    <input type="email" id="setting-sender-email" class="adm-input" style="height:52px; border-radius:14px; padding:0 20px; font-weight:600; background:rgba(255,255,255,0.02); border:1px solid var(--border-glass);" placeholder="sender@system.net">
                                </div>
                            </div>

                            <button id="adm-save-settings-btn" class="bb-btn-primary" style="width:100%; height:52px; border-radius:16px; font-weight:900; font-size:12px; letter-spacing:2px; margin-top:8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                                UPDATE CORE SETTINGS
                            </button>
                        </div>
                    </div>

                    <!-- TEST BOX -->
                    <div class="bb-card" style="border:1px solid rgba(34,197,94,0.1); padding:32px; background: linear-gradient(145deg, rgba(34,197,94,0.03) 0%, rgba(0,0,0,0) 100%);">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow: 0 0 10px #22c55e;"></div>
                            <h3 style="margin:0; font-size:12px; font-weight:900; color:#22c55e; text-transform:uppercase; letter-spacing:2px;">Signal Test</h3>
                        </div>
                        <p style="font-size:12px; color:var(--text-tertiary); line-height:1.6; margin-bottom:24px;">Trigger an immediate diagnostic transmission to verify the Resend pipeline integrity.</p>
                        
                        <div style="display:flex; gap:12px;">
                            <input type="email" id="test-email-addr" class="adm-input" style="flex:1; height:48px; border-radius:12px; border:1px solid rgba(34,197,94,0.1) !important; font-size:13px; font-weight:600; padding:0 16px;" placeholder="test-target@domain.com">
                            <button id="adm-test-email-btn" class="bb-btn-secondary" style="width:48px; height:48px; padding:0; border-radius:12px; color:#22c55e; border:1px solid rgba(34,197,94,0.2); background:rgba(34,197,94,0.05); display:flex; justify-content:center; align-items:center;">
                                <i data-lucide="play-circle" style="width:22px;height:22px;"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- NEW RECIPIENT MODAL -->
        <div id="adm-email-modal" class="bb-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(12px); z-index:2000; justify-content:center; align-items:center; padding:20px;">
            <div class="bb-card anim-in" style="width:100%; max-width:480px; border:1px solid var(--border-glass); padding:40px; box-shadow: 0 30px 100px rgba(0,0,0,0.8);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
                    <div>
                        <h2 style="margin:0; font-size:24px; font-weight:900; color:var(--text-primary); letter-spacing:-0.5px;">Register Recipient</h2>
                        <p style="font-size:13px; color:var(--text-tertiary); margin-top:4px;">Add a new node to the distribution network.</p>
                    </div>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div class="bb-input-group">
                        <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px; display:block; letter-spacing:1px;">Identity / Name</label>
                        <input type="text" id="modal-r-name" class="adm-input" style="height:52px; border-radius:14px; font-weight:600; padding: 0 20px;" placeholder="e.g. John Doe">
                    </div>
                    <div class="bb-input-group">
                        <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px; display:block; letter-spacing:1px;">Email Address</label>
                        <input type="email" id="modal-r-email" class="adm-input" style="height:52px; border-radius:14px; font-weight:600; padding: 0 20px;" placeholder="john@company.com">
                    </div>
                    <div class="bb-input-group">
                        <label style="font-size:10px; font-weight:900; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:8px; display:block; letter-spacing:1px;">Organizational Unit</label>
                        <input type="text" id="modal-r-dept" class="adm-input" style="height:52px; border-radius:14px; font-weight:600; padding: 0 20px;" placeholder="e.g. Procurement">
                    </div>

                    <div style="display:flex; gap:16px; margin-top:16px;">
                        <button onclick="document.getElementById('adm-email-modal').style.display='none'" class="bb-btn-secondary" style="flex:1; height:52px; border-radius:14px; font-weight:800; border:1px solid var(--border-glass);">DISCARD</button>
                        <button id="modal-r-save-btn" class="bb-btn-primary" style="flex:1; height:52px; border-radius:14px; font-weight:900; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">CONFIRM ENTRY</button>
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
    document.getElementById('adm-send-now-btn').addEventListener('click', triggerManualReport);
    document.getElementById('adm-test-email-btn').addEventListener('click', sendDiagnosticEmail);

    // Dynamic Logic
    await Promise.all([
        loadRecipients(),
        loadLogs(),
        loadSettings()
    ]);
}

async function loadRecipients() {
    const list = document.getElementById('recipient-list-body');
    const badge = document.getElementById('recipient-count-badge');
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/recipients`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="padding:100px; text-align:center; color:var(--text-tertiary); font-family:var(--font-mono); font-size:12px; letter-spacing:1px;">DIRECTORY EMPTY: NO NODES CONFIGURED.</td></tr>';
            badge.innerText = '0 Members';
            return;
        }

        badge.innerText = `${data.length} ${data.length === 1 ? 'Member' : 'Members'}`;
        list.innerHTML = data.map(r => `
            <tr style="border-bottom: 1px solid var(--border-glass); transition: background 0.3s var(--ease);" onmouseover="this.style.background='rgba(255,255,255,0.015)'" onmouseout="this.style.background='transparent'">
                <td style="padding:24px 32px;">
                    <div style="font-weight:800; color:var(--text-primary); font-size:15px; letter-spacing:-0.2px;">${r.name}</div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">${r.email}</div>
                </td>
                <td style="padding:24px 32px;">
                    <span style="font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; color:var(--text-secondary); background:rgba(255,255,255,0.03); padding:4px 10px; border-radius:6px; border:1px solid var(--border-glass);">${(r.department || 'GLOBAL').toUpperCase()}</span>
                </td>
                <td style="padding:24px 32px; text-align:center;">
                    <label class="adm-toggle">
                        <input type="checkbox" ${r.is_active ? 'checked' : ''} onchange="window._toggleRecipient('${r.id}', this.checked)">
                        <span class="slider" style="background-color: var(--neon-cyan);"></span>
                    </label>
                </td>
                <td style="padding:24px 32px; text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button class="bb-btn-icon" onclick="window._sendQuickTest('${r.email}')" title="Quick Transmission" style="color:var(--text-tertiary); border:1px solid transparent;" onmouseover="this.style.borderColor='var(--border-glass)'; this.style.color='var(--neon-cyan)'" onmouseout="this.style.borderColor='transparent'; this.style.color='var(--text-tertiary)'"><i data-lucide="send" style="width:16px;height:16px;"></i></button>
                        <button class="bb-btn-icon" onclick="window._deleteRecipient('${r.id}')" title="Terminate" style="color:#ef4444; opacity:0.5; border:1px solid transparent;" onmouseover="this.style.opacity='1'; this.style.borderColor='rgba(239,68,68,0.2)'" onmouseout="this.style.opacity='0.5'; this.style.borderColor='transparent'"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) {
        console.error(e);
        list.innerHTML = `<tr><td colspan="4" style="padding:100px; text-align:center; color:#ef4444; font-family:var(--font-mono); font-size:12px;">FATAL_IO_ERROR: NETWORK_SYNC_FAILED</td></tr>`;
    }
}

async function loadLogs() {
    const logList = document.getElementById('email-log-list');
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/logs`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            logList.innerHTML = '<div style="padding:60px; text-align:center; color:var(--text-tertiary); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; opacity:0.5;">No transmission artifacts recorded.</div>';
            return;
        }

        logList.innerHTML = data.map(log => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-radius:16px; margin-bottom:12px; background:rgba(255,255,255,0.015); border:1px solid var(--border-glass); transition: transform 0.2s;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='none'">
                <div style="display:flex; align-items:center; gap:20px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:${log.status === 'sent' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'}; display:flex; justify-content:center; align-items:center; border:1px solid ${log.status === 'sent' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};">
                        <i data-lucide="${log.status === 'sent' ? 'check-circle' : 'slash'}" style="width:20px; height:20px; color:${log.status === 'sent' ? '#22c55e' : '#ef4444'};"></i>
                    </div>
                    <div>
                        <div style="font-size:14px; font-weight:800; color:var(--text-primary); letter-spacing:-0.2px;">${log.recipient}</div>
                        <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px; font-family:var(--font-mono);">${new Date(log.sent_at).toLocaleString()}</div>
                    </div>
                </div>
                <div style="font-size:10px; font-weight:900; color:${log.status === 'sent' ? '#22c55e' : '#ef4444'}; text-transform:uppercase; letter-spacing:1.5px; background:${log.status === 'sent' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}; padding:5px 12px; border-radius:8px; border:1px solid ${log.status === 'sent' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};">${log.status}</div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

async function loadSettings() {
    const baseUrl = getApiBase();
    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/settings`);
        const s = await res.json();

        // STRICT NULL HANDLING FOR UNDEFINED UI ISSUES
        document.getElementById('setting-report-enabled').checked = !!s?.daily_report_enabled;
        document.getElementById('setting-report-time').value = s?.report_time || '09:00';
        document.getElementById('setting-sender-name').value = s?.sender_name || 'Tender Intelligence';
        document.getElementById('setting-sender-email').value = s?.sender_email || 'reports@leonex.net';
    } catch (e) {
        console.error('Settings load fail:', e);
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
        showToast("System configuration updated successfully.");
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
            showToast("New recipient registered to network.");
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

async function triggerManualReport() {
    if (!confirm("Confirm full systems tender report distribution sequence?")) return;
    const btn = document.getElementById('adm-send-now-btn');
    const baseUrl = getApiBase();
    btn.disabled = true;

    try {
        const res = await adminFetch(`${baseUrl}/admin/emails/send-now`, { method: 'POST' });
        if (res.ok) {
            showToast("Global distribution sequence started.");
            loadLogs();
        } else throw new Error();
    } catch (e) {
        showToast("Sequence initiation failed.", "error");
    } finally {
        btn.disabled = false;
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
    if (!confirm("Permanently terminate this node from the distribution network?")) return;
    const baseUrl = getApiBase();
    try {
        await adminFetch(`${baseUrl}/admin/emails/recipients/${id}`, { method: 'DELETE' });
        loadRecipients();
        showToast("Node termination successful.");
    } catch (e) { showToast("Termination procedure failed.", "error"); }
};

function showToast(msg, type = "success") {
    const toast = document.createElement('div');
    toast.style = `position:fixed; bottom:32px; right:32px; padding:14px 28px; border-radius:16px; background:${type === 'error' ? '#ef4444' : '#22c55e'}; color:white; font-size:14px; font-weight:800; z-index:9999; box-shadow:0 15px 40px rgba(0,0,0,0.5); transform:translateY(150px); transition:transform 0.5s var(--ease); border:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(10px);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateY(0)', 10);
    setTimeout(() => {
        toast.style.transform = 'translateY(150px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
