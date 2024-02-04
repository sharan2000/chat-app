const express = require('express')
const { auth_middleware } = require('../middleware/auth')
const explore_handler = require('../controllers/explore')

const explore_router = express.Router()

explore_router.post('/get_all_users_rooms', auth_middleware, explore_handler.get_all_users_rooms)

module.exports = {
  explore_router
}