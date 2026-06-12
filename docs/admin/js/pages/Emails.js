import { adminFetch, getApiBase } from '../utils/api.js?v=2.2';

export async function renderEmails() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
        <div class="anim-in">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h1 style="font-size:24px; font-weight:800; color:var(--text-primary); margin:0;">Email Management</h1>
                <div style="display:flex; gap:12px;">
                    <button id="adm-send-now-btn" class="bb-btn-secondary" style="height:38px; padding:0 16px; border-radius:10px; font-size:12px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="send" style="width:14px;height:14px;"></i>
                        SEND TENDER REPORT NOW
                    </button>
                    <button id="adm-add-recipient-btn" class="bb-btn-primary" style="height:38px; padding:0 16px; border-radius:10px; font-size:12px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="plus" style="width:14px;height:14px;"></i>
                        ADD RECIPIENT
                    </button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 340px; gap:24px;">
                <!-- Main Area: Recipients & History -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <!-- Recipients Table -->
                    <div style="background:var(--bg-card); border:1px solid var(--border-glass); border-radius:16px; overflow:hidden;">
                        <div style="padding:16px; border-bottom:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:1px; color:var(--text-tertiary);">Active Recipients</span>
                        </div>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                                <thead style="background:rgba(255,255,255,0.02);">
                                    <tr>
                                        <th style="text-align:left; padding:12px 16px; color:var(--text-tertiary); font-weight:600;">Name</th>
                                        <th style="text-align:left; padding:12px 16px; color:var(--text-tertiary); font-weight:600;">Email</th>
                                        <th style="text-align:left; padding:12px 16px; color:var(--text-tertiary); font-weight:600;">Dept</th>
                                        <th style="text-align:center; padding:12px 16px; color:var(--text-tertiary); font-weight:600;">Status</th>
                                        <th style="text-align:right; padding:12px 16px; color:var(--text-tertiary); font-weight:600;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="recipient-list-body">
                                    <tr><td colspan="5" style="padding:40px; text-align:center; color:var(--text-tertiary);">Loading recipients...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- History Logs -->
                    <div style="background:var(--bg-card); border:1px solid var(--border-glass); border-radius:16px; overflow:hidden;">
                        <div style="padding:16px; border-bottom:1px solid var(--border-glass);">
                            <span style="font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:1px; color:var(--text-tertiary);">Deployment History</span>
                        </div>
                        <div style="max-height:400px; overflow-y:auto;">
                            <div id="email-log-list" style="padding:8px;">
                                <!-- Logs here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar: Settings -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    <div style="background:var(--bg-card); border:1px solid var(--border-glass); border-radius:16px; padding:20px;">
                        <h3 style="margin:0 0 20px 0; font-size:14px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:1px;">Global Settings</h3>
                        
                        <div style="display:flex; flex-direction:column; gap:20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-weight:600; font-size:13px; color:var(--text-primary);">Automated Reports</div>
                                    <div style="font-size:11px; color:var(--text-tertiary);">Daily tender distribution</div>
                                </div>
                                <label class="adm-toggle">
                                    <input type="checkbox" id="setting-report-enabled">
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <label style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Scheduled Time</label>
                                <input type="time" id="setting-report-time" class="adm-input" style="height:38px; border-radius:10px;">
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <label style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Sender Name</label>
                                <input type="text" id="setting-sender-name" class="adm-input" style="height:38px; border-radius:10px;" placeholder="Tender Intelligence">
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <label style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Sender Email</label>
                                <input type="text" id="setting-sender-email" class="adm-input" style="height:38px; border-radius:10px;" placeholder="reports@leonex.net">
                            </div>

                            <button id="adm-save-settings-btn" class="bb-btn-primary" style="width:100%; height:38px; margin-top:8px;">
                                SAVE CONFIGURATION
                            </button>
                        </div>
                    </div>

                    <div style="background:rgba(16,185,129,0.03); border:1px solid rgba(16,185,129,0.1); border-radius:16px; padding:20px;">
                        <h3 style="margin:0 0- 12px 0; font-size:13px; font-weight:700; color:#10b981;">TEST DELIVERY</h3>
                        <p style="font-size:11px; color:var(--text-tertiary); margin-bottom:16px;">Send a system test email to any address and verify Resend API integration.</p>
                        <input type="email" id="test-email-addr" class="adm-input" style="height:36px; border-radius:8px; margin-bottom:12px;" placeholder="Enter email address...">
                        <button id="adm-test-email-btn" class="bb-btn-secondary" style="width:100%; height:36px; color:#10b981; border-color:rgba(16,185,129,0.2);">
                            EXECUTE TEST SEND
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach listeners
    document.getElementById('adm-add-recipient-btn').addEventListener('click', () => showRecipientModal());
    document.getElementById('adm-save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('adm-send-now-btn').addEventListener('click', triggerManualReport);
    document.getElementById('adm-test-email-btn').addEventListener('click', sendTestEmail);

    // Initial load
    await Promise.all([
        loadRecipients(),
        loadLogs(),
        loadSettings()
    ]);
}

