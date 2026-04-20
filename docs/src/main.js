import { initTheme } from './theme.js';
import { registerRoute, initRouter, navigate, getCurrentRoute, isAuthenticated } from './router.js?v=1002';
import { renderSidebar, initSidebarEvents } from './components/Sidebar.js?v=1003';
import { renderTopbar, initTopbarEvents } from './components/Topbar.js?v=1003';
import { renderLogin } from './pages/Login.js?v=1002';
import { renderRegister } from './pages/Register.js?v=1002';
import { renderForgotPassword } from './pages/ForgotPassword.js?v=1002';
import { renderOverview } from './pages/Overview.js?v=1003';
import { renderTenders } from './pages/Tenders.js?v=1002';
import { renderMDMTenders } from './pages/MDMTenders.js?v=1002';
import { renderAIOverview } from './pages/AIOverview.js?v=1002';
import { renderGEMPortal } from './pages/GEMPortal.js?v=1002';
import { renderTenderOnTime } from './pages/TenderOnTime.js?v=1002';
import { renderTenderDetailPage } from './pages/TenderDetailPage.js?v=1002';
import { renderTender247 } from './pages/Tender247.js?v=1002';
import { renderBidTenders } from './pages/BidTenders.js?v=1002';
import { renderSettings } from './pages/Settings.js?v=1001';
import { renderNotes } from './pages/Notes.js?v=1001';
import { renderBookmarks } from './pages/Bookmarks.js?v=1001';
import { renderGoogle } from './pages/Google.js?v=1001';
import { renderTenderView } from './pages/TenderView.js?v=1001';
import { renderPortal } from './pages/Portal.js?v=1001';

initTheme();

const app = document.getElementById('app');

function initIcons() {
    if (window.lucide) lucide.createIcons();
}

function withAuthLayout(renderFn) {
    return (container, query) => {
        container.innerHTML = '';
        renderFn(container, query);
        requestAnimationFrame(initIcons);
    };
}

function withAppLayout(renderFn) {
    return (container, query) => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        let pageContent = document.getElementById('page-content');
        
        if (!pageContent || !container.querySelector('.app-shell')) {
            container.innerHTML = `
                <div class="page-wrapper">
                    <div class="app-shell">
                        <div class="sidebar-overlay" id="sidebar-overlay"></div>
                        <aside class="sidebar glass-panel">
                            ${renderSidebar()}
                        </aside>
                        <div class="right-panel">
                            <header class="topbar glass-panel" id="topbar">
                                ${renderTopbar()}
                            </header>
                            <div class="content-scroll glass-panel" id="page-content"></div>
                        </div>
                    </div>
                </div>
            `;
            initSidebarEvents();
            initTopbarEvents();
            
            // Handle overlay click to close sidebar
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    document.querySelector('.sidebar')?.classList.remove('open');
                    overlay.classList.remove('active');
                });
            }
            
            pageContent = document.getElementById('page-content');
        }

        pageContent.innerHTML = '';
        pageContent.className = 'content-scroll glass-panel';
        renderFn(pageContent, query);

        requestAnimationFrame(() => {
            initIcons();
            setTimeout(initIcons, 200);
        });
    };
}

// Routes
registerRoute('/login', withAuthLayout(renderLogin));
registerRoute('/register', withAuthLayout(renderRegister));
registerRoute('/forgot-password', withAuthLayout(renderForgotPassword));

registerRoute('/portal', withAppLayout(renderPortal));
registerRoute('/overview', withAppLayout(renderOverview));
registerRoute('/tenders', withAppLayout(renderTenders));
registerRoute('/mdm-tenders', withAppLayout(renderMDMTenders));
registerRoute('/ai-overview', withAppLayout(renderAIOverview));
registerRoute('/bookmarks', withAppLayout(renderBookmarks));
registerRoute('/google', withAppLayout(renderGoogle));
registerRoute('/gem-portal', withAppLayout(renderGEMPortal));
registerRoute('/tender-on-time', withAppLayout(renderTenderOnTime));
registerRoute('/tender-detail', withAppLayout(renderTenderDetailPage));
registerRoute('/tender-247', withAppLayout(renderTender247));
registerRoute('/bid-tenders', withAppLayout(renderBidTenders));
registerRoute('/tender-view', withAppLayout(renderTenderView));
registerRoute('/settings', withAppLayout(renderSettings));
registerRoute('/notes', withAppLayout(renderNotes));

initRouter(app);

if (!getCurrentRoute() || getCurrentRoute().path === '/') {
    navigate(isAuthenticated() ? '/portal' : '/login');
}

