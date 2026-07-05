# ESPAssists/views.py
from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

# ====== PÁGINA INICIAL ======
def index(request: HttpRequest) -> HttpResponse:
    _ensure_state(request)
    return render(request, 'index.html', {})

# ====== ENTREVISTA (conversa) ======
INTERVIEW_STEPS = [
    (
        "objetivo",
        "O que você deseja que seu ESP32 faça? escreva o objetivo principal do projeto.",
        "Ex: medir temperatura, controlar um LED, monitorar distância ou automatizar um sistema.",
        """
        <p>Descreva, de forma geral, qual problema o projeto deve resolver ou qual tarefa o ESP32 deverá executar.</p>
        <p>Exemplos:</p>
        <ul>
            <li>Monitorar temperatura e umidade.</li>
            <li>Detectar obstáculos.</li>
            <li>Automatizar a irrigação de plantas.</li>
            <li>Controlar a iluminação de um ambiente.</li>
        </ul>
        """
    ),

    (
        "sensores",
        "Quais sensores ou módulos serão utilizados?",
        "Exemplos: DHT11, HC-SR04, MPU6050, OLED. ",
        """
        <p>Sensores coletam informações do ambiente, como temperatura, distância, umidade ou movimento.</p>
        <p>Módulos adicionam funcionalidades ao ESP32, como displays, GPS ou leitores RFID.</p>
        <p>Exemplos:</p>
        <ul>
            <li>🌡️ DHT11 — temperatura e umidade</li>
            <li>📏 HC-SR04 — distância</li>
            <li>📱 MPU6050 — acelerômetro e giroscópio</li>
            <li>🖥️ OLED — display</li>
            <li>📡 RFID RC522 — leitura de cartões</li>
        </ul>
        """
    ),

    (
        "atuadores",
        "O projeto precisa controlar algum atuador?",
        "Ex: acender um LED, tocar um buzzer, mover um servo motor ou acionar um relé.",
        """
        <p>Atuadores são componentes responsáveis por executar ações físicas no projeto.</p>
        <p>Exemplos:</p>
        <ul>
            <li>💡 LED — sinalização luminosa</li>
            <li>🔊 Buzzer — alerta sonoro</li>
            <li>⚙️ Servo motor — movimentação controlada</li>
            <li>🔌 Relé — acionamento de equipamentos elétricos</li>
            <li>🌀 Motor DC — rotação contínua</li>
        </ul>
        """
    ),

    (
        "pinos",
        "Você já definiu quais pinos do ESP32 serão utilizados para conectar cada componente?",
        "Ex: DHT11 no GPIO 4, LED no GPIO 2. Caso contrário, eles poderão ser definidos automaticamente.",
        """
        <p>Cada componente precisa ser conectado a um ou mais pinos do ESP32.</p>
        <p>Caso você já saiba quais utilizar, informe-os.</p>
        <p>Se não souber, os pinos poderão ser definidos automaticamente durante a geração do código.</p>
        """
    ),

    (
        "wifi",
        "O projeto utilizará Wi-Fi?",
        "Ex: para enviar dados para um servidor, receber comandos. Se sim, informe também o SSID (nome da rede) e a senha.",
        """
        <p>O Wi-Fi permite conectar o ESP32 à internet ou à rede local.</p>
        <p>Pode ser utilizado para:</p>
        <ul>
            <li>enviar dados para um servidor;</li>
            <li>acessar APIs;</li>
            <li>controlar o dispositivo por um aplicativo;</li>
            <li>criar uma página web.</li>
        </ul>
        <p>Caso utilize uma rede Wi-Fi, informe também:</p>
        <ul>
            <li>SSID (nome da rede);</li>
            <li>senha.</li>
        </ul>
        """
    ),

    (
        "bt",
        "O projeto utilizará Bluetooth?",
        "Ex: para comunicação com celular ou outros microcontroladores.",
        """
        <p>O Bluetooth permite a comunicação sem fio entre o ESP32 e dispositivos próximos.</p>
        <p>Pode ser utilizado para:</p>
        <ul>
            <li>comunicação com celulares;</li>
            <li>troca de dados;</li>
            <li>envio de comandos;</li>
            <li>configuração do dispositivo.</li>
        </ul>
        """
    ),

    (
        "remoto",
        "O projeto precisa enviar ou receber dados remotamente?",
        "Ex: API REST, broker MQTT, Firebase ou ThingSpeak.",
        """
        <p>Permite que o ESP32 troque informações pela internet.</p>
        <p>Algumas tecnologias comuns são:</p>
        <ul>
            <li>☁️ MQTT — protocolo leve para IoT.</li>
            <li>🔥 Firebase — banco de dados em tempo real.</li>
            <li>📊 ThingSpeak — monitoramento de sensores.</li>
            <li>🌐 API REST — comunicação com aplicações web.</li>
        </ul>
        """
    ),

    (
        "logica",
        "Como o sistema deve reagir às leituras dos sensores ou aos eventos?",
        "Ex: acender um LED quando a temperatura ultrapassar 30 °C ou tocar um buzzer quando um objeto estiver a menos de 10 cm.",
        """
        <p>Descreva o que deve acontecer quando alguma condição for atendida.</p>
        <p>Exemplos:</p>
        <ul>
            <li>Acender um LED quando detectar movimento.</li>
            <li>Tocar um buzzer quando a distância for menor que 10 cm.</li>
            <li>Enviar uma mensagem quando a temperatura ultrapassar um limite.</li>
            <li>Desligar um motor após determinado tempo.</li>
        </ul>
        """
    ),

    (
        "armazenamento",
        "O projeto precisa armazenar informações para uso posterior?",
        "Ex: na memória do ESP32 (EEPROM), em um cartão SD ou em um servidor na internet.",
        """
        <p>Os dados podem ser armazenados em diferentes locais.</p>
        <ul>
            <li>💾 EEPROM — guarda pequenas informações no próprio ESP32.</li>
            <li>📁 Cartão SD — armazena arquivos e históricos de medições.</li>
            <li>☁️ Servidor na internet — permite visualizar ou acessar os dados remotamente por um site ou aplicativo.</li>
        </ul>
        <p>Caso utilize um servidor, informe qual serviço será utilizado, se já estiver definido.</p>
        """
    ),

    (
        "frequencia",
        "Com que frequência o ESP32 deve executar as leituras ou ações?",
        "Ex: a cada 500 ms, 1 segundo ou 5 minutos, ou descreva quando a ação deve ocorrer.",
        """
        <p>Informe quando o ESP32 deverá realizar suas tarefas.</p>
        <p>Exemplos:</p>
        <ul>
            <li>a cada 500 ms;</li>
            <li>a cada 1 segundo;</li>
            <li>a cada 5 minutos;</li>
            <li>somente quando um sensor detectar um evento.</li>
        </ul>
        """
    ),

    (
        "visualizacao",
        "Como os dados do projeto serão visualizados?",
        "Ex: no Monitor Serial, em um display (OLED/LCD), em uma página web, aplicativo ou painel de monitoramento.",
        """
        <p>Os dados gerados pelo ESP32 podem ser exibidos de diversas formas.</p>
        <p>Exemplos:</p>
        <ul>
            <li>💻 Monitor Serial da IDE Arduino.</li>
            <li>🖥️ Display OLED.</li>
            <li>📟 Display LCD.</li>
            <li>🌐 Página Web.</li>
            <li>📱 Aplicativo para celular.</li>
            <li>📊 Dashboard online.</li>
        </ul>
        """
    ),
]

