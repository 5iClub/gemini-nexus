

// content_toolbar_drag.js
(function() {
    /**
     * Module: Drag Behavior
     * Handles draggable window logic
     */
    class DragController {
        constructor(targetEl, handleEl) {
            this.target = targetEl;
            this.handle = handleEl;
            this.isDragging = false;
            this.dragOffset = { x: 0, y: 0 };

            // Bind methods for event listeners
            this.onDragMove = this.onDragMove.bind(this);
            this.onDragEnd = this.onDragEnd.bind(this);

            this.init();
        }

        init() {
            // Mouse
            this.handle.addEventListener('mousedown', (e) => {
                // Ignore clicks on buttons inside the handle
                if (e.target.closest('button')) return;
                
                // Disable drag on mobile if we want fixed bottom sheet
                if (window.matchMedia("(max-width: 600px)").matches) return;

                e.preventDefault();
                this.startDrag(e.clientX, e.clientY);
            });

            // Touch
            this.handle.addEventListener('touchstart', (e) => {
                if (e.target.closest('button')) return;
                if (window.matchMedia("(max-width: 600px)").matches) return;

                const touch = e.touches[0];
                this.startDrag(touch.clientX, touch.clientY);
            }, { passive: true });
        }

        startDrag(clientX, clientY) {
            this.isDragging = true;
            const rect = this.target.getBoundingClientRect();
            
            // Calculate offset within the element
            this.dragOffset.x = clientX - rect.left;
            this.dragOffset.y = clientY - rect.top;

            this.target.classList.add('dragging');
            // Ensure style is set for initial move
            this.target.style.left = `${rect.left}px`;
            this.target.style.top = `${rect.top}px`;
            this.target.style.transform = 'none';

            // Attach global listeners
            document.addEventListener('mousemove', this.onDragMove);
            document.addEventListener('mouseup', this.onDragEnd);
            document.addEventListener('touchmove', this.onDragMove, { passive: false });
            document.addEventListener('touchend', this.onDragEnd);
        }

        onDragMove(e) {
            if (!this.isDragging) return;
            
            let clientX, clientY;
            
            // Handle Touch
            if (e.type === 'touchmove') {
                 e.preventDefault(); // Prevent scrolling
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
            } else {
                 e.preventDefault();
                 clientX = e.clientX;
                 clientY = e.clientY;
            }

            // For position: fixed, we use client coordinates.
            const newLeft = clientX - this.dragOffset.x;
            const newTop = clientY - this.dragOffset.y;

            this.target.style.left = `${newLeft}px`;
            this.target.style.top = `${newTop}px`;
        }

        onDragEnd() {
            this.isDragging = false;
            // Remove global listeners
            document.removeEventListener('mousemove', this.onDragMove);
            document.removeEventListener('mouseup', this.onDragEnd);
            document.removeEventListener('touchmove', this.onDragMove);
            document.removeEventListener('touchend', this.onDragEnd);
        }
        
        reset() {
            this.target.classList.remove('dragging');
            this.target.style.transform = '';
        }
    }

    // Export to Window
    window.GeminiDragController = DragController;
})();
