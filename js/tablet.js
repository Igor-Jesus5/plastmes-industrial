/**
 * TABLET.JS - Módulo Kiosk 10" para Tablets de Máquina (Chão de Fábrica)
 * Ergonomia Industrial, Teclado Numérico Nativo, Pista Dupla/Simples,
 * Checklist Periódico 3x, Bobinas Independentes e Chamados Andon
 */

const TabletModule = {
  app: null,
  currentMachineId: 'CS-01',
  keypadTargetInputId: null,
  keypadBuffer: '',
  keypadTitle: 'Digitação Numérica',

  // Estado das bobinas na máquina atual (especialmente para Pista Dupla)
  coilState: {
    coil1: { id: 'BOB-20261103-01', qr: 'QR-EX01-2885-001', pesoKg: 284.5, consumidoKg: 120.0, inspecoesFeitas: ['inicio', 'meio'] },
    coil2: { id: 'BOB-20261103-02', qr: 'QR-EX01-2885-002', pesoKg: 290.0, consumidoKg: 95.0, inspecoesFeitas: ['inicio'] }
  },

  init(appInstance) {
    this.app = appInstance;
    this.bindEvents();
  },

  bindEvents() {
    const selector = document.getElementById('tabletMachineSelector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.selectMachine(e.target.value);
      });
    }
  },

  selectMachine(machineId) {
    this.currentMachineId = machineId;
    const selector = document.getElementById('tabletMachineSelector');
    if (selector) selector.value = machineId;
    this.render();
  },

  render() {
    const db = this.app.db;
    const machine = db.maquinas.find(m => m.id === this.currentMachineId) || db.maquinas[0];
    const op = db.ordensProducao.find(o => o.id === machine.opAtualId);
    const operador = db.operadores.find(o => o.id === machine.operadorId);

    // Atualiza cabeçalho do Kiosk
    const badgeEl = document.getElementById('kioskMachineId');
    const nameEl = document.getElementById('kioskMachineName');
    const statusPill = document.getElementById('kioskStatusPill');

    if (badgeEl) badgeEl.textContent = machine.id;
    if (nameEl) nameEl.textContent = machine.nome;
    if (statusPill) {
      statusPill.className = `kiosk-status-pill ${machine.status}`;
      statusPill.innerHTML = `<span class="dot"></span> ${machine.status.toUpperCase()}`;
    }

    // Atualiza Banner de OP
    const opCodeEl = document.getElementById('kioskOpCode');
    const opProdEl = document.getElementById('kioskOpProduct');
    const opClientEl = document.getElementById('kioskOpClient');

    if (op) {
      if (opCodeEl) opCodeEl.innerHTML = `<span class="icon-svg" style="margin-right:6px; color:#38bdf8;">${window.Icons ? Icons.fileText : ''}</span> <span>${op.numeroOP}</span> <span style="font-size: 0.75rem; background: rgba(56,189,248,0.2); padding: 0.1rem 0.5rem; border-radius: 4px;">PRIORIDADE: ${op.prioridade.toUpperCase()}</span>`;
      if (opProdEl) opProdEl.textContent = op.produto;
      if (opClientEl) opClientEl.textContent = `Cliente: ${op.clienteNome} | Meta: ${op.qtdPlanejadaUn.toLocaleString('pt-BR')} un (${op.qtdPlanejadaKg} Kg)`;
    } else {
      if (opCodeEl) opCodeEl.textContent = 'Sem OP Ativa';
      if (opProdEl) opProdEl.textContent = 'Aguardando atribuição de Ordem de Produção';
      if (opClientEl) opClientEl.textContent = '';
    }

    // Renderiza área específica do Setor
    const container = document.getElementById('kioskSectorContent');
    if (!container) return;

    if (machine.setor === 'corte_solda') {
      container.innerHTML = this.renderCorteSoldaInterface(machine, op, operador);
      this.attachCorteSoldaListeners(machine);
    } else if (machine.setor === 'extrusao') {
      container.innerHTML = this.renderExtrusaoInterface(machine, op, operador);
    } else if (machine.setor === 'impressao') {
      container.innerHTML = this.renderImpressaoInterface(machine, op, operador);
    }
  },

  // ==========================================================================
  // SETOR 3: CORTE E SOLDA (MÓDULO COMPLETO E DETALHADO)
  // ==========================================================================
  renderCorteSoldaInterface(machine, op, operador) {
    const isPistaDupla = machine.modoPista === 'dupla';
    const mult = isPistaDupla ? 2 : 1;
    const sacosPorPacote = (op && op.fichaTecnica) ? op.fichaTecnica.pacoteUnidades : 500;
    const pacotes = machine.pacotesTurno || 0;
    const totalSacos = pacotes * sacosPorPacote;

    return `
      <!-- Chave Seletora Pista Simples / Pista Dupla -->
      <div class="lane-toggle-card">
        <div class="lane-toggle-label">
          <span>Configuração de Pistas da Máquina</span>
          <small>Em Pista Dupla, cada golpe do barramento produz 2 unidades simultâneas.</small>
        </div>

        <div class="toggle-switch-pista">
          <button class="lane-btn-option ${!isPistaDupla ? 'active' : ''}" id="btnPistaSimples">
            1 Pista Simples (1x)
          </button>
          <button class="lane-btn-option ${isPistaDupla ? 'active' : ''}" id="btnPistaDupla">
            2 Pistas Duplas (2x)
          </button>
        </div>
      </div>

      <!-- Cards de Entrada de Bobina (1 ou 2 cards independentes) -->
      <div class="cut-lanes-container ${isPistaDupla ? 'pista-dupla' : ''}">
        <!-- CARD BOBINA 1 -->
        <div class="coil-input-card coil-active" id="cardBobina1">
          <div class="coil-card-header">
            <span class="coil-title-badge" style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="icon-svg">${window.Icons ? Icons.roll : ''}</span>
              <span>BOBINA 1 (Pista Esquerda / Principal)</span>
            </span>
            <span class="status-tag meta-ok">EM USO</span>
          </div>
          <div class="coil-details-grid">
            <div class="coil-detail-item">
              <label>Código QR / Lote</label>
              <strong class="font-mono">${this.coilState.coil1.qr}</strong>
            </div>
            <div class="coil-detail-item">
              <label>Peso Inicial</label>
              <strong class="font-mono">${this.coilState.coil1.pesoKg} Kg</strong>
            </div>
            <div class="coil-detail-item">
              <label>Consumo Estimado</label>
              <strong class="font-mono" style="color: #38bdf8;">${this.coilState.coil1.consumidoKg} Kg</strong>
            </div>
            <div class="coil-detail-item">
              <label>Inspeções (3x)</label>
              <strong style="color: #22c55e;">Início Conforme | Meio Conforme</strong>
            </div>
          </div>
          <button class="btn-coil-action" onclick="TabletModule.openCoilSwapModal('Bobina 1')">
            <span class="icon-svg">${window.Icons ? Icons.refresh : ''}</span>
            <span>Concluir / Trocar Bobina 1</span>
          </button>
        </div>

        <!-- CARD BOBINA 2 (Exibido apenas em Modo Pista Dupla) -->
        ${isPistaDupla ? `
        <div class="coil-input-card coil-active" id="cardBobina2">
          <div class="coil-card-header">
            <span class="coil-title-badge" style="color: #c084fc; display: flex; align-items: center; gap: 0.4rem;">
              <span class="icon-svg">${window.Icons ? Icons.roll : ''}</span>
              <span>BOBINA 2 (Pista Direita / Secundária)</span>
            </span>
            <span class="status-tag meta-ok">EM USO</span>
          </div>
          <div class="coil-details-grid">
            <div class="coil-detail-item">
              <label>Código QR / Lote</label>
              <strong class="font-mono">${this.coilState.coil2.qr}</strong>
            </div>
            <div class="coil-detail-item">
              <label>Peso Inicial</label>
              <strong class="font-mono">${this.coilState.coil2.pesoKg} Kg</strong>
            </div>
            <div class="coil-detail-item">
              <label>Consumo Estimado</label>
              <strong class="font-mono" style="color: #c084fc;">${this.coilState.coil2.consumidoKg} Kg</strong>
            </div>
            <div class="coil-detail-item">
              <label>Inspeções (3x)</label>
              <strong style="color: #eab308;">Início Conforme | Meio Pendente</strong>
            </div>
          </div>
          <button class="btn-coil-action" onclick="TabletModule.openCoilSwapModal('Bobina 2')">
            <span class="icon-svg">${window.Icons ? Icons.refresh : ''}</span>
            <span>Concluir / Trocar Bobina 2 (Independente)</span>
          </button>
        </div>
        ` : ''}
      </div>

      <!-- CONTADOR DE PRODUÇÃO E EMBALAMENTO -->
      <div class="counter-production-panel">
        <div class="counter-stats-bar">
          <div class="counter-stat-box">
            <label>Pacotes Concluídos</label>
            <div class="count-big font-mono" id="kioskPackCounter">${pacotes}</div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Fardos de ${sacosPorPacote} unidades</span>
          </div>

          <div class="counter-stat-box">
            <label>Total de Sacos Concluídos</label>
            <div class="count-big font-mono" id="kioskTotalUnits" style="color: #38bdf8;">${totalSacos.toLocaleString('pt-BR')}</div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${(totalSacos/1000).toFixed(1)} milheiros</span>
          </div>

          <div class="counter-stat-box">
            <label>Velocidade do Barramento</label>
            <div class="count-big font-mono" style="color: #facc15;">${machine.sacosMin}</div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Sacos/minuto (${isPistaDupla ? '2x por golpe' : '1x por golpe'})</span>
          </div>
        </div>

        <div class="counter-actions-row">
          <!-- BOTÃO GIGANTE EXTRA GRANDE (+1 PACOTE) -->
          <button class="btn-huge-pack" id="btnIncrementPack" onclick="TabletModule.addPack()">
            <span class="icon-svg" style="font-size: 2.2rem;">${window.Icons ? Icons.package : ''}</span>
            <span>+1 PACOTE (${sacosPorPacote} un)</span>
          </button>

          <!-- APONTAMENTO DE REFUGO -->
          <button class="btn-kiosk-scrap" onclick="TabletModule.openScrapModal()">
            <span class="icon-svg" style="font-size: 1.6rem;">${window.Icons ? Icons.trash : ''}</span>
            <span>Apontar Refugo (Kg)</span>
          </button>

          <!-- CHECKLIST DE QUALIDADE (3x POR BOBINA) -->
          <button class="btn-kiosk-quality" onclick="TabletModule.openQualityModal()">
            <span class="icon-svg" style="font-size: 1.6rem;">${window.Icons ? Icons.shieldCheck : ''}</span>
            <span>Inspeção Qualidade (3x)</span>
          </button>
        </div>
      </div>

      <!-- CENTRAL DE CHAMADOS RÁPIDA ANDON -->
      <div class="kiosk-andon-panel">
        <div class="andon-panel-title">
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg" style="color: #60a5fa;">${window.Icons ? Icons.shieldAlert : ''}</span>
            <span>Central de Chamados Rápida (Andon Digital)</span>
          </span>
          <span style="color: #60a5fa;">Notifica Supervisor Imediatamente</span>
        </div>
        <div class="andon-buttons-grid">
          <button class="btn-andon-call preparador" onclick="TabletModule.triggerAndon('Ajuste de Solda / Facas', 'preparador')">
            <span class="icon-svg">${window.Icons ? Icons.wrench : ''}</span>
            <span>Chamar Preparador</span>
          </button>
          <button class="btn-andon-call manutencao" onclick="TabletModule.triggerAndon('Falha Elétrica / Mecânica', 'manutencao')">
            <span class="icon-svg">${window.Icons ? Icons.zap : ''}</span>
            <span>Chamar Manutenção</span>
          </button>
          <button class="btn-andon-call qualidade" onclick="TabletModule.triggerAndon('Dúvida Dimensional / Solda', 'qualidade')">
            <span class="icon-svg">${window.Icons ? Icons.shieldCheck : ''}</span>
            <span>Chamar Qualidade</span>
          </button>
        </div>
      </div>
    `;
  },

  attachCorteSoldaListeners(machine) {
    const btnSimples = document.getElementById('btnPistaSimples');
    const btnDupla = document.getElementById('btnPistaDupla');

    if (btnSimples && btnDupla) {
      btnSimples.addEventListener('click', () => {
        machine.modoPista = 'simples';
        machine.multiplicador = 1;
        window.PlastMES_DB.save(this.app.db);
        this.app.playBeep(450, 0.08);
        this.render();
      });

      btnDupla.addEventListener('click', () => {
        machine.modoPista = 'dupla';
        machine.multiplicador = 2;
        window.PlastMES_DB.save(this.app.db);
        this.app.playBeep(900, 0.08);
        this.render();
      });
    }
  },

  // Adiciona +1 Pacote de Sacos
  addPack() {
    const db = this.app.db;
    const machine = db.maquinas.find(m => m.id === this.currentMachineId);
    if (!machine) return;

    machine.pacotesTurno = (machine.pacotesTurno || 0) + 1;

    // Atualiza apontamento de produção
    const op = db.ordensProducao.find(o => o.id === machine.opAtualId);
    const sacosPorPacote = (op && op.fichaTecnica) ? op.fichaTecnica.pacoteUnidades : 500;
    const kgEstimado = Number((sacosPorPacote * 0.038).toFixed(1));

    let apt = db.apontamentosProducao.find(a => a.maquinaId === machine.id && a.operadorId === machine.operadorId);
    if (!apt) {
      apt = {
        id: Date.now(),
        maquinaId: machine.id,
        operadorId: machine.operadorId,
        opId: machine.opAtualId,
        qtdPacotes: 0,
        qtdUnidades: 0,
        qtdKg: 0,
        modoPista: machine.modoPista || 'simples',
        dataHora: new Date().toISOString()
      };
      db.apontamentosProducao.push(apt);
    }

    apt.qtdPacotes += 1;
    apt.qtdUnidades += sacosPorPacote;
    apt.qtdKg = Number((apt.qtdKg + kgEstimado).toFixed(1));

    // Atualiza consumo de bobina
    this.coilState.coil1.consumidoKg = Number((this.coilState.coil1.consumidoKg + (kgEstimado / (machine.modoPista === 'dupla' ? 2 : 1))).toFixed(1));
    if (machine.modoPista === 'dupla') {
      this.coilState.coil2.consumidoKg = Number((this.coilState.coil2.consumidoKg + (kgEstimado / 2)).toFixed(1));
    }

    window.PlastMES_DB.save(db);
    window.PlastMES_DB.registerPacketSync(db);

    this.app.playPackSound();
    this.updateLiveDisplays();
    this.app.showToast(`+1 Pacote Registrado (${sacosPorPacote} unidades)`, 'success');
  },

  updateLiveDisplays() {
    const db = this.app.db;
    const machine = db.maquinas.find(m => m.id === this.currentMachineId);
    if (!machine) return;

    const op = db.ordensProducao.find(o => o.id === machine.opAtualId);
    const sacosPorPacote = (op && op.fichaTecnica) ? op.fichaTecnica.pacoteUnidades : 500;
    const pacotes = machine.pacotesTurno || 0;

    const packEl = document.getElementById('kioskPackCounter');
    const unitsEl = document.getElementById('kioskTotalUnits');

    if (packEl) packEl.textContent = pacotes;
    if (unitsEl) unitsEl.textContent = (pacotes * sacosPorPacote).toLocaleString('pt-BR');
  },

  // ==========================================================================
  // SETOR 1: EXTRUSÃO (FICHA TÉCNICA, ZONAS Z1-Z5 E CONCLUIR BOBINA MÃE)
  // ==========================================================================
  renderExtrusaoInterface(machine, op, operador) {
    const ficha = op ? op.fichaTecnica : {
      resinaPrincipal: 'PEBD Virgem Linear',
      resinaSecundaria: 'PEAD 20%',
      masterbatch: 'Branco 4%',
      zonasTemperaturaAlvo: [170, 172, 175, 178, 175]
    };

    return `
      <!-- Ficha Técnica Rápida da Extrusão -->
      <div class="coil-input-card">
        <div class="coil-card-header">
          <span class="coil-title-badge" style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg">${window.Icons ? Icons.layers : ''}</span>
            <span>Ficha Técnica & Formulação de Resinas</span>
          </span>
          <span class="status-tag meta-ok">TOLERÂNCIA ± 4µm</span>
        </div>
        <div class="coil-details-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="coil-detail-item">
            <label>Polímero Principal</label>
            <strong>${ficha.resinaPrincipal}</strong>
          </div>
          <div class="coil-detail-item">
            <label>Polímero Secundário</label>
            <strong>${ficha.resinaSecundaria}</strong>
          </div>
          <div class="coil-detail-item">
            <label>Aditivo / Pigmento</label>
            <strong style="color: #38bdf8;">${ficha.masterbatch}</strong>
          </div>
        </div>
      </div>

      <!-- Monitoramento Térmico das 5 Zonas do Canhão / Matriz -->
      <div class="coil-input-card">
        <div class="coil-card-header">
          <span class="coil-title-badge" style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg">${window.Icons ? Icons.thermometer : ''}</span>
            <span>Controle Térmico do Canhão / Matriz (Z1 a Z5)</span>
          </span>
          <span style="font-size: 0.78rem; color: #4ade80;">Oscilação Permitida: ± 3°C</span>
        </div>
        <div class="zones-temp-container">
          ${machine.tempZonas.map((t, idx) => `
            <div class="temp-zone-box zone-ok">
              <span class="temp-zone-name">ZONA ${idx + 1}</span>
              <span class="temp-zone-val font-mono">${t}°C</span>
              <span class="temp-zone-target">Alvo: ${ficha.zonasTemperaturaAlvo[idx]}°C</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Rastreabilidade e Botão Concluir Bobina Mãe -->
      <div class="counter-production-panel" style="background: #0f172a;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 1.1rem; color: white;">Apontamento de Bobina Mãe</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">Gera QR Code rastreável para uso na Impressão e Corte e Solda</p>
          </div>
          <button class="btn-huge-pack" style="min-height: 64px; font-size: 1.15rem; background: linear-gradient(135deg, #0284c7, #38bdf8); display: inline-flex; align-items: center; gap: 0.5rem;" onclick="TabletModule.openConcludeBobinaMaeModal()">
            <span class="icon-svg">${window.Icons ? Icons.qrCode : ''}</span>
            <span>Concluir Bobina Mãe (Kg + QR Code)</span>
          </button>
        </div>
      </div>

      <!-- Central Andon da Extrusão -->
      <div class="kiosk-andon-panel">
        <div class="andon-panel-title">
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg" style="color: #60a5fa;">${window.Icons ? Icons.shieldAlert : ''}</span>
            <span>Chamados Andon da Extrusão</span>
          </span>
        </div>
        <div class="andon-buttons-grid">
          <button class="btn-andon-call preparador" onclick="TabletModule.triggerAndon('Ajuste de Matriz / Espessura', 'preparador')">
            <span class="icon-svg">${window.Icons ? Icons.wrench : ''}</span>
            <span>Chamar Preparador</span>
          </button>
          <button class="btn-andon-call manutencao" onclick="TabletModule.triggerAndon('Aquecimento de Resistência Zonas', 'manutencao')">
            <span class="icon-svg">${window.Icons ? Icons.zap : ''}</span>
            <span>Chamar Manutenção</span>
          </button>
          <button class="btn-andon-call qualidade" onclick="TabletModule.triggerAndon('Aferição de Micrômetro', 'qualidade')">
            <span class="icon-svg">${window.Icons ? Icons.shieldCheck : ''}</span>
            <span>Chamar Qualidade</span>
          </button>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // SETOR 2: IMPRESSÃO E REBOBINADEIRA
  // ==========================================================================
  renderImpressaoInterface(machine, op, operador) {
    const ficha = op ? op.fichaTecnica : {
      coresPantone: ['Pantone 286 C', 'Pantone 485 C'],
      tratamentoCoronaMinDynas: 40
    };

    return `
      <!-- Identificação de Insumo e Parâmetros Técnicos -->
      <div class="coil-input-card">
        <div class="coil-card-header">
          <span class="coil-title-badge" style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg">${window.Icons ? Icons.palette : ''}</span>
            <span>Parâmetros de Impressão Flexográfica</span>
          </span>
          <span class="status-tag meta-ok">VELOCIDADE: ${machine.velMetrosMin} m/min</span>
        </div>
        <div class="coil-details-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="coil-detail-item">
            <label>Cores Pantone Aprovadas</label>
            <strong>${ficha.coresPantone ? ficha.coresPantone.join(' + ') : 'N/A'}</strong>
          </div>
          <div class="coil-detail-item">
            <label>Tratamento Corona Mínimo</label>
            <strong style="color: #38bdf8;">${machine.coronaDynas} dynas (Mín: ${ficha.tratamentoCoronaMinDynas})</strong>
          </div>
          <div class="coil-detail-item">
            <label>Teste de Ancoragem (Fita Crepe)</label>
            <strong style="color: #22c55e;">Aprovado (100% Ancorado)</strong>
          </div>
        </div>
      </div>

      <!-- Apontamento de Aparas / Refile de Borda da Rebobinadeira -->
      <div class="counter-production-panel">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 1.1rem; color: white;">Rebobinadeira & Refile de Borda</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">Apontamento de sucata de refile lateral gerado no acerto de bobina</p>
          </div>
          <button class="btn-kiosk-scrap" style="min-height: 64px; padding: 0 1.5rem; display: inline-flex; align-items: center; gap: 0.5rem;" onclick="TabletModule.openScrapModal()">
            <span class="icon-svg">${window.Icons ? Icons.trash : ''}</span>
            <span>Apontar Refile / Aparas (Kg)</span>
          </button>
        </div>
      </div>

      <!-- Chamados Andon da Impressão -->
      <div class="kiosk-andon-panel">
        <div class="andon-panel-title">
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="icon-svg" style="color: #60a5fa;">${window.Icons ? Icons.shieldAlert : ''}</span>
            <span>Chamados Andon da Impressão</span>
          </span>
        </div>
        <div class="andon-buttons-grid">
          <button class="btn-andon-call preparador" onclick="TabletModule.triggerAndon('Acerto de Tonalidade / Viscosidade Tinta', 'preparador')">
            <span class="icon-svg">${window.Icons ? Icons.palette : ''}</span>
            <span>Chamar Preparador de Tinta</span>
          </button>
          <button class="btn-andon-call manutencao" onclick="TabletModule.triggerAndon('Gerador Corona / Registro', 'manutencao')">
            <span class="icon-svg">${window.Icons ? Icons.zap : ''}</span>
            <span>Chamar Manutenção</span>
          </button>
          <button class="btn-andon-call qualidade" onclick="TabletModule.triggerAndon('Validação de Arte e Código de Barras', 'qualidade')">
            <span class="icon-svg">${window.Icons ? Icons.shieldCheck : ''}</span>
            <span>Chamar Qualidade</span>
          </button>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // DISPARO DE CHAMADOS ANDON PELO OPERADOR
  // ==========================================================================
  triggerAndon(tipoChamado, categoria) {
    const db = this.app.db;
    const machine = db.maquinas.find(m => m.id === this.currentMachineId);
    if (!machine) return;

    machine.status = 'chamado';

    const novoChamado = {
      id: Date.now(),
      maquinaId: machine.id,
      tipoChamado: tipoChamado,
      categoria: categoria,
      operadorId: machine.operadorId,
      dataHoraAbertura: new Date().toISOString(),
      dataHoraAtendimento: null,
      status: 'ativo',
      prioridade: 'alta',
      observacao: `Chamado acionado pelo operador no tablet da máquina ${machine.id}`
    };

    db.chamadosAndon.unshift(novoChamado);
    window.PlastMES_DB.save(db);
    window.PlastMES_DB.registerPacketSync(db);

    this.app.playWarningTone();
    this.app.showToast(`CHAMADO ANDON ACIONADO: ${tipoChamado}! Alerta enviado ao Supervisor.`, 'danger');
    this.render();
  },

  // ==========================================================================
  // CHECKLIST DE INSPEÇÃO PERIÓDICA DE QUALIDADE (3x POR BOBINA)
  // Início, Meio e Fim com aferição de Largura, Espessura e Tração de Solda
  // ==========================================================================
  openQualityModal() {
    const modal = document.getElementById('qualityInspectionModal');
    if (!modal) return;
    modal.style.display = 'flex';
  },

  saveQualityInspection() {
    const db = this.app.db;
    const machine = db.maquinas.find(m => m.id === this.currentMachineId);
    const op = db.ordensProducao.find(o => o.id === (machine ? machine.opAtualId : ''));

    const etapa = document.getElementById('inspEtapa').value;
    const largura = parseFloat(document.getElementById('inspLargura').value) || 240;
    const espessura = parseFloat(document.getElementById('inspEspessura').value) || 80;
    const soldaAprovada = document.getElementById('inspSolda').value === 'aprovado';
    const tracaoKg = parseFloat(document.getElementById('inspTracao').value) || 4.5;

    // Critérios de Validação (Largura nominal 240mm +/- 5mm)
    const nominal = op && op.fichaTecnica ? op.fichaTecnica.larguraNominalMm : 240;
    const tol = op && op.fichaTecnica ? op.fichaTecnica.toleranciaLarguraMm : 5;
    const larguraOk = (largura >= nominal - tol) && (largura <= nominal + tol);

    const aprovado = soldaAprovada && larguraOk;

    const registro = {
      id: Date.now(),
      bobinaId: this.coilState.coil1.id,
      maquinaId: this.currentMachineId,
      opId: machine ? machine.opAtualId : '',
      operadorId: machine ? machine.operadorId : 1,
      etapa: etapa,
      larguraMedidaMm: largura,
      toleranciaLarguraMm: tol,
      espessuraMedidaMicras: espessura,
      soldaAprovada: soldaAprovada,
      aberturaBocaOk: true,
      testeTracaoKg: tracaoKg,
      status: aprovado ? 'aprovado' : 'reprovado',
      dataHora: new Date().toISOString(),
      observacoes: aprovado ? "Conforme padrão de qualidade." : "DESVIO DETECTADO: Solda fraca ou largura fora da tolerância!"
    };

    db.inspecoesQualidade.unshift(registro);

    if (!aprovado) {
      // Dispara marcação visual de lote suspeito e alerta imediato no painel do Supervisor
      this.app.playWarningTone();
      this.app.showToast(`INSPEÇÃO REPROVADA! Lote marcado como suspeito e alerta enviado ao Supervisor!`, 'danger');
      if (machine) {
        machine.status = 'chamado';
        db.chamadosAndon.unshift({
          id: Date.now() + 1,
          maquinaId: machine.id,
          tipoChamado: 'ALERTA DE QUALIDADE: Teste de Solda Reprovado',
          categoria: 'qualidade',
          operadorId: machine.operadorId,
          dataHoraAbertura: new Date().toISOString(),
          dataHoraAtendimento: null,
          status: 'ativo',
          prioridade: 'critica',
          observacao: `Aferição: Largura ${largura}mm (Alvo ${nominal}±${tol}), Solda: ${soldaAprovada ? 'OK' : 'REPROVADA'}`
        });
      }
    } else {
      this.app.playPackSound();
      this.app.showToast(`Inspeção de Qualidade (${etapa.toUpperCase()}) APROVADA com sucesso!`, 'success');
    }

    window.PlastMES_DB.save(db);
    window.PlastMES_DB.registerPacketSync(db);
    this.closeQualityModal();
    this.render();
  },

  closeQualityModal() {
    const modal = document.getElementById('qualityInspectionModal');
    if (modal) modal.style.display = 'none';
  },

  // ==========================================================================
  // APONTAMENTO DE REFUGO / SUCATA (KG)
  // ==========================================================================
  openScrapModal() {
    const modal = document.getElementById('scrapModal');
    if (!modal) return;
    document.getElementById('scrapWeightInput').value = '';
    modal.style.display = 'flex';
  },

  saveScrap() {
    const db = this.app.db;
    const peso = parseFloat(document.getElementById('scrapWeightInput').value);
    const motivo = document.getElementById('scrapReasonSelect').value;

    if (!peso || peso <= 0) {
      this.app.showToast('Informe um peso válido de refugo em Kg!', 'warning');
      return;
    }

    const machine = db.maquinas.find(m => m.id === this.currentMachineId);
    const novoRefugo = {
      id: Date.now(),
      maquinaId: this.currentMachineId,
      operadorId: machine ? machine.operadorId : 1,
      opId: machine ? machine.opAtualId : '',
      pesoKg: peso,
      motivoDefeito: motivo,
      setorCulpado: machine ? machine.setor : 'corte_solda',
      dataHora: new Date().toISOString()
    };

    db.apontamentosRefugo.push(novoRefugo);
    window.PlastMES_DB.save(db);
    window.PlastMES_DB.registerPacketSync(db);

    this.closeScrapModal();
    this.app.playBeep(400, 0.15);
    this.app.showToast(`Apontamento de ${peso} Kg de sucata (${motivo}) registrado!`, 'warning');
    this.render();
  },

  closeScrapModal() {
    const modal = document.getElementById('scrapModal');
    if (modal) modal.style.display = 'none';
  },

  // ==========================================================================
  // CONCLUIR BOBINA MÃE (EXTRUSÃO)
  // ==========================================================================
  openConcludeBobinaMaeModal() {
    const modal = document.getElementById('concludeBobinaModal');
    if (!modal) return;
    const qrSugestao = `QR-${this.currentMachineId}-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('bobinaQrCodeInput').value = qrSugestao;
    document.getElementById('bobinaWeightInput').value = '285.0';
    modal.style.display = 'flex';
  },

  saveBobinaMae() {
    const db = this.app.db;
    const qr = document.getElementById('bobinaQrCodeInput').value;
    const peso = parseFloat(document.getElementById('bobinaWeightInput').value) || 280;

    const novaBobina = {
      id: `BOB-${Date.now()}`,
      codigoQr: qr,
      opId: 'OP-2885-04',
      maquinaOrigem: this.currentMachineId,
      setorOrigem: 'extrusao',
      operadorId: 1,
      pesoBrutoKg: peso,
      pesoLiquidoKg: Number((peso - 5.5).toFixed(1)),
      espessuraMedia: 80.0,
      larguraMm: 240,
      dataCriacao: new Date().toISOString(),
      status: 'estoque_pulmao',
      inspecionada: true
    };

    db.bobinas.push(novaBobina);
    window.PlastMES_DB.save(db);
    window.PlastMES_DB.registerPacketSync(db);

    const modal = document.getElementById('concludeBobinaModal');
    if (modal) modal.style.display = 'none';

    this.app.playPackSound();
    this.app.showToast(`Bobina Mãe ${qr} (${peso} Kg) concluída e etiqueta física gerada!`, 'success');
  },

  // ==========================================================================
  // TROCA / CONCLUSÃO DE BOBINA INDIVIDUAL (PISTA SIMPLES / DUPLA)
  // ==========================================================================
  openCoilSwapModal(bobinaNome) {
    this.app.showToast(`Bobina individual (${bobinaNome}) concluída com sucesso. Nova bobina carregada sem interromper o lote adjacente!`, 'info');
    this.app.playBeep(700, 0.1);
  },

  // ==========================================================================
  // TECLADO NUMÉRICO POP-UP NATIVO (SEM TECLADO DO OS)
  // Botões grandes >= 64px para dedos com luvas/óleo
  // ==========================================================================
  openNumericKeypad(targetInputId, title = 'Digite o Valor') {
    this.keypadTargetInputId = targetInputId;
    this.keypadTitle = title;
    this.keypadBuffer = '';

    const overlay = document.getElementById('numericKeypadOverlay');
    const titleEl = document.getElementById('keypadTitle');
    const displayEl = document.getElementById('keypadDisplay');

    if (titleEl) titleEl.textContent = title;
    if (displayEl) displayEl.textContent = '0';
    if (overlay) overlay.style.display = 'flex';
  },

  keypadPress(key) {
    if (key === 'clear') {
      this.keypadBuffer = '';
    } else if (key === 'backspace') {
      this.keypadBuffer = this.keypadBuffer.slice(0, -1);
    } else if (key === '.') {
      if (!this.keypadBuffer.includes('.')) {
        this.keypadBuffer += this.keypadBuffer === '' ? '0.' : '.';
      }
    } else {
      this.keypadBuffer += key;
    }

    const displayEl = document.getElementById('keypadDisplay');
    if (displayEl) {
      displayEl.textContent = this.keypadBuffer === '' ? '0' : this.keypadBuffer;
    }
    this.app.playBeep(900, 0.04);
  },

  keypadConfirm() {
    if (this.keypadTargetInputId) {
      const target = document.getElementById(this.keypadTargetInputId);
      if (target) {
        target.value = this.keypadBuffer === '' ? '0' : this.keypadBuffer;
      }
    }
    this.closeKeypad();
    this.app.playBeep(1200, 0.08);
  },

  closeKeypad() {
    const overlay = document.getElementById('numericKeypadOverlay');
    if (overlay) overlay.style.display = 'none';
  }
};

window.TabletModule = TabletModule;
