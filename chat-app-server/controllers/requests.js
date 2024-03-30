const { raw } = require('objection');
const UserRequests = require('../models/user_requests')
const Friends = require('../models/friends')
const Users = require("../models/users");
const { getChatNamespace } = require('./chat_socket');

const get_my_requests = async (req, res, next) => {
  console.log("entered into api : /get_my_requests");
  let requests = []
  let success, status = 200
  try {
    console.log('payload -- ', req.body)
    const { my_user_id } = req.body

    // converting to ISO so that frontend can parse it to local time
    requests = await UserRequests.query()
    .select('urt.id', 'ut.username', raw("DATE_FORMAT(urt.sent_at, '%Y-%m-%dT%TZ') as sent_at, IF(urt.from_user_id = :my_user_id, 'sent', 'received') as type", { my_user_id }))
    .from(raw(`${UserRequests.tableName} as urt`))
    .innerJoin(raw(`${Users.tableName} as ut`), function() {
      this.on(raw('(urt.from_user_id = :my_user_id OR urt.to_user_id = :my_user_id) AND IF(urt.from_user_id = :my_user_id, urt.to_user_id, urt.from_user_id) = ut.id', { my_user_id }))
    })
    
    console.log('fetched requests --- ', requests)

    success = true
  } catch(err) {
    console.log('an error occured ', err)
    success = false
  }
  res.status(status).json({
    success,
    requests
  })
}

const take_action_on_request = async (req, res) => {
  let success = true, status = 200, action_success = false, action_taken_user_id
  console.log("entered into api : /take_action_on_request");
  try {
    console.log('payload -- ', req.body)

    const { request_id, type, other_username } = req.body
    const request_data = await UserRequests.query().where('id', request_id)
    console.log('fetched requests in action -- ', request_data)

    /*
      - a request can be accepted by any person from the two. one will be in requests page and other can be
      in chat screen with the 'action taking' user screen. So we should send the 'action takin' username to the
      other user to update the screeen and enable message box, since they are friends now.
    */

    if(request_data.length) {
      await UserRequests.transaction(async (trx) => {
        if (type === 1) {
          await Friends.query(trx).insert({
            user1_id: request_data[0].from_user_id,
            user2_id: request_data[0].to_user_id
          })
        }
        await UserRequests.query(trx).deleteById(request_id)
      })

      action_taken_user_id = req.body.user_data.id
      action_success = true
    } else {
      success = false
    }
    /*
      - type '1' means accepting request. We get the 'from, to' from requests table and add it to friends 
        only (if there is a record in requests table)
      - if there is no record then we ignore it.
      - in both the bove cases we need to delete the requests because action is performed.
      - type '2' means cancel (for requests i sent) or reject (for incoming requests) so just delete the record and send
        a socket notification
    */

    if(action_success) {
      // emitting the events to their the respective users by using a custom event so that they can update their requests page
      getChatNamespace().to(other_username).emit('request_action_performed', {action_taken_user_id, type, other_username : req.body.user_data.username, request_id})
      // action_taken_user_id is used to update the users explore page if he is in that page and cnange properties according to action type
    }
    // we emit request_id for the user who clicked any action. (handles the case where one of the user is offline)
    getChatNamespace().to(req.body.user_data.username).emit('request_action_performed', {request_id})
  } catch (err) {
    success = false
    console.log('error -- ', err)
  }
  return res.status(status).json({ success })
}

module.exports = {
  get_my_requests,
  take_action_on_request
}