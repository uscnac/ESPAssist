import os
from django.conf import settings

# Descobre BASE_DIR de forma segura
try:
    BASE_DIR = settings.BASE_DIR
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PROMPT_PATH = os.path.join(BASE_DIR, "prompts", "esp32_agent.md")


def _load_system_prompt() -> str:
    """Carrega o prompt do agente (prioriza variável de ambiente)."""
    env_prompt = os.getenv("ESP32_AGENT_SYSTEM_PROMPT")
    if env_prompt:
        return env_prompt.strip()

    try:
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            text = f.read().strip()
            if text:
                return text
    except FileNotFoundError:
        pass

    # Fallback mínimo se nada for encontrado
    return (
        "Você é um assistente especializado em gerar código Arduino/C++ para ESP32 "
        "com setup() e loop(). Retorne apenas código compilável, com comentários curtos."
    )


def generate_esp32_code(prompt: str) -> tuple[str, str]:
    """
    Gera (code, feedback) usando OpenAI se houver chave; caso contrário, usa fallback local.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
    model = getattr(settings, "MODEL_NAME", "gpt-4o-mini")
    system = _load_system_prompt()

    if api_key:
        try:
            # openai>=1.0
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            # Uso do campo 'input' em formato de mensagens (system + user)
            rsp = client.responses.create(
                model=model,
                input=[
                    {"role": "system", "content": system},
                    {
                        "role": "user",
                        "content": (
                            "Gere um sketch ESP32 (Arduino/C++) para o seguinte briefing:\n"
                            f"{prompt}\n"
                            "Requisitos: incluir setup() e loop(), comentários curtos; "
                            "retornar APENAS o código (sem markdown)."
                        ),
                    },
                ],
                temperature=0.2,
            )
            text = rsp.output_text
            return text.strip(), "Código gerado com OpenAI."
        except Exception as e:
            return _fallback_generator(prompt), f"Fallback local (erro ao chamar modelo): {e}"

    # Sem chave: fallback
    return _fallback_generator(prompt), "Fallback local (sem OPENAI_API_KEY)."


def _fallback_generator(prompt: str) -> str:
    """
    Gera um exemplo simples quando não há API disponível.
    """
    lower = (prompt or "").lower()
    if "led" in lower or "gpio" in lower:
        return (
            "#include <Arduino.h>\n\n"
            "const int PINO = 2;\n\n"
            "void setup(){ pinMode(PINO, OUTPUT); }\n\n"
            "void loop(){ digitalWrite(PINO, HIGH); delay(500); "
            "digitalWrite(PINO, LOW); delay(500); }\n"
        )

    return (
        "#include <Arduino.h>\n\n"
        "void setup(){ Serial.begin(115200); }\n\n"
        "void loop(){ Serial.println(\"Descreva melhor sua tarefa para gerar um exemplo específico de ESP32.\"); "
        "delay(1000); }\n"
    )
