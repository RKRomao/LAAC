import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.enum('role', ['admin', 'core_team', 'praxante', 'student']).defaultTo('student');
    table.string('avatar', 255).nullable();
    table.boolean('isActive').defaultTo(true);
    table.boolean('emailVerified').defaultTo(false);
    table.string('googleId', 255).nullable().unique();
    table.string('microsoftId', 255).nullable().unique();
    table.timestamp('lastLoginAt').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['email']);
    table.index(['role']);
    table.index(['isActive']);
    table.index(['googleId']);
    table.index(['microsoftId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
