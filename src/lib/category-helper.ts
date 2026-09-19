import type { ServiceCategory } from './types';

export interface CategoryConfig {
  serviceSingular: string;
  servicePlural: string;
  serviceDescription: string;
  professionalSingular: string;
  professionalPlural: string;
  professionalDescription: string;
  hasCatalog: boolean;
  catalogSingular: string;
  catalogPlural: string;
  catalogDescription: string;
  priceLabel: string;
  durationLabel: string;
  aiPromptPlaceholder: string;
}

const defaultConfig: CategoryConfig = {
  serviceSingular: "Serviço",
  servicePlural: "Serviços",
  serviceDescription: "Gira os seus serviços comerciais, combos e promoções do seu negócio.",
  professionalSingular: "Colaborador",
  professionalPlural: "Equipa & Colaboradores",
  professionalDescription: "Faça a gestão da sua equipa de atendimento, escalas semanais, horários e folgas.",
  hasCatalog: true,
  catalogSingular: "Produto/Extra",
  catalogPlural: "Produtos & Extras",
  catalogDescription: "Gira os produtos físicos, extras e complementos de vendas associados.",
  priceLabel: "Preço Base (em AOA)",
  durationLabel: "Duração Estimada (em minutos)",
  aiPromptPlaceholder: "Ex: Serviço completo com atendimento personalizado e brindes."
};

