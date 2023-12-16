const express = require('express')

const chat_handler = require("../controllers/chat.js")
const { auth_middleware } = require("../middleware/auth.js")

const chat_router = express.Router()

chat_router.post('/get_chat', auth_middleware, chat_handler.getChat)

chat_router.post('/get_chat_for_room', auth_middleware, chat_handler.getChatForRoom)

module.exports = {
  chat_router
}
