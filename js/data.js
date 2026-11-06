/**
 * DATA.JS - Banco de Dados Local-First (Chão de Fábrica & Gestão)
 * Simula as entidades relacionais do PostgreSQL e Edge Server Local
 */

const STORAGE_KEY = 'PLASTMES_DB_STATE_V1';

const INITIAL_DATA = {
  syncStatus: {
    online: true,
    localServerIp: "192.168.1.100 (Edge Mini-PC)",
    cloudMirrorUrl: "https://db.cloud-sync.mesplastic.io",
    pendingPackets: 0,
    lastSyncTimestamp: new Date().toISOString()
  },
  
  empresas: [
    { id: 1, nome: "Sacaria Soares Ltda", cnpj: "14.285.991/0001-44", segmento: "Grãos e Ração" },
    { id: 2, nome: "AgroPack Fertilizantes", cnpj: "28.192.443/0001-12", segmento: "Química e Agro" },
    { id: 3, nome: "Frigorífico Estrela do Sul", cnpj: "05.441.782/0001-90", segmento: "Alimentos Congelados" },
    { id: 4, nome: "Bela Vista Alimentos", cnpj: "19.882.115/0001-67", segmento: "Farináceos" },
    { id: 5, nome: "EcoPlast Distribuidora", cnpj: "33.771.209/0001-05", segmento: "Comércio Geral" }
  ],

  maquinas: [
    // SETOR 1: EXTRUSÃO
    { id: "EX-01", nome: "Extrusora 01 - Carnevalli 75mm", setor: "extrusao", status: "produzindo", opAtualId: "OP-2885-04", operadorId: 1, ipTablet: "192.168.1.101", kghAtual: 142, kghMeta: 150, refugoPct: 1.8, tempZonas: [170, 172, 175, 178, 175], modoPistaPadrao: "simples" },
    { id: "EX-02", nome: "Extrusora 02 - Coex 3 Camadas Rulli", setor: "extrusao", status: "produzindo", opAtualId: "OP-2886-02", operadorId: 2, ipTablet: "192.168.1.102", kghAtual: 195, kghMeta: 200, refugoPct: 1.4, tempZonas: [168, 170, 174, 180, 178], modoPistaPadrao: "simples" },
    { id: "EX-03", nome: "Extrusora 03 - Monocamada 60mm", setor: "extrusao", status: "setup", opAtualId: "OP-2887-10", operadorId: 3, ipTablet: "192.168.1.103", kghAtual: 0, kghMeta: 120, refugoPct: 3.2, tempZonas: [165, 168, 170, 172, 170], modoPistaPadrao: "simples" },
    { id: "EX-04", nome: "Extrusora 04 - Balão Tubular 90mm", setor: "extrusao", status: "produzindo", opAtualId: "OP-2888-01", operadorId: 4, ipTablet: "192.168.1.104", kghAtual: 178, kghMeta: 180, refugoPct: 2.1, tempZonas: [172, 175, 176, 179, 176], modoPistaPadrao: "simples" },

    // SETOR 2: IMPRESSÃO & REBOBINADEIRA
    { id: "IM-01", nome: "Flexográfica 01 - 6 Cores Feva", setor: "impressao", status: "produzindo", opAtualId: "OP-2885-04", operadorId: 5, ipTablet: "192.168.1.105", velMetrosMin: 180, velMeta: 200, acertoPantone: 98.5, coronaDynas: 40, modoPistaPadrao: "simples" },
    { id: "IM-02", nome: "Flexo Gearless 02 - 8 Cores Comexi", setor: "impressao", status: "parada", opAtualId: "OP-2889-05", operadorId: 6, ipTablet: "192.168.1.106", velMetrosMin: 0, velMeta: 250, acertoPantone: 92.0, coronaDynas: 36, modoPistaPadrao: "simples" },

    // SETOR 3: CORTE E SOLDA
    { id: "CS-01", nome: "Corte e Solda 01 - Fundo Gunter", setor: "corte_solda", status: "produzindo", opAtualId: "OP-2885-04", operadorId: 7, ipTablet: "192.168.1.107", sacosMin: 95, metaSacosMin: 100, pacotesTurno: 78, modoPista: "dupla", multiplicador: 2 },
    { id: "CS-02", nome: "Corte e Solda 02 - Lateral c/ Pista Dupla", setor: "corte_solda", status: "produzindo", opAtualId: "OP-2886-02", operadorId: 8, ipTablet: "192.168.1.108", sacosMin: 110, metaSacosMin: 120, pacotesTurno: 92, modoPista: "dupla", multiplicador: 2 },
    { id: "CS-03", nome: "Corte e Solda 03 - Pouch 3 Soldas", setor: "corte_solda", status: "chamado", opAtualId: "OP-2887-10", operadorId: 9, ipTablet: "192.168.1.109", sacosMin: 0, metaSacosMin: 80, pacotesTurno: 34, modoPista: "simples", multiplicador: 1 },
    { id: "CS-04", nome: "Corte e Solda 04 - Sacaria Pesada", setor: "corte_solda", status: "produzindo", opAtualId: "OP-2885-04", operadorId: 10, ipTablet: "192.168.1.110", sacosMin: 88, metaSacosMin: 90, pacotesTurno: 65, modoPista: "simples", multiplicador: 1 },
    { id: "CS-05", nome: "Corte e Solda 05 - Alça Fita Hece", setor: "corte_solda", status: "setup", opAtualId: "OP-2890-03", operadorId: 11, ipTablet: "192.168.1.111", sacosMin: 0, metaSacosMin: 85, pacotesTurno: 12, modoPista: "simples", multiplicador: 1 },
    { id: "CS-06", nome: "Corte e Solda 06 - Bloquetadeira Automática", setor: "corte_solda", status: "produzindo", opAtualId: "OP-2891-01", operadorId: 12, ipTablet: "192.168.1.112", sacosMin: 140, metaSacosMin: 140, pacotesTurno: 115, modoPista: "dupla", multiplicador: 2 }
  ],

  operadores: [
    { id: 1, nome: "Carlos Eduardo Silva", cargo: "Operador Extrusão Pleno", setor: "extrusao", turno: "Turno 1 (06h - 14h)", pin: "1234", avatar: "CS" },
    { id: 2, nome: "Marcos Vinicius Lima", cargo: "Operador Extrusão Sênior", setor: "extrusao", turno: "Turno 1 (06h - 14h)", pin: "2233", avatar: "ML" },
    { id: 3, nome: "Lucas Fontes Santos", cargo: "Operador Extrusão Jr", setor: "extrusao", turno: "Turno 1 (06h - 14h)", pin: "4455", avatar: "LS" },
    { id: 4, nome: "Rodrigo Alcantara", cargo: "Operador Extrusão Pleno", setor: "extrusao", turno: "Turno 2 (14h - 22h)", pin: "7788", avatar: "RA" },
    { id: 5, nome: "Roberto Mendes", cargo: "Impressor Flexográfico", setor: "impressao", turno: "Turno 1 (06h - 14h)", pin: "5566", avatar: "RM" },
    { id: 6, nome: "Danilo Ferraz", cargo: "Impressor Flexo II", setor: "impressao", turno: "Turno 2 (14h - 22h)", pin: "9900", avatar: "DF" },
    { id: 7, nome: "Ana Paula Souza", cargo: "Operadora Corte e Solda", setor: "corte_solda", turno: "Turno 1 (06h - 14h)", pin: "1122", avatar: "AS" },
    { id: 8, nome: "Juliana Prado Castro", cargo: "Operadora Corte e Solda Sênior", setor: "corte_solda", turno: "Turno 1 (06h - 14h)", pin: "3344", avatar: "JP" },
    { id: 9, nome: "Tiago Ramos Oliveira", cargo: "Operador Corte e Solda", setor: "corte_solda", turno: "Turno 1 (06h - 14h)", pin: "6677", avatar: "TR" },
    { id: 10, nome: "Fabio Henrique Diniz", cargo: "Operador Corte e Solda", setor: "corte_solda", turno: "Turno 2 (14h - 22h)", pin: "8899", avatar: "FD" },
    { id: 11, nome: "Valter Camargo", cargo: "Preparador de Máquinas", setor: "corte_solda", turno: "Turno Geral", pin: "0000", avatar: "VC" },
    { id: 12, nome: "Beatriz Nogueira", cargo: "Operadora Bloquetadeira", setor: "corte_solda", turno: "Turno 1 (06h - 14h)", pin: "1357", avatar: "BN" }
  ],

  ordensProducao: [
    {
      id: "OP-2885-04",
      numeroOP: "OP 2885-0004",
      clienteId: 1,
      clienteNome: "Sacaria Soares Ltda",
      produto: "Saco Valvulado PEBD 240x350x0.08mm Pigmentado Branco",
      qtdPlanejadaKg: 4500,
      qtdProduzidaKg: 3820,
      qtdPlanejadaUn: 120000,
      qtdProduzidaUn: 102500,
      status: "em_andamento",
      prioridade: "alta",
      prazoEntrega: "2026-11-06",
      fichaTecnica: {
        resinaPrincipal: "PEBD Linear Virgem Braskem LL118",
        resinaSecundaria: "PEAD HD7000 (20%)",
        masterbatch: "Branco Titânio 4% + Deslizante 1.5%",
        larguraNominalMm: 240,
        toleranciaLarguraMm: 5,
        espessuraMicras: 80,
        toleranciaEspessuraMicras: 4,
        comprimentoMm: 350,
        zonasTemperaturaAlvo: [170, 172, 175, 178, 175],
        coresPantone: ["Pantone 286 C (Azul)", "Pantone 485 C (Vermelho)"],
        tratamentoCoronaMinDynas: 40,
        pacoteUnidades: 500
      }
    },
    {
      id: "OP-2886-02",
      numeroOP: "OP 2886-0002",
      clienteId: 2,
      clienteNome: "AgroPack Fertilizantes",
      produto: "Saco Tubo Solda Fundo 500x800x0.15mm PEAD Cristal",
      qtdPlanejadaKg: 8000,
      qtdProduzidaKg: 6400,
      qtdPlanejadaUn: 60000,
      qtdProduzidaUn: 48000,
      status: "em_andamento",
      prioridade: "urgente",
      prazoEntrega: "2026-11-05",
      fichaTecnica: {
        resinaPrincipal: "PEAD Alto Peso Molecular GM9450F",
        resinaSecundaria: "PEBD Reciclado Canela Grau A (15%)",
        masterbatch: "Anti-UV 2% + Antioxidante 1%",
        larguraNominalMm: 500,
        toleranciaLarguraMm: 8,
        espessuraMicras: 150,
        toleranciaEspessuraMicras: 8,
        comprimentoMm: 800,
        zonasTemperaturaAlvo: [168, 170, 174, 180, 178],
        coresPantone: ["Pantone Black 6 C", "Pantone 368 C (Verde)"],
        tratamentoCoronaMinDynas: 38,
        pacoteUnidades: 250
      }
    },
    {
      id: "OP-2887-10",
      numeroOP: "OP 2887-0010",
      clienteId: 3,
      clienteNome: "Frigorífico Estrela do Sul",
      produto: "Bobina Encolhível Barreira 350x0.06mm Impressa",
      qtdPlanejadaKg: 3200,
      qtdProduzidaKg: 850,
      qtdPlanejadaUn: 50000,
      qtdProduzidaUn: 13000,
      status: "em_andamento",
      prioridade: "media",
      prazoEntrega: "2026-11-08",
      fichaTecnica: {
        resinaPrincipal: "Coex 3 Camadas PEBD/EVA/Metalloceno",
        resinaSecundaria: "Polímero de Barreira EVOH",
        masterbatch: "Transparente Cristal c/ Antiestático 1%",
        larguraNominalMm: 350,
        toleranciaLarguraMm: 4,
        espessuraMicras: 60,
        toleranciaEspessuraMicras: 3,
        comprimentoMm: 600,
        zonasTemperaturaAlvo: [165, 168, 170, 172, 170],
        coresPantone: ["Pantone 186 C", "Pantone 123 C", "Pantone White"],
        tratamentoCoronaMinDynas: 42,
        pacoteUnidades: 500
      }
    },
    {
      id: "OP-2888-01",
      numeroOP: "OP 2888-0001",
      clienteId: 4,
      clienteNome: "Bela Vista Alimentos",
      produto: "Saco Almofada Farinha 1Kg 180x280x0.07mm",
      qtdPlanejadaKg: 2800,
      qtdProduzidaKg: 2500,
      qtdPlanejadaUn: 90000,
      qtdProduzidaUn: 81000,
      status: "em_andamento",
      prioridade: "normal",
      prazoEntrega: "2026-11-10",
      fichaTecnica: {
        resinaPrincipal: "PEBDL Virgem C4",
        resinaSecundaria: "PEBD Convencional BC818",
        masterbatch: "Branco Opaco 5%",
        larguraNominalMm: 180,
        toleranciaLarguraMm: 3,
        espessuraMicras: 70,
        toleranciaEspessuraMicras: 3,
        comprimentoMm: 280,
        zonasTemperaturaAlvo: [172, 175, 176, 179, 176],
        coresPantone: ["Pantone 151 C (Laranja)", "Pantone 293 C (Azul)"],
        tratamentoCoronaMinDynas: 40,
        pacoteUnidades: 1000
      }
    },
    {
      id: "OP-2889-05",
      numeroOP: "OP 2889-0005",
      clienteId: 5,
      clienteNome: "EcoPlast Distribuidora",
      produto: "Sacola Camiseta Biodegradável 38x48cm Verde",
      qtdPlanejadaKg: 5000,
      qtdProduzidaKg: 1200,
      qtdPlanejadaUn: 150000,
      qtdProduzidaUn: 36000,
      status: "pausada",
      prioridade: "baixa",
      prazoEntrega: "2026-11-12",
      fichaTecnica: {
        resinaPrincipal: "Resina Compostável d2w + PEBDL",
        resinaSecundaria: "Carga Mineral Carbonato de Cálcio 15%",
        masterbatch: "Verde Folha 2.5%",
        larguraNominalMm: 380,
        toleranciaLarguraMm: 6,
        espessuraMicras: 28,
        toleranciaEspessuraMicras: 2,
        comprimentoMm: 480,
        zonasTemperaturaAlvo: [155, 158, 160, 165, 162],
        coresPantone: ["Pantone 347 C"],
        tratamentoCoronaMinDynas: 38,
        pacoteUnidades: 1000
      }
    }
  ],

  // Rastreabilidade de Bobinas
  bobinas: [
    {
      id: "BOB-20261103-01",
      codigoQr: "QR-EX01-2885-001",
      opId: "OP-2885-04",
      maquinaOrigem: "EX-01",
      setorOrigem: "extrusao",
      operadorId: 1,
      pesoBrutoKg: 284.5,
      pesoLiquidoKg: 279.0,
      espessuraMedia: 81.2,
      larguraMm: 242,
      dataCriacao: "2026-11-03T07:15:00",
      status: "em_corte_solda",
      inspecionada: true
    },
    {
      id: "BOB-20261103-02",
      codigoQr: "QR-EX01-2885-002",
      opId: "OP-2885-04",
      maquinaOrigem: "EX-01",
      setorOrigem: "extrusao",
      operadorId: 1,
      pesoBrutoKg: 290.0,
      pesoLiquidoKg: 284.8,
      espessuraMedia: 79.8,
      larguraMm: 240,
      dataCriacao: "2026-11-03T09:20:00",
      status: "em_corte_solda",
      inspecionada: true
    },
    {
      id: "BOB-20261103-03",
      codigoQr: "QR-EX02-2886-001",
      opId: "OP-2886-02",
      maquinaOrigem: "EX-02",
      setorOrigem: "extrusao",
      operadorId: 2,
      pesoBrutoKg: 412.0,
      pesoLiquidoKg: 406.5,
      espessuraMedia: 149.5,
      larguraMm: 502,
      dataCriacao: "2026-11-03T08:00:00",
      status: "pronta_impressao",
      inspecionada: true
    },
    {
      id: "BOB-20261103-04",
      codigoQr: "QR-EX04-2888-001",
      opId: "OP-2888-01",
      maquinaOrigem: "EX-04",
      setorOrigem: "extrusao",
      operadorId: 4,
      pesoBrutoKg: 315.0,
      pesoLiquidoKg: 310.2,
      espessuraMedia: 70.4,
      larguraMm: 181,
      dataCriacao: "2026-11-03T10:45:00",
      status: "estoque_pulmao",
      inspecionada: true
    }
  ],

  // Apontamentos do Turno Atual
  apontamentosProducao: [
    { id: 101, maquinaId: "CS-01", operadorId: 7, opId: "OP-2885-04", qtdPacotes: 78, qtdUnidades: 39000, qtdKg: 1450.8, modoPista: "dupla", dataHora: "2026-11-03T12:30:00" },
    { id: 102, maquinaId: "CS-02", operadorId: 8, opId: "OP-2886-02", qtdPacotes: 92, qtdUnidades: 23000, qtdKg: 2880.0, modoPista: "dupla", dataHora: "2026-11-03T12:45:00" },
    { id: 103, maquinaId: "CS-04", operadorId: 10, opId: "OP-2885-04", qtdPacotes: 65, qtdUnidades: 32500, qtdKg: 1210.5, modoPista: "simples", dataHora: "2026-11-03T12:15:00" },
    { id: 104, maquinaId: "CS-06", operadorId: 12, opId: "OP-2891-01", qtdPacotes: 115, qtdUnidades: 57500, qtdKg: 1610.0, modoPista: "dupla", dataHora: "2026-11-03T12:50:00" },
    { id: 105, maquinaId: "EX-01", operadorId: 1, opId: "OP-2885-04", qtdPacotes: 0, qtdUnidades: 0, qtdKg: 994.0, modoPista: "simples", dataHora: "2026-11-03T12:00:00" },
    { id: 106, maquinaId: "EX-02", operadorId: 2, opId: "OP-2886-02", qtdPacotes: 0, qtdUnidades: 0, qtdKg: 1365.0, modoPista: "simples", dataHora: "2026-11-03T12:00:00" },
    { id: 107, maquinaId: "EX-04", operadorId: 4, opId: "OP-2888-01", qtdPacotes: 0, qtdUnidades: 0, qtdKg: 1246.0, modoPista: "simples", dataHora: "2026-11-03T12:00:00" }
  ],

  // Apontamentos de Refugo / Sucata
  apontamentosRefugo: [
    { id: 201, maquinaId: "EX-01", operadorId: 1, opId: "OP-2885-04", pesoKg: 18.2, motivoDefeito: "Oscilação de balão / bolha", setorCulpado: "extrusao", dataHora: "2026-11-03T08:10:00" },
    { id: 202, maquinaId: "EX-03", operadorId: 3, opId: "OP-2887-10", pesoKg: 35.0, motivoDefeito: "Purga de troca de cor / pigmento", setorCulpado: "extrusao", dataHora: "2026-11-03T09:40:00" },
    { id: 203, maquinaId: "IM-01", operadorId: 5, opId: "OP-2885-04", pesoKg: 14.5, motivoDefeito: "Aparas de refile de borda rebobinadeira", setorCulpado: "impressao", dataHora: "2026-11-03T10:15:00" },
    { id: 204, maquinaId: "IM-02", operadorId: 6, opId: "OP-2889-05", pesoKg: 42.0, motivoDefeito: "Falha de corona / decalque de tinta", setorCulpado: "impressao", dataHora: "2026-11-03T11:00:00" },
    { id: 205, maquinaId: "CS-01", operadorId: 7, opId: "OP-2885-04", pesoKg: 12.3, motivoDefeito: "Queima de solda lateral no acerto de pista", setorCulpado: "corte_solda", dataHora: "2026-11-03T10:30:00" },
    { id: 206, maquinaId: "CS-03", operadorId: 9, opId: "OP-2887-10", pesoKg: 28.6, motivoDefeito: "Desalinhamento de fotocélula", setorCulpado: "corte_solda", dataHora: "2026-11-03T11:45:00" }
  ],

  // Chamados Andon em Tempo Real
  chamadosAndon: [
    {
      id: 301,
      maquinaId: "CS-03",
      tipoChamado: "Ajuste de Solda Lateral / Faca",
      categoria: "preparador", // preparador | manutencao | qualidade
      operadorId: 9,
      dataHoraAbertura: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // há 4 min
      dataHoraAtendimento: null,
      status: "ativo",
      prioridade: "alta",
      observacao: "Barramento mordendo filme no corte pouch"
    },
    {
      id: 302,
      maquinaId: "IM-02",
      tipoChamado: "Manutenção Elétrica / Sensor Corona",
      categoria: "manutencao",
      operadorId: 6,
      dataHoraAbertura: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      dataHoraAtendimento: null,
      status: "ativo",
      prioridade: "critica",
      observacao: "Oscilação na descarga do gerador corona"
    }
  ],

  // Inspeções Periódicas de Qualidade (Início, Meio, Fim)
  inspecoesQualidade: [
    {
      id: 401,
      bobinaId: "BOB-20261103-01",
      maquinaId: "CS-01",
      opId: "OP-2885-04",
      operadorId: 7,
      etapa: "inicio", // inicio | meio | fim
      larguraMedidaMm: 241,
      toleranciaLarguraMm: 5,
      espessuraMedidaMicras: 80.5,
      soldaAprovada: true,
      aberturaBocaOk: true,
      testeTracaoKg: 4.8, // tração mínima 3.5kg
      status: "aprovado",
      dataHora: "2026-11-03T07:45:00",
      observacoes: "Solda contínua e sem repuxo."
    },
    {
      id: 402,
      bobinaId: "BOB-20261103-01",
      maquinaId: "CS-01",
      opId: "OP-2885-04",
      operadorId: 7,
      etapa: "meio",
      larguraMedidaMm: 240,
      toleranciaLarguraMm: 5,
      espessuraMedidaMicras: 79.8,
      soldaAprovada: true,
      aberturaBocaOk: true,
      testeTracaoKg: 4.6,
      status: "aprovado",
      dataHora: "2026-11-03T10:15:00",
      observacoes: "Conforme padrão de qualidade."
    }
  ],

  // Histórico de setups para liberação com PIN
  setupsPendentes: [
    {
      maquinaId: "EX-03",
      opId: "OP-2887-10",
      motivo: "Troca de matriz e cor (Monocamada para filme barreira)",
      iniciadoEm: "2026-11-03T11:10:00",
      checklist: [
        { item: "Limpeza de canhão e troca de tela de filtro", ok: true },
        { item: "Estabilização de temperatura nas 5 zonas (165-172°C)", ok: true },
        { item: "Aferição de espessura de balão com micrômetro", ok: false },
        { item: "Leitura de código de lote da resina virgem", ok: true }
      ]
    },
    {
      maquinaId: "CS-05",
      opId: "OP-2890-03",
      motivo: "Ajuste de faca de alça fita e régua de solda",
      iniciadoEm: "2026-11-03T12:00:00",
      checklist: [
        { item: "Alinhamento da bobina na desbobinadeira dupla", ok: true },
        { item: "Ajuste de pressão pneumática do barramento (4.5 bar)", ok: true },
        { item: "Teste destrutivo de tração nos 10 primeiros sacos", ok: false }
      ]
    }
  ]
};

