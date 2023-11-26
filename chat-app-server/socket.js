const socketio = require("socket.io");

let io

const initSocketServer = (server) => {
  try {
    io = new socketio.Server(server, {
      cors: {
        origin : "http://localhost:4200",
        credentials: true,
      },
    });
    console.log('Socket server started')
    // main root namespace
    io.on('connection', (socket) => {
      // console.log('a client has been connected to the server', socket)
    })
    return true
  } catch {
    return false
  }
}

const getSocketIO = () => {
  // console.log("getting socket object -- ", io)
  return io;
}

module.exports = {
  initSocketServer,
  getSocketIO
}