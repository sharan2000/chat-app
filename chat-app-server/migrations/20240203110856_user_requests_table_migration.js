/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('user_requests', function (table) {
      table.increments('id').primary({constraintName:'user_requests_primary_key'});
      table.integer('from_user_id').notNullable();
      table.integer('to_user_id').notNullable();
      table.datetime('sent_at', { precision: 6 }).defaultTo(knex.fn.now(6))
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
      .dropTable("user_requests")
};
