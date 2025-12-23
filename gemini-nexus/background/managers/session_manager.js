
// background/managers/session_manager.js
import { sendOfficialMessage } from '../../services/providers/official.js';
import { sendWebMessage } from '../../services/providers/web.js';
import { sendOpenAIMessage } from '../../services/providers/openai_compatible.js';
import { AuthManager } from './auth_manager.js';

export class GeminiSessionManager {
    constructor() {
        this.auth = new AuthManager();
        this.abortController = null;
    }

    async ensureInitialized() {
        await this.auth.ensureInitialized();
    }

    async _getConnectionSettings() {
        const stored = await chrome.storage.local.get([
            'geminiProvider',
            'geminiUseOfficialApi', 
            'geminiApiKey', 
            'geminiThinkingLevel', 
            'geminiApiKeyPointer',
            'geminiOpenaiBaseUrl',
            'geminiOpenaiApiKey',
            'geminiOpenaiModel'
        ]);

        // Legacy Migration Logic
        let provider = stored.geminiProvider;
        if (!provider) {
            provider = stored.geminiUseOfficialApi === true ? 'official' : 'web';
        }

        let activeApiKey = stored.geminiApiKey || "";

        // Handle API Key Rotation (Comma separated) for Official Gemini
        if (provider === 'official' && activeApiKey.includes(',')) {
            const keys = activeApiKey.split(',').map(k => k.trim()).filter(k => k);
            
            if (keys.length > 0) {
                let pointer = stored.geminiApiKeyPointer || 0;
                
                // Reset pointer if out of bounds (e.g. keys removed)
                if (typeof pointer !== 'number' || pointer >= keys.length || pointer < 0) {
                    pointer = 0;
                }
                
                activeApiKey = keys[pointer];
                
                // Advance pointer for next call
                const nextPointer = (pointer + 1) % keys.length;
                await chrome.storage.local.set({ geminiApiKeyPointer: nextPointer });
                
                console.log(`[Gemini Nexus] Rotating Official API Key (Index: ${pointer})`);
            }
        } else {
            // Trim single key just in case
            activeApiKey = activeApiKey.trim();
        }

        return {
            provider: provider,
            // Official
            apiKey: activeApiKey,
            thinkingLevel: stored.geminiThinkingLevel || "low",
            // OpenAI
            openaiBaseUrl: stored.geminiOpenaiBaseUrl,
            openaiApiKey: stored.geminiOpenaiApiKey,
            openaiModel: stored.geminiOpenaiModel
        };
    }

    async handleSendPrompt(request, onUpdate) {
        // Cancel previous if exists
        this.cancelCurrentRequest();
        
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            const settings = await this._getConnectionSettings();
            
            // Normalize files
            let files = [];
            if (request.files && Array.isArray(request.files)) {
                files = request.files;
            } else if (request.image) {
                files = [{
                    base64: request.image, 
                    type: request.imageType,
                    name: request.imageName || "image.png"
                }];
            }

            if (settings.provider === 'official') {
                return await this._handleOfficialRequest(request, settings, files, onUpdate, signal);
            } else if (settings.provider === 'openai') {
                return await this._handleOpenAIRequest(request, settings, files, onUpdate, signal);
            } else {
                return await this._handleWebRequest(request, files, onUpdate, signal);
            }

        } catch (error) {
            if (error.name === 'AbortError') return null;

            console.error("Gemini Error:", error);
            
            let errorMessage = error.message || "Unknown error";
            const isZh = chrome.i18n.getUILanguage().startsWith('zh');

            // Handle common user-facing errors
            if(errorMessage.includes("未登录") || errorMessage.includes("Not logged in")) {
                this.auth.forceContextRefresh();
                await chrome.storage.local.remove(['geminiContext']);
                
                const currentIndex = this.auth.getCurrentIndex();
                if (isZh) {
                    errorMessage = `账号 (Index: ${currentIndex}) 未登录或会话已过期。请前往 <a href="https://gemini.google.com/u/${currentIndex}/" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com/u/${currentIndex}/</a> 登录。`;
                } else {
                    errorMessage = `Account (Index: ${currentIndex}) not logged in. Please log in at <a href="https://gemini.google.com/u/${currentIndex}/" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com/u/${currentIndex}/</a>.`;
                }
            } else if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
                errorMessage = isZh ? "请求过于频繁，请稍后再试 (429)" : "Too many requests, please try again later (429)";
            }
            