const categoryConfigs: Record<string, Partial<CategoryConfig>> = {
  'Hotel': {
    serviceSingular: "Quarto/Acomodação",
    servicePlural: "Quartos & Acomodações",
    serviceDescription: "Cadastre quartos, suites, chalés e pacotes de alojamento, especificando capacidade e preços por noite.",
    professionalSingular: "Rececionista/Funcionário",
    professionalPlural: "Rececionistas & Staff",
    professionalDescription: "Gira a equipa de recepção, limpeza, lavandaria e manutenção, organizando escalas e turnos.",
    catalogSingular: "Serviço Adicional",
    catalogPlural: "Serviços Adicionais",
    catalogDescription: "Gira extras opcionais como Pequeno-almoço, Spa, Transfer de aeroporto e Lavandaria.",
    priceLabel: "Preço por Noite (em AOA)",
    durationLabel: "Tempo Mínimo de Estadia (em minutos)",
    aiPromptPlaceholder: "Ex: Quarto duplo com cama King, ar condicionado, vista mar e pequeno-almoço incluído."
  },
  'Restaurante': {
    serviceSingular: "Prato/Menu",
    servicePlural: "Pratos & Menus",
    serviceDescription: "Cadastre pratos individuais, pratos do dia, menus completos, sobremesas e combos para pedidos.",
    professionalSingular: "Membro do Staff",
    professionalPlural: "Empregados de Mesa & Cozinha",
    professionalDescription: "Gira a equipa de sala e cozinha, organizando escalas de atendimento e postos de trabalho.",
    catalogSingular: "Bebida/Acompanhamento",
    catalogPlural: "Bebidas & Acompanhamentos",
    catalogDescription: "Adicione complementos para os pratos, como guarnições adicionais, bebidas, molhos e sobremesas.",
    priceLabel: "Preço do Prato/Menu (em AOA)",
    durationLabel: "Tempo Médio de Preparação (em minutos)",
    aiPromptPlaceholder: "Ex: Picanha grelhada na brasa com guarnição de arroz, feijão preto, batata frita e farofa."
  },
  'Pizzarias': {
    serviceSingular: "Pizza/Combo",
    servicePlural: "Pizzas & Combos",
    serviceDescription: "Cadastre tamanhos de pizza, sabores, combos especiais e bordas recheadas.",
    professionalSingular: "Pizzaiolo/Entregador",
    professionalPlural: "Pizzaiolos & Entregadores",
    professionalDescription: "Gira a equipa de pizzaiolos, ajudantes de cozinha e estafetas de entrega rápida.",
    catalogSingular: "Ingrediente Extra",
    catalogPlural: "Ingredientes Extras & Bebidas",
    catalogDescription: "Gira acompanhamentos extras de ingredientes (queijo, pepperoni) e refrigerantes.",
    priceLabel: "Preço da Pizza/Combo (em AOA)",
    durationLabel: "Tempo de Cozedura/Preparação (em minutos)",
    aiPromptPlaceholder: "Ex: Pizza Grande de Frango com Catupiry, borda recheada de queijo e refrigerante de 1.5L."
  },
  'Humburguerias': {
    serviceSingular: "Hambúrguer/Combo",
    servicePlural: "Hambúrgueres & Combos",
    serviceDescription: "Cadastre os hambúrgueres artesanais, batatas fritas e combos promocionais do menu.",
    professionalSingular: "Chapeiro/Atendente",
    professionalPlural: "Chapeiros & Atendentes",
    professionalDescription: "Gira a equipa de chapeiros, cozinheiros e staff de atendimento ao cliente.",
    catalogSingular: "Ingrediente Extra",
    catalogPlural: "Ingredientes Extras & Molhos",
    catalogDescription: "Gira bacon extra, fatias de queijo adicionais, batata frita extra ou molhos artesanais.",
    priceLabel: "Preço do Hambúrguer/Combo (em AOA)",
    durationLabel: "Tempo Médio de Preparação (em minutos)",
    aiPromptPlaceholder: "Ex: Hambúrguer artesanal de 150g com queijo cheddar duplo, bacon crocante, alface, tomate e molho especial da casa."
  },
  'Imóveis': {
    serviceSingular: "Imóvel/Propriedade",
    servicePlural: "Imóveis & Propriedades",
    serviceDescription: "Registe apartamentos, vivendas, escritórios comerciais e terrenos para venda ou arrendamento.",
    professionalSingular: "Corretor/Agente",
    professionalPlural: "Agentes & Corretores imobiliários",
    professionalDescription: "Gira a equipa de corretores, agendamento de visitas de clientes e zonas de atuação.",
    hasCatalog: false,
    catalogSingular: "Comodidade",
    catalogPlural: "Comodidades Extras",
    catalogDescription: "Comodidades incluídas como piscina, segurança 24h, garagem e ar condicionado.",
    priceLabel: "Preço/Renda (em AOA)",
    durationLabel: "Duração do Contrato Mínimo (em meses/dias)",
    aiPromptPlaceholder: "Ex: Apartamento T3 mobilado no Talatona com suíte, piscina comum, segurança privada e estacionamento para 2 viaturas."
  },
  'Clínica': {
    serviceSingular: "Consulta/Tratamento",
    servicePlural: "Consultas & Tratamentos",
    serviceDescription: "Cadastre especialidades médicas, consultas, exames de diagnóstico e procedimentos clínicos.",
    professionalSingular: "Médico/Terapeuta",
    professionalPlural: "Corpo Médico & Terapeutas",
    professionalDescription: "Gira as escalas de médicos, terapeutas, enfermeiros e pessoal de apoio clínico.",
    catalogSingular: "Exame/Insumo",
    catalogPlural: "Exames Adicionais & Insumos",
    catalogDescription: "Gira taxas de exames adicionais, materiais ou vacinas aplicadas durante a consulta.",
    priceLabel: "Preço da Consulta (em AOA)",
    durationLabel: "Duração Média da Consulta (em minutos)",
    aiPromptPlaceholder: "Ex: Consulta de Pediatria Geral com avaliação física detalhada e aconselhamento nutricional infantil."
  },
  'Hospitais': {
    serviceSingular: "Especialidade/Procedimento",
    servicePlural: "Especialidades & Procedimentos",
    serviceDescription: "Cadastre cirurgias, exames complexos, internamentos e especialidades de pronto atendimento.",
    professionalSingular: "Profissional Clínico",
    professionalPlural: "Médicos, Enfermeiros & Staff",
    professionalDescription: "Gira a equipa hospitalar de prevenção, urgência, ambulatório e enfermarias de plantão.",
    catalogSingular: "Taxa/Medicamento",
    catalogPlural: "Taxas de Internamento & Medicamentos",
    catalogDescription: "Gira insumos cirúrgicos, medicamentos, exames laboratoriais e taxas de internamento.",
    priceLabel: "Custo Base do Procedimento (em AOA)",
    durationLabel: "Duração Média do Atendimento (em minutos)",
    aiPromptPlaceholder: "Ex: Check-up Cardiológico Completo com Eletrocardiograma, Teste de Esforço e consulta de retorno."
  },
  'Barbearia': {
    serviceSingular: "Corte/Serviço",
    servicePlural: "Cortes & Serviços de Barba",
    serviceDescription: "Cadastre cortes de cabelo, design de barba, sobrancelha, tratamentos capilares e combos masculinos.",
    professionalSingular: "Barbeiro",
    professionalPlural: "Barbeiros & Profissionais",
    professionalDescription: "Gira os horários da equipa de barbeiros, folgas fixas, turnos e comissão por serviço prestado.",
    catalogSingular: "Produto Físico",
    catalogPlural: "Produtos de Venda",
    catalogDescription: "Gira produtos de cuidado masculino, como ceras modeladoras, óleos de barba e champôs.",
    priceLabel: "Preço do Serviço (em AOA)",
    durationLabel: "Duração do Corte/Serviço (em minutos)",
    aiPromptPlaceholder: "Ex: Corte de cabelo degradê americano com lavagem, hidratação capilar e alinhamento de barba com toalha quente."
  },
  'Salão de Beleza': {
    serviceSingular: "Serviço/Tratamento",
    servicePlural: "Serviços de Beleza & Estética",
    serviceDescription: "Cadastre manicure, pedicure, maquilhagem, massagens e tratamentos estéticos faciais e corporais.",
    professionalSingular: "Esteticista/Manicure",
    professionalPlural: "Esteticistas, Cabeleireiras & Manicures",
    professionalDescription: "Gira a equipa de esteticistas, manicures e especialistas de cosmética, organizando folgas e turnos.",
    catalogSingular: "Produto/Cosmético",
    catalogPlural: "Esmaltes, Cremes & Cosméticos",
    catalogDescription: "Gira produtos de beleza para venda direta ou tratamentos especiais adicionados ao serviço.",
    priceLabel: "Preço do Serviço (em AOA)",
    durationLabel: "Duração do Procedimento (em minutos)",
    aiPromptPlaceholder: "Ex: Aplicação de unhas de gel com design personalizado, cuticulagem profunda e hidratação das mãos."
  },
  'Salão de Cabeleireiro': {
    serviceSingular: "Serviço Capilar",
    servicePlural: "Cortes, Penteados & Hidratações",
    serviceDescription: "Cadastre escovas, alisamentos, lavagens, penteados de noiva, tinturas e tratamentos de hidratação profunda.",
    professionalSingular: "Cabeleireiro/Estilista",
    professionalPlural: "Cabeleireiros & Coloristas",
    professionalDescription: "Gira a escala dos profissionais capilares, coloristas e auxiliares de salão.",
    catalogSingular: "Tratamento/Produto",
    catalogPlural: "Tratamentos Extras & Ampolas",
    catalogDescription: "Gira produtos de manutenção de cor, ampolas de hidratação ou sprays finalizadores.",
    priceLabel: "Preço do Serviço (em AOA)",
    durationLabel: "Duração do Atendimento (em minutos)",
    aiPromptPlaceholder: "Ex: Alisamento térmico profissional com queratina orgânica, lavagem profunda, secagem e finalização de pontas."
  },
  'Gráfica': {
    serviceSingular: "Serviço de Impressão",
    servicePlural: "Serviços de Impressão & Design",
    serviceDescription: "Cadastre serviços de impressão digital, offset, criação de logótipos, panfletos, cartões e banners.",
    professionalSingular: "Designer/Operador",
    professionalPlural: "Designers & Operadores de Máquinas",
    professionalDescription: "Gira a equipa de designers gráficos, operadores de pré-impressão e finalizadores de acabamento.",
    catalogSingular: "Material/Papel",
    catalogPlural: "Tipos de Papel & Acabamentos",
    catalogDescription: "Gira gramagens de papel especiais, acabamentos em verniz localizado, plastificação ou laminação fosca.",
    priceLabel: "Preço Base de Impressão (em AOA)",
    durationLabel: "Tempo de Produção Médio (em minutos)",
    aiPromptPlaceholder: "Ex: Impressão de 1000 Cartões de Visita em papel Couché 350g com plastificação mate e verniz localizado frente."
  },
  'Agências de Turismo e Viagens': {
    serviceSingular: "Pacote/Excursão",
    servicePlural: "Pacotes de Viagem & Excursões",
    serviceDescription: "Cadastre roteiros turísticos guiados, viagens de negócios, excursões locais e reservas de passagens.",
    professionalSingular: "Guia/Agente",
    professionalPlural: "Guias Turísticos & Agentes",
    professionalDescription: "Gira a escala de guias de turismo certificados, agentes de viagens e motoristas de transporte.",
    catalogSingular: "Taxa/Extra de Viagem",
    catalogPlural: "Extras de Viagem & Seguro",
    catalogDescription: "Gira taxas de vistos, seguro de saúde de viagem, aluguer de equipamento de mergulho ou fotos profissionais.",
    priceLabel: "Preço do Pacote (em AOA)",
    durationLabel: "Duração da Atividade (em minutos/horas)",
    aiPromptPlaceholder: "Ex: Excursão guiada de 1 dia às Quedas de Kalandula com transporte climatizado, almoço tradicional e seguro de viagem incluído."
  },
  'Oficinas Auto': {
    serviceSingular: "Serviço de Reparação",
    servicePlural: "Serviços & Reparações Auto",
    serviceDescription: "Cadastre serviços de mudança de óleo, alinhamento de direção, mecânica geral, pintura e lavagem detalhada.",
    professionalSingular: "Mecânico/Eletricista",
    professionalPlural: "Mecânicos & Técnicos",
    professionalDescription: "Gira a equipa de mecânicos especializados, eletricistas auto, pintores e ajudantes de oficina.",
    catalogSingular: "Peça/Óleo",
    catalogPlural: "Peças de Reposição & Lubrificantes",
    catalogDescription: "Gira filtros de óleo, pastilhas de travão, velas de ignição, fluidos e peças sobressalentes aplicadas.",
    priceLabel: "Preço de Mão de Obra (em AOA)",
    durationLabel: "Tempo Estimado de Serviço (em minutos)",
    aiPromptPlaceholder: "Ex: Revisão completa com mudança de óleo de motor sintético, filtro de ar, filtro de combustível e diagnóstico por computador."
  },
  'Salão de Festas': {
    serviceSingular: "Serviço de Aluguer",
    servicePlural: "Alugueres & Espaços de Eventos",
    serviceDescription: "Cadastre aluguer de salão completo, áreas gourmet, decoração de casamentos, aniversários e eventos corporativos.",
    professionalSingular: "Coordenador/Staff",
    professionalPlural: "Coordenadores, Seguranças & Limpeza",
    professionalDescription: "Gira a equipa de organização no local, seguranças para eventos, barmans e pessoal pós-festa.",
    catalogSingular: "Serviço de Buffet/Decoração",
    catalogPlural: "Extras de Buffet, Decoração & Som",
    catalogDescription: "Gira serviços adicionais de catering/buffet, aparelhagem de som, DJ profissional ou iluminação decorativa.",
    priceLabel: "Preço de Aluguer do Espaço (em AOA)",
    durationLabel: "Duração do Aluguer (em minutos)",
    aiPromptPlaceholder: "Ex: Aluguer do Salão Principal para Casamentos de até 250 convidados, com mesas redondas, cadeiras Tiffany e área externa climatizada."
  }
};

export function getCategoryConfig(category?: string): CategoryConfig {
  if (!category) return defaultConfig;
  
  const config = categoryConfigs[category];
  if (!config) {
    // Check if category name matches any of our groups loosely
    const catLower = category.toLowerCase();
    if (catLower.includes('barba') || catLower.includes('beleza') || catLower.includes('cabeleireiro')) {
      return { ...defaultConfig, ...categoryConfigs['Barbearia'] };
    }
    if (catLower.includes('restaurante') || catLower.includes('pizza') || catLower.includes('humburguer') || catLower.includes('hambúrguer')) {
      return { ...defaultConfig, ...categoryConfigs['Restaurante'] };
    }
    if (catLower.includes('clínica') || catLower.includes('hospital')) {
      return { ...defaultConfig, ...categoryConfigs['Clínica'] };
    }
    if (catLower.includes('hotel') || catLower.includes('alojamento') || catLower.includes('festa')) {
      return { ...defaultConfig, ...categoryConfigs['Hotel'] };
    }
    if (catLower.includes('imóve') || catLower.includes('imobili')) {
      return { ...defaultConfig, ...categoryConfigs['Imóveis'] };
    }
    return defaultConfig;
  }
  
  return { ...defaultConfig, ...config };
}
