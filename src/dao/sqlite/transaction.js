// 为sqlite3提供 transaction接口
const sqlite3 = require('sqlite3')
let dbFile
function transaction (filename) {
  if (filename) {
    dbFile = filename
  } else {
    let db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE)
    let error
    return {
      serialize: function (callback) {
        db.serialize(callback)
      },
      begin: function () {
        db.exec('BEGIN EXCLUSIVE;')
      },
      exec: function (sql, args) {
        db.exec(sql, args, err => {
          error = err
        })
      },
      run: function (sql, args) {
        db.run(sql, args, err => {
          error = err
        })
      },
      commit: function (callback) {
        db.run(`SELECT sqlite_version();`, () => {
          if (error) {
            db.exec('ROLLBACK;', err => {
              callback(error)
              if (err) {
                console.log('事务回滚失败 ' + err.message)
              }
              db.close()
            })
          } else {
            db.exec('COMMIT;', err => {
              if (err) {
                console.log('事务提交失败 ' + err.message)
                callback(err)
              } else {
                callback(null)
              }
              db.close()
            })
          }
        })
      }
    }
  }
}

module.exports = transaction
