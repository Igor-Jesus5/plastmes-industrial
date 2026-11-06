# PlastMES Industrial - Sistema MES para Embalagens Plásticas Flexíveis

Sistema MES (*Manufacturing Execution System*) completo em arquitetura **Local-First (Edge Computing)** com sincronização em nuvem e inteligência artificial gerencial. Desenvolvido para modernizar o controle operacional e administrativo de indústrias de embalagens plásticas.

---

## 🚀 Arquitetura 3 Sites Únicos & Comunicação em Tempo Real

A aplicação foi estruturada em **3 sites front-end independentes e especializados**, que se comunicam instantaneamente em tempo real através da **BroadcastChannel API** nativa (com fallback automático para `StorageEvent`):

| Site | Caminho Dedicado | Atalho Raiz | Perfil / Função |
| :--- | :--- | :--- | :--- |
| **Site 1: Operador** | `site-operador/index.html` | `operador.html` | Tablet Android 10" Kiosk, botões ≥ 64px (luvas), teclado numérico nativo em tela, Pista Dupla 2x, Checklist 3x, Andon. |
| **Site 2: Supervisor** | `site-supervisor/index.html` | `supervisor.html` | Painel de Linha, filtro rigoroso por setor, cronômetro Andon decorrido em tempo real, Fila Kanban e Liberação de Setup com PIN (`1234`). |
| **Site 3: Executivo** | `site-executivo/index.html` | `executivo.html` | Portal do Dono na nuvem, Balanço de Massa, fluxo em 3 blocos, tabela de produtividade do turno e Copiloto de IA PlastIA. |
| **Hub Central** | `index.html` | `index.html` | Launchpad mestre com **Demonstrador 3 Telas ao Vivo (Side-by-Side Split View)** e ticker de eventos do barramento. |

### ⚡ Como os Sites se Conversam entre si:
- **Apontamento de Produção:** Ao clicar em `+1 Pacote (500 un)` no Site do Operador, o Balanço de Massa e a Tabela de Produtividade do Site Executivo atualizam no mesmo instante com efeito visual de pulso.
- **Chamados Andon:** Ao clicar em `Chamar Manutenção` ou `Chamar Preparador` no Site do Operador, o Site do Supervisor aciona alarme sonoro, pisca a notificação e adiciona o chamado à fila com cronômetro dinâmico a cada segundo.
- **Liberação de Setup com PIN:** Quando o Supervisor/Preparador digita o PIN (`1234`) para liberar uma máquina em regulagem, o Tablet do Operador recebe o sinal instantâneo, desbloqueia a máquina para 🟢 **PRODUZINDO** e toca a melodia de confirmação.
- **Telemetria Mesh de Rede:** Cada site exibe no topo o badge `REDE MESH INTER-SITES` indicando a quantidade de nós conectados (ex: `📱 Operador | 👷 Supervisor | 💼 Executivo`).

---

## 🛠️ Como Executar o Projeto

Como o projeto foi construído puramente com **HTML5, CSS3 moderno e JavaScript modular (ES6+)**, você pode executá-lo de qualquer uma das formas abaixo:

1. **Demonstração Multi-Telas Integrada (Recomendado):**
   - Dê duplo-clique no arquivo `index.html` e abra a aba **"🚀 Demonstrador 3 Telas ao Vivo"** para ver os 3 sites conversando lado a lado em uma única tela!

2. **Abrir os 3 Sites em Janelas/Abas Separadas:**
   - Abra `site-operador/index.html` (ou `operador.html`)
   - Abra `site-supervisor/index.html` (ou `supervisor.html`)
   - Abra `site-executivo/index.html` (ou `executivo.html`)
   - Posicione as janelas lado a lado e faça testes de apontamento e chamados Andon.

3. **Executar via Servidor HTTP Local:**
   ```bash
   # Utilizando Node.js:
   npx serve .
   # ou
   npx http-server .
   ```

---

## 🧪 Testes Automatizados & Esteira de Qualidade

O projeto conta com uma suíte de testes unitários e de integração utilizando o **Node.js Native Test Runner** (`node:test`):

```bash
# Executar a suíte de testes:
npm test
```

