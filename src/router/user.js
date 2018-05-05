// router层， 检测输入以及异常处理。
const userService = require('../service/user')
const config = require('../config')
// 登录
function logIn (req, res) {
  // console.log('配置新包 :', JSON.stringify(req.body))
  // req.body.name
  let userName = req.body.userName
  let password = req.body.password
  if (!userName || !password) {
    return res.json({
      error:
        '参数传入错误'
    })
  }
  // 检测数据库
  userService.logIn(userName, password).then(userInfo => {
    // 创建session
    // res.generated
    req.session.regenerate(function (err) {
      if (err) {
        return res.json({error: '未知异常 ' + err.message})
      }
      req.session.userInfo = Object.assign({}, userInfo)
      userInfo.password = undefined
      res.json(userInfo)
    })
  }).catch(err => {
    res.json({
      error: err.message
    })
  })
}

function logOut (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  req.session.destroy(err => {
    if (err) {
      res.json({error: err.message})
    } else {
      res.json({})
    }
  })
}

// 根据session进行检测
function checkSession (req, res) {
  let login = !!req.session.userInfo
  if (login) {
    // 也调用logIn方法
    userService.logIn(req.session.userInfo.userName, req.session.userInfo.password).then(userInfo => {
      // 创建session
      // res.generated
      req.session.regenerate(function (err) {
        if (err) {
          return res.json({error: '未知异常 ' + err.message})
        }
        req.session.userInfo = Object.assign({}, userInfo)
        userInfo.password = undefined
        res.json(userInfo)
      })
    }).catch(err => {
      res.json({
        error: err.message
      })
    })
  } else {
    res.json({error: '未登录'})
  }
}

// 分页查询用户列表。
function queryUserList (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  if (!config.guestMode) {
    let login = !!req.session.userInfo
    if (!login) {
      return res.json({error: '未登录'})
    }
    let userAdmin = req.session.userInfo.userAdmin
    if (!userAdmin) {
      return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有用户管理员权限!!'})
    }
  }
  // 查询数据库。
  userService.queryUsersList(req.query.pageNum).then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}
// 添加新用户
function addUser (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let userAdmin = req.session.userInfo.userAdmin
  if (!userAdmin) {
    return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有用户管理员权限!!'})
  }
  // 参数为用户信息， 格式为 {name , password ,userAdmin, appAdmin }
  if (req.body.name === undefined || req.body.password === undefined || req.body.userAdmin === undefined || req.body.appAdmin === undefined) {
    return res.json({error: '参数输入错误 ！！！'})
  }
  userService.insertUser(req.body).then(() => {
    res.json({})
  }).catch((err) => {
    res.json({error: err.message})
  })
}
// 重设用户密码
function resetUserPassword (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let userAdmin = req.session.userInfo.userAdmin
  if (!userAdmin) {
    return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有用户管理员权限!!'})
  }
  // 参数为 {userId, password}
  if (req.body.userId === undefined || req.body.password === undefined) {
    return res.json({error: '参数输入错误 ！！！'})
  }
  userService.resetPassword({password: req.body.password, userId: req.body.userId}).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 修改用户权限， 即 用户权限和app管理权限。
function setUserPermission (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let userAdmin = req.session.userInfo.userAdmin
  if (!userAdmin) {
    return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有用户管理员权限!!'})
  }
  // 参数为 {userId, appAdmin, userAdmin}
  if (req.body.userId === undefined || req.body.appAdmin === undefined || req.body.userAdmin === undefined) {
    return res.json({error: '参数输入错误 ！！！'})
  }
  userService.setPermission(req.body.userId, req.body.userAdmin, req.body.appAdmin).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchUser (app) {
  app.post('/api/user/logIn', logIn)
  app.post('/api/user/logOut', logOut)
  app.post('/api/user/check', checkSession)
  app.get('/api/user/list', queryUserList)
  app.post('/api/user/add', addUser)
  app.post('/api/user/resetPassword', resetUserPassword)
  app.post('/api/user/setPermission', setUserPermission)
}

module.exports = dispatchUser
