import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('faqs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('question', 500).notNullable();
    table.text('answer').notNullable();
    table.string('category', 100).notNullable();
    table.integer('order').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.uuid('createdBy').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updatedBy').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    // Indexes
    table.index(['category']);
    table.index(['isActive']);
    table.index(['order']);
    table.index(['createdBy']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('faqs');
}
