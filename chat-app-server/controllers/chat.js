const Users = require("../models/users")
const Messages = require("../models/messages")
const { getSessionStoreObject } = require('../knexConnection')
const { raw } = require("objection")

const getUsersForChatWithStatus = async () => {
  let users = [], store_users = []
  try {
    users = await Users.query().select('username').orderBy('username')
    store_users = await getAllSessions()

    console.log('users -- ', users),
    console.log('store users -- ', store_users)
  } catch(err) {
    console.log("error in getUsersForChatWithStatus -- ", err)
  }
  let userDetailsAndRoomsObject = {}
  users.forEach(userData => {
    userDetailsAndRoomsObject[userData.username] = {
      username: userData.username,
      connected: false
    }
  })

  store_users.forEach(store_user => {
    userDetailsAndRoomsObject[store_user.user_data.username] = {
      username: store_user.user_data.username,
      connected: store_user.user_data.connected
    }
  })

  console.log(userDetailsAndRoomsObject)
  return userDetailsAndRoomsObject
}

const addNewMessage = async (messageData) => {
  await Messages.query().insert(messageData)
  console.log('Message added succesfully')
}

const getAllSessions = async () => {
  return new Promise((resolve, reject) => {
    getSessionStoreObject().all((err, sessions) => { 
      if(err) {
        reject(err)
      } else {
        resolve(sessions)
      }
     })
  }) 
}

const getChat = async (req, res, next) => {
  console.log("entered into api : /get_chat");
  let messages, success, status, error
  try {
    const payload = req.body
    const { from, to } = payload
    console.log('payload -- ', payload)

    // get messages
    const mtn = Messages.tableName
    messages = await Messages.query()
    .select('from as name', 'message')
    .where(raw(`(${mtn}.from = ? AND ${mtn}.to = ?)`, from, to))
    .orWhere(raw(`(${mtn}.from = ? AND ${mtn}.to = ?)`, to, from))
    .orderBy('time')
    console.log('messages are -- ', messages)

    success = true
    status = 200
  } catch(err) {
    messages = []
    success = false
    status = 200
    error = 'Error when getting messages'
    console.log('error in get messages -- ', err)
  }
  res.status(status).json({
    messages,
    success,
    error
  })
}

module.exports = {
  getUsersForChatWithStatus,
  getChat,
  addNewMessage
}