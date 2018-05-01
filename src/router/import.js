const importService = require('../service/import')

// 提交接入申请
function applyImportModule (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 检测模块管理员权限
  let moduleId = req.body.moduleId
  let moduleVersionId = req.body.moduleVersionId
  let note = req.body.note
  if (moduleId === undefined || moduleVersionId === undefined || note === undefined) {
    return res.json({error: '参数传递错误'})
  }
  moduleId = parseInt(moduleId)
  let admin = false
  let moduleList = req.session.userInfo.moduleList
  moduleList.forEach(module => {
    if (module.id === moduleId) {
      admin = true
    }
  })
  if (!admin) {
    return res.json({error: '当前用户没有该模块的管理权限，无法进行相关管理操作。'})
  }
  let applicant = req.session.userInfo.userName
  moduleVersionId = parseInt(moduleVersionId)
  importService.applyImportModule(moduleVersionId, note, applicant).then(() => {
    res.json({})
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getWaitingImportList (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let appVersion = req.query.appVersion
  if (appVersion === undefined) {
    return res.json({error: '参数传递错误！！！'})
  }
  importService.getWaitingImportList(appVersion).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getImportRecordList (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let appVersion = req.query.appVersion
  let module = req.query.module
  let pageNum = req.query.pageNum
  if (pageNum === undefined) {
    return res.json({error: '参数传递错误'})
  }
  pageNum = parseInt(pageNum)
  importService.getImportRecordList(appVersion, module, pageNum).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchImportRouter (app) {
  app.post('/import/apply', applyImportModule)
  app.get('/import/waiting', getWaitingImportList)
  app.get('/import/records', getImportRecordList)
}

module.exports = dispatchImportRouter
