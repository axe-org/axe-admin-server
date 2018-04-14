const dispatchUser = require('./user')
const dispatchAPP = require('./app')
const dispatchTimeline = require('./timeline')

function dispatchRouter (app) {
  dispatchUser(app)
  dispatchAPP(app)
  dispatchTimeline(app)
}

module.exports = dispatchRouter
