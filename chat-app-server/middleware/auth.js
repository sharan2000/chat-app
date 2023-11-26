const jwt = require('jsonwebtoken')

const auth_middleware = (req, res, next) => {
  const { authorization } = req.headers
  const authentication_data = isAuthenticated(authorization)

  if(authentication_data.is_authenticated) {
    req.body['user_data'] = authentication_data.user_data
    next()
  } else {
    res.status(401).json({
      message: 'Unauthorized. You do not have privilages to access this.'
    })
  }
}

const auth_socket_middleware = (socket, next) => {
  const authorization = socket.handshake.auth['Authorization'];
  const authentication_data = isAuthenticated(authorization)

  if(authentication_data.is_authenticated) {
    socket.username = authentication_data.user_data.username
    next()
  } else {
    const err = new Error('Unauthorized. You do not have privilages to access this.');
    next(err);
  }
}

const isAuthenticated = (authorization) => {
  let authentication_data = {
    is_authenticated: false,
    user_data: {}
  }
  try {
    if(authorization.includes('BEARER ')) {
      const jwtoken = authorization.slice(7)
      const user_data = jwt.verify(jwtoken, process.env.JWT_SECRET)
      authentication_data = {
        is_authenticated: true,
        user_data
      }
    }
  } catch(err) {
    console.log('user not authorized -- ', err)
  }
  return authentication_data
}


module.exports = {
  auth_middleware,
  auth_socket_middleware
}