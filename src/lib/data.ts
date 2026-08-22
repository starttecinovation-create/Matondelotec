
import type { Service, Booking, Product, TouristSpot, Taxi } from './types';

export const transportCategories = [
    {
        name: "Carros Ligeiros",
        description: "Viagens rápidas e confortáveis na cidade.",
        comingSoon: true,
    },
    {
        name: "Reboques",
        description: "Assistência para o seu veículo a qualquer hora.",
        comingSoon: true,
    },
    {
        name: "Carros de Mercadorias",
        description: "Transporte de bens e mercadorias com segurança.",
        comingSoon: true,
    },
    {
        name: "Mototáxi",
        description: "A forma mais ágil de se mover no trânsito.",
        comingSoon: true,
    },
    {
        name: "Kupapatas",
        description: "Transporte local rápido e económico.",
        comingSoon: true,
    }
];

export const mockProducts: Product[] = [
    {
      id: 'prod-tshirt-1',
      vendorId: 'p6',
      name: 'T-shirt Branca de Algodão',
      description: 'T-shirt de alta qualidade, 100% algodão, perfeita para estampagem.',
      price: 8500,
      imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    },
    {
      id: 'prod-card-1',
      vendorId: 'p6',
      name: 'Cartões de Visita (x100)',
      description: 'Pacote de 100 cartões de visita em papel couché 300g.',
      price: 12000,
      imageUrl: 'https://picsum.photos/seed/cards/400/400',
    },
    {
      id: 'prod-banner-1',
      vendorId: 'p6',
      name: 'Banner em Lona (1m x 0.8m)',
      description: 'Banner resistente para eventos e publicidade exterior.',
      price: 25000,
      imageUrl: 'https://picsum.photos/seed/banner/400/400',
    }
];