            return {
                action: "GEMINI_REPLY",
                text: "Error: " + errorMessage,
                status: "error"
            };
        } finally {
            this.abortController = null;
        }
    }

    // --- Official API Flow ---
    async _handleOfficialRequest(request, settings, files, onUpdate, signal) {
        if (!settings.apiKey) throw new Error("API Key is missing. Please check settings.");
        
        // Fetch History
        let history = await this._getHistory(request.sessionId);

        const response = await sendOfficialMessage(
            request.text, 
            request.systemInstruction, // Pass system instruction
            history, 
            settings.apiKey,
            request.model, 
            settings.thinkingLevel, 
            files, 
            signal,
            onUpdate
        );

        return {
            action: "GEMINI_REPLY",
            text: response.text,
            thoughts: response.thoughts,
            images: response.images,
            status: "success",
            context: null, // Official API is stateless
            thoughtSignature: response.thoughtSignature
        };
    }

    // --- OpenAI Compatible Flow ---
    async _handleOpenAIRequest(request, settings, files, onUpdate, signal) {
        const config = {
            baseUrl: settings.openaiBaseUrl,
            apiKey: settings.openaiApiKey,
            model: settings.openaiModel
        };

        let history = await this._getHistory(request.sessionId);

        const response = await sendOpenAIMessage(
            request.text,
            request.systemInstruction,
            history,
            config,
            files,
            signal,
            onUpdate
        );

        return {
            action: "GEMINI_REPLY",
            text: response.text,
            thoughts: response.thoughts,
            images: response.images,
            status: "success",
            context: null
        };
    }

    async _getHistory(sessionId) {
        if (!sessionId) return [];
        const { geminiSessions } = await chrome.storage.local.get(['geminiSessions']);
        const session = geminiSessions ? geminiSessions.find(s => s.id === sessionId) : null;
        if (session && session.messages) {
            return session.messages;
        }
        return [];
    }

    // --- Reverse Engineered Web Client Flow ---
    async _handleWebRequest(request, files, onUpdate, signal) {
        await this.ensureInitialized();

        let attemptCount = 0;
        const maxAttempts = Math.max(3, this.auth.accountIndices.length > 1 ? 3 : 2);

        // Concatenate System Instruction for Web Client
        // The web client doesn't support the system instruction field in the same way,
        // so we prepend it to the text.
        let fullText = request.text;
        if (request.systemInstruction) {
            fullText = request.systemInstruction + "\n\nQuestion: " + fullText;
        }

        while (attemptCount < maxAttempts) {
            attemptCount++;
            
            try {
                this.auth.checkModelChange(request.model);
                const context = await this.auth.getOrFetchContext();
                
                const response = await sendWebMessage(
                    fullText, // Use combined text
                    context, 
                    request.model, 
                    files, 
                    signal,
                    onUpdate
                );

                // Success! Update auth state
                await this.auth.updateContext(response.newContext, request.model);

                return {
                    action: "GEMINI_REPLY",
                    text: response.text,
                    thoughts: response.thoughts,
                    images: response.images,
                    status: "success",
                    context: response.newContext 
                };

            } catch (err) {
                const isLoginError = err.message && (
                    err.message.includes("未登录") || 
                    err.message.includes("Not logged in") || 
                    err.message.includes("Sign in") || 
                    err.message.includes("401") || 
                    err.message.includes("403")
                );
                
                const isNetworkGlitch = err.message && (
                    err.message.includes("No valid response found") ||
                    err.message.includes("Network Error") ||
                    err.message.includes("Failed to fetch") ||
                    err.message.includes("Check network") ||
                    err.message.includes("429")
                );
                
                if ((isLoginError || isNetworkGlitch) && attemptCount < maxAttempts) {
                    const type = isLoginError ? "Auth" : "Network";
                    console.warn(`[Gemini Nexus] ${type} error (${err.message}), retrying... (Attempt ${attemptCount}/${maxAttempts})`);
                    
                    if (isLoginError || isNetworkGlitch) {
                         if (this.auth.accountIndices.length > 1) {
                             await this.auth.rotateAccount();
                         }
                         this.auth.forceContextRefresh();
                    }
                    
                    const baseDelay = Math.pow(2, attemptCount) * 1000;
                    const jitter = Math.random() * 1000;
                    await new Promise(r => setTimeout(r, baseDelay + jitter));
                    continue; 
                }
                
                throw err;
            }
        }
    }

    cancelCurrentRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            return true;
        }
        return false;
    }

    async setContext(context, model) {
        await this.auth.updateContext(context, model);
    }

    async resetContext() {
        await this.auth.resetContext();
    }
}