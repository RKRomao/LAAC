import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('event_attendees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('eventId').references('id').inTable('events').onDelete('CASCADE');
    table.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
    table.enum('status', ['registered', 'attended', 'cancelled']).defaultTo('registered');
    table.timestamp('registeredAt').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    // Indexes
    table.index(['eventId']);
    table.index(['userId']);
    table.index(['status']);
    
    // Unique constraint to prevent duplicate registrations
    table.unique(['eventId', 'userId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('event_attendees');
}
