const { raw } = require('objection');
const UserRequests = require('../models/user_requests')
const Users = require("../models/users")

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

module.exports = {
  get_my_requests
}