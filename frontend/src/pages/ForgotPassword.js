import { navigate } from '../router.js?v=1002';

export function renderForgotPassword(container) {
    container.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div class="card glass-panel" style="width: 100%; max-width: 420px; padding: 40px; text-align: center;">
                <div style="display: flex; justify-content: center; margin-bottom: 24px; color: var(--accent-purple);">
                    <i data-lucide="key" style="width:48px;height:48px;"></i>
                </div>
                <h1 style="font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Reset Password</h1>
                <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 32px;">Enter your email and we'll send you a recovery link</p>
                
                <form id="reset-form" style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Email Address</label>
                        <input type="email" class="input" placeholder="admin@leonex.net" required style="width: 100%; height: 44px; background: rgba(255,255,255,0.03);">
                    </div>
                    
                    <button type="submit" class="btn-primary" style="width: 100%; height: 44px; justify-content: center; font-size: 15px; margin-top: 8px;">Send Reset Link</button>
                    <button type="button" id="back-to-login" class="btn-ghost" style="width: 100%; height: 44px; justify-content: center; font-size: 15px;">Back to Log in</button>
                </form>
            </div>
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
