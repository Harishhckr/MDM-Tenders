import { navigate } from '../router.js';

export function renderForgotPassword(container) {
    container.innerHTML = `
        <div class="auth-wrapper" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; background: var(--bg-primary);">
            <div class="auth-card" style="width: 100%; max-width: 420px; padding: 32px; border: 1px solid var(--border-color); border-radius: 12px; text-align: left; box-sizing: border-box;">
                
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.03em;">Reset password</h1>
                    <p style="color: var(--text-secondary); font-size: 13px;">We'll send you a recovery link.</p>
                </div>
                
                <form id="reset-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Email address</label>
                        <input type="email" class="input auth-input" placeholder="admin@leonex.net" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <button type="submit" class="auth-btn" style="width: 100%; height: 44px; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">
                            Send reset link
                        </button>
                        <button type="button" id="back-to-login" class="auth-btn-ghost" style="width: 100%; height: 44px; background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                            Back to log in
                        </button>
                    </div>
                </form>
            </div>
            
            <style>
                .auth-card { background: #000000; }
                html[data-theme="light"] .auth-card { background: #ffffff; }
                .auth-input { width: 100%; box-sizing: border-box !important; }
                .auth-btn, .auth-btn-ghost { width: 100%; box-sizing: border-box !important; }
                .auth-btn { background: #ffffff !important; color: #000000 !important; }
                html[data-theme="light"] .auth-btn { background: #000000 !important; color: #ffffff !important; }
                .auth-input:focus { border-color: var(--text-primary) !important; box-shadow: 0 0 0 1px var(--text-primary); }
                .auth-btn:hover { opacity: 0.8 !important; }
                .auth-btn-ghost:hover { background: rgba(128,128,128,0.1) !important; }
            </style>
        </div>
    `;

    document.getElementById('reset-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Reset link sent to your email.');
        navigate('/login');
    });

    document.getElementById('back-to-login').addEventListener('click', () => {
        navigate('/login');
    });
}
