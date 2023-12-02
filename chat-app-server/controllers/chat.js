const Users = require("../models/users")
const { getSessionStoreObject } = require('../knexConnection')

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
  let userDetailsObject = {}
  users.forEach(userData => {
    userDetailsObject[userData.username] = {
      username: userData.username,
      connected: false
    }
  })

  store_users.forEach(store_user => {
    userDetailsObject[store_user.user_data.username] = {
      username: store_user.user_data.username,
      connected: store_user.user_data.connected
    }
  })

  const userDetailsAndStatus = Object.values(userDetailsObject)
  console.log(userDetailsAndStatus)
  return userDetailsAndStatus
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

module.exports = {
  getUsersForChatWithStatus
}