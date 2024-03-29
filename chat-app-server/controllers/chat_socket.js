const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const { auth_socket_middleware } = require('../middleware/auth');
const { getSocketIO } = require('../socket')
const { getSessionStoreObject } = require('../knexConnection')

const { getFriendsForUser, getRoomsForUser, addNewMessage, getChatRoomDetails } = require("./chat")

let socketIO, chatNamespace

const initializeChatSocket = () => {
  socketIO = getSocketIO()
  chatNamespace = socketIO.of("/chat");

  // middleware to check the authorization whena new socket is connect to this namespace
  chatNamespace.use(auth_socket_middleware);

  chatNamespace.on('connection', async (socket) => {
    socket.emit('send_user_session_token')
    // identifies if the user is reconnecting or new user. Then reuses the old session or initializes a new session

    socket.on('user_session_token', async (user_session_token) => {
      socket.session_id = await identify_and_set_session(socket, user_session_token)
      socket.session_force_expired = false

      const roomsData = await getRoomsForUser()

      // we should add our user to all the rooms
      roomsData.forEach((room_name) => {
        socket.join(room_name);
      })

      socket.broadcast.emit('user_connection_status', {
        username: socket.username,
        connected: true
      })
      // for single one to one communication we create a room with the username
      socket.join(socket.username);
    })

    socket.on('send_message', async (messageData) => {
      console.log("user sent a message --  ", messageData);
      try {
        let currtime = moment.utc() // getting UTC time (Coordinated Universal Time returns value irrespective of time zones)
        console.log('*************** here ****************', currtime)
        messageData.time = currtime.format('Y-MM-DD HH:mm:ss.SSSSSS');
        await addNewMessage(messageData)
        // if the message is sent to a user then we do this
        if(messageData.selected_is_user) {
          chatNamespace.to(messageData.from).to(messageData.to).emit('new_message', {
            from: messageData.from,
            to: messageData.to,
            message: messageData.message,
            time: currtime.toISOString(), // converting to ISO so that frontend can parse it to local time
            is_room: false
          })
        } else {
        // if a message is sent to a room we do this
          chatNamespace.to(messageData.to).emit('new_message', {
            from: messageData.from,
            to: messageData.to,
            message: messageData.message,
            time: currtime.toISOString(), // converting to ISO so that frontend can parse it to local time
            is_room: true
          })
        }
      } catch(err) {
        console.log('Error could not send user message -- ', err)
      }
    })

    // when  user closes the window or clicks logout then we need to remove the session token
    socket.on('user_exit', async () => {
      socket.session_force_expired = true

      await deleteSession(socket.session_id).then(() => {
        socket.broadcast.emit('user_connection_status', {
          username: socket.username,
          connected: false
        })
      }).catch((err) => {
        socket.session_force_expired = false
        console.log(err)}
      )
    })

    socket.on('emit_new_room_details', async (roomname) => {
      let roomDetails = await getChatRoomDetails(roomname)
      chatNamespace.emit('new_room_added', roomDetails)
    })

    socket.on('join_new_room', async (roomname) => {
      socket.join(roomname);
    })

    socket.on("disconnecting", async () => {
      // change status only if user is disconnected (his internet is down or went offline). If the user exits the app we already delete the session in 'user_exit' event
      if(!socket.session_force_expired) {
        const identified_session = await getSession(socket.session_id).catch((err) => { console.log(err) })
        identified_session.user_data.connected = false
        await setSession(socket.session_id, identified_session).then(() => {
          socket.broadcast.emit('user_connection_status', {
            username: socket.username,
            connected: false
          })
        }).catch((err) => {
          console.log('could not set the user status to disconnected when socket disconnected -- ', err)
        })
      }
    });
  })
}

const identify_and_set_session = async (socket, user_session_token) => {
  let identified_session, identified_session_id, exp_date, duration = 24 * 60 * 60 * 1000

  let session_token = user_session_token
  console.log('incoming connecting data -- ', socket.username, ' => ', session_token)
  try {
    if(session_token) {
      const session = await getSession(session_token)

      if(session) {
        identified_session = session
        identified_session_id = session_token
      } else {
        throw new Error('create session in catch block')
      }  
    } else {
      throw new Error('create session in catch block')
    }
  } catch(err) {
    identified_session_id = uuidv4()
    identified_session = {
      "cookie": {
        "expires": '', 
      }, 
      "user_data": {}
    }
  }
  
  exp_date = new Date()
  exp_date.setTime(exp_date.getTime() + duration);
  identified_session.cookie.expires = exp_date
  identified_session.user_data = {
    "username": socket.username, 
    "connected": true
  }

  await setSession(identified_session_id, identified_session).then(() => {
    socket.emit('connected_to_session', identified_session_id)
  }).catch((err) => { console.log(err) })

  return identified_session_id
}

const getSession = async (sessionId) => {
  return new Promise((resolve, reject) => {
    getSessionStoreObject().get(sessionId, (err, session) => {
      if(err) {
        reject(err)
      } else {
        resolve(session)
      }
    })
  }) 
}


const setSession = async (sessionId, sessionObject) => {
  return new Promise((resolve, reject) => {
    getSessionStoreObject().set(sessionId, sessionObject, (err) => {
      if(err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}



const deleteSession = async (sessionId) => {
  return new Promise((resolve, reject) => {
    getSessionStoreObject().destroy(sessionId, (err) => {
      if(err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const getChatNamespace = () => {
  return chatNamespace
}


module.exports = {
  getChatNamespace,
  initializeChatSocket
}