### O que é testado:
- ✅ **12 Máquinas nos 3 Setores:** Validação de integridade de Extrusão, Impressão e Corte e Solda.
- ✅ **Apontamento de Pacotes:** Incremento de unidades, kg e contadores de máquina e OPs.
- ✅ **Apontamento de Refugo:** Registro de sucata em Kg, motivo e setor responsável.
- ✅ **Ciclo de Vida do Andon:** Abertura pelo operador, transição de cores e resolução pelo supervisor.
- ✅ **Liberação de Setup:** Validação de checklist técnico e digitação de PIN do preparador.
- ✅ **Checklist de Qualidade 3x:** Tolerância de largura (240mm ± 5mm) e disparo de alerta em caso de solda fria.
- ✅ **Balanço de Massa:** Conservação de polímeros (Resina Entrada vs Acabado vs Sucata) na faixa industrial de 90-99%.
- ✅ **Validação da Arquitetura Multi-Site:** Existência e desacoplamento dos 3 sites independentes e conexão ao `sync-bus.js`.

---

## 📂 Estrutura de Arquivos Organizada

```text
Plástico Geral/
├── index.html                  # Hub Central & Modo Multi-Telas Side-by-Side ao Vivo
├── operador.html               # Atalho de entrada para o Site do Operador
├── supervisor.html             # Atalho de entrada para o Site do Supervisor
├── executivo.html              # Atalho de entrada para o Site Executivo
├── package.json                # Manifesto do projeto e scripts de teste
├── PROJECT_GUIDELINES.md       # Diretrizes de engenharia, issues, PRs e motion principles
├── README.md                   # Documentação técnica e operacional
├── manifest.json               # Manifesto PWA (Modo Kiosk / Android 10" Fullscreen)
├── sw.js                       # Service Worker com estratégia Cache-First (Resiliência Offline)
│
├── site-operador/              # [SITE 1] Terminal Tablet 10" de Chão de Fábrica
│   └── index.html              # Interface Kiosk, botões >= 64px, teclado numérico, Pista Dupla
│
├── site-supervisor/            # [SITE 2] Painel do Supervisor & Preparador
│   └── index.html              # Filtro rigoroso por setor, Central Andon e Liberação PIN
│
├── site-executivo/             # [SITE 3] Portal Executivo do Dono & Nuvem
│   └── index.html              # Balanço de massa, OEE, produtividade e Copiloto PlastIA
│
├── tests/                      # Esteira de Testes Automatizados
│   ├── db.test.js              # Testes unitários do banco de dados e regras MES
│   └── architecture.test.js    # Testes de integridade da arquitetura multi-site
│
├── .github/workflows/          # Automação de CI/CD
│   └── ci.yml                  # Pipeline de validação e testes automáticos no GitHub
│
├── css/
│   ├── main.css                # Design system, cores Andon normatizadas e layout base
│   ├── dashboard.css           # Balanço de massa, fluxo em 3 blocos e produtividade
│   ├── tablet.css              # Interface Kiosk 10", ergonomia para luvas e teclado numérico
│   └── components.css          # Modais, widget de sincronização peer-sync e split-view
│
└── js/
    ├── sync-bus.js             # Barramento em Tempo Real Inter-Sites (BroadcastChannel + Heartbeat)
    ├── data.js                 # Banco de Dados Local-First Reativo com Métodos Atômicos
    ├── app.js                  # Orquestrador central e simulação de fábrica
    ├── dashboard.js            # KPIs executivos, rendimento e produtividade do turno
    ├── supervisor.js           # Filtro por setor, Andon dinâmico e setup com PIN
    ├── tablet.js               # Terminal tablet, Pista Dupla (2x), pacotes e checklist 3x
    ├── copilot.js              # Copiloto de IA Executivo (PlastIA) com linguagem natural
    ├── ops.js                  # Gestão administrativa de OPs e Ficha Técnica JSON
    └── icons.js                # Biblioteca vetorial de ícones SVG industriais (100% offline)
```

---

## 📋 Padrões de Git & Contribuição

Conforme documentado em `PROJECT_GUIDELINES.md`:
- **Issues Obrigatórias:** Categorizadas como `[Nova função]`, `[Melhoria]` ou `[Correção]`.
- **Pull Requests Estruturados:** Contendo Issue Relacionada, O Que Mudou, Como Foi Validado, Riscos/Limitações e Próximos Passos.
- **Motion Principles:** Transições fluidas, skeletons, haptics visuais e feedback consistente.
