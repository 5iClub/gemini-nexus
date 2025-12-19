
import { SIDEBAR_HTML } from './ui_template_sidebar.js';
import { HEADER_HTML } from './ui_template_header.js';
import { FOOTER_HTML } from './ui_template_footer.js';

export function renderAppLayout(container) {
    const layoutHTML = `
        ${SIDEBAR_HTML}
        ${HEADER_HTML}
        <div id="chat-history"></div>
        ${FOOTER_HTML}
    `;
    container.innerHTML = layoutHTML;
}
