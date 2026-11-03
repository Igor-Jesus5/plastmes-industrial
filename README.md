# PlastMES Industrial - Sistema MES para Embalagens Plásticas Flexíveis

Sistema MES (*Manufacturing Execution System*) completo em arquitetura **Local-First (Edge Computing)** com sincronização em nuvem e inteligência artificial gerencial. Desenvolvido para modernizar o controle operacional e administrativo de indústrias de embalagens plásticas.

---

## Como Executar o Projeto

Como o projeto foi construído puramente com **HTML5, CSS3 moderno e JavaScript modular (ES6+)**, você pode executá-lo de qualquer uma das formas abaixo:

1. **Abrir Diretamente no Navegador:**
   - Dê um duplo-clique no arquivo `index.html` em qualquer navegador moderno (Google Chrome, Edge, Safari, Firefox).

2. **Executar via Servidor Local (Recomendado para PWA / Service Worker):**
   ```bash
   # Utilizando Node.js:
   npx serve .
   # ou
   npx http-server .
   ```
   Acesse no navegador: `http://localhost:3000` ou `http://localhost:8080`.

---

## Estrutura de Arquivos Organizada

```text
Plástico Geral/
├── index.html                  # Single Page Application (SPA) com navegação integrada
├── manifest.json               # Manifesto PWA (Modo Kiosk / Android 10" Fullscreen)
├── sw.js                       # Service Worker com estratégia Cache-First (Resiliência Offline)
│
├── assets/
│   └── logo.svg                # Identidade visual industrial PlastMES
│
├── css/
│   ├── main.css                # Design system, ícones SVG, cores Andon normatizadas e layout
│   ├── dashboard.css           # Balanço de massa, fluxo sequencial em 3 blocos e tabela de produtividade
│   ├── tablet.css              # Interface Kiosk 10", botões >= 64px (luvas) e teclado numérico em tela
│   └── components.css          # Painel do supervisor, Kanban, modais, alertas e chat da IA PlastIA
│
└── js/
    ├── icons.js                # Biblioteca de ícones vetoriais SVG industriais (100% offline)
    ├── data.js                 # Banco de dados Local-First (PostgreSQL/Edge simulado) no localStorage
    ├── app.js                  # Orquestrador central, áudio industrial (Web Audio API) e simulação ao vivo
    ├── dashboard.js            # KPIs executivos, rendimento de polímeros e produtividade do turno
    ├── supervisor.js           # Filtro rigoroso por setor, Andon em tempo real e liberação de setup com PIN
    ├── tablet.js               # Terminal do tablet, Pista Dupla (2x), contador de pacotes e checklist 3x
    ├── copilot.js              # Copiloto de IA Executivo (PlastIA) com linguagem natural e diagnóstico
    └── ops.js                  # Gestão administrativa de OPs, Ficha Técnica em JSON e rastreabilidade QR
```

---

## Funcionalidades Implementadas

### 1. Dashboard Executivo & Portal do Dono
- **Balanço de Massa & Rendimento:** Cálculo automático de Resina Virgem Entrada (Extrusão) vs. Produto Conforme Entregue (Corte e Solda) vs. Total de Sucata/Refugo (Kg e %). Barra visual dinâmica de aproveitamento.
- **Fluxo Sequencial por Setor:**
  - **Setor 1 (Extrusão):** Máquinas EX-01 a EX-04 com produtividade em Kg/h e % de refugo de balão.
  - **Setor 2 (Impressão & Rebobinadeira):** Máquinas IM-01 e IM-02 com velocidade em m/min e acerto Pantone.
  - **Setor 3 (Corte e Solda):** Máquinas CS-01 a CS-06 com ritmo em sacos/min, pacotes e indicador de Pista Dupla.
- **Tabela de Produtividade do Turno:** Filtragem por colaborador, setor e turno com status visual e badges corporativas por iniciais.

### 2. Painel do Supervisor & Preparador
- **Organização Rigorosa por Setor:** Abas superiores exclusivas `[ Setor 1: Extrusão | Setor 2: Impressão | Setor 3: Corte e Solda ]` sem misturar máquinas de setores distintos.
- **Central de Chamados Andon:** Visualização com cronômetro decorrido dinâmico a cada segundo (`há 4 min`) e encerramento com 1 clique.
- **Fila Kanban de OPs:** Priorização e ordenação das Ordens de Produção.
- **Liberação de Setup com PIN:** Checklist técnico com digitação de PIN do preparador (ex: `1234` ou `0000`) para transição de Amarelo (Setup) para Verde (Produzindo).

### 3. Terminal Tablet 10" de Máquina (Chão de Fábrica Kiosk)
- **Ergonomia Industrial:** Todos os botões principais possuem área de toque **>= 64px**, permitindo operação com luvas ou mãos com óleo.
- **Teclado Numérico Nativo Pop-up:** Substitui o teclado do sistema operacional para digitação direta em tela de OPs, pesos e medições.
- **Chave Pista Simples / Pista Dupla (Toggle):**
  - Em **Pista Dupla**, exibe 2 cards independentes (Bobina 1 e Bobina 2) permitindo troca individual de bobina sem interromper o outro lado.
  - Multiplicador de contagem automático (2 unidades por golpe do barramento).
- **Contador com Botão Gigante `+1 Pacote (500 un)`:** Feedback sonoro com Web Audio API.
- **Checklist Periódico de Qualidade (3x por Bobina):** Aferição de Início, Meio e Fim (Largura 240mm ± 5mm, espessura e teste de tração da solda). Dispara marcação de lote suspeito e alerta imediato caso reprovado.
- **Apontamento de Refugo:** Registro imediato de peso em Kg e motivo do defeito.
- **Botões Rápidos Andon:** `Chamar Preparador`, `Chamar Manutenção` e `Chamar Qualidade`.

### 4. Gestão Administrativa de OPs & Fichas Técnicas
- Inspeção de Fichas Técnicas de Engenharia com formulações de resina (PEBD, PEAD, Masterbatch, Zonas Z1-Z5 em 168°C-180°C).
- Exportação e visualização da estrutura relacional em JSON (`Ficha_Tecnica_JSON`).
- Tabela de rastreabilidade de Bobinas-Mãe com geração de etiquetas QR Code.

### 5. Copiloto de IA Executivo (PlastIA)
- Assistente interativo em linguagem natural conectado ao banco de dados em tempo real.
- Consultas prontas e customizadas:
  - *"Qual máquina teve maior refugo e qual o motivo?"*
  - *"A OP do cliente Sacaria Soares vai atrasar?"*
  - *"Quem foi o operador mais eficiente no turno?"*
  - *"Gerar resumo executivo completo do turno atual"*
  - *"Detectar desvios de temperatura e anomalias nas extrusoras"*

### 6. PWA & Resiliência Offline (Local-First)
- O chão de fábrica opera 100% no servidor Edge local, sem dependência de internet externa.
- Indicador dual no cabeçalho permite alternar e testar o funcionamento offline com retenção e sincronização automática de pacotes para a Nuvem.
