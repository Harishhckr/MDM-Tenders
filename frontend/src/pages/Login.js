import { navigate } from '../router.js?v=1002';

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-wrapper" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; background: var(--bg-primary);">
            <div class="auth-card" style="width: 100%; max-width: 420px; padding: 32px; border: 1px solid var(--border-color); border-radius: 12px; text-align: left; box-sizing: border-box;">
                
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.03em;">Log in</h1>
                    <p style="color: var(--text-secondary); font-size: 13px;">Access your intelligence platform.</p>
                </div>
                
                <form id="login-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Email address</label>
                        <input type="email" class="input auth-input" placeholder="admin@leonex.net" value="admin@leonex.net" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Password</label>
                            <a href="#/forgot-password" style="font-size: 12px; color: var(--text-secondary); text-decoration: none; font-weight: 500; transition: color 0.2s;" class="auth-link">Forgot password?</a>
                        </div>
                        <input type="password" class="input auth-input" placeholder="••••••••" value="password" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    <button type="submit" class="auth-btn" style="width: 100%; height: 44px; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: opacity 0.2s;">
                        Continue
                    </button>
                </form>
                
                <div style="margin-top: 32px; font-size: 13px; color: var(--text-secondary); text-align: center;">
                    Don't have an account? <a href="#/register" style="color: var(--text-primary); font-weight: 600; text-decoration: none;" class="auth-link">Sign up</a>
                </div>
            </div>
            
            <style>
                .auth-card { background: #000000; }
                html[data-theme="light"] .auth-card { background: #ffffff; }
                .auth-input { width: 100%; box-sizing: border-box !important; }
                .auth-btn { width: 100%; box-sizing: border-box !important; background: #ffffff !important; color: #000000 !important; }
                html[data-theme="light"] .auth-btn { background: #000000 !important; color: #ffffff !important; }
                .auth-input:focus { border-color: var(--text-primary) !important; box-shadow: 0 0 0 1px var(--text-primary); }
                .auth-btn:hover { opacity: 0.8 !important; }
                .auth-link:hover { color: var(--text-primary) !important; }
            </style>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate login
        // localStorage removed
        navigate('/portal');
    });
}
