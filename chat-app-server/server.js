const express = require('express')
const dotenv = require('dotenv')
const http = require("http");
const session = require('express-session')

const knexConnection = require("./knexConnection.js")
const { chat_router } = require('./routes/chat.js')
const { auth_router } = require('./routes/auth.js')
const { auth_middleware } = require('./middleware/auth.js')
const socketFile = require('./socket')
const chat_socket = require('./controllers/chat_socket.js')

knexConnection.initializeKnex() //initializing knex connection and linking all models to knex
dotenv.config()// reading the '.env' file and configuring our environment variables with it

const app = express()
const server = http.createServer(app)

// getting knex session store onject
const store = knexConnection.getSessionStoreObject()

// creating session middleware 
const sessionMiddleware = session({
  secret: 'my session secret',
  resave: false,
  saveUninitialized: false,
  store
})

//setting headers to remove cors error
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method == "OPTIONS") {
    return res.sendStatus(200);
  }
  next()
})

app.use(express.json())

// single dummy dashboard route. That checks the users token
app.get('/dashboard_data', auth_middleware, (req, res, next) => {
  console.log('user data in dashboard route -- ', req.body.user_data)
  res.status(200).json({
    message: 'This is the dashboard.'
  })
})
app.use([auth_router, chat_router])

server.listen(process.env.SERVER_PORT)
let socket_server_started = socketFile.initSocketServer(server)
if(socket_server_started) {
  // after socket server is successfully started we will use session middleware that will give a session object to every new connection
  const io = socketFile.getSocketIO()
  io.engine.use(sessionMiddleware)

  chat_socket.initializeChatSocket()
}

console.log(`Server started on port => ${process.env.SERVER_PORT}`)
