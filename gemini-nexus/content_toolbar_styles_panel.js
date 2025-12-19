

// content_toolbar_styles_panel.js
(function() {
    window.GeminiStylesPanel = `
        /* Ask Window Styles - Layout & Header */
        .ask-window {
            position: fixed;
            background: #ffffff;
            border: 1px solid #e1e3e1;
            border-radius: 12px;
            width: 400px;
            height: 400px;
            min-width: 300px;
            min-height: 200px;
            
            /* Constraints to prevent exceeding display area */
            max-width: 90vw;
            max-height: 90vh;
            box-sizing: border-box;

            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            z-index: 1000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            
            /* Native Resize Capability */
            resize: both;
            overflow: hidden; /* Required for resize to work */
        }

        .ask-window.visible {
            opacity: 1;
            pointer-events: auto;
        }

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            cursor: move;
            user-select: none;
            background: #fff;
            border-bottom: 1px solid transparent;
        }

        .window-title {
            font-weight: 600;
            font-size: 16px;
            color: #1f1f1f;
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: #5e5e5e;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .icon-btn:hover {
            background: #f0f1f1;
            color: #1f1f1f;
        }
        .icon-btn.active {
            color: #0b57d0;
            background: #e8f0fe;
        }

        .window-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 0 16px 16px 16px;
            overflow: hidden;
            background: #fff;
            position: relative; /* Added for absolute positioning of floating buttons */
        }

        /* Input Styles */
        .input-container {
            margin-bottom: 12px;
            margin-top: 4px; /* Added spacing to prevent focus ring clipping */
            flex-shrink: 0;
        }
        
        input[type="text"]#ask-input {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            outline: none;
            color: #1f1f1f;
            background: #fff;
            box-sizing: border-box;
            transition: border-color 0.2s;
            font-family: inherit;
        }
        input[type="text"]#ask-input:focus {
            border-color: #0b57d0;
            box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.1);
        }

        .context-preview {
            font-size: 12px;
            color: #444746;
            background: #f0f4f9;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }
        .context-preview.hidden { display: none; }
        .context-preview::before {
            content: "Context:";
            font-weight: 600;
            margin-right: 6px;
            color: #0b57d0;
        }

        /* Mobile Layout - Bottom Sheet Style */
        @media (max-width: 600px) {
            .ask-window {
                width: 96vw !important;
                height: 60vh !important;
                left: 2vw !important;
                right: 2vw !important;
                top: auto !important;
                bottom: 12px !important;
                border-radius: 16px;
                transform: none !important;
                max-width: none !important;
                max-height: none !important;
                resize: none !important;
            }
            .ask-header {
                cursor: default; /* Indicate not draggable */
            }
        }
    `;
})();
