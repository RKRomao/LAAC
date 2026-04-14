/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('locations').del();

  // Inserts seed entries
  await knex('locations').insert([
    {
      id: 'campus-ubi-main',
      name: 'Campus Principal da UBI',
      description: 'Campus principal da Universidade da Beira Interior com todos os serviços académicos principais',
      address: 'Rua Marquês d\'Ávila e Bolama, 6201-001 Covilhã',
      coordinates: knex.raw('POINT(-7.5060 40.2795)'),
      category: 'Educação',
      phone: '+351 275 319 600',
      email: 'geral@ubi.pt',
      website: 'https://www.ubi.pt',
      openingHours: 'Seg-Sex: 8h-20h, Sáb: 9h-13h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'hospital-covilha',
      name: 'Hospital Centro Hospitalar Cova da Beira',
      description: 'Serviço de urgência e cuidados de saúde para a população estudantil',
      address: 'Quinta das Lágrimas, 6200-251 Covilhã',
      coordinates: knex.raw('POINT(-7.4980 40.2850)'),
      category: 'Saúde',
      phone: '+351 275 319 700',
      email: 'chcb@chcb.min-saude.pt',
      website: 'https://www.chcb.min-saude.pt',
      openingHours: 'Urgência 24/7, Consultas: Seg-Sex 8h-20h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'biblioteca-ubi',
      name: 'Biblioteca Central da UBI',
      description: 'Espaço de estudo e pesquisa com vasto acervo bibliográfico',
      address: 'Rua Marquês d\'Ávila e Bolama, 6201-001 Covilhã',
      coordinates: knex.raw('POINT(-7.5050 40.2800)'),
      category: 'Educação',
      phone: '+351 275 319 640',
      email: 'biblioteca@ubi.pt',
      website: 'https://www.ubi.pt/Biblioteca',
      openingHours: 'Seg-Sex: 9h-22h, Sáb-Dom: 10h-18h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'terminal-rodoviario',
      name: 'Terminal Rodoviário da Covilhã',
      description: 'Principal ponto de transporte público para acesso à cidade',
      address: 'Avenida 25 de Abril, 6200-415 Covilhã',
      coordinates: knex.raw('POINT(-7.5020 40.2750)'),
      category: 'Transporte',
      phone: '+351 275 327 060',
      website: 'https://www.transdev.pt/covilha',
      openingHours: 'Seg-Dom: 6h-23h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'continente-estacao',
      name: 'Continente Modelo Estação',
      description: 'Supermercado com produtos alimentares e não alimentares',
      address: 'Avenida Sá Carneiro, 6200-425 Covilhã',
      coordinates: knex.raw('POINT(-7.5000 40.2720)'),
      category: 'Compras',
      phone: '+351 275 327 090',
      website: 'https://www.continente.pt',
      openingHours: 'Seg-Sáb: 9h-21h, Dom: 9h-13h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'policiacovilha',
      name: 'Esquadra da PSP da Covilhã',
      description: 'Serviço policial para segurança e emergências',
      address: 'Largo Comandante Henrique Moreira, 6200-164 Covilhã',
      coordinates: knex.raw('POINT(-7.5080 40.2780)'),
      category: 'Emergência',
      phone: '+351 275 322 050',
      website: 'https://www.psp.pt',
      openingHours: 'Emergência 24/7, Balcão: Seg-Sex 9h-17h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'residencias-ubi',
      name: 'Residências Universitárias da UBI',
      description: 'Alojamento estudantil com diversas opções',
      address: 'Rua dos Lagares da Beira, 6200-001 Covilhã',
      coordinates: knex.raw('POINT(-7.5100 40.2820)'),
      category: 'Alojamento',
      phone: '+351 275 319 630',
      email: 'sase@ubi.pt',
      website: 'https://www.ubi.pt/Unidades/SASE',
      openingHours: 'Seg-Sex: 9h-17h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'restaurante-universitario',
      name: 'Restaurante Universitário',
      description: 'Refeições a preços acessíveis para estudantes',
      address: 'Campus da UBI, 6201-001 Covilhã',
      coordinates: knex.raw('POINT(-7.5065 40.2790)'),
      category: 'Alimentação',
      phone: '+351 275 319 650',
      openingHours: 'Seg-Sex: 12h-14h30, 19h30-21h30',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'farmacia-central',
      name: 'Farmácia Central',
      description: 'Serviço farmacêutico e produtos de saúde',
      address: 'Avenida 1º de Maio, 6200-351 Covilhã',
      coordinates: knex.raw('POINT(-7.5030 40.2760)'),
      category: 'Saúde',
      phone: '+351 275 322 123',
      website: 'https://www.farmaciacentralcovilha.pt',
      openingHours: 'Seg-Sex: 9h-19h, Sáb: 9h-13h',
      is_active: true,
      created_by: 'system'
    },
    {
      id: 'centro-desportivo',
      name: 'Centro Desportivo da UBI',
      description: 'Instalações desportivas para estudantes',
      address: 'Complexo Desportivo da UBI, 6201-001 Covilhã',
      coordinates: knex.raw('POINT(-7.5040 40.2810)'),
      category: 'Desporto',
      phone: '+351 275 319 680',
      email: 'desporto@ubi.pt',
      website: 'https://www.ubi.pt/Desporto',
      openingHours: 'Seg-Sex: 8h-22h, Sáb: 9h-18h',
      is_active: true,
      created_by: 'system'
    }
  ]);
};
