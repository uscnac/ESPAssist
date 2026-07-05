document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const generatedCodePre = document.getElementById('generated-code');
    const copyButton = document.getElementById('copy-button');
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    const copyText = document.getElementById('copy-text');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const resetButton = document.getElementById('reset-button');
    const loadingOverlay = document.getElementById('loading-overlay');

    // --- Theme Toggling ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark');
        themeIconSun.classList.remove('hidden');
        themeIconMoon.classList.add('hidden');
    } else {
        htmlElement.classList.remove('dark');
        themeIconSun.classList.add('hidden');
        themeIconMoon.classList.remove('hidden');
    }

    themeToggle.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            themeIconSun.classList.remove('hidden');
            themeIconMoon.classList.add('hidden');
        } else {
            localStorage.setItem('theme', 'light');
            themeIconSun.classList.add('hidden');
            themeIconMoon.classList.remove('hidden');
        }
    });

    // --- Helper functions for message display ---
    function createAvatar(isUser) {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`;
        const avatarIcon = document.createElement('div');
        avatarIcon.className = `w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isUser ? 'bg-primary' : 'bg-gray-500'}`;
        avatarIcon.textContent = isUser ? 'Você' : 'IA';
        avatarDiv.appendChild(avatarIcon);
        return avatarDiv;
    }

    function createMessageBubble(message, isUser) {
        const contentDiv = document.createElement('div');
        contentDiv.className = `message-bubble max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border rounded-bl-sm'
        }`;
        contentDiv.textContent = message;
        return contentDiv;
    }

    // New function to update the help panel
    function updateHelpPanel(helpText) {
        const helpPanel = document.getElementById("help-panel");
        const helpContent = document.getElementById("help-content");

        if (helpText && helpText.trim() !== "") {
            helpContent.innerHTML = helpText;
            helpPanel.classList.remove("hidden");
            helpPanel.classList.add("flex"); // Ensure it's visible and uses flex layout
        } else {
            helpContent.innerHTML = ""; // Clear content when hidden
            helpPanel.classList.add("hidden");
            helpPanel.classList.remove("flex");
        }
    }

    // New function to hide the help panel
    function hideHelpPanel() {
        const helpPanel = document.getElementById("help-panel");
        const helpContent = document.getElementById("help-content");
        helpContent.innerHTML = "";
        helpPanel.classList.add("hidden");
        helpPanel.classList.remove("flex");
    }

    function addMessageToChat(message, isUser, isTemporary = false) { // Removed helpText parameter
        const messageDiv = document.createElement('div');
        messageDiv.className = `message flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`;
        if (isTemporary) {
            messageDiv.classList.add('temporary-message');
        }

        const avatarDiv = createAvatar(isUser);
        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = `message-content flex items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`;

        const messageBubbleDiv = createMessageBubble(message, isUser);
        
        messageContentDiv.appendChild(messageBubbleDiv);
        // Removed helpCardDiv creation and appending logic

        if (isUser) {
            messageDiv.appendChild(messageContentDiv);
            messageDiv.appendChild(avatarDiv);
        } else {
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(messageContentDiv);
        }

        chatMessagesContainer.appendChild(messageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        return messageDiv;
    }

    function removeTemporaryMessages() {
        const temporaryMessages = document.querySelectorAll('.temporary-message');
        temporaryMessages.forEach(msg => msg.remove());
    }

    async function sendMessage(message) {
        if (message) { // Only add user message if it's not an empty string (e.g., for initial question)
            addMessageToChat(message, true);
        }
        chatInput.value = '';
        sendButton.disabled = true;

        const loadingChatMessage = addMessageToChat(
            "🤖 Estou analisando seu projeto e gerando o código...",
            false,
            true
        );

        sendButton.innerHTML = `
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Gerando...
        `;

        generatedCodePre.textContent = "// Gerando código...\n// Isso pode levar alguns segundos.";
        loadingOverlay.classList.remove("hidden");
        loadingOverlay.classList.add("flex");

        try {
            const response = await fetch('/api/agent/next', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ answer: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            removeTemporaryMessages();

            if (data.done) {
                addMessageToChat(data.feedback || "Código gerado!", false);
                generatedCodePre.textContent = data.code;
                chatInput.placeholder = "A conversa terminou. Clique em 'Reiniciar Conversa' para começar um novo projeto.";
                chatInput.disabled = true; // Disable input after conversation is done
                hideHelpPanel(); // Hide help panel when conversation is done
            } else {
                addMessageToChat(data.question, false); // No helpText here
                chatInput.placeholder = data.placeholder_example;
                updateHelpPanel(data.help_text); // Update help panel with new help text
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            removeTemporaryMessages();
            addMessageToChat("Desculpe, houve um erro ao processar sua solicitação.", false);
            generatedCodePre.textContent = "// Erro ao gerar código.";
            chatInput.placeholder = "Ocorreu um erro. Tente reiniciar a conversa.";
            hideHelpPanel(); // Hide help panel on error
        } finally {
            sendButton.disabled = false;
            sendButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send h-4 w-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                Enviar
            `;
            loadingOverlay.classList.remove("flex");
            loadingOverlay.classList.add("hidden");
        }
    }

    // --- Initial Interview Start ---
    async function startInterview() {
        chatMessagesContainer.innerHTML = ''; // Clear any initial content
        generatedCodePre.textContent = "// Aguardando o código… converse com a IA do lado para gerar seu firmware.";
        chatInput.value = '';
        chatInput.disabled = false; // Ensure input is enabled
        hideHelpPanel(); // Hide help panel on start/reset

        try {
            const response = await fetch('/api/agent/reset', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // After reset, immediately request the first question
            sendMessage(''); // Send an empty message to get the first question
        } catch (error) {
            console.error('Erro ao iniciar a entrevista:', error);
            addMessageToChat("Desculpe, houve um erro ao iniciar a entrevista.", false);
            hideHelpPanel(); // Hide help panel on error
        }
    }

    // Call startInterview on page load
    startInterview();

    // --- Chat Form Submission ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message && !chatInput.disabled) { // Prevent sending if input is disabled
            sendMessage(message);
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message && !chatInput.disabled) {
                sendMessage(message);
            }
        }
    });

    // --- Reset Functionality ---
    resetButton.addEventListener('click', async () => {
        if (!confirm("Tem certeza que deseja reiniciar a conversa? Todo o progresso será perdido.")) {
            return;
        }
        startInterview(); // Simply call startInterview to reset and get the first question
    });

    // --- Copy Code Functionality ---
    copyButton.addEventListener('click', async () => {
        const code = generatedCodePre.textContent;
        if (code && code !== "// Aguardando o código… converse com a IA do lado para gerar seu firmware." && code !== "// Gerando código..." && code !== "// Erro ao gerar código.") {
            try {
                await navigator.clipboard.writeText(code);
                copyIcon.classList.add('hidden');
                checkIcon.classList.remove('hidden');
                copyText.textContent = 'Copiado!';
                setTimeout(() => {
                    copyIcon.classList.remove('hidden');
                    checkIcon.classList.add('hidden');
                    copyText.textContent = 'Copiar';
                }, 1500);
            } catch (err) {
                console.error('Falha ao copiar o código:', err);
                alert('Erro ao copiar o código. Por favor, copie manualmente.');
            }
        }
    });
});