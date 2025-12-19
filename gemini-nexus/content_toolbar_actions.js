
// content_toolbar_actions.js

class ToolbarActions {
    constructor(uiController) {
        this.ui = uiController;
    }

    // --- Business Logic ---

    handleImageAnalyze(imgUrl, rect) {
        // Open window in Loading state
        this.ui.showAskWindow(rect, "Analyzing image...", "图片分析");
        this.ui.showLoading("Analyzing image content...");
        this.ui.setAskInputValue("Describe this image");

        chrome.runtime.sendMessage({
            action: "QUICK_ASK_IMAGE",
            url: imgUrl,
            text: "请详细描述这张图片的内容，并提取其中的所有文字。",
            model: "3-flash"
        });
        // We do NOT wait for callback here, content_toolbar.js listens for stream events
    }

    handleQuickAction(actionType, selection, rect) {
        const prompt = this.getPrompt(actionType, selection);
        const title = actionType === 'translate' ? '翻译' : '解释';
        
        // Show the window in loading state immediately
        this.ui.hide();
        this.ui.showAskWindow(rect, selection, title);
        this.ui.showLoading(actionType === 'translate' ? 'Translating...' : 'Explaining...');
        
        // Pre-fill input to indicate what's happening
        this.ui.setAskInputValue(actionType === 'translate' ? 'Translate Selection' : 'Explain Selection');

        chrome.runtime.sendMessage({
            action: "QUICK_ASK",
            text: prompt,
            model: "3-flash"
        });
    }

    handleSubmitAsk(question, context) {
        this.ui.showLoading();
        
        let prompt = question;
        if (context) {
            prompt = `${question}\n\nContext:\n"""\n${context}\n"""`;
        }
        
        // Send "Quick Ask" to background
        chrome.runtime.sendMessage({
            action: "QUICK_ASK",
            text: prompt,
            model: "3-flash"
        });
    }

    handleCancel() {
        chrome.runtime.sendMessage({ action: "CANCEL_PROMPT" });
    }

    handleContinueChat(sessionId) {
        // Open Side Panel
        chrome.runtime.sendMessage({ 
            action: "OPEN_SIDE_PANEL",
            sessionId: sessionId
        });
    }

    // --- Helpers ---

    getPrompt(action, payload) {
        switch(action) {
            case 'translate':
                return `你是一个专业的翻译。请将以下文本翻译成自然地道的中文（如果原文是英文）或英文（如果原文是中文）。如果文本是其他语言，请将其翻译成中文。只返回翻译后的文本，不要提供任何解释。待翻译文本：\n\n"${payload}"`;
            case 'explain':
                return `你是一位资深的教育专家。请用简单、易懂的语言解释以下文本或概念。请保持简练并突出重点。待解释文本：\n\n"${payload}"`;
            default:
                return payload;
        }
    }

    // Legacy / Sidepanel method if needed
    openInSidePanel(action, payload) {
        const prompt = this.getPrompt(action, payload);
        chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
        setTimeout(() => {
            chrome.runtime.sendMessage({
                action: "SEND_PROMPT",
                text: prompt,
                model: "3-flash"
            });
        }, 500);
    }
}

// Export global for Content Script usage
window.GeminiToolbarActions = ToolbarActions;
