const express = require('express')
const { auth_middleware } = require('../middleware/auth')
const requests_handler = require('../controllers/requests')

const requests_router = express.Router()

requests_router.post('/get_my_requests', auth_middleware, requests_handler.get_my_requests)
requests_router.post('/take_action_on_request', auth_middleware, requests_handler.take_action_on_request)


module.exports = {
  requests_router
}