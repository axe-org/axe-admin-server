const dispatchUser = require('./user')
const dispatchAPP = require('./app')
const dispatchTimeline = require('./timeline')
const dispatchModule = require('./module')
const dispatchJenkins = require('./jenkins')

function dispatchRouter (app) {
  dispatchUser(app)
  dispatchAPP(app)
  dispatchTimeline(app)
  dispatchModule(app)
  dispatchJenkins(app)
}

module.exports = dispatchRouter
