const express = require('express')

const chat_handler = require("../controllers/chat.js")
const { auth_middleware } = require("../middleware/auth.js")

const chat_router = express.Router()

chat_router.post('/get_chat', auth_middleware, chat_handler.getChat)

module.exports = {
  chat_router
}
