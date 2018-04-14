const sqlite3 = require('sqlite3')
const path = require('path')
const config = require('../../config')
const fs = require('fs')
const transaction = require('./transaction')

const userDAO = require('./user')
const appDAO = require('./app')
const timelineDAO = require('./timeline')
// 初始化数据库。
function initDB () {
  return new Promise((resolve, reject) => {
    let file = path.join(config.workPath, 'db.sqlite3')
    let mode = !fs.existsSync(file)
      ? sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
      : sqlite3.OPEN_READWRITE
    console.log('连接数据库')
    let db = new sqlite3.Database(file, mode, (err) => {
      if (err) {
        reject(err)
      } else {
        userDAO.initDB(db).then(() => {
          return appDAO.initDB(db)
        }).then(() => {
          return timelineDAO.initDB(db)
        }).catch((err) => {
          reject(err)
        }).then(() => {
          transaction(file)
          resolve()
        })
      }
    })
  })
}

module.exports = {
  initDB: initDB,
  userDAO: userDAO,
  appDAO: appDAO,
  timelineDAO: timelineDAO
}
