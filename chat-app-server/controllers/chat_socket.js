const { auth_socket_middleware } = require('../middleware/auth');
const { getSocketIO } = require('../socket')

const initializeChatSocket = () => {
  const socketIO = getSocketIO()
  const chatNamespace = socketIO.of("/chat");

  // middleware to check the authorization whena new socket is connect to this namespace
  chatNamespace.use(auth_socket_middleware);

  chatNamespace.on('connection', (socket) => {
    // attaching user data to socket
    socket.data.user_data = socket['user_data']
    chatNamespace.emit('new_message', {
      username: socket['user_data']['username'],
      message: 'user is connected',
      message_type: 'connection_status'
    })

    socket.on('send_message', (body) => {
      console.log("user sent a message --  ", body);
      chatNamespace.emit('new_message', body)
    })

    socket.on("disconnecting", () => {
      chatNamespace.emit('new_message', {
        username: socket.data.user_data['username'],
        message: 'user disconnected',
        message_type: 'connection_status'
      })
    });
  })
}


module.exports = {
  initializeChatSocket
}