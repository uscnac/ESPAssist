document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessagesContainer = document.getElementById('chat-messages');
    let initialChatMessage = document.getElementById('initial-chat-message'); // Use let as it might be removed
    const generatedCodePre = document.getElementById('generated-code');
    const copyButton = document.getElementById('copy-button');
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    const copyText = document.getElementById('copy-text');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

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

    // --- Chat Functionality ---
    function addMessageToChat(message, isUser, isTemporary = false) {
        if (initialChatMessage) {
            initialChatMessage.remove();
            initialChatMessage = null; // Clear reference after removal
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        if (isTemporary) {
            messageDiv.classList.add('temporary-message'); // Add a class to identify temporary messages
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = `max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border rounded-bl-sm'
        }`;
        contentDiv.textContent = message;
        messageDiv.appendChild(contentDiv);
        chatMessagesContainer.appendChild(messageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
        return messageDiv; // Return the message element for potential removal
    }

    function removeTemporaryMessages() {
        const temporaryMessages = document.querySelectorAll('.temporary-message');
        temporaryMessages.forEach(msg => msg.remove());
    }

    async function sendMessage(message) {
        addMessageToChat(message, true); // Display user message immediately
        chatInput.value = '';
        sendButton.disabled = true; // Disable button while loading

        // Add a loading message
        const loadingMessageElement = addMessageToChat("Gerando código...", false, true);
        generatedCodePre.textContent = "// Gerando código..."; // Clear previous code and show loading

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

            removeTemporaryMessages(); // Remove loading message before adding actual response

            if (data.done) {
                addMessageToChat(data.feedback || "Código gerado!", false);
                generatedCodePre.textContent = data.code;
            } else {
                addMessageToChat(data.question, false);
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            removeTemporaryMessages(); // Ensure loading message is removed on error
            addMessageToChat("Desculpe, houve um erro ao processar sua solicitação.", false);
            generatedCodePre.textContent = "// Erro ao gerar código."; // Indicate error in code area
        } finally {
            sendButton.disabled = false; // Re-enable button
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault(); // Prevent new line in textarea
            const message = chatInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        }
    });

    // --- Copy Code Functionality ---
    copyButton.addEventListener('click', async () => {
        const code = generatedCodePre.textContent;
        if (code && code !== "// Aguardando o código… converse com a IA do lado para gerar seu firmware." && code !== "// Gerando código." && code !== "// Erro ao gerar código.") {
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