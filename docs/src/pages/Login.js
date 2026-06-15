import { navigate } from '../router.js';
import { saveTokens, getApiBase, getUserInfo, getUserRole } from '../utils/api.js';

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-wrapper" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:var(--bg-primary);">
            <div class="auth-card" style="width:100%;max-width:420px;padding:40px;border:1px solid var(--border-color);border-radius:16px;text-align:left;box-sizing:border-box;">

                <div style="margin-bottom:8px;">
                    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(124,92,252,0.12);border:1px solid rgba(124,92,252,0.25);border-radius:20px;padding:4px 12px;margin-bottom:16px;">
                        <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite;"></span>
                        <span style="font-size:11px;font-weight:600;color:#7c5cfc;letter-spacing:0.5px;">LEONEX INTELLIGENCE</span>
                    </div>
                    <h1 style="font-size:28px;font-weight:800;color:var(--text-primary);margin:0 0 6px;letter-spacing:-0.03em;">Welcome back</h1>
                    <p style="color:var(--text-secondary);font-size:13px;margin:0;">Sign in to access your dashboard</p>
                </div>

                <div id="login-error" style="display:none;background:#ff3b3b22;border:1px solid #ff3b3b55;color:#ff6b6b;padding:10px 14px;border-radius:8px;font-size:13px;margin:16px 0;"></div>
                <div id="login-success" style="display:none;background:#22c55e22;border:1px solid #22c55e55;color:#22c55e;padding:10px 14px;border-radius:8px;font-size:13px;margin:16px 0;text-align:center;"></div>

                <form id="login-form" style="display:flex;flex-direction:column;gap:16px;margin-top:24px;">
                    <div>
                        <label style="display:block;font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">Email address</label>
                        <input type="email" id="login-email" class="input auth-input" placeholder="admin@leonex.net" required
                            style="width:100%;height:44px;background:transparent;border:1px solid var(--border-color);color:var(--text-primary);padding:0 14px;border-radius:10px;font-size:14px;outline:none;transition:all 0.2s;box-sizing:border-box;">
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <label style="font-size:12px;font-weight:600;color:var(--text-primary);">Password</label>
                            <a href="#/forgot-password" style="font-size:12px;color:var(--text-secondary);text-decoration:none;font-weight:500;transition:color 0.2s;" class="auth-link">Forgot password?</a>
                        </div>
                        <div style="position:relative;">
                            <input type="password" id="login-password" class="input auth-input" placeholder="••••••••" required
                                style="width:100%;height:44px;background:transparent;border:1px solid var(--border-color);color:var(--text-primary);padding:0 44px 0 14px;border-radius:10px;font-size:14px;outline:none;transition:all 0.2s;box-sizing:border-box;">
                            <button type="button" id="toggle-password"
                                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;padding:4px;">
                                <i data-lucide="eye" id="eye-icon" style="width:18px;height:18px;"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" id="login-btn" class="auth-btn"
                        style="width:100%;height:46px;background:var(--text-primary);color:var(--bg-primary);border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;transition:opacity 0.2s;letter-spacing:0.3px;">
                        Sign In
                    </button>
                </form>

                <!-- Credential hints -->
                <div style="margin-top:20px;padding:12px;border:1px solid var(--border-color);border-radius:10px;background:rgba(255,255,255,0.02);">
                    <p style="font-size:11px;font-weight:600;color:var(--text-tertiary);margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Access Levels</p>
                    <div style="display:flex;gap:8px;">
                        <div style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(124,92,252,0.3);background:rgba(124,92,252,0.08);">
                            <div style="font-size:11px;font-weight:700;color:#7c5cfc;margin-bottom:2px;">⬡ ADMIN</div>
                            <div style="font-size:10px;color:var(--text-tertiary);">Full platform access</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);">
                            <div style="font-size:11px;font-weight:700;color:#22c55e;margin-bottom:2px;">◎ USER</div>
                            <div style="font-size:10px;color:var(--text-tertiary);">Tenders & reports</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top:20px;font-size:13px;color:var(--text-secondary);text-align:center;">
                    Don't have an account? <a href="#/register" style="color:var(--text-primary);font-weight:600;text-decoration:none;" class="auth-link">Sign up</a>
                </div>
            </div>

            <style>
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .auth-card { background: #000000; }
                html[data-theme="light"] .auth-card { background: #ffffff; }
                .auth-input { width: 100%; box-sizing: border-box !important; }
                .auth-btn { background: #ffffff !important; color: #000000 !important; }
                html[data-theme="light"] .auth-btn { background: #000000 !important; color: #ffffff !important; }
                .auth-input:focus { border-color: #7c5cfc !important; box-shadow: 0 0 0 2px rgba(124,92,252,0.18); }
                .auth-btn:hover { opacity: 0.85 !important; }
                .auth-link:hover { color: var(--text-primary) !important; }
                .auth-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
            </style>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const form = document.getElementById('login-form');
    const errBox = document.getElementById('login-error');
    const successBox = document.getElementById('login-success');
    const btn = document.getElementById('login-btn');
    const passInput = document.getElementById('login-password');
    const toggleBtn = document.getElementById('toggle-password');
    const eyeIcon = document.getElementById('eye-icon');

    toggleBtn.addEventListener('click', () => {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) window.lucide.createIcons();
    });

    function showError(msg) {
        errBox.textContent = msg;
        errBox.style.display = 'block';
        successBox.style.display = 'none';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.style.display = 'none';
        successBox.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Signing in...';

        const email = document.getElementById('login-email').value.trim();
        const password = passInput.value;

        try {
            const res = await fetch(`${getApiBase()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.detail || 'Login failed. Please check your credentials.');
                btn.disabled = false;
                btn.textContent = 'Sign In';
                return;
            }

            // Store tokens — this also caches the decoded user info instantly
            saveTokens(data.access_token, data.refresh_token);

            // Decode role directly from the token (zero extra API call)
            const user = getUserInfo();
            const role = user?.role || 'user';
            const name = user?.email?.split('@')[0] || 'User';

            // Show success flash before redirect
            successBox.textContent = `✓ Welcome back, ${name}! Redirecting...`;
            successBox.style.display = 'block';
            btn.textContent = '✓ Authenticated';

            // Role-based routing — instant, no delay
            setTimeout(() => {
                if (role === 'admin') {
                    navigate('/portal');       // Admin → full dashboard
                } else {
                    navigate('/tenders');      // User → tenders only
                }
            }, 600);

        } catch (err) {
            showError('Cannot connect to server. Make sure the backend is running.');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    });
}
