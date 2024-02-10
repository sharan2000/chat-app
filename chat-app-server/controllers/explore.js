const Users = require("../models/users")
const Rooms = require("../models/rooms")
const Friends = require("../models/friends");
const UserRooms = require("../models/user_rooms")
const UserRequests = require('../models/user_requests')

const moment = require('moment');
const { raw } = require("objection");



const get_all_users_rooms = async (req, res) => {
  console.log("entered into api : /get_all_users_rooms");
  let data = {
    users: {},
    rooms: []
  }
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
    // to get all rooms the user is in
    promiseArr.push(
      Rooms.query()
      .select('rtn.id', 'rtn.roomname', raw('if(ISNULL(urtn.id), 0, 1) as connected'))
      .from(raw(`${Rooms.tableName} as rtn`))
      .leftOuterJoin(raw(`${UserRooms.tableName} as urtn`), function() {
        this.on(raw('(rtn.id = urtn.room_id AND urtn.user_id = :user_id)', { user_id }))
      })
    )
    ;[users, sent_requests,data.rooms] = await Promise.all(promiseArr)
    // preparing data in a format that shows the persons from whom i received requests or sent requests to.
    for(let uobj of sent_requests) {
      in_request[uobj.sent_to_user_id] = true
    }

    for(let user of users) {
      data.users[user.id] = {
        ...user,
        in_request: in_request[user.id] ? true : false
      }
    }

    console.log('--here -- ', data)

    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
    data
  })
}

const add_or_remove_user_friend = async (req, res) => {
  console.log("entered into api : /add_or_remove_user_friend");
  let success, status = 200
  try {
    let { type, my_user_id, friend_user_id } = req.body
    // type '1' means add as friend, type '2' means remove as friend
    if(type === 1) {
      let currtime = moment.utc() // getting UTC time (Coordinated Universal Time returns value irrespective of time zones)
      const queryres = await UserRequests.query().insert({
        from_user_id: my_user_id,
        to_user_id: friend_user_id,
        sent_at: currtime.format('Y-MM-DD HH:mm:ss.SSSSSS') // changing to db accepted format of time
      })
      console.log(queryres)
    } else if(type === 2) {
      // do something

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

module.exports = {
  get_all_users_rooms,
  add_or_remove_user_friend
}