export const mockServices: Service[] = [
  {
    id: '1',
    vendorId: 'p1',
    name: 'Hotel Baía Luanda',
    description: 'Um hotel de luxo com vistas deslumbrantes sobre a baía de Luanda. Oferece quartos modernos, piscina e restaurante de alta gastronomia.',
    category: 'Hotel',
    price: 75000,
    imageUrls: ['hotel-1', 'hotel-2', 'hotel-3'],
    location: {
      latitude: -8.8143,
      longitude: 13.235,
    },
  },
  {
    id: '2',
    vendorId: 'p2',
    name: 'Restaurante Kymbu',
    description: 'Sabores autênticos de Angola num ambiente sofisticado. Especializado em pratos de peixe fresco e cozinha tradicional reinventada.',
    category: 'Restaurante',
    price: 15000,
    imageUrls: ['restaurant-1', 'restaurant-2'],
     location: {
      latitude: -8.8383,
      longitude: 13.235,
    },
  },
  {
    id: '3',
    vendorId: 'p3',
    name: 'Clínica Girassol',
    description: 'Cuidados de saúde de excelência com uma equipa de especialistas dedicados. Oferecemos uma vasta gama de serviços médicos.',
    category: 'Clínica',
    price: 25000,
    imageUrls: ['clinic-1'],
    location: {
      latitude: -8.847,
      longitude: 13.262,
    },
  },
  {
    id: '4',
    vendorId: 'p4',
    name: 'Barbearia O Clássico',
    description: 'Cortes de cabelo e barba com estilo. Um espaço para o homem moderno que valoriza a precisão e o bom atendimento.',
    category: 'Barbearia',
    price: 5000,
    imageUrls: ['barber-1'],
    location: {
      latitude: -8.83,
      longitude: 13.24,
    },
  },
  {
    id: '5',
    vendorId: 'p5',
    name: 'Salão Divas',
    description: 'Especialistas em beleza e bem-estar. Oferecemos serviços de cabeleireiro, manicure, pedicure e tratamentos estéticos.',
    category: 'Salão de Beleza',
    price: 8000,
    imageUrls: ['salon-1'],
    location: {
      latitude: -8.825,
      longitude: 13.245,
    },
  },
  {
    id: '6',
    vendorId: 'p6',
    name: 'Gráfica Impressões Rápidas',
    description: 'Soluções de impressão de alta qualidade para empresas e particulares. Cartões de visita, flyers, banners e muito mais. Use o nosso chat com IA para obter um orçamento personalizado!',
    category: 'Gráfica',
    price: 10000,
    imageUrls: ['print-1'],
    location: {
      latitude: -8.85,
      longitude: 13.25,
    },
  },
  {
    id: '7',
    vendorId: 'p7',
    name: 'Tour Miradouro da Lua',
    description: 'Uma excursão inesquecível ao Miradouro da Lua. Transporte incluído, com guia local e paragem para fotos.',
    category: 'Agências de Turismo e Viagens',
    price: 20000,
    imageUrls: ['tourism-1', 'tourism-2'],
    location: {
      latitude: -9.176,
      longitude: 13.133,
    },
  },
    {
    id: '8',
    vendorId: 'p8',
    name: 'Pensão Girassol',
    description: 'Acomodação económica e confortável no coração da cidade. Ideal para viajantes a negócios ou lazer.',
    category: 'Hotel',
    price: 25000,
    imageUrls: ['hotel-4'],
    location: {
      latitude: -8.836,
      longitude: 13.232,
    },
  },
  {
    id: '9',
    vendorId: 'p9',
    name: 'Kero',
    description: 'Um dos maiores hipermercados de Angola, oferecendo uma vasta gama de produtos, desde alimentos a eletrónicos.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.88,
      longitude: 13.28,
    },
  },
  {
    id: '10',
    vendorId: 'p10',
    name: 'Kibabo',
    description: 'Uma popular rede de supermercados conhecida pela sua variedade e preços competitivos.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.84,
      longitude: 13.26,
    },
  },
  {
    id: '11',
    vendorId: 'p11',
    name: 'Angomart',
    description: 'Supermercado moderno com uma vasta seleção de produtos importados e locais.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.82,
      longitude: 13.25,
    },
  },
  {
    id: '12',
    vendorId: 'p12',
    name: 'Fresmart',
    description: 'Focado em produtos frescos e de qualidade, o Fresmart é uma escolha popular para as compras do dia a dia.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.86,
      longitude: 13.24,
    },
  },
  {
    id: '13',
    vendorId: 'p13',
    name: 'Descontão',
    description: 'Supermercado focado em oferecer preços baixos e grandes promoções.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.89,
      longitude: 13.27,
    },
  },
  {
    id: '14',
    vendorId: 'p14',
    name: 'Nossa Casa',
    description: 'Uma rede de supermercados de proximidade, com várias lojas em Luanda.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.815,
      longitude: 13.245,
    },
  },
  {
    id: '15',
    vendorId: 'p15',
    name: 'Kinda Home',
    description: 'Loja de decoração e utilidades para o lar que também oferece uma seleção de produtos gourmet.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.875,
      longitude: 13.285,
    },
  },
  {
    id: '16',
    vendorId: 'p16',
    name: 'Fresco do Dia',
    description: 'Especializado em frutas, verduras e outros produtos frescos de alta qualidade.',
    category: 'Supermercado',
    price: 5000,
    imageUrls: [],
    location: {
      latitude: -8.832,
      longitude: 13.238,
    },
  },
  {
    id: '17',
    vendorId: 'p17',
    name: 'Serviço de Bombeiros',
    description: 'Serviço de emergência para combate a incêndios, resgates e proteção civil. Contacto de emergência: 115.',
    category: 'Instituições Públicas',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.828,
        longitude: 13.239
    }
  },
  {
      id: '18',
      vendorId: 'p18',
      name: 'Polícia Nacional',
      description: 'Força de segurança pública responsável pela manutenção da ordem, segurança e tranquilidade. Contacto de emergência: 113.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.834,
          longitude: 13.23
      }
  },
  {
      id: '19',
      vendorId: 'p19',
      name: 'SIC - Serviço de Investigação Criminal',
      description: 'Órgão de investigação e instrução de processos criminais. Para denúncias e informações, contacte a unidade mais próxima.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.814,
          longitude: 13.23
      }
  },
  {
    id: '20',
    vendorId: 'p20',
    name: 'Pumangol',
    description: 'Rede de postos de combustível que oferece combustíveis e lubrificantes de qualidade.',
    category: 'Bombas de combustível',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.851,
        longitude: 13.245
    }
  },
  {
    id: '21',
    vendorId: 'p21',
    name: 'Sonangol (Posto de Combustível)',
    description: 'A empresa nacional de combustíveis de Angola, com uma vasta rede de postos por todo o país.',
    category: 'Bombas de combustível',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.821,
        longitude: 13.248
    }
  },
  {
    id: '22',
    vendorId: 'p22',
    name: 'TotalEnergies (Posto de Combustível)',
    description: 'Postos de combustível com padrões internacionais, oferecendo também lojas de conveniência e outros serviços.',
    category: 'Bombas de combustível',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.837,
        longitude: 13.255
    }
  },
  {
    id: '23',
    vendorId: 'p23',
    name: 'Sonangalp',
    description: 'Uma parceria entre a Sonangol e a Galp, oferecendo uma experiência de serviço moderna.',
    category: 'Bombas de combustível',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.809,
        longitude: 13.233
    }
  },
  {
    id: '24',
    vendorId: 'p24',
    name: 'Hospital Américo Boavida',
    description: 'Um dos maiores e mais importantes hospitais públicos de Luanda, oferecendo uma vasta gama de especialidades médicas.',
    category: 'Hospitais',
    price: 0,
    imageUrls: [],
    location: {
      latitude: -8.817,
      longitude: 13.239
    },
  },
  {
    id: '25',
    vendorId: 'p25',
    name: 'Hospital Josina Machel (Maria Pia)',
    description: 'Hospital público de referência em Angola, conhecido pela sua maternidade e serviços pediátricos.',
    category: 'Hospitais',
    price: 0,
    imageUrls: [],
    location: {
      latitude: -8.83,
      longitude: 13.234
    },
  },
  {
      id: '26',
      vendorId: 'p26',
      name: 'Ministério da Educação',
      description: 'Órgão do governo responsável pela política e gestão do sistema de ensino em Angola.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.816,
          longitude: 13.231
      }
  },
  {
      id: '27',
      vendorId: 'p27',
      name: 'Ministério da Saúde',
      description: 'Responsável pela formulação, execução e controlo da política nacional de saúde.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.815,
          longitude: 13.232
      }
  },
  {
      id: '28',
      vendorId: 'p28',
      name: 'Ministério das Finanças',
      description: 'Responsável pela gestão das finanças do Estado, incluindo a política fiscal e o orçamento geral.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.813,
          longitude: 13.233
      }
  },
  {
      id: '29',
      vendorId: 'p29',
      name: 'Ministério dos Transportes',
      description: 'Responsável pela política e regulação dos transportes terrestres, marítimos e aéreos em Angola.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.812,
          longitude: 13.230
      }
  },
  {
      id: '30',
      vendorId: 'p30',
      name: 'Ministério da Cultura e Turismo',
      description: 'Promove e desenvolve a cultura e o turismo, preservando o património nacional.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.811,
          longitude: 13.231
      }
  },
  {
      id: '31',
      vendorId: 'p31',
      name: 'Ministério do Interior',
      description: 'Assegura a ordem e a segurança pública, a gestão de fronteiras e a proteção civil.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.810,
          longitude: 13.232
      }
  },
  {
      id: '32',
      vendorId: 'p32',
      name: 'Ministério da Indústria e Comércio',
      description: 'Define e executa as políticas para o desenvolvimento industrial e a regulação do comércio.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8145,
          longitude: 13.2325
      }
  },
  {
      id: '33',
      vendorId: 'p33',
      name: 'Ministério dos Recursos Minerais, Petróleo e Gás',
      description: 'Responsável pela gestão e exploração dos recursos minerais, petróleo e gás do país.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8135,
          longitude: 13.2345
      }
  },
  {
      id: '34',
      vendorId: 'p34',
      name: 'Ministério do Ambiente',
      description: 'Formula e implementa políticas de proteção ambiental e desenvolvimento sustentável.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8125,
          longitude: 13.2355
      }
  },
  {
      id: '35',
      vendorId: 'p35',
      name: 'Guiché Único da Empresa (GUE)',
      description: 'Serviço público para a constituição, alteração e extinção de sociedades comerciais, de forma simplificada e integrada.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.835,
          longitude: 13.241
      }
  },
  {
      id: '36',
      vendorId: 'p36',
      name: 'Televisão Pública de Angola (TPA)',
      description: 'A emissora pública de televisão de Angola, responsável pela produção e transmissão de notícias, entretenimento e cultura.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.845,
          longitude: 13.242
      }
  },
  {
      id: '37',
      vendorId: 'p37',
      name: 'Rádio Nacional de Angola (RNA)',
      description: 'A emissora pública de rádio de Angola, com várias estações que cobrem todo o território nacional.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8155,
          longitude: 13.2315
      }
  },
  {
      id: '38',
      vendorId: 'p38',
      name: 'Jornal de Angola',
      description: 'O principal e mais antigo jornal diário de Angola, de propriedade estatal.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8165,
          longitude: 13.2305
      }
  },
  {
      id: '39',
      vendorId: 'p39',
      name: 'ANGOP - Agência Angola Press',
      description: 'A agência de notícias oficial de Angola, fornecendo informações sobre o país e o mundo.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.8145,
          longitude: 13.2335
      }
  },
  {
      id: '40',
      vendorId: 'p40',
      name: 'Chevron',
      description: 'Uma das maiores empresas de energia integradas do mundo, com operações significativas em Angola na exploração e produção de petróleo e gás.',
      category: 'Multinacionais',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.808,
          longitude: 13.234
      }
  },
  {
      id: '41',
      vendorId: 'p41',
      name: 'TotalEnergies',
      description: 'Uma grande empresa multienergética que produz e comercializa energias em escala global: petróleo e biocombustíveis, gás natural e gases verdes, renováveis e eletricidade.',
      category: 'Multinacionais',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.81,
          longitude: 13.24
      }
  },
  {
    id: '50',
    vendorId: 'p50',
    name: 'ExxonMobil',
    description: 'Empresa global de petróleo e gás com um portfólio diversificado em exploração, produção, refinação e produtos químicos.',
    category: 'Multinacionais',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.812,
        longitude: 13.238
    }
  },
  {
    id: '51',
    vendorId: 'p51',
    name: 'Eni',
    description: 'Empresa italiana de energia com forte presença em Angola, focada na exploração e produção de hidrocarbonetos.',
    category: 'Multinacionais',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.811,
        longitude: 13.242
    }
  },
  {
    id: '52',
    vendorId: 'p52',
    name: 'BP',
    description: 'Empresa britânica de energia que opera em todos os setores da indústria de petróleo e gás, com investimentos significativos em Angola.',
    category: 'Multinacionais',
    price: 0,
    imageUrls: [],
    location: {
        latitude: -8.809,
        longitude: 13.245
    }
  },
  {
      id: '42',
      vendorId: 'p42',
      name: 'Sonangol E.P.',
      description: 'A empresa estatal de petróleo de Angola, responsável pela exploração e produção de petróleo e gás natural.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.814,
          longitude: 13.234
      }
  },
  {
      id: '43',
      vendorId: 'p43',
      name: 'ENDE - Empresa Nacional de Distribuição de Electricidade',
      description: 'A empresa pública responsável pela distribuição de energia elétrica em Angola.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.825,
          longitude: 13.231
      }
  },
  {
      id: '44',
      vendorId: 'p44',
      name: 'Endiama E.P.',
      description: 'A Empresa Nacional de Diamantes de Angola, responsável pela prospecção, exploração, lapidação e comercialização de diamantes.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.815,
          longitude: 13.229
      }
  },
  {
      id: '45',
      vendorId: 'p45',
      name: 'PRODEL - Empresa Pública de Produção de Electricidade',
      description: 'Responsável pela produção de energia elétrica a partir de fontes hídricas e térmicas em Angola.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.826,
          longitude: 13.232
      }
  },
  {
      id: '46',
      vendorId: 'p46',
      name: 'RNT - Rede Nacional de Transporte de Electricidade',
      description: 'Responsável pela gestão da rede nacional de transporte de energia elétrica em alta tensão.',
      category: 'Instituições Públicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.827,
          longitude: 13.233
      }
  },
  {
      id: '47',
      vendorId: 'p47',
      name: 'MS Telecom',
      description: 'Uma empresa de telecomunicações que oferece soluções de conectividade e serviços de dados em Angola.',
      category: 'Operadoras de Redes Telefónicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.829,
          longitude: 13.239
      }
  },
  {
      id: '48',
      vendorId: 'p48',
      name: 'Angola Telecom',
      description: 'A empresa pública de telecomunicações de Angola, fornecendo serviços de telefonia fixa, móvel e internet.',
      category: 'Operadoras de Redes Telefónicas',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.813,
          longitude: 13.231
      }
  },
  {
      id: '49',
      vendorId: 'p49',
      name: 'Angosat-2',
      description: 'O satélite angolano que oferece serviços de comunicação e internet em todo o território nacional e em África.',
      category: 'Provedores de Internet',
      price: 0,
      imageUrls: [],
      location: {
          latitude: -8.831,
          longitude: 13.241
      }
  },
  {
    id: 'cfp-1',
    vendorId: 'p-cinfotec',
    name: 'CINFOTEC - Centro Integrado de Formação Tecnológica',
    description: 'Centro de referência para formação tecnológica e profissional em áreas como informática, telecomunicações, eletricidade e mecânica.',
    category: 'Centros de Formação Profissional',
    price: 0,
    imageUrls: [],
    location: {
      latitude: -8.865,
      longitude: 13.386
    }
  },
  {
    id: 'cfp-2',
    vendorId: 'p-inefop',
    name: 'INEFOP - Instituto Nacional de Emprego e Formação Profissional',
    description: 'Entidade pública que superintende a política de emprego e formação profissional em Angola, gerindo vários centros de formação em todo o país (centros MAPTSS).',
    category: 'Centros de Formação Profissional',
    price: 0,
    imageUrls: [],
    location: {
      latitude: -8.840,
      longitude: 13.245
    }
  },
  {
    id: 'cfp-3',
    vendorId: 'p-cenfoc',
    name: 'CENFOC - Centro de Formação Profissional da Construção Civil',
    description: 'Centro especializado na formação de mão de obra qualificada para o setor da construção civil, com cursos de pedreiro, carpinteiro, eletricista, entre outros.',
    category: 'Centros de Formação Profissional',
    price: 0,
    imageUrls: [],
    location: {
      latitude: -8.937,
      longitude: 13.337
    }
  }
];

