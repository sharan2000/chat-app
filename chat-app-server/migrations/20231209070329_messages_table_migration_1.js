/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('messages', function (table) {
      table.increments('id').primary({constraintName:'messages_primary_key'});
      table.string('from', 255).notNullable();
      table.string('to', 255).notNullable();
      table.string('message', 3000).notNullable();
      table.datetime('time', { precision: 6 }).defaultTo(knex.fn.now(6))
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
      .dropTable("messages")
};
