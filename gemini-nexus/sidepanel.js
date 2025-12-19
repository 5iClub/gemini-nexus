
// sidepanel.js - Bridge between Sandbox and Background

const iframe = document.getElementById('sandbox-frame');

// 1. Forward messages from Sandbox (UI) to Background
window.addEventListener('message', (event) => {
    // Only accept messages from our direct iframe
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    const { action, payload } = event.data;
    
    // Check if it's a message intended for the background script
    if (action === 'FORWARD_TO_BACKGROUND') {
        chrome.runtime.sendMessage(payload).catch(e => {
            // Suppress errors if background doesn't respond (channel closed)
            // console.debug("Background msg error", e);
        });
    }
    
    // --- Session Management (Full History) ---
    if (action === 'SAVE_SESSIONS') {
        chrome.storage.local.set({ geminiSessions: payload });
    }
    
    if (action === 'GET_SESSIONS') {
        chrome.storage.local.get(['geminiSessions', 'pendingSessionId'], (result) => {
            if (iframe.contentWindow) {
                // 1. Restore Sessions
                iframe.contentWindow.postMessage({
                    action: 'RESTORE_SESSIONS',
                    payload: result.geminiSessions || []
                }, '*');

                // 2. Handle Pending Switch (if opened fresh)
                if (result.pendingSessionId) {
                    iframe.contentWindow.postMessage({
                        action: 'BACKGROUND_MESSAGE',
                        payload: {
                            action: 'SWITCH_SESSION',
                            sessionId: result.pendingSessionId
                        }
                    }, '*');
                    
                    // Consume it
                    chrome.storage.local.remove('pendingSessionId');
                }
            }
        });
    }

    // --- Shortcut Management ---
    if (action === 'SAVE_SHORTCUTS') {
        chrome.storage.local.set({ geminiShortcuts: payload });
    }

    if (action === 'GET_SHORTCUTS') {
        chrome.storage.local.get(['geminiShortcuts'], (result) => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'RESTORE_SHORTCUTS',
                    payload: result.geminiShortcuts || null
                }, '*');
            }
        });
    }

    // --- Theme Management ---
    if (action === 'SAVE_THEME') {
        chrome.storage.local.set({ geminiTheme: payload });
    }

    if (action === 'GET_THEME') {
        chrome.storage.local.get(['geminiTheme'], (result) => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'RESTORE_THEME',
                    payload: result.geminiTheme || 'light'
                }, '*');
            }
        });
    }
});

// 2. Forward messages from Background to Sandbox (UI)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // New: Handle Session Updates explicitly
    if (message.action === 'SESSIONS_UPDATED') {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: message.sessions
            }, '*');
        }
        return;
    }

    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload: message
        }, '*');
    }
});