// Gerenciador do Banco de Dados Local-First Reativo
const DB = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Falha ao ler localStorage, utilizando dados iniciais padrão.", e);
    }
    this.save(INITIAL_DATA, false);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  },

  save(data, broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (broadcast && window.SyncBus) {
        window.SyncBus.publish(window.SyncBus.EVENTS.STATE_SYNC_RESPONSE, { db: data }, false);
      }
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('plastmes:data-changed', { detail: data }));
      }
    } catch (e) {
      console.error("Erro ao salvar no storage local", e);
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = this.load();
    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.STATE_SYNC_RESPONSE, { db: fresh });
    }
    return fresh;
  },

  // Simulação de fila de pacotes sincronizados com a Nuvem
  registerPacketSync(dbInstance) {
    if (!dbInstance || !dbInstance.syncStatus) return;
    dbInstance.syncStatus.pendingPackets = (dbInstance.syncStatus.pendingPackets || 0) + 1;
    // Simula envio em lote para nuvem
    setTimeout(() => {
      if (dbInstance.syncStatus && dbInstance.syncStatus.online) {
        dbInstance.syncStatus.pendingPackets = Math.max(0, dbInstance.syncStatus.pendingPackets - 1);
        dbInstance.syncStatus.lastSyncTimestamp = new Date().toISOString();
        DB.save(dbInstance, false);
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('syncStatusUpdated', { detail: dbInstance.syncStatus }));
        }
      }
    }, 1200);
  },

  // =========================================================================
  // MÉTODOS ATÔMICOS DE NEGÓCIO COM SINCRONIZAÇÃO EM TEMPO REAL
  // =========================================================================

  /**
   * Registra apontamento de pacote (+1 Pacote)
   */
  addProductionPack(machineId, opId, operatorId, qtdPacotes = 1, qtdUnidades = 500, qtdKg = 22.5, modoPista = 'dupla') {
    const data = this.load();
    const machine = data.maquinas.find(m => m.id === machineId);
    const op = data.ordensProducao.find(o => o.id === (opId || (machine && machine.opAtualId)));
    const operador = data.operadores.find(o => o.id === (operatorId || (machine && machine.operadorId)));

    // Incrementa contagem da máquina
    if (machine) {
      machine.pacotesTurno = (machine.pacotesTurno || 0) + qtdPacotes;
      if (machine.status !== 'produzindo') {
        machine.status = 'produzindo';
      }
    }

    // Incrementa progresso da OP
    if (op) {
      op.qtdProduzidaUn = (op.qtdProduzidaUn || 0) + qtdUnidades;
      op.qtdProduzidaKg = (op.qtdProduzidaKg || 0) + Math.round(qtdKg);
    }

    // Adiciona registro na tabela de apontamentos
    const novoApontamento = {
      id: "APT-" + Date.now().toString().slice(-6),
      maquinaId: machineId,
      operadorId: operador ? operador.id : 1,
      opId: op ? op.id : "OP-2885-04",
      dataHora: new Date().toISOString().replace('T', ' ').slice(0, 19),
      qtdPacotes: qtdPacotes,
      qtdUnidades: qtdUnidades,
      qtdKg: qtdKg,
      modoPista: modoPista || (machine ? machine.modoPista : 'simples')
    };

    data.apontamentosProducao.unshift(novoApontamento);
    this.save(data);

    // Publica no barramento em tempo real
    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.PRODUCTION_RECORDED, {
        machineId,
        opId: novoApontamento.opId,
        operatorName: operador ? operador.nome : 'Operador',
        qtdPacotes,
        qtdUnidades,
        qtdKg,
        totalPacotesMaquina: machine ? machine.pacotesTurno : 0,
        novoApontamento
      });
    }

    return { data, novoApontamento };
  },

  /**
   * Registra refugo/sucata (Kg)
   */
  addScrapRecord(machineId, opId, operatorId, pesoKg, motivo, setorCulpado) {
    const data = this.load();
    const machine = data.maquinas.find(m => m.id === machineId);
    const op = data.ordensProducao.find(o => o.id === (opId || (machine && machine.opAtualId)));
    const operador = data.operadores.find(o => o.id === (operatorId || (machine && machine.operadorId)));

    const novoRefugo = {
      id: "REF-" + Date.now().toString().slice(-6),
      maquinaId: machineId,
      operadorId: operador ? operador.id : 1,
      opId: op ? op.id : "OP-2885-04",
      dataHora: new Date().toISOString().replace('T', ' ').slice(0, 19),
      pesoKg: parseFloat(pesoKg) || 0,
      motivoDefeito: motivo || "Aparas e refile",
      setorCulpado: setorCulpado || (machine ? machine.setor : "corte_solda")
    };

    data.apontamentosRefugo.unshift(novoRefugo);
    this.save(data);

    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.SCRAP_RECORDED, {
        machineId,
        opId: novoRefugo.opId,
        operatorName: operador ? operador.nome : 'Operador',
        pesoKg: novoRefugo.pesoKg,
        motivo: novoRefugo.motivoDefeito,
        setorCulpado: novoRefugo.setorCulpado,
        novoRefugo
      });
    }

    return { data, novoRefugo };
  },

  /**
   * Abre chamado Andon
   */
  openAndonCall(machineId, tipoChamado, solicitanteNome) {
    const data = this.load();
    const machine = data.maquinas.find(m => m.id === machineId);

    if (machine) {
      machine.status = 'chamado';
    }

    const novoChamado = {
      id: "ANDON-" + Date.now().toString().slice(-6),
      maquinaId: machineId,
      tipoChamado: tipoChamado || "Suporte de Linha",
      dataHoraAbertura: new Date().toISOString(),
      dataHoraAtendimento: null,
      status: "ativo",
      solicitante: solicitanteNome || "Operador"
    };

    data.chamadosAndon.unshift(novoChamado);
    this.save(data);

    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.ANDON_CALLED, {
        chamadoId: novoChamado.id,
        machineId,
        tipoChamado: novoChamado.tipoChamado,
        solicitante: novoChamado.solicitante,
        dataHoraAbertura: novoChamado.dataHoraAbertura,
        machineName: machine ? machine.nome : machineId,
        setor: machine ? machine.setor : 'corte_solda'
      });
    }

    return { data, novoChamado };
  },

  /**
   * Supervisor/Preparador atende e resolve chamado Andon
   */
  resolveAndonCall(chamadoId, supervisorNome = "Supervisor de Turno") {
    const data = this.load();
    const chamado = data.chamadosAndon.find(c => c.id === chamadoId);

    if (chamado) {
      chamado.status = 'atendido';
      chamado.dataHoraAtendimento = new Date().toISOString();
      chamado.atendidoPor = supervisorNome;

      // Se não houver outros chamados ativos na máquina, volta para produzindo
      const outrosAtivos = data.chamadosAndon.some(c => c.maquinaId === chamado.maquinaId && c.status === 'ativo' && c.id !== chamadoId);
      if (!outrosAtivos) {
        const machine = data.maquinas.find(m => m.id === chamado.maquinaId);
        if (machine && machine.status === 'chamado') {
          machine.status = 'produzindo';
        }
      }
    }

    this.save(data);

    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.ANDON_RESOLVED, {
        chamadoId,
        machineId: chamado ? chamado.maquinaId : null,
        atendidoPor: supervisorNome,
        timestamp: new Date().toISOString()
      });
    }

    return { data, chamado };
  },

  /**
   * Liberação de Setup com PIN do Preparador
   */
  releaseSetup(machineId, preparadorNome = "Valter Camargo (Preparador)", pin = "1234") {
    const data = this.load();
    const machine = data.maquinas.find(m => m.id === machineId);

    if (machine) {
      machine.status = 'produzindo';
    }

    // Remove do array de setups pendentes
    data.setupsPendentes = data.setupsPendentes.filter(s => s.maquinaId !== machineId);

    this.save(data);

    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.SETUP_RELEASED, {
        machineId,
        preparadorNome,
        pin,
        timestamp: new Date().toISOString(),
        machineName: machine ? machine.nome : machineId
      });
    }

    return { data, machine };
  },

  /**
   * Inspeção de Qualidade (Início, Meio ou Fim)
   */
  recordQualityInspection(machineId, bobinaId, operadorId, etapa, larguraMedida, soldaAprovada, espessuraMicras) {
    const data = this.load();
    const machine = data.maquinas.find(m => m.id === machineId);
    const operador = data.operadores.find(o => o.id === (operadorId || (machine && machine.operadorId)));

    const statusFinal = soldaAprovada ? 'aprovado' : 'reprovado';

    const novaInspecao = {
      id: "INSP-" + Date.now().toString().slice(-6),
      bobinaId: bobinaId || "BOB-20261103-01",
      maquinaId: machineId,
      operadorId: operador ? operador.id : 1,
      etapa: etapa || "meio",
      dataHora: new Date().toISOString().replace('T', ' ').slice(0, 19),
      larguraMedidaMm: parseFloat(larguraMedida) || 240,
      espessuraMedidaMicras: parseFloat(espessuraMicras) || 80,
      soldaAprovada: !!soldaAprovada,
      status: statusFinal,
      observacoes: statusFinal === 'aprovado' ? 'Dentro dos parâmetros normais.' : 'REPROVADO: Disparo de alerta de lote suspeito!'
    };

    data.inspecoesQualidade.unshift(novaInspecao);

    // Se reprovado, sinaliza máquina
    if (!soldaAprovada && machine) {
      // Abre chamado Andon de Qualidade automaticamente
      data.chamadosAndon.unshift({
        id: "ANDON-" + Date.now().toString().slice(-6),
        maquinaId: machineId,
        tipoChamado: "Alerta de Qualidade (Solda Reprovada)",
        dataHoraAbertura: new Date().toISOString(),
        dataHoraAtendimento: null,
        status: "ativo",
        solicitante: operador ? operador.nome : "Operador"
      });
      machine.status = 'chamado';
    }

    this.save(data);

    if (window.SyncBus) {
      window.SyncBus.publish(window.SyncBus.EVENTS.QUALITY_INSPECTED, {
        machineId,
        bobinaId: novaInspecao.bobinaId,
        etapa: novaInspecao.etapa,
        aprovado: soldaAprovada,
        inspecao: novaInspecao,
        operatorName: operador ? operador.nome : 'Operador'
      });
    }

    return { data, novaInspecao };
  },

  /**
   * Altera prioridade de uma OP
   */
  changeOpPriority(opId, novaPrioridade) {
    const data = this.load();
    const op = data.ordensProducao.find(o => o.id === opId);
    if (op) {
      op.prioridade = novaPrioridade;
      this.save(data);

      if (window.SyncBus) {
        window.SyncBus.publish(window.SyncBus.EVENTS.OP_PRIORITY_CHANGED, {
          opId,
          numeroOP: op.numeroOP,
          novaPrioridade
        });
      }
    }
    return { data, op };
  }
};

window.PlastMES_DB = DB;
