// ============================================================
// Admin Login — Minimalist Premium Design
// ============================================================
import { getApiBase, setToken } from '../utils/api.js';

export async function renderLogin(container) {
    const app = document.getElementById('admin-app');
    app.classList.add('logged-out');

    container.innerHTML = `
        <div class="centered-login anim-in">
            <h1 class="login-title">Log in</h1>
            <p class="login-subtitle">Access your intelligence platform.</p>

            <div id="adm-login-error" style="display:none; color:var(--accent-red); font-size:13px; margin-bottom:24px; font-weight:600;"></div>

            <form id="admin-login-form">
                <div class="login-field">
                    <label>Email address</label>
                    <input type="email" id="adm-email" placeholder="admin@leonex.net" required autocomplete="email">
                </div>
                <div class="login-field">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label>Password</label>
                        <a href="#" style="font-size:12px; color:var(--text-tertiary); text-decoration:none;">Forgot password?</a>
                    </div>
                    <input type="password" id="adm-pass" placeholder="••••••••" required autocomplete="current-password">
                </div>
                
                <button type="submit" class="login-btn-master" id="adm-login-btn">Continue</button>
            </form>

            <div style="margin-top:32px; font-size:14px; color:var(--text-secondary);">
                Don't have an account? <a href="#" style="color:#fff; text-decoration:none; font-weight:700;">Sign up</a>
            </div>
        </div>
    `;

    const form = document.getElementById('admin-login-form');
    const btn = document.getElementById('adm-login-btn');
    const errEl = document.getElementById('adm-login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Processing...';

        const email = document.getElementById('adm-email').value.trim();
        const pass  = document.getElementById('adm-pass').value;

        try {
            const res = await fetch(`${getApiBase()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }),
            });

            if (!res.ok) throw new Error('Invalid credentials');

            const data = await res.json();
            
            // Verification step (check role)
            const meRes = await fetch(`${getApiBase()}/auth/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` },
            });
            const me = await meRes.json();
            if (me.role !== 'admin') throw new Error('Unauthorized Access');

            setToken(data.access_token);
            app.classList.remove('logged-out');
            window.location.hash = '#/dashboard';
            window.location.reload();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Continue';
        }
    });
}
