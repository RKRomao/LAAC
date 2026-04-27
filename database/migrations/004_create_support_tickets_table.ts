import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('support_tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.string('category', 100).notNullable();
    table.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('assignedTo').references('id').inTable('users').onDelete('SET NULL');
    table.text('response').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['userId']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['category']);
    table.index(['assignedTo']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('support_tickets');
}
