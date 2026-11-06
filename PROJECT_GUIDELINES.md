# Diretrizes de Engenharia e Padrões de Desenvolvimento - PlastMES Industrial

> **Atenção para qualquer Agente ou Desenvolvedor:**
> Este documento define as regras obrigatórias de arquitetura, fluxo de trabalho no Git, convenções de código, esteira de qualidade e motion design que DEVEM ser rigorosamente respeitadas em qualquer modificação ou evolução do projeto PlastMES Industrial.

---

## 1. Fluxo de Trabalho Git (Issues, Branches e Pull Requests)

### 1.1. Categorização Obrigatória de Issues
Todas as tarefas a serem desenvolvidas devem possuir uma Issue correspondente no GitHub com uma das seguintes taxonomias no título e labels:
- `[Correção]` (Bugfix): Resolução de desvios, erros ou falhas de funcionamento.
- `[Melhoria]` (Enhancement): Otimizações de performance, refatorações, design e ergonomia.
- `[Nova função]` (Feature): Implementação de novas funcionalidades, telas ou módulos.

### 1.2. Padrão Estrito de Pull Requests (PRs)
Todo Pull Request DEVE conter obrigatoriamente as 5 seções estruturadas:
1. **Issue Relacionada:** Link direto (ex: `Resolve #1`, `Conecta com #2`).
2. **O que mudou:** Descrição clara e concisa de todas as alterações introduzidas no código.
3. **Como foi validado:** Evidências de testes manuais, testes automatizados (`npm test`) e verificações visuais.
4. **Riscos e Limitações:** Análise de potenciais efeitos colaterais, dependências ou limitações conhecidas.
5. **Próximos Passos:** Ações subsequentes recomendadas para o ciclo seguinte.

---

## 2. Princípios de Motion Design & UI/UX Industrial

Baseado nas diretrizes [Motion Principles](https://github.com/kylezantos/design-principles) e adaptado para chão de fábrica industrial:

- **Ergonomia de Toque para Chão de Fábrica:** Todos os botões interativos do tablet do operador devem possuir área de toque mínima de **64x64px** para permitir acionamento confiável com luvas e mãos oleosas.
- **Teclado Numérico Nativo em Tela:** Não invocar o teclado padrão do sistema operacional nos tablets Kiosk Android. Utilizar o teclado numérico pop-up em tela.
- **Lazy Loading & Skeleton Screens:** Componentes pesados ou listas dinâmicas devem renderizar skeleton screens durante o carregamento.
- **Animações Suaves de Entrada e Saída:** Transições com curvas de aceleração naturais (`cubic-bezier(0.16, 1, 0.3, 1)`) entre 200ms e 350ms.
- **Estados de Progresso e Haptics Visuais:** Elementos interativos devem exibir feedback visual imediato ao clique (hover, active, pulso verde/vermelho em apontamentos).
- **Cores Industriais Andon Normatizadas:**
  * 🟢 Verde (`#22C55E`): Produção Normal / Em Andamento
  * 🟡 Amarelo (`#EAB308`): Setup / Regulação / Troca de Lote
  * 🔴 Vermelho (`#EF4444`): Parada Não Planejada / Defeito / Manutenção
  * 🔵 Azul (`#3B82F6`): Chamado de Suporte Ativo / Aguardando Atendimento

---

## 3. Arquitetura Multi-Site e Comunicação em Tempo Real

O front-end do PlastMES é desacoplado em **3 sites independentes e especializados**:
1. **Site do Operador (`site-operador/index.html`):** Tablet Android 10" em modo Kiosk para os operadores de Extrusão, Impressão e Corte e Solda (Pista Dupla, Teclado Numérico, Checklist 3x).
2. **Site do Supervisor (`site-supervisor/index.html`):** Painel de Linha com filtro estrito por setor, central Andon com cronômetro decorrido dinâmico e liberação de setup com PIN.
3. **Site Executivo (`site-executivo/index.html`):** Portal do Dono na nuvem com Balanço de Massa, fluxo sequencial em 3 blocos, tabela de produtividade do turno e Copiloto PlastIA.
4. **Hub Central & Multi-Screen Demonstrator (`index.html`):** Orquestrador com launchpad e modo side-by-side ao vivo com as 3 telas conectadas.

### 3.1. Barramento de Intercomunicação (`js/sync-bus.js`)
- Os 3 sites conversam entre si instantaneamente em **tempo real** via **`BroadcastChannel API`** (canal `plastmes_realtime_sync_bus_v1`) com fallback automático para `StorageEvent`.
- Ao registrar um pacote (+1 Pacote) no Operador, o Executivo e o Supervisor atualizam no mesmo milissegundo.
- Ao abrir um chamado Andon, o Supervisor recebe alerta sonoro e visual imediato.
- Ao liberar um setup com PIN no Supervisor, o Operador recebe liberação e desbloqueio da máquina na hora.
- Cada nó anuncia sua presença e mantém telemetria de rede mesh com heartbeat a cada 3 segundos.

---

## 4. Esteira de Qualidade, Testes e Observabilidade

### 4.1. Testes Automatizados
- Executar via comando oficial:
  ```bash
  npm test
  ```
- Cobertura obrigatória para:
  * Integridade estrutural das entidades do banco de dados relacional simulado.
  * Cálculos de balanço de massa, OEE e rendimento de resina virgem vs produto acabado vs refugo.
  * Transições de estado Andon e validação de PIN de setup.
  * Tolerâncias do checklist de qualidade periódica (largura nominal 240mm ± 5mm, espessura e tração).

### 4.2. Observabilidade & Telemetria
- Suporte planejado para integração com Sentry (rastreamento de erros de runtime), Datadog/New Relic (RUM de performance em tablets) e OpenTelemetry (traces de pacotes edge/cloud sync).

### 4.3. Segurança & Resiliência Operacional
- Arquitetura **Local-First**: Quedas de internet externa não afetam o chão de fábrica; os dados acumulam localmente e sincronizam em lote quando o link é restabelecido.
- Validação de PINs para preparadores e supervisores.
- Separação estrita entre camadas de apresentação (views) e o motor de banco de dados (`data.js`).
