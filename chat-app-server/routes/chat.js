const express = require('express')

const chat_handler = require("../controllers/chat.js")
const { auth_middleware } = require("../middleware/auth.js")

const chat_router = express.Router()

chat_router.post('/get_chat', auth_middleware, chat_handler.getChat)

chat_router.post('/get_chat_for_room', auth_middleware, chat_handler.getChatForRoom)

chat_router.post('/add_new_chat_room', auth_middleware, chat_handler.addNewChatRoom)

chat_router.post('/get_users_and_rooms_data', auth_middleware, chat_handler.getUsersAndRoomsData)

module.exports = {
  chat_router
}
