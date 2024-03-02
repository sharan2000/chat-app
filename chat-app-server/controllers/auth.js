const Users = require("../models/users")

const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs")

const login = async (req, res) => {
  let message, errors = {}
  try {
    console.log("entered into api : /login");
    const payload = req.body
    console.log('payload -- ', payload)
    
    const { email, password } = payload 

    // check if details
    const user_data = await Users.query().select('id', 'email', 'password', 'username').where('email', email)
    if(user_data.length === 0) {
      errors['email'] = true
    }
    else  {
      //compare passwords
      const valid_password = await bcrypt.compare(password, user_data[0].password);
      if(!valid_password) {
        errors['password'] = true
      }
    }

    // check if errors exist then throw it
    if(Object.keys(errors).length > 0) {
      message = 'email or password error'
      throw new Error()
    }

    let token = jwt.sign(
      {
        id: user_data[0].id,
        email: user_data[0].email,
        username: user_data[0].username
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: 60 * 60 } // takes in seconds
    );
    token = 'BEARER ' + token

    res.status(200).json({
      token,
      user_data: {
        id: user_data[0].id,
        email: user_data[0].email,
        username: user_data[0].username
      },
      success: true,
      message: 'login successful',
      errors
    })
  }
  catch (error) {
    console.log("Error -- ", error.message)
    res.status(200).json({
      success: false,
      message: message || "Internal Server Error",
      errors
    })
  }
}

const signup = async (req, res) => {
  let message, errors = {}
  try {
    console.log("entered into api : /signup");
    const payload = req.body
    console.log('payload -- ', payload)

    const { email, username, password } = payload 
    
    // check if user name already exists
    const duplicate_username = await Users.query().select('username').where('username', username)
    if(duplicate_username.length > 0) {
      errors['username'] = true
    }

    // check if email already exists
    const duplicate_email = await Users.query().select('email').where('email', email)
    if(duplicate_email.length > 0) {
      errors['email'] = true
    }

    // check if errors exist then throw it
    if(Object.keys(errors).length > 0) {
      message = 'email or username error'
      throw new Error()
    }
    
    // hash password then add details into table
    const hashed_password = await bcrypt.hash(password, 8)
    await Users.query().insert({
      email,
      password: hashed_password,
      username
    });
    
    res.status(200).json({
      success: true,
      message: 'signup successful',
      errors
    })
  } 
  catch (error) {
    console.log("Error -- ", error.message)
    res.status(200).json({
      success: false,
      message: message || "Internal Server Error",
      errors
    })
  }
}




module.exports = {
  login,
  signup
}