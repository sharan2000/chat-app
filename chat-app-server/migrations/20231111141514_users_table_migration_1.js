/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .createTable('users', function (table) {
      table.increments('id').primary({constraintName:'users_primary_key'});
      table.string('email', 255).notNullable().unique({indexName:'users_unique_email'});
      table.string('password', 255).notNullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
      .dropTable("users")
};
