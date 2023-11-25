const Knex = require('knex');
const knexConfig = require('./knexfile');
const { Model } = require('objection');

const initializeKnex = () => {
  const knex = Knex(knexConfig.development);

  Model.knex(knex);
}

module.exports = {
  initializeKnex
}