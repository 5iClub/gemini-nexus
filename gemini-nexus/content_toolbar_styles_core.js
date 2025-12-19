
// content_toolbar_styles_core.js
(function() {
    window.GeminiStylesCore = `
        /* Shared Resets */
        button { font-family: inherit; }
        
        /* Arrow Base Styles */
        .arrow {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            transition: all 0.2s;
        }

        /* Default / Placed Bottom: Point UP */
        .toolbar.placed-bottom .arrow, .toolbar:not(.placed-top) .arrow {
            top: -6px;
            bottom: auto;
            border-bottom: 6px solid #1e1e1e;
            border-top: none;
        }

        /* Placed Top: Point DOWN */
        .toolbar.placed-top .arrow {
            bottom: -6px;
            top: auto;
            border-top: 6px solid #1e1e1e;
            border-bottom: none;
        }

        .view { display: flex; flex-direction: column; gap: 12px; }
        .view.hidden { display: none; }

        .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: #c4c7c5;
            font-size: 13px;
            padding: 20px 0;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: #a8c7fa;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;
})();
