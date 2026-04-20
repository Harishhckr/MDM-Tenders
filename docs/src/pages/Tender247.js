import { renderSourcePage } from './SourcePage.js?v=1002';

export async function renderTender247(container) {
    await renderSourcePage(container, {
        source:      'tender247',
        name:        'Tender247',
        icon:        'calendar-clock',
        description: 'Largest Database for Tenders and RFQs globally',
    });
}
