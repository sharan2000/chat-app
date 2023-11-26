const Users = require("../models/users")

const getUsersForChatWithStatus = async (store) => {
 const users = await Users.query().select('username')
 
 let store_users = await store.all((err, sessions) => { 
  if(!err) {
    console.log('sessions -- ', sessions)
  } else {
    console.log('could not get the sessions -- ')
  }
 })
 console.log('store users -- ', store_users)
 return users
}


module.exports = {
  getUsersForChatWithStatus
}