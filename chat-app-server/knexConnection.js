const Knex = require('knex');
const knexConfig = require('./knexfile');
const { Model } = require('objection');

const session = require('express-session')
const KnexSessionStore = require('connect-session-knex')(session);

let knex
let session_store
const initializeKnex = () => {
  knex = Knex(knexConfig.development);

  Model.knex(knex);

  //creating session store
  session_store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions'
  });
  
}

const getKnexConnection = () => {
  return knex
}


const getSessionStoreObject = () => {
  return session_store
}

module.exports = {
  initializeKnex,
  getKnexConnection,
  getSessionStoreObject
}