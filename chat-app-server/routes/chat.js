const express = require('express')

const chat_handler = require("../controllers/chat.js")
const auth_middleware = require("../middleware/auth.js")

const chat_router = express.Router()


module.exports = {
  chat_router
}
