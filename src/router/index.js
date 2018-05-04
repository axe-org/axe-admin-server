const dispatchUser = require('./user')
const dispatchAPP = require('./app')
const dispatchTimeline = require('./timeline')
const dispatchModule = require('./module')
const dispatchJenkins = require('./jenkins')
const dispatchImportRouter = require('./import')
const config = require('../config')

function dispatchRouter (app) {
  dispatchUser(app)
  dispatchAPP(app)
  dispatchTimeline(app)
  dispatchModule(app)
  dispatchJenkins(app)
  dispatchImportRouter(app)
  app.get('/api/config', (req, res) => {
    res.json(config.webConfig)
  })
}

module.exports = dispatchRouter
