import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.string('location', 255).notNullable();
    table.timestamp('startDate').notNullable();
    table.timestamp('endDate').notNullable();
    table.string('imageUrl', 255).nullable();
    table.string('category', 100).notNullable();
    table.integer('maxAttendees').nullable();
    table.boolean('isActive').defaultTo(true);
    table.uuid('createdBy').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updatedBy').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    // Indexes
    table.index(['startDate']);
    table.index(['category']);
    table.index(['isActive']);
    table.index(['createdBy']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('events');
}
