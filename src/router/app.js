const appService = require('../service/app')

// 查询当前进行中的APP版本列表
function getOngoingAppVersions (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 查询数据库。
  appService.getOngoingAppVersions().then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getAPPVersionsByPage (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let pageNum = req.query.pageNum
  if (pageNum === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  pageNum = parseInt(pageNum)
  // 查询数据库。
  appService.getAPPVersionsByPage(pageNum).then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function createAPPVersion (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let appAdmin = req.session.userInfo.appAdmin
  if (!appAdmin) {
    return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
  }
  // 检测参数 ：
  let version = req.body.version
  let actions = req.body.actions
  if (version === undefined || actions === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  appService.createAPPVersion(version, actions).then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function deleteAPPVersion (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let appAdmin = req.session.userInfo.appAdmin
  if (!appAdmin) {
    return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
  }
  let version = req.body.version
  if (version === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  appService.deleteAPPVersion(version).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getVersionInfo (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let version = req.query.version
  if (version === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  // 查询数据库。
  appService.getVersionInfo(version).then((data) => {
    if (data) {
      res.json(data)
    } else {
      res.json({error: '当前没有版本 ' + version})
    }
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchApp (app) {
  app.get('/app/ongoing', getOngoingAppVersions)
  app.get('/app/versions', getAPPVersionsByPage)
  app.post('/app/create', createAPPVersion)
  app.post('/app/delete', deleteAPPVersion)
  app.get('/app/version', getVersionInfo)
}

module.exports = dispatchApp
