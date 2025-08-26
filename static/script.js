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

// Mostra a “fala” do agente
function setAgentText(txt){
  $("agent-feedback").textContent = txt || "";
}

// ===== Conversa =====
async function startInterview(){
  try{
    // zera e pede a 1ª pergunta
    await postJSON("/api/agent/reset");
    const r = await postJSON("/api/agent/next", {}); // sem answer => 1ª pergunta
    if (!r.done) setAgentText(r.question);
  }catch(e){
    setAgentText("Erro ao iniciar conversa: " + e.message);
    console.error(e);
  }
}

// Envia resposta atual OU, se já acabou, ignora
async function onGenerateClick(){
  const codeEl = $("generated-code");
  const answer = $("user-input").value.trim();

  try{
    const r = await postJSON("/api/agent/next", {answer});
    if (r.done){
      setAgentText(r.feedback || "OK");
      codeEl.textContent = r.code || "";
      $("user-input").value = "";  // limpa caixa
    }else{
      // próximo passo
      setAgentText(r.question);
      $("user-input").value = "";
    }
  }catch(e){
    setAgentText("Erro: " + e.message);
    console.error(e);
  }
}

// ===== OTA/Copy (mesmo de antes) =====
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

function onCopy(){
  const txt = $("generated-code").textContent;
  if(!txt) return;
  navigator.clipboard.writeText(txt).then(()=>{
    setAgentText("Código copiado para a área de transferência.");
  });
}

// ===== boot
window.addEventListener("DOMContentLoaded", () => {
  $("generate-code")?.addEventListener("click", onGenerateClick);
  $("send-ota")?.addEventListener("click", onSendOTA);
  $("copy-code")?.addEventListener("click", onCopy);

  // inicia a conversa automaticamente
  startInterview();
});