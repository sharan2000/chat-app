const { v4: uuidv4 } = require('uuid');

const { auth_socket_middleware } = require('../middleware/auth');
const { getSocketIO } = require('../socket')
const { getSessionStoreObject } = require('../knexConnection')

const { getUsersForChatWithStatus } = require("./chat")

const initializeChatSocket = () => {
  const socketIO = getSocketIO()
  const chatNamespace = socketIO.of("/chat");

  // middleware to check the authorization whena new socket is connect to this namespace
  chatNamespace.use(auth_socket_middleware);

  chatNamespace.on('connection', async (socket) => {
    socket.emit('send_user_session_token')
    // identifies if the user is reconnecting or new user. Then reuses the old session or initializes a new session

    socket.on('user_session_token', async (user_session_token) => {
      socket.session_id = await identify_and_set_session(socket, user_session_token)
      socket.session_force_expired = false

      chatNamespace.emit('users_data', await getUsersForChatWithStatus())
    })

    socket.on('send_message', (body) => {
      console.log("user sent a message --  ", body);
      chatNamespace.emit('new_message', body)
    })

    // when  user closes the window or clicks logout then we need to remove the session token
    socket.on('user_exit', async () => {
      socket.session_force_expired = true

      await deleteSession(socket.session_id).catch((err) => {
        socket.session_force_expired = false
        console.log(err)}
      )
    })

    socket.on("disconnecting", async () => {
      // change status only if user is disconnected. If the user exits the app we already delete the session in 'user_exit' event
      if(!socket.session_force_expired) {
        const identified_session = await getSession(socket.session_id).catch((err) => { console.log(err) })
        identified_session.user_data.connected = false
        await setSession(socket.session_id, identified_session).catch((err) => {
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


module.exports = {
  initializeChatSocket
}