async function loadRecipients() {
    const list = document.getElementById('recipient-list-body');
    try {
        const data = await adminFetch('/admin/emails/recipients');
        if (!data || data.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:var(--text-tertiary);">No recipients found. Click Add to get started.</td></tr>';
            return;
        }

        list.innerHTML = data.map(r => `
            <tr style="border-bottom: 1px solid var(--border-glass);">
                <td style="padding:12px 16px; font-weight:600; color:var(--text-primary);">${r.name}</td>
                <td style="padding:12px 16px; color:var(--text-secondary);">${r.email}</td>
                <td style="padding:12px 16px; color:var(--text-tertiary);">${r.department || '-'}</td>
                <td style="padding:12px 16px; text-align:center;">
                    <label class="adm-toggle">
                        <input type="checkbox" ${r.is_active ? 'checked' : ''} onchange="window._toggleRecipient('${r.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td style="padding:12px 16px; text-align:right;">
                    <button class="bb-btn-icon" onclick="window._deleteRecipient('${r.id}')" style="color:#ef4444;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) {
        console.error(e);
        list.innerHTML = `<tr><td colspan="5" style="padding:40px; text-align:center; color:#ef4444;">Error: ${e.message}</td></tr>`;
    }
}

async function loadLogs() {
    const logList = document.getElementById('email-log-list');
    try {
        const data = await adminFetch('/admin/emails/logs');
        if (!data || data.length === 0) {
            logList.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-tertiary); font-size:12px;">No email history recorded yet.</div>';
            return;
        }

        logList.innerHTML = data.map(log => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:10px; margin-bottom:4px; background:rgba(255,255,255,0.01);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:32px; height:32px; border-radius:8px; background:${log.status === 'sent' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; display:flex; justify-content:center; align-items:center;">
                        <i data-lucide="${log.status === 'sent' ? 'check' : 'alert-circle'}" style="width:14px; height:14px; color:${log.status === 'sent' ? '#10b981' : '#ef4444'};"></i>
                    </div>
                    <div>
                        <div style="font-size:12px; font-weight:600; color:var(--text-primary);">${log.recipient}</div>
                        <div style="font-size:10px; color:var(--text-tertiary);">${new Date(log.sent_at).toLocaleString()}</div>
                    </div>
                </div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">${log.status}</div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

async function loadSettings() {
    try {
        const s = await adminFetch('/admin/emails/settings');
        document.getElementById('setting-report-enabled').checked = s.daily_report_enabled;
        document.getElementById('setting-report-time').value = s.report_time;
        document.getElementById('setting-sender-name').value = s.sender_name;
        document.getElementById('setting-sender-email').value = s.sender_email;
    } catch (e) { console.error(e); }
}

async function saveSettings() {
    const btn = document.getElementById('adm-save-settings-btn');
    btn.disabled = true;
    btn.innerHTML = 'SAVING...';

    try {
        await adminFetch('/admin/emails/settings', {
            method: 'PUT',
            body: {
                daily_report_enabled: document.getElementById('setting-report-enabled').checked,
                report_time: document.getElementById('setting-report-time').value,
                sender_name: document.getElementById('setting-sender-name').value,
                sender_email: document.getElementById('setting-sender-email').value
            }
        });
        alert("Configuration saved successfully.");
    } catch (e) {
        alert("Error saving settings: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'SAVE CONFIGURATION';
    }
}

async function triggerManualReport() {
    if (!confirm("Are you sure you want to send a full tender report to all active recipients right now?")) return;
    const btn = document.getElementById('adm-send-now-btn');
    btn.disabled = true;

    try {
        await adminFetch('/admin/emails/send-now', { method: 'POST' });
        alert("Email report sequence initiated.");
        loadLogs();
    } catch (e) {
        alert("Failed to manual send: " + e.message);
    } finally {
        btn.disabled = false;
    }
}

async function sendTestEmail() {
    const email = document.getElementById('test-email-addr').value;
    if (!email) return alert("Please enter an email address.");

    const btn = document.getElementById('adm-test-email-btn');
    btn.disabled = true;

    try {
        const res = await adminFetch('/admin/emails/send-test', {
            method: 'POST',
            body: { email }
        });
        if (res.status === 'success') alert("Test email sent!");
        else alert("Failed to send: " + res.message);
        loadLogs();
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.disabled = false;
    }
}

window._toggleRecipient = async (id, isActive) => {
    try {
        await adminFetch(`/admin/emails/recipients/${id}`, {
            method: 'PUT',
            body: { is_active: isActive }
        });
    } catch (e) {
        alert("Toggle failed: " + e.message);
        loadRecipients();
    }
};

window._deleteRecipient = async (id) => {
    if (!confirm("Remove this recipient?")) return;
    try {
        await adminFetch(`/admin/emails/recipients/${id}`, { method: 'DELETE' });
        loadRecipients();
    } catch (e) { alert("Delete failed: " + e.message); }
};

function showRecipientModal() {
    const name = prompt("Recipient Name:");
    if (!name) return;
    const email = prompt("Recipient Email:");
    if (!email) return;
    const dept = prompt("Department (Optional):");

    adminFetch('/admin/emails/recipients', {
        method: 'POST',
        body: { name, email, department: dept }
    }).then(() => loadRecipients()).catch(e => alert(e.message));
}
