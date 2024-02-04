/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('friends', function (table) {
    table.increments('id').primary({constraintName:'friends_primary_key'});
    table.integer('user1_id').notNullable();
    table.integer('user2_id').notNullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("friends")
};
