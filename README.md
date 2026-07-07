# ESP32 Assist

## Visão Geral do Projeto

O **ESP32 Assist** é uma ferramenta inovadora que utiliza Inteligência Artificial para auxiliar no desenvolvimento de firmware para dispositivos ESP32. Através de um processo de "entrevista" guiado, a IA coleta os requisitos do usuário e gera um código C++ otimizado, pronto para ser utilizado no Arduino IDE. O projeto visa simplificar a programação de sistemas embarcados, permitindo que usuários, mesmo com pouca experiência, criem firmwares complexos de forma eficiente.

## Funcionalidades Principais

*   **Geração de Código por IA:** Um assistente de IA interativo que faz perguntas sobre o projeto ESP32 e gera o código C++ correspondente.
*   **Fluxo de Entrevista Guiado:** A IA conduz o usuário por uma série de perguntas estruturadas para coletar todos os requisitos do firmware.
*   **Feedback Visual:** Interface de chat que exibe as perguntas da IA e as respostas do usuário.
*   **Cópia Rápida de Código:** Botão para copiar o código gerado para a área de transferência.
*   **Alternância de Tema:** Modo claro e escuro com persistência de preferência do usuário.
*   **Backend Robusto:** Desenvolvido com Django, gerenciando a lógica da aplicação e a integração com a IA.

## Estrutura do Projeto

O projeto é composto por um backend Django e um frontend simples baseado em HTML, Tailwind CSS e JavaScript.

```
Projeto/
├── .env                      # Variáveis de ambiente (ex: OPENAI_API_KEY)
├── ESPAssist/                # Configurações do projeto Django (settings.py, urls.py, wsgi.py)
├── ESPAssists/               # Aplicativo Django principal
│   ├── migrations/           # Migrações do banco de dados
│   ├── services/             # Lógica de integração com a IA (generator.py)
│   ├── static/               # Arquivos estáticos específicos do app 
│   ├── templates/            # Templates específicos do app
│   ├── admin.py              # Configurações de administração do Django
│   ├── apps.py               # Configurações do aplicativo
│   ├── models.py             # Modelos de banco de dados (Entry)
│   ├── urls.py               # Padrões de URL do aplicativo
│   └── views.py              # Lógica de views e interação com a IA
├── db.sqlite3                # Banco de dados SQLite (padrão do Django)
├── prompts/                  
│   └── esp32_agent.md        # Prompt do sistema para o agente ESP32
├── templates/                
│   └── index.html            # Página principal da aplicação
└── README.md                 # Este arquivo
```

## Backend (Django)

O backend é construído com Django e é responsável por:

*   Servir a página HTML principal.
*   Gerenciar o fluxo da entrevista com a IA, armazenando o estado na sessão do usuário.
*   Integrar-se com a API da OpenAI para a geração de código.
*   Salvar o histórico de prompts e códigos gerados no banco de dados.

### Fluxo da Entrevista com a IA

1.  **Início:** Ao carregar a página, o frontend chama `/api/agent/reset` para limpar qualquer estado de entrevista anterior e, em seguida, `/api/agent/next` para obter a primeira pergunta.
2.  **Interação:** O usuário responde à pergunta no campo de texto e clica em "Enviar".
3.  **Processamento:** O frontend envia a resposta para `/api/agent/next`. O backend:
    *   Armazena a resposta na sessão.
    *   Avança para o próximo passo da `INTERVIEW_STEPS`.
    *   Retorna a próxima pergunta ou, se a entrevista estiver completa, o código gerado.
4.  **Geração Final:** Quando todas as perguntas são respondidas, o backend compila um "briefing" detalhado e o envia para o módulo de geração de código.

### Geração de Código (`ESPAssists/services/generator.py`)

Este módulo é o ponto central da inteligência do projeto:

*   **Prompt do Sistema:** Carrega o prompt principal da IA de `prompts/esp32_agent.md` (ou de uma variável de ambiente `ESP32_AGENT_SYSTEM_PROMPT`). Este prompt define o papel da IA e o fluxo da entrevista.
*   **Integração OpenAI:** Tenta usar a API da OpenAI (requer `OPENAI_API_KEY` configurada nas variáveis de ambiente ou `settings.py`) para gerar o código C++ para ESP32 com base no briefing do usuário.
*   **Fallback Local:** Se a chave da API da OpenAI não estiver disponível ou se houver um erro na chamada à API, um gerador de fallback local (`_fallback_generator`) é ativado. Este fallback fornece exemplos de código simples (ex: piscar LED) com base em palavras-chave no prompt.

