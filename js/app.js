/**
 * APP.JS - Orquestrador Central da Aplicação MES
 * Gerenciamento de Estado, Sincronização Dual Edge/Cloud,
 * Áudio Industrial, e Simulação em Tempo Real
 */

const App = {
  db: null,
  activeTab: 'dashboard',
  simulationInterval: null,
  simulationRunning: true,
  audioEnabled: true,
  audioCtx: null,

  init() {
    this.db = window.PlastMES_DB.load();
    this.initNavigation();
    this.initClock();
    this.initSyncStatus();
    this.initAudio();
    this.startLiveSimulation();

    // Iniciar submódulos
    if (window.DashboardModule) window.DashboardModule.init(this);
    if (window.SupervisorModule) window.SupervisorModule.init(this);
    if (window.TabletModule) window.TabletModule.init(this);
    if (window.CopilotModule) window.CopilotModule.init(this);
    if (window.OpsModule) window.OpsModule.init(this);

    // Escutar eventos globais de atualização
    window.addEventListener('plastmes:data-changed', () => {
      this.refreshAll();
    });

    console.log("PlastMES Industrial carregado com sucesso. Arquitetura Edge Local-First pronta.");
  },

  // Navegação entre as abas principais
  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Botão de simulação no cabeçalho
    const simBtn = document.getElementById('btnToggleSim');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.simulationRunning = !this.simulationRunning;
        simBtn.classList.toggle('active', this.simulationRunning);
        simBtn.setAttribute('title', this.simulationRunning ? 'Simulação de Fábrica Ativa' : 'Simulação Pausada');
        this.showToast(
          this.simulationRunning ? 'Simulação do Chão de Fábrica ATIVA' : 'Simulação PAUSADA',
          this.simulationRunning ? 'success' : 'warning'
        );
      });
    }

    // Botão de Áudio
    const audioBtn = document.getElementById('btnToggleAudio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        audioBtn.classList.toggle('active', this.audioEnabled);
        const iconContainer = document.getElementById('audioIconContainer');
        if (iconContainer && window.Icons) {
          iconContainer.innerHTML = this.audioEnabled ? Icons.volume2 : Icons.volumeX;
        }
        this.showToast(
          this.audioEnabled ? 'Efeitos Sonoros Industriais ATIVADOS' : 'Sons Silenciados',
          'info'
        );
      });
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    // Atualiza botões
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Atualiza painéis
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabId}`);
    });

    // Se mudou para Tablet, inicializa ou redimensiona
    if (tabId === 'tablet' && window.TabletModule) {
      window.TabletModule.render();
    } else if (tabId === 'supervisor' && window.SupervisorModule) {
      window.SupervisorModule.render();
    } else if (tabId === 'dashboard' && window.DashboardModule) {
      window.DashboardModule.render();
    } else if (tabId === 'ops' && window.OpsModule) {
      window.OpsModule.render();
    }
  },

  // Relógio do Galpão e Identificação de Turno
  initClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const timeEl = document.getElementById('plantClockTime');
      const shiftEl = document.getElementById('plantClockShift');

      if (timeEl) timeEl.textContent = `${hours}:${minutes}:${seconds}`;

      // Determinar turno (Turno 1: 06h-14h | Turno 2: 14h-22h | Turno 3: 22h-06h)
      let currentShift = "Turno 1 (06h - 14h)";
      const h = now.getHours();
      if (h >= 14 && h < 22) currentShift = "Turno 2 (14h - 22h)";
      else if (h >= 22 || h < 6) currentShift = "Turno 3 (22h - 06h)";

      if (shiftEl) shiftEl.innerHTML = `<span class="dot-status-inline"></span> ${currentShift}`;
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  // Controle de Sincronização Dual (Edge Local + Cloud Sync)
  initSyncStatus() {
    const syncPill = document.getElementById('dualSyncPill');
    if (syncPill) {
      syncPill.addEventListener('click', () => {
        // Alternar estado de conectividade para testar a resiliência offline do PWA
        this.db.syncStatus.online = !this.db.syncStatus.online;
        window.PlastMES_DB.save(this.db);
        this.updateSyncUI();

        if (this.db.syncStatus.online) {
          this.playBeep(880, 0.1);
          this.showToast('Conexão Restabelecida: Sincronizando pacotes com a Nuvem (Supabase)...', 'success');
          // Descarregar buffer
          setTimeout(() => {
            this.db.syncStatus.pendingPackets = 0;
            this.db.syncStatus.lastSyncTimestamp = new Date().toISOString();
            window.PlastMES_DB.save(this.db);
            this.updateSyncUI();
          }, 1500);
        } else {
          this.playWarningTone();
          this.showToast('Modo Offline Ativado: O Chão de Fábrica opera 100% no Edge Server Local!', 'warning');
        }
      });
    }

    this.updateSyncUI();
  },

  updateSyncUI() {
    const dot = document.getElementById('cloudSyncDot');
    const label = document.getElementById('cloudSyncLabel');
    const badge = document.getElementById('syncPendingBadge');
    const iconContainer = document.getElementById('cloudSyncIcon');

    if (this.db.syncStatus.online) {
      if (dot) {
        dot.className = 'sync-dot pulse';
      }
      if (iconContainer && window.Icons) iconContainer.innerHTML = Icons.cloud;
      if (label) label.textContent = 'Nuvem Espelhada';
      if (badge) {
        badge.textContent = `${this.db.syncStatus.pendingPackets} pacotes`;
        badge.style.display = this.db.syncStatus.pendingPackets > 0 ? 'inline-block' : 'none';
      }
    } else {
      if (dot) {
        dot.className = 'sync-dot offline';
      }
      if (iconContainer && window.Icons) iconContainer.innerHTML = Icons.cloudOff;
      if (label) label.textContent = 'Edge Local Apenas (Offline)';
      if (badge) {
        badge.textContent = `${this.db.syncStatus.pendingPackets} retidos`;
        badge.style.display = 'inline-block';
      }
    }
  },

  // Efeitos de Áudio Industrial sintetizados via Web Audio API
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API não suportada neste navegador.");
    }
  },

  playBeep(freq = 600, duration = 0.08) {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  },

  playPackSound() {
    // Tom de conclusão de pacote (+1 Pacote 500 un)
    if (!this.audioEnabled || !this.audioCtx) return;
    this.playBeep(784, 0.07);
    setTimeout(() => this.playBeep(1046, 0.12), 80);
  },

  playWarningTone() {
    // Alerta Andon ou Reprovação de Solda
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {}
  },

  // Simulação viva em tempo real do Chão de Fábrica
  startLiveSimulation() {
    this.simulationInterval = setInterval(() => {
      if (!this.simulationRunning) return;

      let changed = false;

      // 1. Corte e Solda: Máquinas CS em produção geram golpes
      this.db.maquinas.forEach(m => {
        if (m.setor === 'corte_solda' && m.status === 'produzindo') {
          // Incrementa golpes e contadores ligeiramente a cada ciclo
          const chancePack = Math.random();
          if (chancePack > 0.65) {
            m.pacotesTurno = (m.pacotesTurno || 0) + 1;
            // Multiplicador da pista
            const mult = m.modoPista === 'dupla' ? 2 : 1;
            const incSacos = 500;
            const incKg = Number(((incSacos * 0.038)).toFixed(1));

            // Atualiza apontamento de produção
            let apt = this.db.apontamentosProducao.find(a => a.maquinaId === m.id);
            if (apt) {
              apt.qtdPacotes += 1;
              apt.qtdUnidades += incSacos;
              apt.qtdKg = Number((apt.qtdKg + incKg).toFixed(1));
            }
            changed = true;
          }
        } else if (m.setor === 'extrusao' && m.status === 'produzindo') {
          // Pequena oscilação térmica real das 5 zonas (168°C - 180°C)
          m.tempZonas = m.tempZonas.map(t => {
            const delta = (Math.random() - 0.5) * 0.6;
            return Number(Math.max(167, Math.min(181, t + delta)).toFixed(1));
          });
          // Produção contínua em Kg
          let apt = this.db.apontamentosProducao.find(a => a.maquinaId === m.id);
          if (apt && Math.random() > 0.7) {
            apt.qtdKg = Number((apt.qtdKg + 1.2).toFixed(1));
          }
          changed = true;
        }
      });

      if (changed) {
        window.PlastMES_DB.save(this.db);
        if (!this.db.syncStatus.online) {
          this.db.syncStatus.pendingPackets++;
          this.updateSyncUI();
        }
        this.refreshActiveViews();
      }
    }, 3000);
  },

  refreshActiveViews() {
    if (this.activeTab === 'dashboard' && window.DashboardModule) {
      window.DashboardModule.updateMetricsOnly();
    } else if (this.activeTab === 'tablet' && window.TabletModule) {
      window.TabletModule.updateLiveDisplays();
    }
  },

  refreshAll() {
    this.db = window.PlastMES_DB.load();
    if (window.DashboardModule) window.DashboardModule.render();
    if (window.SupervisorModule) window.SupervisorModule.render();
    if (window.TabletModule) window.TabletModule.render();
    if (window.OpsModule) window.OpsModule.render();
    this.updateSyncUI();
  },

  // Sistema de Notificações Toast Industriais
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    let iconSvg = window.Icons ? Icons.info : '';
    if (type === 'success') iconSvg = window.Icons ? Icons.check : '';
    if (type === 'warning') iconSvg = window.Icons ? Icons.alertTriangle : '';
    if (type === 'danger') iconSvg = window.Icons ? Icons.shieldAlert : '';

    toast.innerHTML = `
      <span class="icon-svg" style="font-size: 1.25rem;">${iconSvg}</span>
      <div style="font-size: 0.85rem; font-weight: 600; color: #f8fafc;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.App = App;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
