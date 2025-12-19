
// renderer.js

// Helper: Render Markdown/Math/Text into an element
function renderContent(contentDiv, text, role) {
    // Render Markdown and Math for AI responses
    if (role === 'ai' && typeof marked !== 'undefined') {
        
        // --- Math Protection & Normalization ---
        const mathBlocks = [];
        
        const protectMath = (regex, isDisplay) => {
            text = text.replace(regex, (match, content) => {
                const id = `@@MATH_BLOCK_${mathBlocks.length}@@`;
                mathBlocks.push({
                    id,
                    content: content,
                    isDisplay
                });
                return id;
            });
        };

        // 1. Block Math: \$\$ ... \$\$ (Gemini specific)
        protectMath(/\\\$\$([\s\S]+?)\\\$\$/g, true);
        
        // 2. Block Math: $$ ... $$
        protectMath(/\$\$([\s\S]+?)\$\$/g, true);

        // 3. Block Math: \[ ... \]
        protectMath(/\\\[([\s\S]+?)\\\]/g, true);

        // 4. Inline Math: \$ ... \$ (Gemini specific)
        protectMath(/\\\$([^$]+?)\\\$/g, false);

        // 5. Inline Math: \( ... \)
        protectMath(/\\\(([\s\S]+?)\\\)/g, false);

        // 6. Inline Math: $ ... $ (Standard LaTeX)
        protectMath(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, false);

        // --- Markdown Parsing ---
        let html = marked.parse(text);
        
        // --- Restore Math ---
        mathBlocks.forEach(({ id, content, isDisplay }) => {
            // Escape HTML chars inside latex to prevent browser parsing issues
            const safeContent = content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            // Use standard delimiters for KaTeX
            const open = isDisplay ? '$$' : '$';
            const close = isDisplay ? '$$' : '$';
            
            html = html.replace(id, `${open}${safeContent}${close}`);
        });

        contentDiv.innerHTML = html;
        
        // Render Math (KaTeX)
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(contentDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    } else {
        // User message: keep as plain text (CSS handles whitespace)
        contentDiv.innerText = text;
    }
}

// Appends a message to the chat history and returns an update controller
export function appendMessage(container, text, role, imageUrl = null) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    
    // Store current text state
    let currentText = text || "";

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'chat-image';
        
        // Click to enlarge
        img.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('gemini-view-image', { detail: imageUrl }));
        });

        div.appendChild(img);
    }

    let contentDiv = null;

    // Allow creating empty AI bubbles for streaming
    if (currentText || role === 'ai') {
        contentDiv = document.createElement('div');
        renderContent(contentDiv, currentText, role);
        div.appendChild(contentDiv);

        // --- Add Copy Button ---
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copy content';
        
        const copyIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        copyBtn.innerHTML = copyIcon;

        copyBtn.addEventListener('click', async () => {
            try {
                // Use currentText closure to get latest streaming text
                await navigator.clipboard.writeText(currentText);
                copyBtn.innerHTML = checkIcon;
                setTimeout(() => {
                    copyBtn.innerHTML = copyIcon;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });

        div.appendChild(copyBtn);
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Return controller
    return {
        div,
        update: (newText) => {
            // Check if user is near bottom before update
            const threshold = 50; 
            const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            const isAtBottom = distanceToBottom <= threshold;

            currentText = newText;
            if (contentDiv) {
                renderContent(contentDiv, currentText, role);
            }
            
            // Smart scroll: Only scroll to bottom if user was already at bottom
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    };
}
