const jenkinsService = require('../service/jenkins')

// 检测模块接入管理构建任务的状态
function checkModuleManagerJobStatus (req, res) {

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
  app.post('/jenkins/module/status', checkModuleBuildJobStatus)
  app.post('/jenkins/module/build', moduleBuild)
  app.get('/jenkins/build', checkJenkinsBuildStatus)
}

module.exports = dispatchJenkinsRouter
