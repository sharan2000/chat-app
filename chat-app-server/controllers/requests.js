

const get_my_requests = async (req, res, next) => {
  console.log("entered into api : /get_my_requests");
  let requests = []
  let success, status = 200
  try {
    // do something

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