export const mockTouristSpots: TouristSpot[] = [
    {
        id: 'ts-1',
        name: 'Quedas de Kalandula',
        description: 'Uma das maiores e mais impressionantes quedas de água em África, com uma beleza natural de cortar a respiração.',
        location: 'Malanje',
        imageUrls: ['https://picsum.photos/seed/kalandula/600/400'],
        imageHint: 'Kalandula Falls'
    },
    {
        id: 'ts-2',
        name: 'Fendas da Tundavala',
        description: 'Uma fenda geológica colossal com vistas panorâmicas espetaculares sobre a planície. Localizada entre o Lubango e a Humpata.',
        location: 'Huíla',
        imageUrls: ['https://picsum.photos/seed/tundavala/600/400'],
        imageHint: 'Tundavala Fissure'
    },
    {
        id: 'ts-3',
        name: 'Serra da Leba',
        description: 'Famosa pela sua estrada sinuosa e paisagens montanhosas deslumbrantes. Uma obra-prima da engenharia e um ícone de Angola.',
        location: 'Huíla',
        imageUrls: ['https://picsum.photos/seed/leba/600/400'],
        imageHint: 'Serra da Leba'
    },
    {
        id: 'ts-4',
        name: 'Parque Nacional da Quiçama',
        description: 'O principal parque nacional de Angola, lar de uma variedade de vida selvagem, incluindo elefantes, girafas e zebras.',
        location: 'Luanda',
        imageUrls: ['https://picsum.photos/seed/quicama/600/400'],
        imageHint: 'Kissama Park'
    },
    {
        id: 'ts-5',
        name: 'Miradouro da Lua',
        description: 'Uma paisagem de falésias erodidas pela chuva e pelo vento que se assemelha à superfície lunar.',
        location: 'Luanda',
        imageUrls: ['https://picsum.photos/seed/lua/600/400'],
        imageHint: 'Moon Viewpoint'
    },
    {
        id: 'ts-6',
        name: 'Pedras Negras de Pungo Andongo',
        description: 'Formações rochosas monolíticas gigantes envoltas em mitos e lendas locais.',
        location: 'Malanje',
        imageUrls: ['https://picsum.photos/seed/pungo-andongo/600/400'],
        imageHint: 'Black Rocks'
    }
];

