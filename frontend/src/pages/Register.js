import { navigate } from '../router.js?v=1002';

export function renderRegister(container) {
    container.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div class="card glass-panel" style="width: 100%; max-width: 420px; padding: 40px; text-align: center;">
                <div style="display: flex; justify-content: center; margin-bottom: 24px; color: var(--accent-purple);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                        <path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25L19 3Z" fill="currentColor" opacity="0.7"/>
                        <path d="M6 16L6.5 17.5L8 18L6.5 18.5L6 20L5.5 18.5L4 18L5.5 17.5L6 16Z" fill="currentColor" opacity="0.5"/>
                    </svg>
                </div>
                <h1 style="font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Create an account</h1>
                <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 32px;">Start winning more tenders with Leonex AI</p>
                
                <form id="register-form" style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Full Name</label>
                        <input type="text" class="input" placeholder="Alex Carter" required style="width: 100%; height: 44px; background: rgba(255,255,255,0.03);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Email</label>
                        <input type="email" class="input" placeholder="alex@company.com" required style="width: 100%; height: 44px; background: rgba(255,255,255,0.03);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Password</label>
                        <input type="password" class="input" placeholder="••••••••" required style="width: 100%; height: 44px; background: rgba(255,255,255,0.03);">
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; height: 44px; justify-content: center; font-size: 15px; margin-top: 8px;">Sign Up</button>
                </form>
                
                <div style="margin-top: 32px; font-size: 14px; color: var(--text-secondary);">
                    Already have an account? <a href="#/login" style="color: var(--accent-purple); font-weight: 600; text-decoration: none;">Log in</a>
                </div>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('leonex-auth', 'true');
        navigate('/overview');
    });
}
