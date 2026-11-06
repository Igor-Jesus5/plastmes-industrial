/**
 * SYNC-BUS.JS - Barramento de Comunicação em Tempo Real Multi-Site
 * PlastMES Industrial - Arquitetura Local-First (Edge Computing)
 *
 * Utiliza a BroadcastChannel API nativa (com fallback para StorageEvent e CustomEvents)
 * para conectar instantaneamente os 3 sites desacoplados:
 *  1. Site do Operador (Tablet Kiosk 10" Chão de Fábrica)
 *  2. Site do Supervisor & Preparador (Painel de Linha e Andon)
 *  3. Site Executivo & Portal do Dono (Gestão e Inteligência Artificial)
 */

(function (window) {
  'use strict';

  const CHANNEL_NAME = 'plastmes_realtime_sync_bus_v1';
  const HEARTBEAT_INTERVAL_MS = 3000;
  const NODE_TIMEOUT_MS = 9000;

  // Gerar ID único para este nó/janela
  const NODE_ID = 'node_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

  // Registro de nós ativos conhecidos na rede
  const activeNodes = new Map();

  // Canal de difusão de mensagens entre janelas/abas
  let broadcastChannel = null;
  try {
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {
    console.warn('[SyncBus] BroadcastChannel não disponível, utilizando fallback via StorageEvent.', e);
  }

  // Identidade do nó atual
  let currentNodeInfo = {
    nodeId: NODE_ID,
    role: 'unknown', // 'operador' | 'supervisor' | 'executivo' | 'hub'
    title: document.title || 'PlastMES Node',
    machineId: null,
    connectedAt: new Date().toISOString(),
    lastSeen: Date.now()
  };

  // Áudio Sintetizado Industrial para Feedback Imediato
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'andon-alert') {
        // Alarme sonoro industrial Andon (duplo bipe de atenção)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'production-pack') {
        // Bipe curto de sucesso para apontamento de pacote (+1 Pacote)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'setup-released') {
        // Melodia ascendente suave para liberação de setup
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'quality-fail') {
        // Alerta de reprovação de qualidade
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // Ignora restrições de autoplay até interação do usuário
    }
  }

  // Constantes de Tipos de Eventos do Barramento
  const EVENTS = {
    HEARTBEAT: 'HEARTBEAT',
    NODE_ANNOUNCE: 'NODE_ANNOUNCE',
    NODE_BYE: 'NODE_BYE',
    ANDON_CALLED: 'ANDON_CALLED',
    ANDON_RESOLVED: 'ANDON_RESOLVED',
    SETUP_RELEASED: 'SETUP_RELEASED',
    PRODUCTION_RECORDED: 'PRODUCTION_RECORDED',
    SCRAP_RECORDED: 'SCRAP_RECORDED',
    QUALITY_INSPECTED: 'QUALITY_INSPECTED',
    OP_PRIORITY_CHANGED: 'OP_PRIORITY_CHANGED',
    MACHINE_STATUS_CHANGED: 'MACHINE_STATUS_CHANGED',
    STATE_SYNC_REQUEST: 'STATE_SYNC_REQUEST',
    STATE_SYNC_RESPONSE: 'STATE_SYNC_RESPONSE',
    GLOBAL_NOTIFICATION: 'GLOBAL_NOTIFICATION'
  };

  const subscribers = new Map();

  const SyncBus = {
    EVENTS,

    /**
     * Inicializa a participação do site no barramento de comunicação
     * @param {Object} options { role: 'operador'|'supervisor'|'executivo'|'hub', machineId?: string }
     */
    init(options = {}) {
      currentNodeInfo.role = options.role || 'unknown';
      currentNodeInfo.machineId = options.machineId || null;
      currentNodeInfo.title = options.title || document.title;

      this._setupReceivers();
      this._startHeartbeat();
      this._announcePresence();

      // Notificar saída ao descarregar a página
      window.addEventListener('beforeunload', () => {
        this.publish(EVENTS.NODE_BYE, { nodeId: NODE_ID });
      });

      console.log(`[SyncBus] Nó ${NODE_ID} registrado com função '${currentNodeInfo.role}'. Barramento ativo.`);
    },

    /**
     * Atualiza os metadados do nó atual (ex: operador trocou de máquina no tablet)
     */
    setMachineId(machineId) {
      currentNodeInfo.machineId = machineId;
      this._announcePresence();
    },

    /**
     * Publica uma mensagem no barramento de eventos para todos os sites conectados
     * @param {string} eventType 
     * @param {Object} payload 
     * @param {boolean} echoLocal Se true, dispara também para os ouvintes na mesma janela
     */
    publish(eventType, payload = {}, echoLocal = true) {
      const message = {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        type: eventType,
        sourceNodeId: NODE_ID,
        sourceRole: currentNodeInfo.role,
        sourceMachineId: currentNodeInfo.machineId,
        timestamp: new Date().toISOString(),
        payload: payload
      };

      // 1. Enviar via BroadcastChannel
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(message);
        } catch (e) {
          console.warn('[SyncBus] Falha ao enviar via BroadcastChannel:', e);
        }
      }

      // 2. Fallback via LocalStorage para navegadores ou abas restritas
      try {
        const storagePayload = JSON.stringify({
          msg: message,
          _rand: Math.random() // Força gatilho de mudança
        });
        localStorage.setItem('plastmes_sync_last_event', storagePayload);
      } catch (e) {
        // LocalStorage cheio ou desabilitado
      }

      // 3. Notificar localmente se solicitado
      if (echoLocal) {
        this._dispatchLocally(message);
      }

      // Registrar pacote no indicador de rede dual
      if (window.PlastMES_DB) {
        try {
          const db = window.PlastMES_DB.load();
          window.PlastMES_DB.registerPacketSync(db);
        } catch (e) {}
      }

      return message;
    },

    /**
     * Inscreve um callback para um tipo de evento
     * @param {string} eventType 
     * @param {Function} callback 
     */
    on(eventType, callback) {
      if (!subscribers.has(eventType)) {
        subscribers.set(eventType, new Set());
      }
      subscribers.get(eventType).add(callback);
      return () => subscribers.get(eventType).delete(callback);
    },

    /**
     * Inscreve um callback para qualquer evento do barramento
     */
    onAny(callback) {
      return this.on('*', callback);
    },

    /**
     * Retorna a lista de nós atualmente conectados e ativos
     */
    getActiveNodes() {
      const now = Date.now();
      const list = [];
      activeNodes.forEach((node, id) => {
        if (now - node.lastSeen <= NODE_TIMEOUT_MS) {
          list.push(node);
        } else {
          activeNodes.delete(id);
        }
      });
      return list;
    },

    /**
     * Retorna resumo de conexões { total, operador, supervisor, executivo, hub }
     */
    getNodeCounts() {
      const nodes = this.getActiveNodes();
      const counts = { total: nodes.length + 1, operador: 0, supervisor: 0, executivo: 0, hub: 0 };
      
      // Contar a si próprio
      if (counts[currentNodeInfo.role] !== undefined) {
        counts[currentNodeInfo.role]++;
      }

      nodes.forEach(n => {
        if (counts[n.role] !== undefined) {
          counts[n.role]++;
        }
      });
      return counts;
    },

    /**
     * Renderiza o Widget de Conexão com os outros sites
     * @param {HTMLElement|string} targetElement 
     */
    mountPeerWidget(targetElement) {
      const el = typeof targetElement === 'string' ? document.getElementById(targetElement) : targetElement;
      if (!el) return;

      const updateUI = () => {
        const counts = this.getNodeCounts();
        const activeList = this.getActiveNodes();

        let badgesHtml = `
          <div class="peer-sync-container" title="Rede Local-First em Tempo Real: ${counts.total} sites conectados">
            <div class="peer-sync-header">
              <span class="sync-dot pulse" style="background:#22c55e;"></span>
              <span class="peer-sync-title font-mono">REDE MESH INTER-SITES</span>
              <span class="badge-pwa-local" style="margin-left:auto; font-size: 0.65rem;">${counts.total} NÓS ATIVOS</span>
            </div>
            <div class="peer-chips-row">
              <span class="peer-chip ${counts.operador > 0 ? 'active' : ''}" title="Site Operador: ${counts.operador} conectado(s)">
                <span class="dot"></span> 📱 Operador ${counts.operador > 0 ? `(${counts.operador})` : 'offline'}
              </span>
              <span class="peer-chip ${counts.supervisor > 0 ? 'active' : ''}" title="Site Supervisor: ${counts.supervisor} conectado(s)">
                <span class="dot"></span> 👷 Supervisor ${counts.supervisor > 0 ? `(${counts.supervisor})` : 'offline'}
              </span>
              <span class="peer-chip ${counts.executivo > 0 ? 'active' : ''}" title="Site Executivo: ${counts.executivo} conectado(s)">
                <span class="dot"></span> 💼 Executivo ${counts.executivo > 0 ? `(${counts.executivo})` : 'offline'}
              </span>
            </div>
          </div>
        `;

        el.innerHTML = badgesHtml;
      };

      updateUI();
      // Atualizar a cada 3 segundos
      const timer = setInterval(updateUI, 2500);
      this.on(EVENTS.HEARTBEAT, updateUI);
      this.on(EVENTS.NODE_ANNOUNCE, updateUI);
      this.on(EVENTS.NODE_BYE, updateUI);

      return () => clearInterval(timer);
    },

    playIndustrialSound(type) {
      playTone(type);
    },

    // =========================================================================
    // MÉTODOS INTERNOS PRIVADOS
    // =========================================================================
    _setupReceivers() {
      // 1. Escutar BroadcastChannel
      if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.sourceNodeId !== NODE_ID) {
            this._handleIncomingMessage(event.data);
          }
        };
      }

      // 2. Escutar eventos no Storage (cross-tab fallback)
      window.addEventListener('storage', (e) => {
        if (e.key === 'plastmes_sync_last_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.msg && parsed.msg.sourceNodeId !== NODE_ID) {
              this._handleIncomingMessage(parsed.msg);
            }
          } catch (err) {}
        }
      });
    },

    _handleIncomingMessage(msg) {
      // Atualizar catálogo de nós
      if (msg.type === EVENTS.NODE_BYE) {
        activeNodes.delete(msg.payload.nodeId);
      } else {
        activeNodes.set(msg.sourceNodeId, {
          nodeId: msg.sourceNodeId,
          role: msg.sourceRole,
          machineId: msg.sourceMachineId,
          lastSeen: Date.now()
        });
      }

      // Efeitos de áudio automáticos baseados no evento recebido
      if (msg.type === EVENTS.ANDON_CALLED) {
        playTone('andon-alert');
      } else if (msg.type === EVENTS.PRODUCTION_RECORDED) {
        playTone('production-pack');
      } else if (msg.type === EVENTS.SETUP_RELEASED) {
        playTone('setup-released');
      } else if (msg.type === EVENTS.QUALITY_INSPECTED && msg.payload && msg.payload.aprovado === false) {
        playTone('quality-fail');
      }

      // Disparar para os inscritos da página
      this._dispatchLocally(msg);
    },

    _dispatchLocally(msg) {
      // 1. Ouvintes específicos pelo tipo
      const callbacks = subscribers.get(msg.type);
      if (callbacks) {
        callbacks.forEach(cb => {
          try { cb(msg); } catch (e) { console.error('[SyncBus] Erro em callback:', e); }
        });
      }

      // 2. Ouvintes universais '*'
      const wildcard = subscribers.get('*');
      if (wildcard) {
        wildcard.forEach(cb => {
          try { cb(msg); } catch (e) { console.error('[SyncBus] Erro em wildcard callback:', e); }
        });
      }

      // 3. Evento no DOM global
      try {
        window.dispatchEvent(new CustomEvent('plastmes:sync-event', { detail: msg }));
      } catch (e) {}
    },

    _startHeartbeat() {
      setInterval(() => {
        this.publish(EVENTS.HEARTBEAT, {
          role: currentNodeInfo.role,
          machineId: currentNodeInfo.machineId,
          title: currentNodeInfo.title
        }, false);
      }, HEARTBEAT_INTERVAL_MS);
    },

    _announcePresence() {
      this.publish(EVENTS.NODE_ANNOUNCE, {
        role: currentNodeInfo.role,
        machineId: currentNodeInfo.machineId,
        title: currentNodeInfo.title
      }, false);
    }
  };

  window.SyncBus = SyncBus;

})(window);