export const mockTaxis: Taxi[] = [
    {
        id: 'taxi-1',
        driverId: 'driver-1',
        driverName: 'João da Silva',
        plateNumber: 'LD-01-02-AA',
        model: 'Toyota Corolla',
        location: { lat: -8.830, lng: 13.235 },
        status: 'available',
        pricingDescription: 'Base: 1500 AOA + 200 AOA/km. Tarifa noturna aumenta 25%.',
        routes: ['Centro da Cidade', 'Aeroporto', 'Talatona'],
        operationalNotes: 'Carro com ar condicionado. Viagens longas negociáveis.',
        referredBy: 'agent-alpha',
        taxiClass: 'conforto',
    },
    {
        id: 'taxi-2',
        driverId: 'driver-2',
        driverName: 'Manuel Pedro',
        plateNumber: 'LD-03-04-BB',
        model: 'Suzuki Alto',
        location: { lat: -8.840, lng: 13.240 },
        status: 'available',
        pricingDescription: 'Preço fixo de 150 AOA/km. Apenas em Luanda.',
        routes: ['Viana', 'Cacuaco', 'Zango'],
        operationalNotes: 'Carro baixo, não posso entrar em zonas sem asfalto.',
        referredBy: 'agent-beta',
        taxiClass: 'economico',
    },
    {
        id: 'taxi-3',
        driverId: 'driver-3',
        driverName: 'António Costa',
        plateNumber: 'LD-05-06-CC',
        model: 'Mercedes-Benz Classe E',
        location: { lat: -8.815, lng: 13.230 },
        status: 'available',
        pricingDescription: 'Serviço executivo. Preço sob consulta.',
        routes: ['Aeroporto', 'Hotéis 5 estrelas', 'Eventos Corporativos'],
        operationalNotes: 'Serviço premium, água e Wi-Fi a bordo.',
        referredBy: 'agent-alpha',
        taxiClass: 'executivo',
    },
    {
        id: 'taxi-4',
        driverId: 'driver-4',
        driverName: 'Catarina Miguel',
        plateNumber: 'LD-07-08-DD',
        model: 'Toyota Hiace',
        location: { lat: -8.855, lng: 13.260 },
        status: 'available',
        pricingDescription: 'Tarifa base de 2000 AOA + 250 AOA/km. Preços de grupo disponíveis.',
        routes: ['Excursões', 'Viagens Interprovinciais'],
        operationalNotes: 'Veículo para até 10 passageiros.',
        referredBy: null,
        taxiClass: 'conforto',
    },
];
    
