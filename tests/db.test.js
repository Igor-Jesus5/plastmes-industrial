/**
 * TESTS/DB.TEST.JS - Testes Automatizados de Banco de Dados e Regras de Negócio MES
 * Executado via Node.js Native Test Runner (node:test)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// Mock localStorage para ambiente Node.js
const storageMock = (() => {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; }
  };
})();
global.localStorage = storageMock;
global.window = {
  dispatchEvent: () => {},
  SyncBus: {
    EVENTS: {
      STATE_SYNC_RESPONSE: 'STATE_SYNC_RESPONSE',
      PRODUCTION_RECORDED: 'PRODUCTION_RECORDED',
      SCRAP_RECORDED: 'SCRAP_RECORDED',
      ANDON_CALLED: 'ANDON_CALLED',
      ANDON_RESOLVED: 'ANDON_RESOLVED',
      SETUP_RELEASED: 'SETUP_RELEASED',
      QUALITY_INSPECTED: 'QUALITY_INSPECTED',
      OP_PRIORITY_CHANGED: 'OP_PRIORITY_CHANGED'
    },
    publish: () => {}
  }
};
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

// Carregar data.js
require('../js/data.js');
const DB = global.window.PlastMES_DB;

describe('PlastMES Industrial - Testes de Integridade do Banco de Dados & Regras MES', () => {

  beforeEach(() => {
    storageMock.clear();
    DB.reset();
  });

  it('deve carregar o estado inicial com todas as 12 máquinas distribuídas nos 3 setores industriais', () => {
    const data = DB.load();
    assert.strictEqual(data.maquinas.length, 12, 'Deve conter exatamente 12 máquinas no parque fabril');

    const extrusao = data.maquinas.filter(m => m.setor === 'extrusao');
    const impressao = data.maquinas.filter(m => m.setor === 'impressao');
    const corteSolda = data.maquinas.filter(m => m.setor === 'corte_solda');

    assert.strictEqual(extrusao.length, 4, 'Setor 1 (Extrusão) deve ter 4 máquinas (EX-01 a EX-04)');
    assert.strictEqual(impressao.length, 2, 'Setor 2 (Impressão) deve ter 2 máquinas (IM-01 e IM-02)');
    assert.strictEqual(corteSolda.length, 6, 'Setor 3 (Corte e Solda) deve ter 6 máquinas (CS-01 a CS-06)');
  });

  it('deve registrar apontamento de pacote (+1 Pacote) e atualizar contadores da máquina e da OP', () => {
    const machineId = 'CS-01';
    const opId = 'OP-2885-04';
    const dataAntes = DB.load();
    const maqAntes = dataAntes.maquinas.find(m => m.id === machineId);
    const pacotesAntes = maqAntes.pacotesTurno || 0;

    const result = DB.addProductionPack(machineId, opId, 7, 1, 500, 22.5, 'dupla');
    const dataDepois = DB.load();
    const maqDepois = dataDepois.maquinas.find(m => m.id === machineId);

    assert.strictEqual(maqDepois.pacotesTurno, pacotesAntes + 1, 'Pacotes da máquina devem ter incrementado em 1');
    assert.strictEqual(maqDepois.status, 'produzindo', 'Máquina deve estar no status produzindo');
    assert.strictEqual(result.novoApontamento.qtdUnidades, 500, 'Apontamento deve registrar 500 unidades');
  });

  it('deve registrar sucata/refugo com peso em Kg e motivo do descarte', () => {
    const machineId = 'CS-02';
    const pesoKg = 15.5;
    const motivo = 'Solda vazando ou queima de barramento';

    const result = DB.addScrapRecord(machineId, 'OP-2886-02', 8, pesoKg, motivo, 'corte_solda');
    const data = DB.load();
    const refugoSalvo = data.apontamentosRefugo.find(r => r.id === result.novoRefugo.id);

    assert.ok(refugoSalvo, 'Registro de refugo deve existir na tabela de apontamentosRefugo');
    assert.strictEqual(refugoSalvo.pesoKg, 15.5, 'Peso do refugo deve ser 15.5 Kg');
    assert.strictEqual(refugoSalvo.motivoDefeito, motivo, 'Motivo do refugo deve conferir');
  });

  it('deve abrir chamado Andon, alterar o status da máquina para chamado e permitir resolução pelo Supervisor', () => {
    const machineId = 'CS-04';
    
    // 1. Operador abre chamado
    const callResult = DB.openAndonCall(machineId, 'Chamar Manutenção (Aquecimento da Régua)', 'Operador CS-04');
    let data = DB.load();
    let maq = data.maquinas.find(m => m.id === machineId);
    
    assert.strictEqual(maq.status, 'chamado', 'Status da máquina deve mudar para chamado (Azul)');
    assert.strictEqual(callResult.novoChamado.status, 'ativo', 'Chamado deve estar ativo');

    // 2. Supervisor resolve chamado
    DB.resolveAndonCall(callResult.novoChamado.id, 'Supervisor Carlos Mendes');
    data = DB.load();
    maq = data.maquinas.find(m => m.id === machineId);
    const chamadoResolvido = data.chamadosAndon.find(c => c.id === callResult.novoChamado.id);

    assert.strictEqual(chamadoResolvido.status, 'atendido', 'Chamado deve estar com status atendido');
    assert.strictEqual(maq.status, 'produzindo', 'Máquina deve retornar ao status produzindo (Verde)');
  });

  it('deve liberar máquina em Setup para status Produzindo quando Preparador validar com PIN', () => {
    const machineId = 'CS-05';
    let data = DB.load();
    let maq = data.maquinas.find(m => m.id === machineId);
    assert.strictEqual(maq.status, 'setup', 'CS-05 deve iniciar em setup (Amarelo)');

    DB.releaseSetup(machineId, 'Valter Camargo (Preparador)', '1234');
    data = DB.load();
    maq = data.maquinas.find(m => m.id === machineId);

    assert.strictEqual(maq.status, 'produzindo', 'CS-05 deve passar para produzindo (Verde) após liberação com PIN');
    assert.strictEqual(data.setupsPendentes.some(s => s.maquinaId === machineId), false, 'Setup pendente da máquina deve ser removido');
  });

  it('deve registrar inspeção de qualidade periódica e disparar chamado Andon imediato se houver reprovação', () => {
    const machineId = 'CS-01';

    // Aferição com Solda REPROVADA
    const insp = DB.recordQualityInspection(machineId, 'BOB-20261103-01', 7, 'meio', 240, false, 80);
    const data = DB.load();
    const maq = data.maquinas.find(m => m.id === machineId);

    assert.strictEqual(insp.novaInspecao.status, 'reprovado', 'Inspeção com solda falsa deve ser reprovada');
    assert.strictEqual(maq.status, 'chamado', 'Reprovação de qualidade deve mudar status da máquina para chamado');
    assert.ok(data.chamadosAndon.some(c => c.maquinaId === machineId && c.tipoChamado.includes('Qualidade')), 'Deve criar chamado Andon de Qualidade automaticamente');
  });

  it('deve calcular o Balanço de Massa corretamente respeitando conservação de polímeros', () => {
    const data = DB.load();

    const kgResinaEntrada = data.apontamentosProducao
      .filter(a => data.maquinas.find(m => m.id === a.maquinaId && m.setor === 'extrusao'))
      .reduce((acc, curr) => acc + (curr.qtdKg || 0), 0);

    const kgProdutoAcabado = data.apontamentosProducao
      .filter(a => data.maquinas.find(m => m.id === a.maquinaId && m.setor === 'corte_solda'))
      .reduce((acc, curr) => acc + (curr.qtdKg || 0), 0);

    const kgRefugoTotal = data.apontamentosRefugo
      .reduce((acc, curr) => acc + (curr.pesoKg || 0), 0);

    assert.ok(kgResinaEntrada > 0, 'Kg de resina entrada deve ser maior que 0');
    assert.ok(kgProdutoAcabado > 0, 'Kg de produto acabado deve ser maior que 0');
    assert.ok(kgRefugoTotal > 0, 'Kg de refugo total deve ser maior que 0');

    // Rendimento deve estar em faixa aceitável industrial (entre 90% e 99%)
    const totalSaidas = kgProdutoAcabado + kgRefugoTotal;
    const rendimentoPct = (kgProdutoAcabado / totalSaidas) * 100;
    assert.ok(rendimentoPct > 90 && rendimentoPct < 100, `Rendimento industrial (${rendimentoPct.toFixed(1)}%) deve estar na faixa aceitável de 90-99%`);
  });

});
