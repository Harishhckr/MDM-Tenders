// ============================================================
// Admin Login Page
// ============================================================
import { getApiBase, setToken } from '../utils/api.js';

export async function renderLogin(container) {
    const app = document.getElementById('admin-app');
    app.classList.add('logged-out');

    container.innerHTML = `
        <div class="admin-login-wrap">
            <div class="admin-login-box anim-in">
                <div class="login-brand">
                    <div class="brand-icon"><i data-lucide="terminal"></i></div>
                    <span>Leonex Admin</span>
                </div>
                <h2>Mission Control Access</h2>
                <form id="admin-login-form">
                    <div class="field">
                        <label for="adm-email">Email</label>
                        <input type="email" id="adm-email" placeholder="admin@leonex.net" autocomplete="email" required>
                    </div>
                    <div class="field">
                        <label for="adm-pass">Password</label>
                        <input type="password" id="adm-pass" placeholder="••••••••" autocomplete="current-password" required>
                    </div>
                    <button type="submit" class="login-btn" id="adm-login-btn">Authenticate</button>
                    <div class="login-error" id="adm-login-error"></div>
                </form>
                <div class="login-footer">
                    <a href="../#/login">← Back to User Portal</a>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('adm-login-btn');
        const errEl = document.getElementById('adm-login-error');
        const email = document.getElementById('adm-email').value.trim();
        const pass  = document.getElementById('adm-pass').value;

        btn.disabled = true;
        btn.textContent = 'Authenticating…';
        errEl.textContent = '';

        try {
            const res = await fetch(`${getApiBase()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }),
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || 'Login failed');
            }

            const data = await res.json();

            // Verify admin role by calling /auth/me
            const meRes = await fetch(`${getApiBase()}/auth/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` },
            });
            if (!meRes.ok) throw new Error('Failed to verify role');
            const me = await meRes.json();

            if (me.role !== 'admin') {
                throw new Error('Access denied — admin role required');
            }

            setToken(data.access_token);
            app.classList.remove('logged-out');
            window.location.hash = '#/dashboard';
            window.location.reload();
        } catch (err) {
            errEl.textContent = err.message;
            btn.disabled = false;
            btn.textContent = 'Authenticate';
        }
    });
}
