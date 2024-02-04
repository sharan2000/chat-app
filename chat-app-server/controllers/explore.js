const Users = require("../models/users")
const Rooms = require("../models/rooms")
const Friends = require("../models/friends");
const UserRooms = require("../models/user_rooms")
const UserRequests = require('../models/user_requests')

const { raw } = require("objection");



const get_all_users_rooms = async (req, res, next) => {
  console.log("entered into api : /get_all_users_rooms");
  let data = {
    users: {},
    rooms: []
  }
  let success, status = 200
  try {
    const { user_id } = req.body
    let sent_requests = [], users = [], in_request = {}
    const [ftn, utn, rtn, urtn, urt] = [Friends.tableName, Users.tableName, Rooms.tableName, UserRooms.tableName, UserRequests.tableName]
    let promiseArr = []
    // to get all users and a flag telling if they are friends of mine
    promiseArr.push(
      Friends.query()
      .select(`${utn}.id`, `${utn}.username`, raw(`if(ISNULL(${ftn}.id), 0, 1) as connected`))
      .from(utn)
      .leftOuterJoin(ftn, function() {
        this
          .on(raw(`(${utn}.id = ${ftn}.user2_id AND ${ftn}.user1_id = :user_id)`, { user_id }))
          .orOn(raw(`(${utn}.id = ${ftn}.user1_id AND ${ftn}.user2_id = :user_id)`, { user_id }))
      })
      .where(`${utn}.id`, '<>', user_id)
    )
    // to get all the sent and received requests of user to hide add button
    promiseArr.push(
      UserRequests.query()
      .select(raw(`if(${urt}.from_user_id = :user_id, to_user_id, from_user_id) as sent_to_user_id`, { user_id }))
      .where(`${urt}.from_user_id`, '=', user_id)
      .orWhere(`${urt}.to_user_id`, '=', user_id)
    )
    // to get all rooms the user is in
    promiseArr.push(
      Rooms.query()
      .select(`${rtn}.id`, `${rtn}.roomname`, raw(`if(ISNULL(${urtn}.id), 0, 1) as connected`))
      .from(rtn)
      .leftOuterJoin(urtn, function() {
        this.on(raw(`(${rtn}.id = ${urtn}.room_id AND ${urtn}.user_id = :user_id)`, { user_id }))
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

module.exports = {
  get_all_users_rooms
}