const express = require('express')
const { auth_middleware } = require('../middleware/auth')
const explore_handler = require('../controllers/explore')

const explore_router = express.Router()

explore_router.post('/get_all_users', auth_middleware, explore_handler.get_all_users)
explore_router.post('/get_all_rooms', auth_middleware, explore_handler.get_all_rooms)

explore_router.post('/add_or_remove_user_friend', auth_middleware, explore_handler.add_or_remove_user_friend)
explore_router.post('/add_or_remove_user_room', auth_middleware, explore_handler.add_or_remove_user_room)


module.exports = {
  explore_router
}