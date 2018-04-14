// sql 实现， 这里使用 sqlite3
const Promise = require('bluebird')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  return new Promise((resolve, reject) => {
    // 建立用户信息表。表结构
    // name为用户名，用于登录
    // email 后续扩展，进行邮件通知
    // password 密码md5值
    // user_admin 用户管理员权限
    // app_admin APP管理权限
    // last_active 上次操作时间。
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
          module_name VARCHAR(30) NOT NULL,
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

// 添加分组权限信息。 groupinfo 的数据为 userId,moduleName,moduleId
function addGroupInfo (groupInfo) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO user_group VALUES  (?, ?, ?)`, [groupInfo.userId, groupInfo.moduleName, groupInfo.moduleId], err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 删除分组权限信息。 groupinfo 的数据为 userId,moduleId
function deleteGroupInfo (groupInfo) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM user_group WHERE user_id = ? AND module_id = ?`, [groupInfo.userId, groupInfo.moduleId], err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 获取用户信息, 当没有用户时，返回空。
function getUserInfo (userName) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM user WHERE name = ?', [userName], function (err, row) {
      if (err) {
        reject(err)
      } else {
        if (!row) {
          // reject(new Error('当前无用户 ' + userName))
          resolve(null)
        } else {
          resolve({
            userId: row.id,
            password: row.password,
            userName: row.name,
            lastActive: row.last_active,
            appAdmin: row.app_admin,
            userAdmin: row.user_admin
          })
        }
      }
    })
  })
}

// 返回值， 为userID.
function insertUser (userInfo) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO user VALUES (NULL, ? , NULL , ? , ? , ? ,DATETIME('now','localtime'))`,
      [userInfo.name, userInfo.password, userInfo.userAdmin, userInfo.appAdmin], function (err) {
        if (err) {
          reject(err)
        } else {
          let userId = this.lastID
          resolve(userId)
        }
      })
  })
}

// 刷新操作时间
function freshUser (userId) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE user SET last_active = DATETIME('now','localtime') WHERE id = ?;`, [userId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
// 获取用户权限分组信息。
function getUserGroups (userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM user_group WHERE user_id = ?', [userId],
      function (err, rows) {
        if (err) {
          reject(err)
        } else {
          let moduleList = []
          rows.forEach(function (row) {
            moduleList.push(row.module_name)
          })
          resolve({
            moduleList: moduleList
          })
        }
      })
  })
}

// 分页查询用户信息, 返回结果是 分页数据， 以及 总页数。
// 这里的页数是从0 开始的。
function getUsersByPage (pageNum, pageCount) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM user LIMIT ? OFFSET ?', [pageCount, pageCount * pageNum], function (err, rows) {
      if (err) {
        reject(err)
      } else {
        let array = []
        rows.forEach(function (row) {
          array.push({
            userId: row.id,
            password: row.password,
            userName: row.name,
            lastActive: row.last_active,
            appAdmin: row.app_admin,
            userAdmin: row.user_admin
          })
        })
        db.get('SELECT count(*) FROM user ', function (err, row) {
          if (err) {
            reject(err)
          } else {
            let count = row['count(*)']
            resolve({
              usersInfo: array,
              pageCount: parseInt(count / 12) + 1
            })
          }
        })
      }
    })
  })
}

function getbatchUserGroupsInfo (userIdList) {
  return new Promise((resolve, reject) => {
    let inList = '(' + userIdList.join(',') + ')'
    db.all('SELECT * FROM user_group WHERE user_id IN ' + inList, function (err, rows) {
      if (err) {
        reject(err)
      } else {
        let ret = {}
        userIdList.forEach((userId) => {
          ret[userId] = {
            moduleList: []
          }
        })
        rows.forEach(function (row) {
          ret[row.user_id].moduleList.push(row.module_name)
        })
        resolve(ret)
      }
    })
  })
}
// 设置用户密码
function setPassword (userId, password) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE user SET password = ? WHERE id = ?`, [password, userId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 设置用户权限
function setUserPermission (userId, userAdmin, appAdmin) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE user SET user_admin = ? , app_admin = ?  WHERE id = ?`, [userAdmin, appAdmin, userId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = {
  initDB: initDB,
  freshUser: freshUser,
  getUserInfo: getUserInfo,
  insertUser: insertUser,
  addGroupInfo: addGroupInfo,
  getUserGroups: getUserGroups,
  getUsersByPage: getUsersByPage,
  getbatchUserGroupsInfo: getbatchUserGroupsInfo,
  setPassword: setPassword,
  setUserPermission: setUserPermission,
  deleteGroupInfo: deleteGroupInfo
}
