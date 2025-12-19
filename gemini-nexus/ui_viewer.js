
// ui_viewer.js

const VIEWER_TEMPLATE = `
    <div id="image-viewer" class="image-viewer">
        <span class="close-viewer">&times;</span>
        <img class="viewer-content" id="full-image">
    </div>
`;

export class ViewerController {
    constructor() {
        this.render();
        this.queryElements();
        this.initListeners();
    }

    render() {
        if (!document.getElementById('image-viewer')) {
            document.body.insertAdjacentHTML('beforeend', VIEWER_TEMPLATE);
        }
    }

    queryElements() {
        this.viewer = document.getElementById('image-viewer');
        this.fullImage = document.getElementById('full-image');
        this.closeBtn = this.viewer ? this.viewer.querySelector('.close-viewer') : null;
    }

    initListeners() {
        if (this.viewer) {
            this.viewer.addEventListener('click', (e) => {
                if (e.target === this.viewer || e.target === this.closeBtn) {
                    this.close();
                }
            });
            
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }
        }

        // Global Event
        document.addEventListener('gemini-view-image', (e) => {
            this.open(e.detail);
        });

        // Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer && this.viewer.classList.contains('visible')) {
                this.close();
            }
        });
    }

    open(src) {
        if (this.fullImage && this.viewer) {
            this.fullImage.src = src;
            this.viewer.classList.add('visible');
        }
    }

    close() {
        if (this.viewer) {
            this.viewer.classList.remove('visible');
            setTimeout(() => {
                if(this.fullImage) this.fullImage.src = '';
            }, 300); 
        }
    }
}
