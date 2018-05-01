const sqlite = require('sqlite')
const path = require('path')
const config = require('../../config')
const transaction = require('./transaction')

const userDAO = require('./user')
const appDAO = require('./app')
const timelineDAO = require('./timeline')
const moduleDAO = require('./module')
const importDAO = require('./import')
// 初始化数据库。
function initDB () {
  let file = path.join(config.workPath, 'db.sqlite3')
  let db
  return sqlite.open(file, {Promise}).then(ret => {
    db = ret
    return db.exec('PRAGMA foreign_keys = ON') // 需要手动打开外键
  }).then(db => {
    return Promise.all([userDAO.initDB(db), appDAO.initDB(db), timelineDAO.initDB(db), moduleDAO.initDB(db), importDAO.initDB(db)])
  }).then(() => {
    transaction(file)
  })
}

module.exports = {
  initDB: initDB,
  userDAO: userDAO,
  appDAO: appDAO,
  timelineDAO: timelineDAO,
  moduleDAO: moduleDAO,
  importDAO: importDAO
}
