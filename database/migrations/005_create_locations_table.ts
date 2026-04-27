import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.string('address', 255).notNullable();
    table.string('category', 100).notNullable();
    table.specificType('coordinates', 'POINT').nullable();
    table.string('phoneNumber', 50).nullable();
    table.string('email', 255).nullable();
    table.string('website', 255).nullable();
    table.string('openingHours', 255).nullable();
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    // Indexes
    table.index(['category']);
    table.index(['is_active']);
    table.index(['created_by']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('locations');
}