### Modelo de Dados (`ESPAssists/models.py`)

O projeto utiliza um modelo `Entry` para registrar cada interação de geração de código:

```python
class Entry(models.Model):
    prompt = models.TextField(blank=True, default='')   # O briefing completo enviado à IA
    code = models.TextField(blank=True, default='')     # O código C++ gerado
    feedback = models.TextField(blank=True, default='') # Feedback ou mensagem do gerador (ex: "Código gerado com OpenAI.")
    created_at = models.DateTimeField(auto_now_add=True) # Data e hora da criação
```

### Endpoints da API

*   `GET /`: Página inicial (renderiza `index.html`).
*   `POST /api/agent/next`: Processa uma resposta da entrevista e retorna a próxima pergunta ou o código final.
*   `POST /api/agent/reset`: Reinicia o estado da entrevista na sessão.
*   `POST /api/generate`: (Legado) Gera código diretamente de um prompt fornecido, sem o fluxo de entrevista.
*   `POST /api/ota`: (Stub) Um placeholder para futuras funcionalidades de atualização Over-The-Air (OTA) para ESP32.

## Frontend (HTML, Tailwind CSS, JavaScript)

O frontend é uma Single Page Application (SPA) construída com:

*   **HTML (`templates/index.html`):** Define a estrutura da interface, incluindo o cabeçalho, as seções de input/chat, a área de código e o rodapé.
*   **Tailwind CSS (via CDN):** Responsável por toda a estilização e responsividade da aplicação, utilizando classes utilitárias. As cores e temas (claro/escuro) são definidos via variáveis CSS e configurados no script `tailwind-config`.
*   **JavaScript (`static/script.js`):**
    *   Gerencia a interação com o usuário (envio de mensagens, cópia de código).
    *   Comunica-se com os endpoints da API do backend.
    *   Controla a alternância entre o modo claro e escuro, salvando a preferência do usuário no `localStorage`.
    *   Exibe as mensagens da IA e do usuário na interface de chat de forma dinâmica.

## Configuração e Execução

### Pré-requisitos

*   Python 3.x
*   pip (gerenciador de pacotes Python)
*   Django
*   Uma chave de API da OpenAI (opcional, para usar o gerador de IA completo)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <URL>
    cd ESPAssist
    ```

2.  **Crie e ative um ambiente virtual:**
    ```bash
    python -m venv ll_env
    source ll_env/bin/activate  # No Linux/macOS
    # ou
    ll_env\Scripts\activate     # No Windows
    ```

3.  **Instale as dependências do Python:**
    ```bash
    pip install -r requirements.txt # Você precisará criar este arquivo com suas dependências (Django, openai, etc.)
    ```
    *(Se você não tiver um `requirements.txt`, instale `Django` e `openai` manualmente: `pip install Django openai`)*

4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto (`ESPAssist/.env`) e adicione sua chave da OpenAI (se for usar o modelo completo):
    ```
    OPENAI_API_KEY='sua_chave_da_openai_aqui'
    # Opcional: para sobrescrever o prompt do sistema do arquivo
    # ESP32_AGENT_SYSTEM_PROMPT='Seu prompt customizado aqui'
    ```
    Certifique-se de que seu `settings.py` esteja configurado para ler variáveis de ambiente (ex: usando `python-dotenv`).

5.  **Execute as migrações do banco de dados:**
    ```bash
    python manage.py migrate
    ```

### Executando o Projeto

1.  **Inicie o servidor de desenvolvimento Django:**
    ```bash
    python manage.py runserver
    ```

2.  Abra seu navegador e acesse `http://127.0.0.1:8000/`.

Confira como o site ficou em: `https://espassist.onrender.com/`

## Observações

*   A funcionalidade OTA (`/api/ota`) é um *stub* e precisa ser implementada para ter funcionalidade real.
*   A IA é configurada para um fluxo de entrevista. Respostas diretas sem seguir o fluxo podem não ser processadas como esperado até que todos os passos da entrevista sejam concluídos.
*   O tema da interface é salvo no `localStorage` do navegador.

---
