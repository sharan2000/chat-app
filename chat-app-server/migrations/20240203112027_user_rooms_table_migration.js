/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('user_rooms', function (table) {
    table.increments('id').primary({constraintName:'user_rooms_primary_key'});
    table.integer('user_id').notNullable();
    table.integer('room_id').notNullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("user_rooms")
};
