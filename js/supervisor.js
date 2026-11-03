/**
 * SUPERVISOR.JS - Painel do Preparador & Supervisor de Turno
 * Organização rigorosa por setor, Andon em tempo real, Kanban de OPs e Liberação de Setup com PIN
 */

const SupervisorModule = {
  app: null,
  activeSector: 'corte_solda', // extrusao | impressao | corte_solda
  elapsedTimerInterval: null,
  currentSetupReleaseMaquinaId: null,

  init(appInstance) {
    this.app = appInstance;
    this.bindEvents();
    this.startElapsedTimer();
  },

  bindEvents() {
    // Seletor de Setor Superior Obrigatório
    const sectorTabs = document.querySelectorAll('.sector-tab-btn');
    sectorTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSector = btn.getAttribute('data-sector');
        sectorTabs.forEach(b => b.classList.toggle('active', b === btn));
        this.render();
      });
    });
  },

  startElapsedTimer() {
    // Atualiza contadores de tempo decorrido dos chamados Andon a cada segundo
    if (this.elapsedTimerInterval) clearInterval(this.elapsedTimerInterval);
    this.elapsedTimerInterval = setInterval(() => {
      if (this.app.activeTab === 'supervisor') {
        this.updateAndonTimers();
      }
    }, 1000);
  },

  render() {
    this.updateSectorBadgeCounts();
    this.renderSectorMachines();
    this.renderSectorAndonBoard();
    this.renderSectorKanban();
  },

  updateSectorBadgeCounts() {
    const db = this.app.db;
    const counts = {
      extrusao: db.maquinas.filter(m => m.setor === 'extrusao').length,
      impressao: db.maquinas.filter(m => m.setor === 'impressao').length,
      corte_solda: db.maquinas.filter(m => m.setor === 'corte_solda').length
    };

    ['extrusao', 'impressao', 'corte_solda'].forEach(s => {
      const el = document.getElementById(`countBadge-${s}`);
      if (el) el.textContent = `${counts[s]} Máqs`;
    });
  },

  // 4.1 FILTRO EXCLUSIVO DO SETOR SELECIONADO: CARDS DE STATUS
  renderSectorMachines() {
    const container = document.getElementById('supervisorMachinesGrid');
    if (!container) return;

    const db = this.app.db;
    const machines = db.maquinas.filter(m => m.setor === this.activeSector);

    container.innerHTML = machines.map(m => {
      const op = db.ordensProducao.find(o => o.id === m.opAtualId);
      const operador = db.operadores.find(o => o.id === m.operadorId);

      // Botão de liberação de setup caso a máquina esteja em Amarelo (Setup)
      const setupBtn = m.status === 'setup'
        ? `<button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: #eab308; color: #020617; display: inline-flex; align-items: center; gap: 0.4rem;" onclick="SupervisorModule.openSetupReleaseModal('${m.id}')"><span class="icon-svg">${window.Icons ? Icons.wrench : ''}</span><span>Liberar Setup (PIN)</span></button>`
        : '';

      return `
        <div class="machine-overview-card" style="border-left: 5px solid var(--andon-${m.status === 'produzindo' ? 'green' : m.status === 'setup' ? 'yellow' : m.status === 'chamado' ? 'blue' : 'red'});">
          <div class="machine-card-head">
            <div>
              <div style="font-size: 1.1rem; font-weight: 800;">${m.id}</div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">${m.nome}</div>
            </div>
            <div class="status-badge ${m.status}">
              <span class="dot"></span>
              ${m.status.toUpperCase()}
            </div>
          </div>

          <div class="machine-op-badge">
            <span>OP: <strong>${op ? op.numeroOP : 'Sem OP Ativa'}</strong></span>
            <span>Operador: <strong>${operador ? operador.nome.split(' ')[0] : 'Nenhum'}</strong></span>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; padding-top: 0.4rem; border-top: 1px solid var(--border-subtle);">
            <span>IP Tablet: <strong class="font-mono">${m.ipTablet}</strong></span>
            ${setupBtn}
          </div>
        </div>
      `;
    }).join('');
  },

  // CENTRAL DE CHAMADOS ANDON DO SETOR COM TEMPO DECORRIDO
  renderSectorAndonBoard() {
    const listEl = document.getElementById('supervisorAndonList');
    if (!listEl) return;

    const db = this.app.db;
    // Filtra chamados apenas das máquinas do setor ativo
    const sectorMachineIds = db.maquinas.filter(m => m.setor === this.activeSector).map(m => m.id);
    const chamados = db.chamadosAndon.filter(c => sectorMachineIds.includes(c.maquinaId) && c.status === 'ativo');

    if (chamados.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; background: rgba(34, 197, 94, 0.05); border: 1px dashed rgba(34, 197, 94, 0.3); border-radius: var(--radius-md); color: #4ade80; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <span class="icon-svg" style="color: #4ade80;">${window.Icons ? Icons.check : ''}</span>
          <span>Nenhuma solicitação Andon pendente no setor de <strong>${this.getSectorLabel(this.activeSector)}</strong>. Produção operando conforme padrão.</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = chamados.map(c => {
      const maq = db.maquinas.find(m => m.id === c.maquinaId);
      const op = db.operadores.find(o => o.id === c.operadorId);
      const elapsedFormatted = this.formatElapsed(c.dataHoraAbertura);

      return `
        <div class="andon-incident-card" id="incident-${c.id}">
          <div class="incident-card-top">
            <span class="incident-machine" style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="icon-svg" style="color: #ef4444;">${window.Icons ? Icons.shieldAlert : ''}</span>
              <span>${c.maquinaId} - ${maq ? maq.nome : ''}</span>
            </span>
            <span class="incident-elapsed font-mono" data-opened="${c.dataHoraAbertura}">
              <span class="icon-svg" style="margin-right: 4px;">${window.Icons ? Icons.clock : ''}</span>
              <span>${elapsedFormatted}</span>
            </span>
          </div>
          <div class="incident-reason">${c.tipoChamado}</div>
          <div style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">"${c.observacao || 'Sem observações adicionais'}"</div>
          <div class="incident-operator">Solicitado por: <strong>${op ? op.nome : 'Operador do Posto'}</strong> (${c.categoria.toUpperCase()})</div>
          
          <button class="btn-attend-incident" onclick="SupervisorModule.resolveAndon(${c.id}, '${c.maquinaId}')" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <span class="icon-svg">${window.Icons ? Icons.check : ''}</span>
            <span>Atender e Encerrar Chamado</span>
          </button>
        </div>
      `;
    }).join('');
  },

  updateAndonTimers() {
    const timerEls = document.querySelectorAll('.incident-elapsed[data-opened]');
    timerEls.forEach(el => {
      const opened = el.getAttribute('data-opened');
      if (opened) {
        el.textContent = `⏱️ ${this.formatElapsed(opened)}`;
      }
    });
  },

  formatElapsed(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  },

  resolveAndon(chamadoId, maquinaId) {
    const db = this.app.db;
    const chamado = db.chamadosAndon.find(c => c.id === chamadoId);
    if (chamado) {
      chamado.status = 'encerrado';
      chamado.dataHoraAtendimento = new Date().toISOString();
    }

    // Retorna a máquina para o status de 'produzindo' ou 'setup'
    const maq = db.maquinas.find(m => m.id === maquinaId);
    if (maq && maq.status === 'chamado') {
      maq.status = 'produzindo';
    }

    window.PlastMES_DB.save(db);
    this.app.playBeep(880, 0.1);
    this.app.showToast(`Chamado da máquina ${maquinaId} atendido e concluído!`, 'success');
    this.render();
  },

  // FILA KANBAN DE OPs DO SETOR COM PRIORIZAÇÃO
  renderSectorKanban() {
    const container = document.getElementById('supervisorKanbanContainer');
    if (!container) return;

    const db = this.app.db;
    // OPs associadas ou filtradas para o setor
    const ops = db.ordensProducao;

    const colEmAndamento = ops.filter(o => o.status === 'em_andamento');
    const colProgramadas = ops.filter(o => o.status !== 'em_andamento' && o.status !== 'concluida');
    const colConcluidas = ops.filter(o => o.status === 'concluida');

    container.innerHTML = `
      <div class="kanban-column">
        <div class="kanban-col-header">
          <span><span class="dot-status-inline warning"></span> Em Fila / Aguardando</span>
          <span class="font-mono">${colProgramadas.length}</span>
        </div>
        <div class="kanban-cards-wrapper">
          ${this.renderKanbanCards(colProgramadas)}
        </div>
      </div>

      <div class="kanban-column" style="border-top: 3px solid #0284c7;">
        <div class="kanban-col-header">
          <span style="color: #38bdf8;"><span class="dot-status-inline"></span> Em Produção Ativa</span>
          <span class="font-mono">${colEmAndamento.length}</span>
        </div>
        <div class="kanban-cards-wrapper">
          ${this.renderKanbanCards(colEmAndamento)}
        </div>
      </div>

      <div class="kanban-column">
        <div class="kanban-col-header">
          <span style="display: flex; align-items: center; gap: 0.35rem;"><span class="icon-svg" style="color: #4ade80;">${window.Icons ? Icons.check : ''}</span> Concluídas Hoje</span>
          <span class="font-mono">${colConcluidas.length}</span>
        </div>
        <div class="kanban-cards-wrapper">
          ${this.renderKanbanCards(colConcluidas)}
        </div>
      </div>
    `;
  },

  renderKanbanCards(cards) {
    if (cards.length === 0) {
      return `<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem;">Nenhuma OP neste status</div>`;
    }

    return cards.map(op => {
      let prioridadeCor = '#94a3b8';
      if (op.prioridade === 'urgente') prioridadeCor = '#ef4444';
      if (op.prioridade === 'alta') prioridadeCor = '#eab308';

      const pct = Math.round((op.qtdProduzidaKg / op.qtdPlanejadaKg) * 100);

      return `
        <div class="kanban-op-card">
          <div class="kanban-op-head">
            <span style="color: #38bdf8;">${op.numeroOP}</span>
            <span style="color: ${prioridadeCor}; text-transform: uppercase; font-size: 0.68rem; font-weight: 800;">● ${op.prioridade}</span>
          </div>
          <div class="kanban-op-title">${op.clienteNome}</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">${op.produto}</div>
          
          <div class="kanban-op-meta">
            <span>Progresso: <strong>${pct}%</strong></span>
            <span>Entrega: <strong>${op.prazoEntrega.split('-').reverse().slice(0, 2).join('/')}</strong></span>
          </div>

          <div class="progress-bar-inline" style="width: 100%;">
            <div class="progress-fill" style="width: ${Math.min(100, pct)}%; background: #38bdf8;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 4.1 LIBERAÇÃO DE SETUP: CHECKLIST COM DIGITAÇÃO DE PIN DO PREPARADOR
  openSetupReleaseModal(maquinaId) {
    this.currentSetupReleaseMaquinaId = maquinaId;
    const db = this.app.db;
    const maquina = db.maquinas.find(m => m.id === maquinaId);
    const setupData = db.setupsPendentes.find(s => s.maquinaId === maquinaId) || {
      motivo: "Acerto e regulação de barramento",
      checklist: [
        { item: "Conferência visual de espessura e medidas nominais", ok: true },
        { item: "Verificação de temperatura de solda e pressão pneumática", ok: true },
        { item: "Inspeção e teste de tração manual dos primeiros 10 sacos", ok: false }
      ]
    };

    const modal = document.getElementById('setupReleaseModal');
    if (!modal) return;

    document.getElementById('setupModalMaquinaId').textContent = maquinaId;
    document.getElementById('setupModalMotivo').textContent = setupData.motivo;

    // Renderiza itens do checklist
    const checklistContainer = document.getElementById('setupModalChecklist');
    checklistContainer.innerHTML = setupData.checklist.map((item, idx) => `
      <label class="checklist-item">
        <input type="checkbox" id="setupCheck_${idx}" ${item.ok ? 'checked' : ''} />
        <span>${item.item}</span>
      </label>
    `).join('');

    // Reset PIN display
    document.getElementById('setupPinDisplay').textContent = '••••';
    this.pinBuffer = '';

    modal.style.display = 'flex';
  },

  pinBuffer: '',

  pressPinKey(key) {
    if (key === 'clear') {
      this.pinBuffer = '';
    } else if (key === 'backspace') {
      this.pinBuffer = this.pinBuffer.slice(0, -1);
    } else if (this.pinBuffer.length < 4) {
      this.pinBuffer += key;
    }

    const display = document.getElementById('setupPinDisplay');
    if (display) {
      display.textContent = this.pinBuffer.padEnd(4, '•');
    }
  },

  confirmSetupRelease() {
    // Validar PIN (Valter Camargo preparador PIN: 0000 ou Master PIN: 1234)
    if (this.pinBuffer !== '1234' && this.pinBuffer !== '0000') {
      this.app.playWarningTone();
      this.app.showToast('PIN do Preparador incorreto! Use 1234 ou 0000.', 'danger');
      return;
    }

    // Validar se todos os checkboxes estão marcados
    const checkboxes = document.querySelectorAll('#setupModalChecklist input[type="checkbox"]');
    for (let cb of checkboxes) {
      if (!cb.checked) {
        this.app.playWarningTone();
        this.app.showToast('Todos os itens do checklist técnico devem ser aprovados antes da liberação!', 'warning');
        return;
      }
    }

    // Libera a máquina de Amarelo (Setup) para Verde (Produzindo)
    const db = this.app.db;
    const maq = db.maquinas.find(m => m.id === this.currentSetupReleaseMaquinaId);
    if (maq) {
      maq.status = 'produzindo';
      window.PlastMES_DB.save(db);
    }

    this.closeSetupModal();
    this.app.playPackSound();
    this.app.showToast(`Máquina ${this.currentSetupReleaseMaquinaId} liberada para PRODUÇÃO NORMAL com sucesso!`, 'success');
    this.render();
  },

  closeSetupModal() {
    const modal = document.getElementById('setupReleaseModal');
    if (modal) modal.style.display = 'none';
  },

  getSectorLabel(sector) {
    if (sector === 'extrusao') return 'Extrusão';
    if (sector === 'impressao') return 'Impressão & Rebobinadeira';
    return 'Corte e Solda';
  }
};

window.SupervisorModule = SupervisorModule;