def _ensure_state(request: HttpRequest):
    if "iv_idx" not in request.session:
        request.session["iv_idx"] = 0
        request.session["answers"] = {}
        request.session.modified = True

def _compose_briefing(answers: dict) -> str:
    return (
        f"Objetivo: {answers.get('objetivo','')}\n"
        f"Sensores/Módulos: {answers.get('sensores','')}\n"
        f"Atuadores: {answers.get('atuadores','')}\n"
        f"Pinos GPIO: {answers.get('pinos','')}\n"
        f"Conectividade: WiFi={answers.get('wifi','')}, BT={answers.get('bt','')}, Remoto={answers.get('remoto','')}\n"
        f"Lógica: {answers.get('logica','')}\n"
        f"Armazenamento: {answers.get('armazenamento','')}\n"
        f"Frequência: {answers.get('frequencia','')}\n"
        f"Visualização: {answers.get('visualizacao','')}"
    )

@require_http_methods(["POST"])
@csrf_exempt
def agent_next(request: HttpRequest) -> JsonResponse:
    # import ABSOLUTO (evita erro de pacote relativo)
    from ESPAssists.services.generator import generate_esp32_code
    from ESPAssists.models import Entry

    _ensure_state(request)
    payload = json.loads(request.body.decode("utf-8") or "{}")
    answer = (payload.get("answer") or "").strip()

    idx = request.session["iv_idx"]
    answers = request.session["answers"]

    if answer and idx < len(INTERVIEW_STEPS):
        key, _, _, _ = INTERVIEW_STEPS[idx] # Ajustado para pegar apenas a chave
        answers[key] = answer
        request.session["answers"] = answers
        idx += 1
        request.session["iv_idx"] = idx
        request.session.modified = True

    if idx < len(INTERVIEW_STEPS):
        _, question, placeholder_example, help_text = INTERVIEW_STEPS[idx] # Pega a pergunta, o exemplo e o help text
        return JsonResponse({
            "done": False,
            "question": question,
            "placeholder_example": placeholder_example, # Novo campo
            "help_text": help_text, # Novo campo
            "step": idx+1,
            "total": len(INTERVIEW_STEPS)
        })

    briefing = _compose_briefing(answers)
    code, feedback = generate_esp32_code(briefing)

    try:
        Entry.objects.create(prompt=briefing, code=code, feedback=feedback)
    except Exception as e:
        print("[WARN] Falha ao salvar Entry:", e)

    request.session.pop("iv_idx", None)
    request.session.pop("answers", None)
    request.session.modified = True

    return JsonResponse({"done": True, "feedback": feedback, "code": code})

