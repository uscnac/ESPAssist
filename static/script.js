const $ = (id) => document.getElementById(id);

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data || {})
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Function to display messages in the chat interface
function displayMessage(sender, text) {
  const chatMessages = $("chat-messages");
  if (!chatMessages) {
    console.warn("Element with ID 'chat-messages' not found.");
    return;
  }

  // Remove the initial placeholder message if it exists
  const initialMessage = $("initial-chat-message");
  if (initialMessage) {
    initialMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("flex", "items-start", "gap-3");

  let avatarHtml = '';
  let messageBubbleClasses = '';

  if (sender === 'user') {
    avatarHtml = `
      <div class="h-8 w-8 rounded-full bg-blue-500 text-white grid place-items-center text-xs font-bold flex-shrink-0">
        VC
      </div>
    `;
    messageBubbleClasses = "bg-blue-500 text-white rounded-br-none";
  } else { // sender === 'ai'
    avatarHtml = `
      <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot h-4 w-4"><path d="M12 8V4H8"/><path d="M22 7.26V14L12 22 2 14V7.26l10-6"/><path d="m2 7 10 6 10-6"/><path d="M12 22V14"/><path d="M8 18H4"/><path d="M16 18h4"/></svg>
      </div>
    `;
    messageBubbleClasses = "bg-muted text-muted-foreground rounded-bl-none";
  }

  messageDiv.innerHTML = `
    ${avatarHtml}
    <div class="flex-1 p-3 rounded-lg ${messageBubbleClasses}">
      <p class="text-sm">${text}</p>
    </div>
  `;
  chatMessages.appendChild(messageDiv);

  // Scroll to the bottom of the chat messages
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== Conversa =====
async function startInterview(){
  try{
    // zera e pede a 1ª pergunta
    await postJSON("/api/agent/reset");
    const r = await postJSON("/api/agent/next", {}); // sem answer => 1ª pergunta
    if (!r.done) {
      displayMessage('ai', r.question);
    }
  }catch(e){
    displayMessage('ai', "Erro ao iniciar conversa: " + e.message);
    console.error(e);
  }
}

// Envia resposta atual OU, se já acabou, ignora
async function onGenerateClick(){
  const codeEl = $("generated-code");
  const chatInput = $("chat-input");
  const answer = chatInput.value.trim();

  if (!answer) return; // Don't send empty messages

  displayMessage('user', answer); // Display user's message immediately
  chatInput.value = ""; // Clear input field

  try{
    const r = await postJSON("/api/agent/next", {answer});
    if (r.done){
      displayMessage('ai', r.feedback || "OK");
      codeEl.textContent = r.code || "";
    }else{
      // próximo passo
      displayMessage('ai', r.question);
    }
  }catch(e){
    displayMessage('ai', "Erro: " + e.message);
    console.error(e);
  }
}

// ===== OTA/Copy =====
// Commenting out OTA functionality as there's no corresponding button in index.html yet.
/*
async function onSendOTA(){
  const code = $("generated-code").textContent;
  if(!code){ setAgentText("Gere um código antes de enviar OTA."); return; }
  try{
    const r = await postJSON("/api/ota", {code});
    setAgentText((r.message || "OTA ok") + ` (bytes: ${r.size})`);
  }catch(e){
    setAgentText("Erro OTA: " + e.message);
  }
}
*/

function onCopy(){
  const txt = $("generated-code").textContent;
  if(!txt) return;
  navigator.clipboard.writeText(txt).then(()=>{
    // Update the button text to "Copiado!" temporarily
    const copyButton = $("copy-button");
    const copyTextSpan = $("copy-text");
    const copyIcon = $("copy-icon");
    const checkIcon = $("check-icon");

    if (copyTextSpan && copyIcon && checkIcon) {
        const originalText = copyTextSpan.textContent;
        copyTextSpan.textContent = "Copiado!";
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');

        setTimeout(() => {
            copyTextSpan.textContent = originalText;
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
        }, 2000);
    }
  });
}

// ===== Theme Toggle =====
function applyTheme(theme) {
    const html = document.documentElement;
    const sunIcon = $("theme-icon-sun");
    const moonIcon = $("theme-icon-moon");

    if (theme === 'dark') {
        html.classList.add('dark');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    } else {
        html.classList.remove('dark');
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

window.addEventListener("DOMContentLoaded", () => {
  // Chat functionality
  const sendButton = $("send-button");
  if (sendButton) {
    sendButton.addEventListener("click", onGenerateClick);
  } else {
    console.warn("Element with ID 'send-button' not found.");
  }

  // Allow Ctrl/Cmd + Enter to send message
  const chatInput = $("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault(); // Prevent new line
        onGenerateClick();
      }
    });
  }

  const copyButton = $("copy-button");
  if (copyButton) {
    copyButton.addEventListener("click", onCopy);
  } else {
    console.warn("Element with ID 'copy-button' not found.");
  }

  // Theme toggle functionality
  const themeToggleBtn = $("theme-toggle");
  if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
  } else {
    console.warn("Element with ID 'theme-toggle' not found.");
  }

  // Apply saved theme or default to dark
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
      applyTheme(savedTheme);
  } else {
      // Default to dark theme if no preference is saved
      applyTheme('dark');
  }

  startInterview();
});