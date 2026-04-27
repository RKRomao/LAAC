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
      id: 'polo-i',
      name: 'Polo I - Universidade da Beira Interior',
      description: 'Entrada: Salas 2.12',
      address: 'R. Marquês de Ávila e Bolama, 6201-001 Covilhã',
      coordinates: 'POINT(-7.508995 40.277881)',
      category: 'Educação',
      website: 'https://www.ubi.pt/Pagina/Faculdades',
      openingHours: 'Seg-Sex: 8h-20h',
      is_active: true,
      created_by: 'system'
    }
  ]);
};