@require_http_methods(["POST"])
@csrf_exempt
def agent_reset(request: HttpRequest) -> JsonResponse:
    request.session.pop("iv_idx", None)
    request.session.pop("answers", None)
    request.session.modified = True
    return JsonResponse({"ok": True})

# ====== Endpoints legados (opcional manter) ======
@require_http_methods(["POST"])
@csrf_exempt
def generate_code(request: HttpRequest) -> JsonResponse:
    from ESPAssists.services.generator import generate_esp32_code
    from ESPAssists.models import Entry

    payload = json.loads(request.body.decode('utf-8') or "{}")
    prompt = (payload.get('prompt') or '').strip()
    if not prompt:
        return JsonResponse({"error": "Prompt vazio."}, status=400)
    code, feedback = generate_esp32_code(prompt)
    try:
        Entry.objects.create(prompt=prompt, code=code, feedback=feedback)
    except Exception as e:
        print("[WARN] Falha ao salvar Entry:", e)
    return JsonResponse({"code": code, "feedback": feedback})

@require_http_methods(["POST"])
@csrf_exempt
def send_ota(request: HttpRequest) -> JsonResponse:
    payload = json.loads(request.body.decode('utf-8') or "{}")
    code = payload.get('code', '')
    return JsonResponse({
        "status": "ok",
        "message": "Stub OTA: aqui você integrará a rotina real de OTA para o ESP32.",
        "size": len(code),
    })