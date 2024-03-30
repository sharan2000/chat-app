const Users = require("../models/users")
const Messages = require("../models/messages")
const Rooms = require("../models/rooms")
const { getSessionStoreObject } = require('../knexConnection')
const { raw } = require("objection")
const Friends = require("../models/friends")
const UserRooms = require("../models/user_rooms")

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
    const { id, username } = req.body.user_data
    console.log('payload -- ', payload)

    const promiseArr = []
    promiseArr.push(getRoomsData(id, username))
    promiseArr.push(getUsersForChatWithStatus(id, username))

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

const getUsersForChatWithStatus = async (id, username) => {
  let users = [], store_users = []
  try {
    let promiseArr = []

    promiseArr.push(
      Friends.query()
        .alias('ftn')
        .select(raw('DISTINCT IF(ftn.user1_id = :id, ftn.user2_id, ftn.user1_id) as user_id', {id}))
        .where('ftn.user1_id', id)
        .orWhere('ftn.user2_id', id)
    )

    promiseArr.push(
      Messages.query()  // here we get user names and room names
        .alias('mtn')
        .select(raw('DISTINCT IF(mtn.from = :username, mtn.to, mtn.from) as user_name', {username}))
        .where('mtn.from', username)
        .orWhere('mtn.to', username)
    )

    let [dataForFriendsWithIds, dataForMessagedUsersWithNames] = await Promise.all(promiseArr)

    let ids = [id] // adding my_user_id to see an option to chat with myself
    let names = []
    dataForFriendsWithIds.forEach(ele => ids.push(ele.user_id))
    dataForMessagedUsersWithNames.forEach(ele => names.push(ele.user_name))

    promiseArr = []
    promiseArr.push(
      Users.query()
      .alias('ut')
      .select('username', 'id')
      .whereIn('ut.id', ids)
      .orWhereIn('ut.username', names)
      .orderBy('username')
    )
    promiseArr.push(getAllSessions())

    ;[users, store_users] = await Promise.all(promiseArr)

  } catch(err) {
    console.log("error in getUsersForChatWithStatus -- ", err)
  }

  console.log('users -- ', users, ' -- store users -- ', store_users)

  let userDetailsAndRoomsObject = {}
  users.forEach(userData => {
    userDetailsAndRoomsObject[userData.username] = {
      username: userData.username,
      connected: false,
      id: userData.id
    }
  })

  console.log('userDetailsAndRoomsObject -- ', userDetailsAndRoomsObject)
  console.log('store_users -- ', store_users)
  store_users.forEach(store_user => {
    if(userDetailsAndRoomsObject[store_user.user_data.username]) {
      userDetailsAndRoomsObject[store_user.user_data.username].connected = store_user.user_data.connected
    }
  })

  console.log(userDetailsAndRoomsObject)
  return userDetailsAndRoomsObject
}

const getRoomsData = async (id, username) => {
  const data = {}
  try {
    let promiseArr = []
    promiseArr.push(
      UserRooms.query()
        .alias('urt')
        .select('urt.room_id')
        .where('urt.user_id', id)
    )

    promiseArr.push(
      Messages.query()
        .alias('mtn')
        .select(raw('DISTINCT mtn.to')) // here we get user names and room names
        .where('mtn.from', username)
    )

    
    let [dataForRoomsWithIds, dataForMessagedRoomNames] = await Promise.all(promiseArr)

    let ids = []
    let names = []
    dataForRoomsWithIds.forEach(ele => ids.push(ele.room_id))
    dataForMessagedRoomNames.forEach(ele => names.push(ele.to))

    let roomsData = await Rooms.query()
    .select('roomname', 'id')
    .whereIn('id', ids)
    .orWhereIn('roomname', names)
    .orderBy('roomname')
    roomsData.forEach(room => {
      data[room.roomname] = {
        room_name: room.roomname,
        room_id: room.id
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
  let messages = [], success, status, error, is_connected = false
  try {
    const payload = req.body
    const from = req.body.user_data.username
    const from_id = req.body.user_data.id
    const { to, to_id } = payload // to is friend_user_name and to_id is friend_user_id
    console.log('payload -- ', payload)

    const promiseArr = []
    let friendsData = []

    // first check if there two are friends to enable sending messages
    promiseArr.push(
      Friends.query()
      .select('id')
      .whereRaw('(user1_id = :to_id and user2_id = :from_id) or (user1_id = :from_id and user2_id = :to_id)', {from_id, to_id})
    )

    // get messages
    const mtn = Messages.tableName
    promiseArr.push(
      Messages.query()
      .select(raw(`${mtn}.from as name, ${mtn}.message, DATE_FORMAT(${mtn}.time, '%Y-%m-%dT%TZ') as time`)) // converting to ISO so that frontend can parse it to local time
      .where(raw(`(${mtn}.from = ? AND ${mtn}.to = ?)`, from, to))
      .orWhere(raw(`(${mtn}.from = ? AND ${mtn}.to = ?)`, to, from))
      .orderBy('time')
    )

    ;[friendsData, messages] = await Promise.all(promiseArr)
    if(friendsData?.length || (from_id === to_id)) { is_connected = true }

    console.log('messages are -- ', messages)

    success = true
    status = 200
  } catch(err) {
    messages = []
    is_connected = false
    success = false
    status = 200
    error = 'Error when getting messages'
    console.log('error in get messages -- ', err)
  }
  res.status(status).json({
    messages,
    is_connected,
    success,
    error
  })
}

const getChatForRoom = async (req, res, next) => {
  console.log("entered into api : /get_chat_for_room");
  let messages = [], success, status, error, is_connected = false
  try {
    const payload = req.body
    const { to, to_id } = payload // to_id is the room_id
    const my_user_id = req.body.user_data.id
    console.log('payload -- ', payload)

    const promiseArr = []
    let roomData

    promiseArr.push(UserRooms.query().where('user_id', my_user_id).andWhere('room_id', to_id))

    // get messages
    const mtn = Messages.tableName
    promiseArr.push(
      Messages.query()
      .select(raw(`${mtn}.from as name, ${mtn}.message, DATE_FORMAT(${mtn}.time, '%Y-%m-%dT%TZ') as time`)) // converting to ISO so that frontend can parse it to local time
      .where(raw(`${mtn}.to = ?`, to))
      .orderBy('time')
    )

    ;[roomData, messages] = await Promise.all(promiseArr)
    if(roomData?.length) { is_connected = true }

    console.log('room messages are -- ', messages, roomData)

    success = true
    status = 200
  } catch(err) {
    messages = []
    is_connected = false
    success = false
    status = 200
    error = 'Error when getting messages'
    console.log('error in get messages -- ', err)
  }
  res.status(status).json({
    messages,
    is_connected,
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