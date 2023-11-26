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
    // identifies if the user is reconnecting or new user. Then reuses the old session or initializes a new session
    let {identified_session, identified_session_id } = await identify_and_set_session(socket)
    socket.session_id = identified_session_id
    socket.session_force_expired = false

    socket.emit('users_data', await getUsersForChatWithStatus(getSessionStoreObject()))

    socket.on('send_message', (body) => {
      console.log("user sent a message --  ", body);
      chatNamespace.emit('new_message', body)
    })

    // when  user closes the window or clicks logout then we need to remove the session token
    socket.on('user_exit', async () => {
      socket.session_force_expired = true
      identified_session.cookie.expires = new Date('1970-1-1')

      await (new Promise((resolve, reject) => {
        identified_session.save((err) => {
          if(err) {
            reject(err)
          }
          else {
            ;[ identified_session, identified_session_id ] = [undefined, undefined]
            console.log('user session deleted for db -- ', identified_session, identified_session_id)
            resolve()
          }
        })
      })).catch((err) => {
        socket.session_force_expired = false
        console.log('could not destroy the session in db -- ')
        console.log(err)}
      )
      console.log("user closed the screen so closed session ********  ");
    })

    socket.on("disconnecting", async () => {
      console.log('here val in disconnect -- ', socket.session_force_expired)
      // change status only if user is disconnected. If the user exits the app we already delete the session in 'user_exit' event
      if(!socket.session_force_expired) {
        identified_session.user_data.connected = false
        await (new Promise((resolve, reject) => {
          getSessionStoreObject().set(identified_session_id, identified_session, (err) => {
            if(err) { reject(err) }
            else { resolve() }
          })
        })).catch((err) => {
          console.log('could not set the user status to disconnected when socket disconnected -- ', err)
        })
      }
      
      // chatNamespace.emit('new_message', {
      //   username: socket.username,
      //   message: 'user disconnected',
      //   message_type: 'connection_status'
      // })
    });
  })
}


const identify_and_set_session = async (socket) => {
  let identified_session, identified_session_id

  // getting the sessiontoken if it is sent. It means that a old user reconnected. Or we create a new sessiontoken and pass to store in session storage of client
  let session_token = socket.handshake.auth['session_token']
  console.log('auth data -- ', socket.handshake.auth)
  if(session_token) {
    try {
      // check if valid session token by getting the linked session object
      const session = await new Promise((resolve, reject) => {
        getSessionStoreObject().get(session_token, (err, session) => {
          if(err) {
            console.log('could not get the session object -- ', err)
            reject()
          } else {
            console.log('session fetched -- ', session)
            resolve(session)
          }
        })
      })

      console.log('session object -- ', session)
      if(session) {
        // session is there
        identified_session = session
        identified_session_id = session_token
      } else {
        throw new Error('create session in catch block')
      }  
    } catch(err) {
      console.log('in error')
      identified_session = socket.request.session;
      identified_session_id = socket.request.session.id
    }
  } else {
    identified_session = socket.request.session;
    identified_session_id = socket.request.session.id
  }

  identified_session.user_data = {
    username: socket.username,
    connected: true 
  }
  await new Promise((resolve, reject) => {
    getSessionStoreObject().set(identified_session_id, identified_session, (err) => {
      if(err) {
        console.log('could not set the identified session object -- ', err)
        reject()
      } else {
        socket.emit('connected_to_session', identified_session_id)
        resolve()
      }
    })
  })
  // above code is used to identify if the user is reconnecting or not and based on that we create a new session or use an existing one for that user

  return {
    identified_session,
    identified_session_id
  }
}


module.exports = {
  initializeChatSocket
}