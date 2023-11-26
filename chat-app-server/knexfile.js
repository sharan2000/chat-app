// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'mysql2',
    debug: true,
    connection: {
      database: 'my_database',
      user:     'root',
      password: 'RootPassword'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

};
