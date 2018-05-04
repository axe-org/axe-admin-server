// sql 实现， 这里使用 sqlite3
const transaction = require('./transaction')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  // 建立用户信息表。表结构
  // name为用户名，用于登录
  // email 后续扩展，进行邮件通知
  // password 密码md5值
  // user_admin 用户管理员权限
  // app_admin APP管理权限
  // last_active 上次操作时间。
  return db.run(`CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(30),
    password VARCHAR(32) NOT NULL,
    user_admin INT(1) NOT NULL,
    app_admin INT(1) NOT NULL,
    last_active DATETIME NOT NULL
  )`).then(() =>
    // 创建用户分组表， 用于确定用户分组信息
    // userid 为用户id
    // module_name ，当为模块管理的类型时，指向模块ID。 module 改为使用name做唯一区分，方便查询。
    // module_id 设置module_id ,为了做外键，进行联动删除
    db.run(`CREATE TABLE IF NOT EXISTS user_group (
    user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
  )`))
}

// 添加分组权限信息。 groupinfo 的数据为 userId,moduleId
function addGroupInfo (groupInfo) {
  return db.run(`INSERT INTO user_group VALUES  (?, ?)`, [groupInfo.userId, groupInfo.moduleId])
}

// 删除分组权限信息。 groupinfo 的数据为 userId,moduleId
function deleteGroupInfo (groupInfo) {
  return db.run(`DELETE FROM user_group WHERE user_id = ? AND module_id = ?`, [groupInfo.userId, groupInfo.moduleId])
}

// 获取用户信息, 当没有用户时，返回空。
function getUserInfo (userName) {
  return db.get('SELECT * FROM user WHERE name = ?', [userName]).then(row => {
    if (!row) {
      // reject(new Error('当前无用户 ' + userName))
      return null
    } else {
      return {
        userId: row.id,
        password: row.password,
        userName: row.name,
        lastActive: row.last_active,
        appAdmin: row.app_admin,
        userAdmin: row.user_admin
      }
    }
  })
}

// 返回值， 为userID.
function insertUser (userInfo) {
  return db.run(`INSERT INTO user VALUES (NULL, ? , NULL , ? , ? , ? ,DATETIME('now','localtime'))`, [userInfo.name, userInfo.password, userInfo.userAdmin ? 1 : 0, userInfo.appAdmin ? 1 : 0]).then(stmt => {
    return stmt.lastID
  })
}

// 刷新操作时间
function freshUser (userId) {
  return db.run(`UPDATE user SET last_active = DATETIME('now','localtime') WHERE id = ?;`, [userId])
}
// 获取用户权限分组信息。
function getUserGroups (userId) {
  return db.all('SELECT name,module_id FROM (SELECT * FROM user_group WHERE user_id = ?) INNER JOIN module ON module_id = module.id', [userId]).then(rows => {
    let moduleList = []
    rows.forEach(function (row) {
      moduleList.push({
        name: row.name,
        id: row.module_id
      })
    })
    return {
      moduleList: moduleList
    }
  })
}

// 分页查询用户信息, 返回结果是 分页数据， 以及 总页数。
// 这里的页数是从0 开始的。
function getUsersByPage (pageNum, pageCount) {
  let array = []
  return db.all('SELECT * FROM user LIMIT ? OFFSET ?', [pageCount, pageCount * pageNum]).then(rows => {
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
  }).then(() => db.get('SELECT count(*) FROM user ')).then(row => {
    let count = row['count(*)']
    return {
      usersInfo: array,
      pageCount: parseInt(count / 12) + 1
    }
  })
}

function getbatchUserGroupsInfo (userIdList) {
  let inList = '(' + userIdList.join(',') + ')'
  return db.all(`SELECT module_id, name, user_id FROM ( SELECT * FROM user_group WHERE user_id IN ${inList} )
   INNER JOIN module ON module_id = module.id `).then(rows => {
    let ret = {}
    userIdList.forEach((userId) => {
      ret[userId] = {
        moduleList: []
      }
    })
    rows.forEach(function (row) {
      ret[row.user_id].moduleList.push(row.name)
    })
    return ret
  })
}
// 设置用户密码
function setPassword (userId, password) {
  return db.run(`UPDATE user SET password = ? WHERE id = ?`, [password, userId])
}

// 设置用户权限
function setUserPermission (userId, userAdmin, appAdmin) {
  return db.run(`UPDATE user SET user_admin = ? , app_admin = ?  WHERE id = ?`, [userAdmin, appAdmin, userId])
}

// 获取全部用户列表，[{userName: xxx, userId: xxx}]
function getUserList () {
  return db.all(`SELECT name,id FROM user`).then(rows => {
    let list = []
    rows.forEach(row => {
      list.push({
        userName: row.name,
        userId: row.id
      })
    })
    return list
  })
}

// 获取指定模块的管理员列表。[userID ...]
function getModuleAdminUserList (moduleId) {
  return db.all(`SELECT user_id FROM user_group WHERE module_id = ?`, [moduleId]).then(rows => {
    let list = []
    rows.forEach(row => {
      list.push(row.user_id)
    })
    return list
  })
}

// 批量修改模块权限。
function submitModuleAdminChange (moduleId, deleted, added) {
  return transaction().then(tr => {
    deleted.forEach(userId => {
      userId = parseInt(userId)
      tr.run(`DELETE FROM user_group WHERE module_id = ? AND user_id = ?`, [moduleId, userId])
    })
    added.forEach(userId => {
      userId = parseInt(userId)
      tr.run(`INSERT INTO user_group VALUES (?, ?)`, [userId, moduleId])
    })
    return tr.commit()
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
  deleteGroupInfo: deleteGroupInfo,
  getUserList: getUserList,
  getModuleAdminUserList: getModuleAdminUserList,
  submitModuleAdminChange: submitModuleAdminChange
}
