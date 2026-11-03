/**
 * OPS.JS - Módulo Administrativo de Ordens de Produção & Fichas Técnicas
 * Cadastro, visualização técnica detalhada e rastreabilidade de bobinas
 */

const OpsModule = {
  app: null,
  selectedOpId: 'OP-2885-04',

  init(appInstance) {
    this.app = appInstance;
    this.render();
  },

  render() {
    this.renderOpsList();
    this.renderOpDetail(this.selectedOpId);
    this.renderBobinasRastreabilidade();
  },

  renderOpsList() {
    const listEl = document.getElementById('opsListContainer');
    if (!listEl) return;

    const db = this.app.db;
    listEl.innerHTML = db.ordensProducao.map(op => {
      const isSelected = op.id === this.selectedOpId;
      const pct = Math.round((op.qtdProduzidaKg / op.qtdPlanejadaKg) * 100);

      return `
        <div class="kanban-op-card" style="border-left: 4px solid ${isSelected ? '#38bdf8' : 'var(--border-medium)'}; ${isSelected ? 'background: #1e293b;' : ''}" onclick="OpsModule.selectOp('${op.id}')">
          <div class="kanban-op-head">
            <span style="color: #38bdf8; font-weight: 800;">${op.numeroOP}</span>
            <span class="status-badge ${op.status === 'em_andamento' ? 'produzindo' : 'setup'}">${op.status.replace('_', ' ')}</span>
          </div>
          <div class="kanban-op-title" style="font-size: 0.95rem;">${op.clienteNome}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">${op.produto}</div>

          <div class="kanban-op-meta" style="margin-top: 0.4rem;">
            <span>${op.qtdProduzidaKg.toLocaleString('pt-BR')} / ${op.qtdPlanejadaKg.toLocaleString('pt-BR')} Kg</span>
            <span style="font-weight: 700; color: #4ade80;">${pct}%</span>
          </div>
          <div class="progress-bar-inline" style="width: 100%;">
            <div class="progress-fill" style="width: ${Math.min(100, pct)}%; background: #38bdf8;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  selectOp(opId) {
    this.selectedOpId = opId;
    this.renderOpsList();
    this.renderOpDetail(opId);
    this.app.playBeep(650, 0.05);
  },

  renderOpDetail(opId) {
    const container = document.getElementById('opDetailContainer');
    if (!container) return;

    const db = this.app.db;
    const op = db.ordensProducao.find(o => o.id === opId) || db.ordensProducao[0];
    const ft = op.fichaTecnica;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: #38bdf8; font-weight: 800; text-transform: uppercase;">Ficha Técnica de Engenharia</span>
          <h3 style="font-size: 1.4rem; font-weight: 800; color: white;">${op.numeroOP} - ${op.produto}</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem;">Cliente: <strong>${op.clienteNome}</strong> | Prazo de Entrega: <strong>${op.prazoEntrega}</strong></p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" style="display: inline-flex; align-items: center; gap: 0.4rem;" onclick="OpsModule.printFicha('${op.id}')">
            <span class="icon-svg">${window.Icons ? Icons.printer : ''}</span>
            <span>Imprimir Ficha</span>
          </button>
          <button class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.4rem;" onclick="OpsModule.openEditOpModal('${op.id}')">
            <span class="icon-svg">${window.Icons ? Icons.edit : ''}</span>
            <span>Editar Ficha</span>
          </button>
        </div>
      </div>

      <!-- Grid de Parâmetros Técnicos Industriais -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="coil-detail-item" style="border: 1px solid var(--border-subtle);">
          <label>Resina Base & Mistura</label>
          <strong style="color: white;">${ft.resinaPrincipal}</strong>
          <small style="color: var(--text-muted);">${ft.resinaSecundaria}</small>
        </div>

        <div class="coil-detail-item" style="border: 1px solid var(--border-subtle);">
          <label>Masterbatch / Pigmentação</label>
          <strong style="color: #38bdf8;">${ft.masterbatch}</strong>
          <small style="color: var(--text-muted);">Homogeneização prévia em misturador</small>
        </div>

        <div class="coil-detail-item" style="border: 1px solid var(--border-subtle);">
          <label>Dimensões Nominais (L x C x E)</label>
          <strong class="font-mono" style="color: #4ade80;">${ft.larguraNominalMm}mm (±${ft.toleranciaLarguraMm}) x ${ft.comprimentoMm}mm x ${ft.espessuraMicras}µm</strong>
          <small style="color: var(--text-muted);">Tolerância espessura: ±${ft.toleranciaEspessuraMicras}µm</small>
        </div>

        <div class="coil-detail-item" style="border: 1px solid var(--border-subtle);">
          <label>Tratamento Corona & Impressão</label>
          <strong style="color: #c084fc;">Mínimo ${ft.tratamentoCoronaMinDynas} dynas</strong>
          <small style="color: var(--text-muted);">${ft.coresPantone ? ft.coresPantone.join(', ') : 'Sem impressão'}</small>
        </div>
      </div>

      <!-- JSON Estruturado da Engenharia -->
      <div style="background: #020617; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
        <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
          <span>Estrutura Relacional JSON (Ficha_Tecnica_JSON)</span>
          <span style="color: #22c55e;">Sincronizado via Edge</span>
        </div>
        <pre class="font-mono" style="font-size: 0.78rem; color: #7dd3fc; overflow-x: auto; max-height: 160px; line-height: 1.4;">${JSON.stringify(ft, null, 2)}</pre>
      </div>
    `;
  },

  renderBobinasRastreabilidade() {
    const container = document.getElementById('bobinasRastreabilidadeTable');
    if (!container) return;

    const db = this.app.db;
    container.innerHTML = db.bobinas.map(b => {
      const op = db.ordensProducao.find(o => o.id === b.opId);

      return `
        <tr>
          <td><strong class="font-mono" style="color: #38bdf8;">${b.codigoQr}</strong></td>
          <td>${op ? op.numeroOP : b.opId}</td>
          <td><span class="font-mono">${b.maquinaOrigem}</span> (${b.setorOrigem})</td>
          <td class="font-mono"><strong>${b.pesoBrutoKg} Kg</strong> (Líq: ${b.pesoLiquidoKg} Kg)</td>
          <td class="font-mono">${b.larguraMm}mm x ${b.espessuraMedia}µm</td>
          <td>
            <span class="status-tag meta-ok">
              ${b.inspecionada ? `<span class="icon-svg" style="color: #4ade80; margin-right: 4px;">${window.Icons ? Icons.check : ''}</span> Inspecionada` : 'Pendente'}
            </span>
          </td>
          <td>
            <button class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="OpsModule.printQrLabel('${b.codigoQr}', ${b.pesoBrutoKg})">
              <span class="icon-svg">${window.Icons ? Icons.qrCode : ''}</span>
              <span>Imprimir QR</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  printFicha(opId) {
    this.app.showToast(`Enviando Ficha Técnica da ${opId} para a impressora de rede industrial...`, 'info');
    this.app.playBeep(800, 0.1);
  },

  openEditOpModal(opId) {
    this.app.showToast(`Modo de edição da OP ${opId} habilitado para o Gerente Administrativo.`, 'info');
  },

  printQrLabel(qr, peso) {
    this.app.showToast(`Etiqueta Zebra gerada: [QR: ${qr} | Peso: ${peso} Kg]`, 'success');
    this.app.playPackSound();
  }
};

window.OpsModule = OpsModule;
