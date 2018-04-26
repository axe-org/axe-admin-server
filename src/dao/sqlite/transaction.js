// 为sqlite3提供 transaction接口
const sqlite = require('sqlite')
let dbFile
// 这里 transcation用法
// transaction().then(tr => {
//   tr.run(`xxx`)
//   tr.run(`xxx`)
//   ...
//   return tr.commit()
// }).then(() => {
//   success
// }).catch((err) => {
//   failed
// })
function transaction (filename) {
  if (filename) {
    dbFile = filename
  } else {
    let error
    return sqlite.open(dbFile, {Promise}).then((db) => {
      // db.driver 私有方法。。。。
      db.driver.serialize()
      // 开启外键。
      db.exec('PRAGMA foreign_keys = ON')
      db.exec('BEGIN EXCLUSIVE;')
      return {
        exec: function (sql, args) {
          return db.exec(sql, args).catch(err => {
            error = err
          })
        },
        run: function (sql, args) {
          return db.run(sql, args).catch(err => {
            error = err
          })
        },
        commit: function () {
          // 这个sql语句本事是不可能出错的。。。
          return db.run(`SELECT sqlite_version();`).then(() => {
            if (error) {
              // 如果有错误，则回滚
              db.exec('ROLLBACK;').catch(err => {
                console.log('事务回滚失败 : ' + err.message)
                db.close()
              }).then(() => {
                db.close()
              })
              return Promise.reject(error)
            } else {
              return db.exec('COMMIT;').catch(err => {
                console.log('事物提交失败 ： ' + err.message)
                db.close()
              }).then(() => {
                db.close()
              })
            }
          })
        }
      }
    })

    // let db = sqlite.open(dbFile, {Promise})
    // let error
    // return {
    //   serialize: function (callback) {
    //     return db.serialize(callback)
    //   },
    //   begin: function () {
    //     return db.exec('BEGIN EXCLUSIVE;')
    //   },
    //   exec: function (sql, args) {
    //     return db.exec(sql, args).catch(err => {
    //       error = err
    //     })
    //   },
    //   run: function (sql, args) {
    //     return db.run(sql, args).cathc(err => {
    //       error = err
    //     })
    //   },
    //   commit: function (callback) {
    //     // 这个sql语句本事是不可能出错的。。。
    //     return db.run(`SELECT sqlite_version();`).then(() => {
    //       if (error) {
    //         // 如果有错误，则回归
    //         db.exec('ROLLBACK;').catch(err => {
    //           console.log('事务回滚失败 : ' + err.message)
    //           db.close()
    //         }).then(() => {
    //           db.close()
    //         })
    //         return Promise.reject(error)
    //       } else {
    //         return db.exec('COMMIT;').catch(err => {
    //           console.log('事物提交失败 ： ' + err.message)
    //           db.close()
    //         }).then(() => {
    //           db.close()
    //         })
    //       }
    //     })
    //   }
    // }
  }
}

module.exports = transaction
