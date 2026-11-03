/**
 * DASHBOARD.JS - Módulo do Dashboard Executivo (Portal do Dono / Nuvem)
 * Fluxo Sequencial dos 3 Setores, Balanço de Massa e Produtividade
 */

const DashboardModule = {
  app: null,
  sectorFilter: 'todos',
  shiftFilter: 'todos',
  searchQuery: '',

  init(appInstance) {
    this.app = appInstance;
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const sectorEl = document.getElementById('dashFilterSector');
    const shiftEl = document.getElementById('dashFilterShift');
    const searchEl = document.getElementById('dashSearchOperator');

    if (sectorEl) {
      sectorEl.addEventListener('change', (e) => {
        this.sectorFilter = e.target.value;
        this.renderProductivityTable();
      });
    }

    if (shiftEl) {
      shiftEl.addEventListener('change', (e) => {
        this.shiftFilter = e.target.value;
        this.renderProductivityTable();
      });
    }

    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderProductivityTable();
      });
    }
  },

  render() {
    this.renderMassBalance();
    this.renderSequentialFlow();
    this.renderProductivityTable();
  },

  // Atualização rápida de métricas sem reconstruir todo o DOM
  updateMetricsOnly() {
    this.renderMassBalance();
    this.updateFlowMetricsOnly();
  },

  // 5.3 BALANÇO DE MASSA E KPIS GLOBAIS
  renderMassBalance() {
    const db = this.app.db;

    // 1. Quilos de Resina Entrados (Produzidos na Extrusão)
    const kgResinaEntrada = db.apontamentosProducao
      .filter(a => {
        const maq = db.maquinas.find(m => m.id === a.maquinaId);
        return maq && maq.setor === 'extrusao';
      })
      .reduce((acc, curr) => acc + (curr.qtdKg || 0), 0);

    // 2. Quilos de Produto Acabado Entregues (Corte e Solda)
    const kgProdutoAcabado = db.apontamentosProducao
      .filter(a => {
        const maq = db.maquinas.find(m => m.id === a.maquinaId);
        return maq && maq.setor === 'corte_solda';
      })
      .reduce((acc, curr) => acc + (curr.qtdKg || 0), 0);

    // Total de Sacos / Milheiros Acabados
    const totalSacos = db.apontamentosProducao
      .filter(a => a.qtdUnidades > 0)
      .reduce((acc, curr) => acc + curr.qtdUnidades, 0);

    // 3. Total de Refugo (Kg e %)
    const totalRefugoKg = db.apontamentosRefugo.reduce((acc, curr) => acc + (curr.pesoKg || 0), 0);
    const massaProcessada = kgProdutoAcabado + totalRefugoKg;
    const refugoPercentual = massaProcessada > 0 ? ((totalRefugoKg / massaProcessada) * 100).toFixed(2) : 0;

    // Rendimento da matéria-prima (Kg Acabado / (Kg Acabado + Kg Refugo))
    const rendimentoPct = massaProcessada > 0 ? ((kgProdutoAcabado / massaProcessada) * 100).toFixed(1) : 96.5;

    // Atualiza elementos de texto
    const elResina = document.getElementById('kpiResinaEntrada');
    const elAcabado = document.getElementById('kpiProdutoAcabado');
    const elSacos = document.getElementById('kpiTotalSacos');
    const elRefugo = document.getElementById('kpiTotalRefugo');
    const elRefugoPct = document.getElementById('kpiRefugoPct');
    const elRendimento = document.getElementById('kpiRendimento');

    if (elResina) elResina.textContent = `${kgResinaEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Kg`;
    if (elAcabado) elAcabado.textContent = `${kgProdutoAcabado.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Kg`;
    if (elSacos) elSacos.textContent = `${(totalSacos / 1000).toFixed(1)} milheiros (${totalSacos.toLocaleString('pt-BR')} un)`;
    if (elRefugo) elRefugo.textContent = `${totalRefugoKg.toFixed(1)} Kg`;
    if (elRefugoPct) elRefugoPct.textContent = `${refugoPercentual}% do volume processado`;
    if (elRendimento) elRendimento.textContent = `${rendimentoPct}%`;

    // Atualiza barra de fluxo
    const barGood = document.getElementById('flowBarGood');
    const barScrap = document.getElementById('flowBarScrap');
    if (barGood && barScrap) {
      barGood.style.width = `${rendimentoPct}%`;
      barScrap.style.width = `${(100 - rendimentoPct).toFixed(1)}%`;
    }
  },

  // 5.1 VISÃO GERAL DO GALPÃO - FLUXO SEQUENCIAL (3 BLOCOS)
  renderSequentialFlow() {
    this.renderStageExtrusao();
    this.renderStageImpressao();
    this.renderStageCorteSolda();
  },

  updateFlowMetricsOnly() {
    // Atualiza apenas os números de cards existentes
    const db = this.app.db;
    db.maquinas.forEach(m => {
      const card = document.getElementById(`flow-card-${m.id}`);
      if (!card) return;

      if (m.setor === 'extrusao') {
        const val = card.querySelector('.metric-kgh');
        if (val) val.textContent = `${m.kghAtual} Kg/h`;
      } else if (m.setor === 'corte_solda') {
        const valSacos = card.querySelector('.metric-sacos');
        const valPacotes = card.querySelector('.metric-pacotes');
        if (valSacos) valSacos.textContent = `${m.sacosMin} sc/min`;
        if (valPacotes) valPacotes.textContent = `${m.pacotesTurno} pacotes`;
      }
    });
  },

  renderStageExtrusao() {
    const container = document.getElementById('gridStageExtrusao');
    if (!container) return;

    const extrusoras = this.app.db.maquinas.filter(m => m.setor === 'extrusao');
    container.innerHTML = extrusoras.map(m => {
      const op = this.app.db.ordensProducao.find(o => o.id === m.opAtualId);
      const operador = this.app.db.operadores.find(op => op.id === m.operadorId);

      return `
        <div class="machine-overview-card" id="flow-card-${m.id}" onclick="App.switchTab('tablet'); TabletModule.selectMachine('${m.id}')">
          <div class="machine-card-head">
            <div>
              <div class="machine-id-box">${m.id}</div>
              <div class="machine-subname">${m.nome}</div>
            </div>
            <div class="status-badge ${m.status}">
              <span class="dot"></span>
              ${m.status.toUpperCase()}
            </div>
          </div>

          <div class="machine-op-badge">
            <span>OP: <strong>${op ? op.numeroOP : 'Sem OP'}</strong></span>
            <span>${operador ? operador.nome.split(' ')[0] : 'N/A'}</span>
          </div>

          <div class="machine-metrics-row">
            <div class="metric-cell">
              <span class="cell-label">Produtividade</span>
              <span class="cell-value font-mono metric-kgh">${m.kghAtual} Kg/h</span>
            </div>
            <div class="metric-cell">
              <span class="cell-label">Refugo Balão</span>
              <span class="cell-value font-mono" style="color: ${m.refugoPct > 2 ? '#f87171' : '#4ade80'};">${m.refugoPct}%</span>
            </div>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Matriz: Z5 a ${m.tempZonas[4]}°C</span>
            <span style="color: #38bdf8;">Abrir Tablet →</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderStageImpressao() {
    const container = document.getElementById('gridStageImpressao');
    if (!container) return;

    const impressoras = this.app.db.maquinas.filter(m => m.setor === 'impressao');
    container.innerHTML = impressoras.map(m => {
      const op = this.app.db.ordensProducao.find(o => o.id === m.opAtualId);
      const operador = this.app.db.operadores.find(op => op.id === m.operadorId);

      return `
        <div class="machine-overview-card" id="flow-card-${m.id}" onclick="App.switchTab('tablet'); TabletModule.selectMachine('${m.id}')">
          <div class="machine-card-head">
            <div>
              <div class="machine-id-box">${m.id}</div>
              <div class="machine-subname">${m.nome}</div>
            </div>
            <div class="status-badge ${m.status}">
              <span class="dot"></span>
              ${m.status.toUpperCase()}
            </div>
          </div>

          <div class="machine-op-badge">
            <span>OP: <strong>${op ? op.numeroOP : 'Sem OP'}</strong></span>
            <span>${operador ? operador.nome.split(' ')[0] : 'N/A'}</span>
          </div>

          <div class="machine-metrics-row">
            <div class="metric-cell">
              <span class="cell-label">Velocidade</span>
              <span class="cell-value font-mono">${m.velMetrosMin} m/min</span>
            </div>
            <div class="metric-cell">
              <span class="cell-label">Acerto Pantone</span>
              <span class="cell-value font-mono" style="color: ${m.acertoPantone >= 95 ? '#4ade80' : '#facc15'};">${m.acertoPantone}%</span>
            </div>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Trat. Corona: ${m.coronaDynas} dynas</span>
            <span style="color: #38bdf8;">Abrir Tablet →</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderStageCorteSolda() {
    const container = document.getElementById('gridStageCorteSolda');
    if (!container) return;

    const maquinasCS = this.app.db.maquinas.filter(m => m.setor === 'corte_solda');
    container.innerHTML = maquinasCS.map(m => {
      const op = this.app.db.ordensProducao.find(o => o.id === m.opAtualId);
      const operador = this.app.db.operadores.find(op => op.id === m.operadorId);

      return `
        <div class="machine-overview-card" id="flow-card-${m.id}" onclick="App.switchTab('tablet'); TabletModule.selectMachine('${m.id}')">
          <div class="machine-card-head">
            <div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="machine-id-box">${m.id}</span>
                <span class="lane-tag">${m.modoPista === 'dupla' ? '2 Pistas (x2)' : '1 Pista'}</span>
              </div>
              <div class="machine-subname">${m.nome}</div>
            </div>
            <div class="status-badge ${m.status}">
              <span class="dot"></span>
              ${m.status.toUpperCase()}
            </div>
          </div>

          <div class="machine-op-badge">
            <span>OP: <strong>${op ? op.numeroOP : 'Sem OP'}</strong></span>
            <span>${operador ? operador.nome.split(' ')[0] : 'N/A'}</span>
          </div>

          <div class="machine-metrics-row">
            <div class="metric-cell">
              <span class="cell-label">Ritmo Atual</span>
              <span class="cell-value font-mono metric-sacos">${m.sacosMin} sc/min</span>
            </div>
            <div class="metric-cell">
              <span class="cell-label">Pacotes (500un)</span>
              <span class="cell-value font-mono metric-pacotes" style="color: #4ade80;">${m.pacotesTurno} pac</span>
            </div>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Meta: ${m.metaSacosMin} sc/min</span>
            <span style="color: #38bdf8;">Terminal Operador →</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // 5.2 TABELA DE PRODUTIVIDADE DO TURNO
  renderProductivityTable() {
    const tbody = document.getElementById('productivityTableBody');
    if (!tbody) return;

    const db = this.app.db;

    // Compilar dados de produtividade por funcionário e máquina
    let rows = db.operadores.map(op => {
      const maquina = db.maquinas.find(m => m.operadorId === op.id);
      if (!maquina) return null;

      // Apontamentos deste operador
      const apontamentos = db.apontamentosProducao.filter(a => a.operadorId === op.id);
      const refugos = db.apontamentosRefugo.filter(r => r.operadorId === op.id);

      const totalKg = apontamentos.reduce((acc, curr) => acc + (curr.qtdKg || 0), 0);
      const totalSacos = apontamentos.reduce((acc, curr) => acc + (curr.qtdUnidades || 0), 0);
      const refugoKg = refugos.reduce((acc, curr) => acc + (curr.pesoKg || 0), 0);

      const refugoPct = totalKg > 0 ? ((refugoKg / totalKg) * 100).toFixed(1) : '0.0';

      // Meta fictícia baseada no setor
      let metaKg = 2500;
      if (maquina.setor === 'extrusao') metaKg = 1200;
      else if (maquina.setor === 'impressao') metaKg = 3000;

      const eficiencia = Math.min(130, Math.round((totalKg / metaKg) * 100));
      const metaAtingida = eficiencia >= 90;

      return {
        operador: op,
        maquina: maquina,
        turno: op.turno,
        setor: maquina.setor,
        modoPista: maquina.modoPista || maquina.modoPistaPadrao || 'simples',
        totalKg: totalKg,
        totalSacos: totalSacos,
        refugoKg: refugoKg,
        refugoPct: refugoPct,
        eficiencia: eficiencia,
        statusMeta: metaAtingida
      };
    }).filter(Boolean);

    // Aplicar Filtros
    if (this.sectorFilter !== 'todos') {
      rows = rows.filter(r => r.setor === this.sectorFilter);
    }
    if (this.shiftFilter !== 'todos') {
      rows = rows.filter(r => r.turno.includes(this.shiftFilter));
    }
    if (this.searchQuery) {
      rows = rows.filter(r => r.operador.nome.toLowerCase().includes(this.searchQuery));
    }

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum colaborador encontrado com os filtros aplicados.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const sacosTexto = r.totalSacos > 0 ? `${(r.totalSacos / 1000).toFixed(1)} milheiros (${r.totalSacos.toLocaleString('pt-BR')} un)` : `${r.totalKg.toFixed(1)} Kg (Filme)`;

      return `
        <tr>
          <td>
            <div class="operator-cell">
              ${window.getOperatorBadge ? getOperatorBadge(r.operador.nome, r.operador.cargo) : `<div class="operator-avatar">${r.operador.avatar}</div>`}
              <div>
                <div class="operator-info-name">${r.operador.nome}</div>
                <div class="operator-info-role">${r.operador.cargo}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="font-mono" style="font-weight: 700; color: #38bdf8;">${r.maquina.id}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize;">${r.setor.replace('_', ' e ')}</div>
          </td>
          <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${r.turno}</span></td>
          <td>
            <span class="lane-tag" style="${r.modoPista === 'dupla' ? 'background: rgba(168, 85, 247, 0.2); color: #d8b4fe;' : 'background: rgba(255,255,255,0.06); color: var(--text-secondary);'}">
              ${r.modoPista === 'dupla' ? 'Pista Dupla (2x)' : 'Pista Simples'}
            </span>
          </td>
          <td>
            <div class="font-mono" style="font-weight: 700; color: var(--text-primary);">${r.totalKg.toFixed(1)} Kg</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${sacosTexto}</div>
          </td>
          <td>
            <div class="font-mono" style="color: ${r.refugoPct > 2.5 ? '#f87171' : 'var(--text-secondary)'}; font-weight: 700;">
              ${r.refugoKg.toFixed(1)} Kg
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${r.refugoPct}% do lote</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 700;">
              <span>${r.eficiencia}%</span>
            </div>
            <div class="progress-bar-inline">
              <div class="progress-fill" style="width: ${Math.min(100, r.eficiencia)}%; background: ${r.statusMeta ? '#22c55e' : '#ef4444'};"></div>
            </div>
          </td>
          <td>
            <span class="status-tag ${r.statusMeta ? 'meta-ok' : 'meta-abaixo'}">
              <span class="dot-status-inline ${r.statusMeta ? '' : 'danger'}"></span>
              <span>${r.statusMeta ? 'Meta Conforme' : 'Abaixo da Meta'}</span>
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
};

window.DashboardModule = DashboardModule;
