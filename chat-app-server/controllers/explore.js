const Users = require("../models/users")
const Rooms = require("../models/rooms")
const Friends = require("../models/friends");
const UserRooms = require("../models/user_rooms")
const UserRequests = require('../models/user_requests')

const moment = require('moment');
const { raw } = require("objection");

const { getChatNamespace } = require('../controllers/chat_socket')


const get_all_users = async (req, res) => {
  console.log("entered into api : /get_all_users");
  let users_data = {}
  let success, status = 200
  try {
    const { user_id } = req.body
    let sent_requests = [], users = [], in_request = {}
    let promiseArr = []
    // to get all users and a flag telling if they are friends of mine
    promiseArr.push(
      Friends.query()
      .select('utn.id', 'utn.username', raw('if(ISNULL(ftn.id), 0, 1) as connected'))
      .from(raw(`${Users.tableName} as utn`))
      .leftOuterJoin(raw(`${Friends.tableName} as ftn`), function() {
        this
          .on(raw('(utn.id = ftn.user2_id AND ftn.user1_id = :user_id)', { user_id }))
          .orOn(raw('(utn.id = ftn.user1_id AND ftn.user2_id = :user_id)', { user_id }))
      })
      .where('utn.id', '<>', user_id)
    )
    // to get all the sent and received requests of user to hide add button
    promiseArr.push(
      UserRequests.query().alias('urt')
      .select(raw('if(urt.from_user_id = :user_id, to_user_id, from_user_id) as sent_to_user_id', { user_id }))
      .where('urt.from_user_id', '=', user_id)
      .orWhere('urt.to_user_id', '=', user_id)
    )

    ;[users, sent_requests] = await Promise.all(promiseArr)
    // preparing data in a format that shows the persons from whom i received requests or sent requests to.
    for(let uobj of sent_requests) {
      in_request[uobj.sent_to_user_id] = true
    }

    for(let user of users) {
      users_data[user.id] = {
        ...user,
        in_request: in_request[user.id] ? true : false
      }
    }

    console.log('--here -- ', users_data)

    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
    users: users_data
  })
}

const get_all_rooms = async (req, res) => {
  console.log("entered into api : /get_all_rooms");
  let rooms = []
  let success, status = 200
  try {
    const { user_id } = req.body

    // to get all rooms the user is in
    rooms = await Rooms.query()
      .select('rtn.id', 'rtn.roomname', raw('if(ISNULL(urtn.id), 0, 1) as connected'))
      .from(raw(`${Rooms.tableName} as rtn`))
      .leftOuterJoin(raw(`${UserRooms.tableName} as urtn`), function() {
        this.on(raw('(rtn.id = urtn.room_id AND urtn.user_id = :user_id)', { user_id }))
      })

    console.log('--here -- ', rooms)

    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
    rooms
  })
}

const add_or_remove_user_friend = async (req, res) => {
  console.log("entered into api : /add_or_remove_user_friend");
  let success, status = 200
  try {
    let { type, my_user_id, friend_user_id, my_user_name, friend_user_name } = req.body
    // type '1' means add as friend, type '2' means remove as friend
    if(type === 1) {
      // in some extreme cases a user can duplicate requests so first we check if the request is already there
      let prevReq = await UserRequests.query()
      .select('id')
      .whereRaw('(from_user_id = :my_user_id and to_user_id = :friend_user_id) or (from_user_id = :friend_user_id and to_user_id = :my_user_id)', { my_user_id, friend_user_id })
      if(prevReq.length) {
        throw new Error("request already sent to the user")
      }

      let currtime = moment.utc() // getting UTC time (Coordinated Universal Time returns value irrespective of time zones)
      const queryres = await UserRequests.query().insert({
        from_user_id: my_user_id,
        to_user_id: friend_user_id,
        sent_at: currtime.format('Y-MM-DD HH:mm:ss.SSSSSS') // changing to db accepted format of time
      })
      console.log(queryres)

      /*
        - here we should do some actions.
        1)this request should be modeled to correct format and emit an event to both the users
          this emmitted data is used both in requests page to display a new row. This is also used
          in explore page where we change the button to 'in requests' in both the pages.
      */
      
      let common_event_data = {
        id: queryres.id, // id in user_requests table
        sent_at: currtime.toISOString(), // converting to ISO so that frontend can parse it to local time
      }

      // emitting the events to their the respective users by using a custom event
      getChatNamespace().to(my_user_name).emit('user_request', {
        user_id: friend_user_id,
        data: {
          ...common_event_data,
          username: friend_user_name, // for the sent user it will be friend_name
          type: 'sent' // for sent-user it is 'sent'
        }
      })
      getChatNamespace().to(friend_user_name).emit('user_request', {
        user_id: my_user_id,
        data: {
          ...common_event_data,
          username: my_user_name, // for the friend it will be sent_user_name
          type: 'received' // for friend it will be 'received'
        }
      })

    } else if(type === 2) {
      let res = await Friends.query().delete().whereRaw(`(user1_id = :my_user_id and user2_id = :friend_user_id) or (user1_id = :friend_user_id and user2_id = :my_user_id)`, { my_user_id, friend_user_id })
      
      console.log('res -- ', res)
      if(res) { // if the friends link has been deleted then we can send a event to the friend and the user who clicked unfriend
        getChatNamespace().to(friend_user_name).emit('user_unfriended', {
          user_id: my_user_id,
          user_name: my_user_name
        })
      }
      // if the user clicked the button after coming online (already other user unfriended him when he is offline in network) then his button should be updated
      getChatNamespace().to(my_user_name).emit('user_unfriended', {
        user_id: friend_user_id,
      })

    } else {
      throw new Error('Invalid type for action')
    }

    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
  })
}

const add_or_remove_user_room = async (req, res) => {
  console.log("entered into api : /add_or_remove_user_room");
  let success, status = 200
  try {
    let payload = req.body
    console.log('payload is -- ', payload)
    if(payload.type === 1) { // add room to user
      let existing_record = await UserRooms.query()
      .select('*')
      .where('user_id', payload.my_user_id)
      .andWhere('room_id', payload.room_id)

      if(existing_record.length === 0) {
        await UserRooms.query().insert({
          user_id: payload.my_user_id,
          room_id: payload.room_id
        })
      }

    } else if (payload.type === 2) {
      // remove room to user
      await UserRooms.query()
      .delete()
      .where('user_id', payload.my_user_id)
      .andWhere('room_id', payload.room_id)
    }
    
    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
  })
}

module.exports = {
  get_all_users,
  get_all_rooms,
  add_or_remove_user_friend,
  add_or_remove_user_room
}