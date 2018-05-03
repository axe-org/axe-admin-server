const appService = require('../service/app')
const config = require('../config')

// 查询当前进行中的APP版本列表
function getOngoingAppVersions (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  if (!config.guestMode) {
    let login = !!req.session.userInfo
    if (!login) {
      return res.json({error: '未登录'})
    }
  }
  // 查询数据库。
  appService.getOngoingAppVersions().then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getAPPVersionInfoList (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录，且是否有权限。
  if (!config.guestMode) {
    let login = !!req.session.userInfo
    if (!login) {
      return res.json({error: '未登录'})
    }
  }
  let ongoing = req.query.ongoing
  let pageNum = req.query.pageNum
  if (pageNum === undefined || ongoing === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  ongoing = parseInt(ongoing)
  pageNum = parseInt(pageNum)
  // 查询数据库。
  appService.getAPPVersionsByPage(ongoing, pageNum).then((data) => {
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
  if (!config.guestMode) {
    let login = !!req.session.userInfo
    if (!login) {
      return res.json({error: '未登录'})
    }
  }
  let version = req.query.version
  if (version === undefined) {
    return res.json({error: '参数传递错误！'})
  }
  // 查询数据库。
  appService.getVersionInfo(version).then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 手动刷新app结构图
function manualReloadStructureImage (req, res) {
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
  appService.manualRefreshAPPStructureImage(version).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchApp (app) {
  app.get('/api/app/ongoing', getOngoingAppVersions)
  app.get('/api/app/list', getAPPVersionInfoList)
  app.post('/api/app/create', createAPPVersion)
  app.post('/api/app/delete', deleteAPPVersion)
  app.get('/api/app/version', getVersionInfo)
  app.post('/api/app/reloadStruct', manualReloadStructureImage)
}

module.exports = dispatchApp
