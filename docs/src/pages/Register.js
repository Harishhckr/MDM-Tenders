import { navigate } from '../router.js?v=1002';

export function renderRegister(container) {
    container.innerHTML = `
        <div class="auth-wrapper" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; background: var(--bg-primary);">
            <div class="auth-card" style="width: 100%; max-width: 420px; padding: 32px; border: 1px solid var(--border-color); border-radius: 12px; text-align: left; box-sizing: border-box;">
                
                <div style="margin-bottom: 32px;">
                    <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.03em;">Create account</h1>
                    <p style="color: var(--text-secondary); font-size: 13px;">Start winning more tenders.</p>
                </div>
                
                <form id="register-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Full Name</label>
                        <input type="text" class="input auth-input" placeholder="Alex Carter" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Email address</label>
                        <input type="email" class="input auth-input" placeholder="alex@company.com" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Password</label>
                        <input type="password" class="input auth-input" placeholder="••••••••" required style="width: 100%; height: 42px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;">
                    </div>
                    <button type="submit" class="auth-btn" style="width: 100%; height: 44px; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: opacity 0.2s;">
                        Create account
                    </button>
                </form>
                
                <div style="margin-top: 32px; font-size: 13px; color: var(--text-secondary); text-align: center;">
                    Already have an account? <a href="#/login" style="color: var(--text-primary); font-weight: 600; text-decoration: none;" class="auth-link">Log in</a>
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

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('leonex-auth', 'true');
        navigate('/portal');
    });
}
