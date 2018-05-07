// service层做具体业务。
const userDAO = require('../dao').userDAO
const config = require('../config')
const md5 = require('md5')
// 初始化设置的管理信息
function initSettingAdmin () {
  return userDAO.getUserInfo(config.adminUserName).then(userInfo => {
    if (userInfo) {
      // 有管理员，则成功，不做处理。

    } else {
      return insertUser({
        name: config.adminUserName,
        password: md5(config.adminPassword),
        userAdmin: true,
        appAdmin: true
      })
    }
  })
}

// 添加用户 ，用户属性为 name , password : 前端传入的是md5后的密码， userAdmin , appAdmin
function insertUser (user) {
  return userDAO.getUserInfo(user.name).then(userInfo => {
    if (userInfo) {
      return Promise.reject(new Error('已有用户 ' + user.name + ' ，请修改用户名'))
    } else {
      return userDAO.insertUser(user)
    }
  })
}

function logIn (userName, password) {
  let user
  return userDAO.getUserInfo(userName).then(userInfo => {
    if (!userInfo) {
      return Promise.reject(new Error('当前无用户 ' + userName))
    } else {
      if (userInfo.password === password) {
        userDAO.freshUser(userInfo.userId)
        user = userInfo
        return userDAO.getUserGroups(userInfo.userId)
      } else {
        return Promise.reject(new Error('用户密码输入错误 ！！！'))
      }
    }
  }).then((groupsInfo) => {
    // 对于管理员用户，下发授权信息
    if (user.appAdmin) {
      user['dynamicServerAccessControlPath'] = config.dynamicServerAccessControlPath
      user['offlineServerAccessControlPath'] = config.offlineServerAccessControlPath
    }
    return Object.assign(groupsInfo, user)
  })
}

// 分页查询用户列表， 这里的页数从1 开始.
function queryUsersList (pageNum) {
  let ret = {}
  return userDAO.getUsersByPage(pageNum - 1, 10).then((usersInfo) => {
    ret.pageCount = usersInfo.pageCount
    let userIdList = []
    let mappedList = []
    usersInfo.usersInfo.forEach(userInfo => {
      mappedList.push(userInfo)
      userIdList.push(userInfo.userId)
    })
    ret.usersInfo = mappedList
    return userDAO.getbatchUserGroupsInfo(userIdList)
  }).then(usersGroupInfo => {
    ret.usersInfo.forEach(userInfo => {
      let groupInfo = usersGroupInfo[userInfo.userId]
      userInfo.moduleList = groupInfo.moduleList
    })
    return ret
  })
}

function resetPassword (userId, password) {
  return userDAO.setPassword(userId, password)
}

function setPermission (userId, userAdmin, appAdmin) {
  return userDAO.setUserPermission(userId, !!userAdmin, !!appAdmin)
}

module.exports = {
  logIn: logIn,
  initSettingAdmin: initSettingAdmin,
  insertUser: insertUser,
  queryUsersList: queryUsersList,
  resetPassword: resetPassword,
  setPermission: setPermission
}
