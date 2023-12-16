const Users = require("../models/users")
const Messages = require("../models/messages")
const { getSessionStoreObject } = require('../knexConnection')
const { raw } = require("objection")

/*
  - generally we should get this romm names from the database.
  - in the database the user with admin status will add rooms.
  - whenever a new user logs in we send him the users list along with the rooms list
  - for now we just use this const array. Adding admin panel and giving option to add rooms is a enhancement
*/
const ROOMS = ['room1', 'room2', 'room3']

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

const getRoomsData = () => {
  // normally we should write a query to get rooms data from the DB. For now we use the const array
  const data = {}
  ROOMS.forEach(name => {
    data[name] = {
      room_name: name,
      // we can add any additional information in future
    }
  })
  return data
}

const addNewMessage = async (messageData) => {
  await Messages.query().insert({
    from: messageData.from,
    to: messageData.to,
    message: messageData.message,
    time: messageData.time
  })
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
    .select(raw(`${mtn}.from as name, ${mtn}.message, DATE_FORMAT(${mtn}.time, '%Y-%m-%dT%TZ') as time`)) // converting to ISO so that frontend can parse it to local time
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

const getChatForRoom = async (req, res, next) => {
  console.log("entered into api : /get_chat_for_room");
  let messages, success, status, error
  try {
    const payload = req.body
    const { to } = payload
    console.log('payload -- ', payload)

    // get messages
    const mtn = Messages.tableName
    messages = await Messages.query()
    .select(raw(`${mtn}.from as name, ${mtn}.message, DATE_FORMAT(${mtn}.time, '%Y-%m-%dT%TZ') as time`)) // converting to ISO so that frontend can parse it to local time
    .where(raw(`${mtn}.to = ?`, to))
    .orderBy('time')
    console.log('room messages are -- ', messages)

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
  addNewMessage,
  getRoomsData,
  getChatForRoom
}