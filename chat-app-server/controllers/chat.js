const Users = require("../models/users")
const Messages = require("../models/messages")
const Rooms = require("../models/rooms")
const { getSessionStoreObject } = require('../knexConnection')
const { raw } = require("objection")

/*
  - generally we should get this room names from the database.
  - in the database the user with admin status will add rooms.
  - whenever a new user logs in we send him the users list along with the rooms list
  - for now we just use this const array. Adding admin panel and giving option to add rooms is a enhancement
*/

const getUsersAndRoomsData = async (req, res) => {
  console.log("entered into api : /get_users_and_rooms_data");
  let messages, success, status, error, data = {
    usersData: {},
    roomsData: {}
  }
  try {
    const payload = req.body
    const { email } = payload
    console.log('payload -- ', payload)

    const promiseArr = []
    promiseArr.push(getRoomsData())
    promiseArr.push(getUsersForChatWithStatus())

    ;[data.roomsData, data.usersData] = await Promise.all(promiseArr) 

    // get data here
    success = true
    status = 200
  } catch(err) {
    messages = []
    success = false
    status = 200
    error = 'Error when getting friends and rooms data'
    console.log('error in getUsersAndRoomsData -- ', err)
  }
  res.status(status).json({
    data,
    messages,
    success,
    error
  })
}

const getUsersForChatWithStatus = async () => {
  let users = [], store_users = []
  try {
    let promiseArr = []
    promiseArr.push(Users.query().select('username').orderBy('username'))
    promiseArr.push(getAllSessions())

    ;[users, store_users] = await Promise.all(promiseArr)

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

const getRoomsData = async () => {
  const data = {}
  try {
    let roomsData = await Rooms.query().select('roomname').orderBy('roomname')
    roomsData.forEach(room => {
      data[room.roomname] = {
        room_name: room.roomname,
        // we can add any additional information in future
      }
    })
  } catch(err) {
    console.log("error in getRoomsData -- ", err)
  }
  return data
}

const getRoomsForUser = async () => {
  const data = []
  try {
    let roomsData = await Rooms.query().select('roomname')
    roomsData.forEach(rmdata => {
      data.push(rmdata.roomname)
    })
  } catch(err) {
    console.log("error in getRoomsForUser -- ", err)
  }
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

const addNewChatRoom = async (req, res, next) => {
  console.log("entered into api : /add_new_chat_room");
  let success, status, error
  try {
    const payload = req.body
    console.log('payload -- ', payload)
    const { enteredRoomName } = payload
    let sameNameData = await Rooms.query().select('roomname').where('roomname', enteredRoomName)
    if(sameNameData.length) {
      throw new Error('Same room name exists. Please use another room name.')
    }

    await Rooms.query().insert({
      roomname: enteredRoomName
    })

    success = true
    status = 200
  } catch(err) {
    error = 'Same room exists. Try another name.'
    success = false
    status = 200
    console.log('error in get messages -- ', err)
  }
  res.status(status).json({
    success,
    error: {
      roomname: error
    }
  })
}

const getChatRoomDetails = async (roomname) => {
  /* 
    - async has no effect here. after adding db call in the future it will be used.
    - here we will get all the details of the room by querying the database with the given roomname.
    - For now we just return a simple roomobject
    - data to send about new room. this is in the same format as we send the usersandrooms data at the start
  */
  return {
    room_name: roomname
  }
}

module.exports = {
  getUsersAndRoomsData,
  getRoomsForUser,
  getUsersForChatWithStatus,
  getChat,
  addNewMessage,
  getRoomsData,
  getChatForRoom,
  addNewChatRoom,
  getChatRoomDetails
}