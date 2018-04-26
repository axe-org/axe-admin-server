// action 表， 记录系统中所有用户的操作。不包括动态路由和离线包
// action 实际就是最后展示给用户的一些通知。
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  return new Promise((resolve, reject) => {
    // action 表， 记录系统中所有用户的操作。不包括动态路由和离线包
    // id ,自增主键
    // user_id , 操作用户id
    // time , 操作时间
    // message , 操作形容。
    // type ， 类型 0表示用户管理操作,用户可看。 1表示app相关操作， 2表示模块操作
    // module_id , 模块操作对于具体模块id
    // version , 模块操作下时模块id， app操作下是appid。
    db.run(`CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(30) NOT NULL UNIQUE,
      email VARCHAR(30),
      password VARCHAR(32) NOT NULL,
      user_admin INT(1) NOT NULL,
      app_admin INT(1) NOT NULL,
      last_active DATETIME NOT NULL
    )`, (err) => {
      if (err) {
        reject(err)
      } else {
        // 创建用户分组表， 用于确定用户分组信息
        // userid 为用户id
        // module_name ，当为模块管理的类型时，指向模块ID。 module 改为使用name做唯一区分，方便查询。
        // module_id 设置module_id ,为了做外键，进行联动删除
        db.run(`CREATE TABLE IF NOT EXISTS user_group (
          user_id INTEGER NOT NULL,
          module_id INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  })
}

module.exports = {
  initDB: initDB
}
