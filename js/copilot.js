/**
 * COPILOT.JS - Copiloto de IA Executivo (PlastIA)
 * Análise de dados industriais em linguagem natural, diagnóstico preventivo,
 * resumo executivo de turnos e detecção de anomalias
 */

const CopilotModule = {
  app: null,

  init(appInstance) {
    this.app = appInstance;
    this.bindEvents();
  },

  bindEvents() {
    const sendBtn = document.getElementById('btnCopilotSend');
    const inputField = document.getElementById('copilotInput');

    if (sendBtn && inputField) {
      sendBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (text) {
          this.handleUserMessage(text);
          inputField.value = '';
        }
      });

      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = inputField.value.trim();
          if (text) {
            this.handleUserMessage(text);
            inputField.value = '';
          }
        }
      });
    }

    // Botões de perguntas rápidas (chips)
    const quickButtons = document.querySelectorAll('.btn-quick-prompt');
    quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (query) {
          this.handleUserMessage(query);
        }
      });
    });
  },

  handleUserMessage(text) {
    this.appendMessage(text, 'user');

    // Simula raciocínio e resposta contextualizada da IA
    setTimeout(() => {
      const response = this.generateAIResponse(text);
      this.appendMessage(response, 'ai');
      this.app.playBeep(750, 0.08);
    }, 600);
  },

  appendMessage(text, sender = 'ai') {
    const container = document.getElementById('copilotMessagesContainer');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-message-bubble ${sender}`;

    if (sender === 'ai') {
      bubble.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; color: #a855f7; font-weight: 700; font-size: 0.8rem;">
          <span class="icon-svg">${window.Icons ? Icons.bot : ''}</span>
          <span>PlastIA Copiloto Executivo</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>${text}</div>
      `;
    } else {
      bubble.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem; font-size: 0.75rem; color: #bae6fd;">Você (Gestor)</div>
        <div>${text}</div>
      `;
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  generateAIResponse(prompt) {
    const db = this.app.db;
    const lower = prompt.toLowerCase();

    // 1. Pergunta: Maior refugo
    if (lower.includes('maior refugo') || lower.includes('sucata') || lower.includes('desperdício')) {
      const refugosPorMaquina = {};
      db.apontamentosRefugo.forEach(r => {
        refugosPorMaquina[r.maquinaId] = (refugosPorMaquina[r.maquinaId] || 0) + r.pesoKg;
      });

      let piorMaq = null;
      let maxKg = -1;
      for (const [maq, kg] of Object.entries(refugosPorMaquina)) {
        if (kg > maxKg) {
          maxKg = kg;
          piorMaq = maq;
        }
      }

      return `
        <strong>Diagnóstico de Refugo Industrial:</strong><br><br>
        A máquina com o maior volume de descarte acumulado é a <strong>${piorMaq}</strong> com <strong>${maxKg.toFixed(1)} Kg de refugo</strong>.<br>
        • <em>Motivo predominante:</em> Desalinhamento de fotocélula e regulagem de barramento.<br>
        • <em>Impacto:</em> Representa aproximadamente <strong>${((maxKg / 140) * 100).toFixed(1)}%</strong> do refugo total registrado no turno.<br>
        <strong>Recomendação da IA:</strong> Recomendo solicitar ao preparador uma inspeção preventiva na régua térmica e no sensor ótico da ${piorMaq}.
      `;
    }

    // 2. Pergunta: Atraso da OP do cliente X (Sacaria Soares ou AgroPack)
    if (lower.includes('atrasar') || lower.includes('soares') || lower.includes('prazo') || lower.includes('op')) {
      const opSoares = db.ordensProducao.find(o => o.clienteNome.includes('Soares'));
      if (opSoares) {
        const pct = Math.round((opSoares.qtdProduzidaUn / opSoares.qtdPlanejadaUn) * 100);
        return `
          <strong>Análise Preditiva de Prazo (OP ${opSoares.numeroOP}):</strong><br><br>
          • <strong>Cliente:</strong> ${opSoares.clienteNome}<br>
          • <strong>Progresso Atual:</strong> ${pct}% concluído (${opSoares.qtdProduzidaUn.toLocaleString('pt-BR')} / ${opSoares.qtdPlanejadaUn.toLocaleString('pt-BR')} unidades).<br>
          • <strong>Ritmo de Produção:</strong> A máquina CS-01 está rodando em <strong>Pista Dupla</strong> a ~95 sacos/min.<br>
          <strong>Conclusão do Copiloto:</strong> A OP <strong>NÃO VAI ATRASAR</strong>. A previsão de conclusão é para amanhã às 11:30h, com folga de 48 horas em relação ao prazo final contratual (${opSoares.prazoEntrega}).
        `;
      }
    }

    // 3. Pergunta: Operador mais eficiente
    if (lower.includes('eficiente') || lower.includes('produtividade') || lower.includes('melhor operador') || lower.includes('noite')) {
      return `
        <strong>Ranking de Produtividade & Eficiência Operacional:</strong><br><br>
        1. <strong>Juliana Prado Castro</strong> (CS-02): Eficiência de <strong>115% da meta</strong> (2.880 Kg produzidos com apenas 0.4% de refugo).<br>
        2. <strong>Carlos Eduardo Silva</strong> (EX-01): Eficiência de <strong>108% da meta</strong> na Extrusão.<br>
        3. <strong>Beatriz Nogueira</strong> (CS-06): 115 pacotes concluídos na Bloquetadeira.<br><br>
        <em>Destaque Técnico:</em> Juliana operou de forma contínua em modo Pista Dupla, realizando trocas de bobina em menos de 3 minutos.
      `;
    }

    // 4. Pergunta: Resumo do Dia / Turno
    if (lower.includes('resumo') || lower.includes('turno') || lower.includes('dia') || lower.includes('geral')) {
      const totalKg = db.apontamentosProducao.reduce((acc, c) => acc + (c.qtdKg || 0), 0);
      const totalRefugo = db.apontamentosRefugo.reduce((acc, c) => acc + (c.pesoKg || 0), 0);
      const totalSacos = db.apontamentosProducao.reduce((acc, c) => acc + (c.qtdUnidades || 0), 0);
      const rendimento = (((totalKg - totalRefugo) / totalKg) * 100).toFixed(1);

      return `
        <strong>RESUMO EXECUTIVO DO TURNO (PLASTIA REPORT):</strong><br><br>
        • <strong>Volume Total Processado:</strong> ${totalKg.toFixed(1)} Kg de polímeros.<br>
        • <strong>Unidades Acabadas:</strong> ${totalSacos.toLocaleString('pt-BR')} sacos plásticos (${(totalSacos/1000).toFixed(1)} milheiros).<br>
        • <strong>Índice de Rendimento Global:</strong> <span style="color: #4ade80; font-weight: 800;">${rendimento}%</span> (Meta mínima da diretoria: 95%).<br>
        • <strong>Perdas por Sucata:</strong> ${totalRefugo.toFixed(1)} Kg de aparas e purgas.<br>
        • <strong>OEE Geral do Parque Fabril:</strong> <strong>88.4%</strong>.<br>
        • <strong>Status da Frota:</strong> 7 máquinas em produção contínua, 2 em setup regulatório, 1 aguardando manutenção.<br>
        • <strong>Alertas Ativos:</strong> 2 chamados Andon resolvidos no tempo médio de 6.2 minutos.
      `;
    }

    // 5. Pergunta: Desvio de temperatura ou anomalia
    if (lower.includes('temperatura') || lower.includes('desvio') || lower.includes('anomalia') || lower.includes('extrusão')) {
      return `
        <strong>Detecção de Anomalias Térmicas & Preventivas:</strong><br><br>
        • <strong>Extrusora EX-03:</strong> Foi detectada oscilação de <strong>+4.2°C na Zona 4</strong> durante a transição para resina de barreira. Status atual em Setup.<br>
        • <strong>Flexográfica IM-02:</strong> Apresentou instabilidade no gerador Corona (36 dynas, abaixo do mínimo requerido de 38 dynas). Manutenção acionada via Andon.<br>
        <em>Extrusoras EX-01, EX-02 e EX-04:</em> Todas as zonas operando com estabilidade térmica dentro da faixa de 168°C a 180°C.
      `;
    }

    // Resposta Padrão Inteligente
    return `
      Entendido. Com base no banco de dados operacional local da fábrica:
      Atualmente estamos com <strong>${db.maquinas.length} máquinas ativas</strong> no parque fabril, operando sob o <strong>Turno 1</strong>.
      O rendimento global da matéria-prima virgem está em <strong>96.8%</strong> e a fila Kanban possui <strong>${db.ordensProducao.length} Ordens de Produção</strong> cadastradas.
      Você pode me perguntar sobre:
      • <em>"Qual máquina teve maior refugo?"</em>
      • <em>"A OP do cliente Sacaria Soares vai atrasar?"</em>
      • <em>"Gerar resumo completo do turno atual"</em>
      • <em>"Quem foi o operador mais eficiente?"</em>
    `;
  }
};

window.CopilotModule = CopilotModule;
