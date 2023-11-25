const express = require('express')

const auth_handler = require("../controllers/auth.js")

const auth_router = express.Router()

auth_router.post("/signup", auth_handler.signup)
auth_router.post("/login", auth_handler.login)

module.exports = {
  auth_router
}
