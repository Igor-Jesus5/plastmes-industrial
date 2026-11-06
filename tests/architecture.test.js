/**
 * TESTS/ARCHITECTURE.TEST.JS - Testes Automatizados da Arquitetura Multi-Site
 * Verifica integridade dos 3 sites independentes e links de sincronização
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

describe('PlastMES Industrial - Validação da Arquitetura Multi-Site Desacoplada', () => {

  it('deve possuir os arquivos index.html dedicados para cada um dos 3 sites únicos', () => {
    const siteOperadorHtml = path.join(rootDir, 'site-operador', 'index.html');
    const siteSupervisorHtml = path.join(rootDir, 'site-supervisor', 'index.html');
    const siteExecutivoHtml = path.join(rootDir, 'site-executivo', 'index.html');

    assert.ok(fs.existsSync(siteOperadorHtml), 'Arquivo site-operador/index.html deve existir');
    assert.ok(fs.existsSync(siteSupervisorHtml), 'Arquivo site-supervisor/index.html deve existir');
    assert.ok(fs.existsSync(siteExecutivoHtml), 'Arquivo site-executivo/index.html deve existir');
  });

  it('deve possuir aliases raiz (operador.html, supervisor.html, executivo.html) para conveniência', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'operador.html')), 'operador.html deve existir');
    assert.ok(fs.existsSync(path.join(rootDir, 'supervisor.html')), 'supervisor.html deve existir');
    assert.ok(fs.existsSync(path.join(rootDir, 'executivo.html')), 'executivo.html deve existir');
  });

  it('todos os 3 sites devem incluir o barramento de sincronização em tempo real (sync-bus.js)', () => {
    const sites = [
      path.join(rootDir, 'site-operador', 'index.html'),
      path.join(rootDir, 'site-supervisor', 'index.html'),
      path.join(rootDir, 'site-executivo', 'index.html'),
      path.join(rootDir, 'index.html')
    ];

    sites.forEach(sitePath => {
      const content = fs.readFileSync(sitePath, 'utf-8');
      assert.ok(content.includes('sync-bus.js'), `${path.basename(path.dirname(sitePath))}/${path.basename(sitePath)} deve carregar sync-bus.js`);
      assert.ok(content.includes('peerSyncWidget'), `${path.basename(path.dirname(sitePath))}/${path.basename(sitePath)} deve conter o elemento peerSyncWidget para telemetria mesh`);
    });
  });

  it('o site do operador deve atender às diretrizes ergonômicas de chão de fábrica (Kiosk, Luvas, Teclado Numérico)', () => {
    const opContent = fs.readFileSync(path.join(rootDir, 'site-operador', 'index.html'), 'utf-8');
    assert.ok(opContent.includes('numericKeypadOverlay'), 'Site do Operador deve conter o Teclado Numérico Pop-up Nativo');
    assert.ok(opContent.includes('kiosk-mode'), 'Site do Operador deve conter classe kiosk-mode');
    assert.ok(opContent.includes('qualityInspectionModal'), 'Site do Operador deve conter o modal do checklist de qualidade 3x');
  });

  it('o site do supervisor deve atender à diretriz de isolamento rigoroso por setor', () => {
    const supContent = fs.readFileSync(path.join(rootDir, 'site-supervisor', 'index.html'), 'utf-8');
    assert.ok(supContent.includes('supervisor-sector-selector'), 'Site do Supervisor deve conter o seletor superior de setor');
    assert.ok(supContent.includes('setupReleaseModal'), 'Site do Supervisor deve conter o modal de liberação com PIN');
    assert.ok(supContent.includes('andon-panel'), 'Site do Supervisor deve conter o painel Andon central');
  });

  it('o site executivo deve conter balanço de massa, fluxo em 3 blocos e copiloto PlastIA', () => {
    const execContent = fs.readFileSync(path.join(rootDir, 'site-executivo', 'index.html'), 'utf-8');
    assert.ok(execContent.includes('mass-balance-container'), 'Site Executivo deve conter o balanço de massa');
    assert.ok(execContent.includes('flow-sector-block'), 'Site Executivo deve conter os 3 blocos sequenciais');
    assert.ok(execContent.includes('copilot-container'), 'Site Executivo deve conter o copiloto de IA PlastIA');
  });

  it('o Hub central (index.html) deve conter o demonstrador multi-telas ao vivo com os 3 iframes conectados', () => {
    const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    assert.ok(indexContent.includes('frameOperador'), 'Hub Central deve conter iframe para o site do operador');
    assert.ok(indexContent.includes('frameSupervisor'), 'Hub Central deve conter iframe para o site do supervisor');
    assert.ok(indexContent.includes('frameExecutivo'), 'Hub Central deve conter iframe para o site executivo');
    assert.ok(indexContent.includes('tickerLiveFeed'), 'Hub Central deve conter o feed do ticker de eventos em tempo real');
  });

});
