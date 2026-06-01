# ESPAssists/views.py
from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

# ====== PÁGINA INICIAL ======
def index(request: HttpRequest) -> HttpResponse:
    return render(request, 'index.html')

# ====== ENTREVISTA (conversa) ======
INTERVIEW_STEPS = [
    ("objetivo",       "O que você deseja que seu ESP32 faça?"),
    ("sensores",       "Quais sensores ou módulos serão usados? (ex: DHT11, MPU6050, HC-SR04 etc.)"),
    ("atuadores",      "Seu projeto precisa ativar algo? (ex: LED, motor, relé)"),
    ("pinos",          "Quais pinos do ESP32 você quer utilizar? Ou deseja que eu sugira?"),
    ("wifi",           "O ESP32 precisa de Wi-Fi? (Se sim, qual o SSID e a senha?)"),
    ("bt",             "Precisa de Bluetooth?"),
    ("remoto",         "Precisa enviar/receber dados remotamente?"),
    ("logica",         "Como o código deve reagir às leituras dos sensores?"),
    ("armazenamento",  "Precisa salvar informações? (EEPROM, SD Card, servidor)"),
    ("frequencia",     "Com que frequência o ESP32 deve executar as tarefas?"),
    ("visualizacao",   "Como você deseja ver os dados? (Serial, OLED, servidor, app)"),
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
        key, _ = INTERVIEW_STEPS[idx]
        answers[key] = answer
        request.session["answers"] = answers
        idx += 1
        request.session["iv_idx"] = idx
        request.session.modified = True

    if idx < len(INTERVIEW_STEPS):
        _, question = INTERVIEW_STEPS[idx]
        return JsonResponse({"done": False, "question": question, "step": idx+1, "total": len(INTERVIEW_STEPS)})

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
