const jenkinsService = require('../service/jenkins')
const config = require('../config')

// 检测模块接入管理构建任务的状态
function importModule (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  if (!req.session.userInfo.appAdmin) {
    return res.json({error: '当前用户没有APP管理权限！！！'})
  }
  let appVersion = req.body.appVersion
  // 结构为 [{importId , name, version}]
  let importList = req.body.importList
  if (importList === undefined || appVersion === undefined) {
    return res.json({error: '参数传递错误！！'})
  }
  jenkinsService.handleModuleImport(appVersion, importList, req.session.userInfo.userName).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}
// 检测接入jenkins任务当前状态。
function checkModuleImportJobStatus (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  if (!req.session.userInfo.appAdmin) {
    return res.json({error: '当前用户没有APP管理权限！！！'})
  }
  let importJobName = config.jenkinsModuleImportJobName
  jenkinsService.checkJenkinsJobStatus(importJobName).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 检查模块构建任务的状态
function checkModuleBuildJobStatus (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 检测参数
  let moduleId = req.body.moduleId
  let jobName = req.body.jobName
  if (moduleId === undefined || jobName === undefined) {
    return res.json({error: '参数传递错误！！！'})
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
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  jenkinsService.checkJenkinsJobStatus(jobName).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function moduleBuild (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 检测参数
  let moduleId = req.body.moduleId
  let jobName = req.body.jobName
  let versionId = req.body.versionId
  let parameters = req.body.parameters
  if (moduleId === undefined || jobName === undefined || versionId === undefined || parameters === undefined) {
    return res.json({error: '参数传递错误！！！'})
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
    return res.json({error: '当前用户没有该模块的权限，不能进行删除操作'})
  }
  jenkinsService.buildModule({
    moduleId: moduleId,
    versionId: parseInt(versionId),
    jobName: jobName,
    parameters: parameters
  }).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
    res.json({error: err.message})
  })
}

// 检测构建状态
function checkJenkinsBuildStatus (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  let buildId = req.query.buildId
  jenkinsService.checkBuildStatus(buildId).then(data => {
    res.json(data)
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchJenkinsRouter (app) {
  app.post('/api/jenkins/module/status', checkModuleBuildJobStatus)
  app.post('/api/jenkins/module/build', moduleBuild)
  app.get('/api/jenkins/build', checkJenkinsBuildStatus)
  app.get('/api/jenkins/import/status', checkModuleImportJobStatus)
  app.post('/api/jenkins/import/build', importModule)
}

module.exports = dispatchJenkinsRouter
