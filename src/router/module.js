const moduleService = require('../service/module')

// 创建模块
function createModule (req, res) {
  // 权限是已登录即可。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 检测参数
  let name = req.body.name
  let jenkinsJob = req.body.jenkinsJob
  let type = req.body.type
  let homeURL = req.body.homeURL
  let gitType = req.body.gitType
  if (name === undefined || jenkinsJob === undefined ||
    type === undefined || homeURL === undefined || gitType === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  // 访问服务
  moduleService.createModule({
    name: name,
    jenkinsJob: jenkinsJob,
    type: type,
    homeURL: homeURL,
    gitType: gitType,
    userId: req.session.userInfo.userId
  }).then((module) => {
    res.json({moduleId: module.moduleId})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function deleteModule (req, res) {
  // 需要拥有模块权限。
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  if (moduleId === undefined) {
    return res.json({error: '参数传递错误!!'})
  }
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  moduleService.deleteModule(moduleId).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getModuleInfo (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.query.moduleId
  if (moduleId === undefined) {
    return res.json({error: '参数传递错误!!'})
  }
  moduleId = parseInt(moduleId)
  moduleService.getModuleInfo(moduleId).then(moduleInfo => {
    res.json(moduleInfo)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getModuleList (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let query = {}
  query['name'] = req.body.name
  query['type'] = req.body.type
  query['adminUser'] = req.body.adminUser
  let pageNum = req.body.pageNum
  if (pageNum === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  pageNum = parseInt(pageNum)
  query['pageNum'] = pageNum

  moduleService.getModuleList(query).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 获取模块的 管理员用户相关信息。
function getModuleAdminUserInfo (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.query.moduleId
  if (moduleId === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  moduleId = parseInt(moduleId)
  moduleService.getModuleAdminUserInfo(moduleId).then(info => {
    res.json(info)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function submitModuleAdminChange (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let deleted = req.body.deleted
  let added = req.body.added
  if (moduleId === undefined || deleted === undefined || added === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  moduleId = parseInt(moduleId)
  // 需要模块管理员权限
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  moduleService.submitModuleAdminChange(moduleId, deleted, added).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function submitModuleVersion (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let appVersionId = req.body.appVersionId
  let version = req.body.version
  let changeLog = req.body.changeLog
  let actions = req.body.actions
  if (moduleId === undefined || appVersionId === undefined || version === undefined ||
    changeLog === undefined || actions === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  moduleId = parseInt(moduleId)
  appVersionId = parseInt(appVersionId)
  // 需要模块管理员权限
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  moduleService.createModuleVersion(req.body).then(versionId => {
    res.json({versionId: versionId})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function deleteModuleVersion (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let versionId = req.body.versionId
  if (moduleId === undefined || versionId === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  moduleId = parseInt(moduleId)
  versionId = parseInt(versionId)
  // 需要模块管理员权限
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  moduleService.deleteModuleVersion(versionId).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getModuleVersionList (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let pageNum = req.body.pageNum
  if (moduleId === undefined || pageNum === undefined) {
    return res.json({error: '参数传递错误！！！'})
  }
  moduleId = parseInt(moduleId)
  pageNum = parseInt(pageNum)
  moduleService.getModuleVersionList(moduleId, pageNum).then((data) => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getModuleVersion (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let version = req.body.version
  if (moduleId === undefined || version === undefined) {
    return res.json({error: '参数传递错误！！！'})
  }
  moduleId = parseInt(moduleId)
  moduleService.getModuleVersion(moduleId, version).then(versionInfo => {
    res.json(versionInfo)
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 该moduleRouter 的操作请求，都要传递moduleId , 以进行权限检测。
function updateVersionChangeLog (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let moduleId = req.body.moduleId
  let versionId = req.body.versionId
  let changeLog = req.body.changeLog
  if (moduleId === undefined || versionId === undefined || changeLog === undefined) {
    return res.json({error: '参数传递错误！！！'})
  }
  moduleId = parseInt(moduleId)
  versionId = parseInt(versionId)
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '用户没有该模块的管理权限，不能进行相关管理操作！！！'})
  }
  moduleService.updateVersionChangeLog(versionId, moduleId, changeLog).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchModule (app) {
  app.post('/module/create', createModule)
  app.post('/module/delete', deleteModule)
  app.get('/module/info', getModuleInfo)
  app.post('/module/list', getModuleList)
  app.get('/module/admin/list', getModuleAdminUserInfo)
  app.post('/module/admin/change', submitModuleAdminChange)
  app.post('/module/version/create', submitModuleVersion)
  app.post('/module/version/delete', deleteModuleVersion)
  app.post('/module/version/list', getModuleVersionList)
  app.post('/module/version/info', getModuleVersion)
  app.post('/module/version/changelog', updateVersionChangeLog)
}

module.exports = dispatchModule
