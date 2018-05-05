const dispatchUser = require('./user')
const dispatchAPP = require('./app')
const dispatchTimeline = require('./timeline')
const dispatchModule = require('./module')
const dispatchJenkins = require('./jenkins')
const dispatchImportRouter = require('./import')

function dispatchRouter (app) {
  dispatchUser(app)
  dispatchAPP(app)
  dispatchTimeline(app)
  dispatchModule(app)
  dispatchJenkins(app)
  dispatchImportRouter(app)
}

module.exports = dispatchRouter
