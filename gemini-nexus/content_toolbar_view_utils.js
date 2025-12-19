
// content_toolbar_view_utils.js
(function() {
    /**
     * Shared Utility for Positioning Elements
     */
    window.GeminiViewUtils = {
        positionElement: function(el, rect, isLargerWindow, isPinned, mousePoint) {
            // Do not reposition if pinned and already visible
            if (isPinned && el.classList.contains('visible')) return;

            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // 1. Get Dimensions
            let width = el.offsetWidth;
            let height = el.offsetHeight;

            // Fallback for hidden elements (estimate dimensions)
            if (width === 0 || height === 0) {
                width = isLargerWindow ? 400 : 220; 
                height = isLargerWindow ? 300 : 40;
            }

            let left, top;

            // --- Logic for Small Toolbar (Mouse Cursor Based) ---
            if (!isLargerWindow && mousePoint) {
                const offset = 12; // Distance from cursor
                
                // Default: Bottom Right of cursor
                let relLeft = mousePoint.x + offset;
                let relTop = mousePoint.y + offset;
                
                el.classList.remove('placed-top', 'placed-bottom');
                
                // Boundary Check: Right Edge
                if (relLeft + width > vw) {
                    // Flip to Left of cursor
                    relLeft = mousePoint.x - width - offset;
                }

                // Boundary Check: Bottom Edge
                if (relTop + height > vh) {
                    // Flip to Top of cursor
                    relTop = mousePoint.y - height - offset;
                    el.classList.add('placed-top'); // Updates arrow style if applicable
                } else {
                    el.classList.add('placed-bottom');
                }

                // Hard Stop for Left/Top edges (prevent going off-screen top-left)
                if (relLeft < 0) relLeft = 0;
                if (relTop < 0) relTop = 0;

                left = relLeft + scrollX;
                top = relTop + scrollY;
            } 
            
            // --- Logic for Ask Window or Fallback (Rect Based) ---
            else if (isLargerWindow) {
                // --- Ask Window (Fixed Positioning) ---
                // We use viewport coordinates directly (no scroll offsets)
                
                // Horizontal: Align left, clamp to viewport
                let relLeft = rect.left;
                // Constraints: margin 10px
                const maxLeft = vw - width - 10;
                const minLeft = 10;
                
                // Clamp
                relLeft = Math.min(Math.max(relLeft, minLeft), maxLeft);
                
                left = relLeft;

                // Vertical: Try Below -> Above -> Clamp
                // Margin 10px
                const spaceBelow = vh - rect.bottom;
                const spaceAbove = rect.top;
                
                let relTop;
                
                // Preference: Below
                if (spaceBelow >= height + 10) {
                    relTop = rect.bottom + 10;
                } 
                // Fallback: Above
                else if (spaceAbove >= height + 10) {
                    relTop = rect.top - height - 10;
                } 
                // Fallback: Whichever has more space, clamped
                else {
                    if (spaceBelow >= spaceAbove) {
                        // Put below, clamped to bottom
                        relTop = vh - height - 10;
                    } else {
                        // Put above, clamped to top
                        relTop = 10;
                    }
                }
                
                top = relTop;

            } else {
                // --- Fallback for Toolbar if no mousePoint provided (original logic) ---
                // Vertical: Default to Bottom
                let relTop = rect.bottom + 12;
                let positionClass = 'placed-bottom';

                if (relTop + height > vh) {
                    relTop = rect.top - height - 12;
                    positionClass = 'placed-top';
                }
                
                top = relTop + scrollY;
                
                el.classList.remove('placed-top', 'placed-bottom');
                el.classList.add(positionClass);

                // Horizontal: Align with Right Edge
                let relLeft = rect.right;
                const halfW = width / 2;
                const maxCenter = vw - halfW - 10;
                const minCenter = halfW + 10;
                
                relLeft = Math.min(Math.max(relLeft, minCenter), maxCenter);
                left = relLeft + scrollX;
            }

            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
        }
    };
})();