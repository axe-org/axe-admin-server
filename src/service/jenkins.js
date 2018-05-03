const { URL } = require('url')
const config = require('../config')
const conf = require('../conf')
const request = require('request')
const fs = require('fs')
const path = require('path')
const md5 = require('md5')
const moduleDAO = require('../dao').moduleDAO
const importDAO = require('../dao').importDAO
let jenkinsURL = new URL(config.jenkinsURL)
jenkinsURL.username = config.jenkinsUser
jenkinsURL.password = config.jenkinsPassword
jenkinsURL = jenkinsURL.toString()
let jenkins = require('jenkins')({ baseUrl: jenkinsURL })

// 检测jenkins任务是否存在 ， 不存在会报错。
function checkJenkinsJobExists (jobName) {
  return new Promise((resolve, reject) => {
    jenkins.job.exists(jobName, (err, exists) => {
      if (err) {
        reject(err)
      } else {
        if (exists) {
          resolve({})
        } else {
          reject(new Error(`JENKINS JOB ${jobName} 并不存在，请先在jenkins上配置构建任务!!!`))
        }
      }
    })
  })
}

// 本地记录一下 jenkins构建和版本的对应信息。
let jenkinsBuildMaps = {}

// 检测jenkins任务状态， 返回数据 { building: 如果当前构建中，则返回buildNumber, 前端提示以查看构建进度,
//                              jobFree: 是否空闲
//                              nextbuildNumber: 下一个构建的版本号  }
function checkJenkinsJobStatus (jobName) {
  return checkJenkinsJobExists(jobName).then(() =>
    new Promise((resolve, reject) => {
      jenkins.job.get(jobName, (err, data) => {
        if (err) {
          reject(err)
        } else {
          let nextBuildNumber = data.nextBuildNumber
          if (data.lastBuild) {
            let lastBuildNum = data.lastBuild.number
            jenkins.build.get(jobName, lastBuildNum, (err, data) => {
              if (err) {
                reject(err)
              } else {
                if (data.building) {
                  // 如果正在构建中， 则暂时无法提交构建
                  resolve({building: lastBuildNum, jobFree: false})
                } else {
                  resolve({jobFree: true, nextBuildNumber: nextBuildNumber})
                }
              }
            })
          } else {
            resolve({jobFree: true, nextBuildNumber: nextBuildNumber})
          }
        }
      })
    }))
}

function checkJenkinsBuildStatus (jobName, buildNumber) {
  return new Promise((resolve, reject) => {
    jenkins.build.get(jobName, buildNumber, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

// 监控jenkins任务构建情况
function watchJenkinsBuilding (buildId) {
  let buildInfo = jenkinsBuildMaps[buildId]
  checkJenkinsBuildStatus(buildInfo.jobName, buildInfo.buildNumber).catch(err => {
    buildInfo.failedCount++
    console.log(err)
    if (buildInfo.failedCount > 10) {
      // 出错超过10次，我们认为发生了异常
      buildInfo.status = conf.JENKINS_JOB_BUILD_STATUS_FAILURE
      submitJenkinsBuildResult(buildId)
    } else {
      setTimeout(() => {
        watchJenkinsBuilding(buildId)
      }, 3000)
    }
    // 依旧返回reject ,避免影响下面的准确检测。
    return Promise.reject(err)
  }).then(data => {
    if (data.building) {
      // 依然在构建中
      setTimeout(() => {
        watchJenkinsBuilding(buildId)
      }, 3000)
    } else {
      // 检测构建状态
      buildInfo.status = data.result
      submitJenkinsBuildResult(buildId)
    }
  })
}

// 在jenkins成功或失败后， 处理结果。
function submitJenkinsBuildResult (buildId) {
  let buildInfo = jenkinsBuildMaps[buildId]
  let workspaceURL = `${jenkinsURL}/job/${buildInfo.jobName}/ws/build/`
  if (buildInfo.status === conf.JENKINS_JOB_BUILD_STATUS_SUCCESS) {
    // 成功， 处理api文件，以及依赖图
    if (buildInfo.buildType === conf.JENKINS_BUILD_TYPE_MODULE_BUILD && buildInfo.publish) {
      // 如果是模块构建
      let modulePath = path.join(config.modulePath, String(buildInfo.versionId))
      if (!fs.existsSync(modulePath)) {
        fs.mkdirSync(modulePath)
      }
      let dependencySVGPath = path.join(modulePath, 'dependency.svg')
      let APIFilePath = path.join(modulePath, 'API.h')
      request(`${jenkinsURL}/job/${buildInfo.jobName}/ws/axe/dependency.svg`).pipe(fs.createWriteStream(dependencySVGPath))
      request(workspaceURL + `API.h`).pipe(fs.createWriteStream(APIFilePath))
      request(workspaceURL + 'version.txt', function (error, response, body) {
        if (error) {
          console.log('下载失败， 版本构建失败！！！')
          buildInfo.status = conf.JENKINS_JOB_BUILD_STATUS_FAILURE
          submitJenkinsBuildResult(buildId)
        } else {
          // 构建成功后， 更新一下数据
          let newVersion = String(body)
          buildInfo['newVersion'] = newVersion
          let released = !newVersion.includes('beta')
          moduleDAO.updateVersionWithSuccessBuild(buildInfo.versionId, newVersion, released)
        }
      })
    } else if (buildInfo.buildType === conf.JENKINS_BUILD_TYPE_MODULE_IMPORT) {
      // app 模块管理。 管理成功后， 修改数据。
      let importList = buildInfo.importList
      importList.forEach(importInfo => {
        importInfo.handleUser = buildInfo.handleUser
        importInfo.status = conf.MODULE_IMPORT_STATUS_SUCCESS
      })
      importDAO.handleImport(importList).catch(err => {
        // 这里不应该出现数据库错误。
        console.log('使用 importDAO 处理接入结果失败 ：')
        console.log(err)
      })
      // APP结构图 绘制与处理的下载保存
      let appVersionPath = path.join(config.appPath, buildInfo.appVersion)
      if (!fs.existsSync(appVersionPath)) {
        fs.mkdirSync(appVersionPath)
      }
      let dependencySVGPath = path.join(appVersionPath, 'dependency.svg')
      request(`${jenkinsURL}/job/${buildInfo.jobName}/ws/axe/dependency.svg`).pipe(fs.createWriteStream(dependencySVGPath))
    }
  } else {
    // 其他都视为失败。
    if (buildInfo.buildType === conf.JENKINS_BUILD_TYPE_MODULE_BUILD) {
      // 如果是模块构建
      moduleDAO.updateVersionWithFailedBuild(buildInfo.versionId)
    } else if (buildInfo.buildType === conf.JENKINS_BUILD_TYPE_MODULE_IMPORT) {
      // app 模块管理。
      let importList = buildInfo.importList
      importList.forEach(importInfo => {
        importInfo.handleUser = buildInfo.handleUser
        importInfo.status = conf.MODULE_IMPORT_STATUS_FAILED
      })
      importDAO.handleImport(importList).catch(err => {
        // 这里不应该出现数据库错误。
        console.log('使用 importDAO 处理接入结果失败 ：')
        console.log(err)
      })
    }
  }
  // 清理内容。
  setTimeout(() => {
    jenkinsBuildMaps[buildId] = undefined
  }, 10 * 60 * 1000)
}

// 构建任务
function buildJenkinsJob (jobName, params, otherInfo) {
  return checkJenkinsJobStatus(jobName).then((data) =>
    new Promise((resolve, reject) => {
      if (!data.jobFree) {
        reject(new Error(`当前Jenkins Job ${jobName} 正在构建中， 请稍后重试！！！`))
      } else {
        let buildNumber = data.nextBuildNumber
        // 开始构建
        jenkins.job.build({ name: jobName, parameters: params }, (err, data) => {
          if (err) {
            reject(err)
          } else {
            checkJenkinsBuildStatus(jobName, buildNumber).catch(err => {
              reject(err)
            }).then(data => {
              if (data.number === buildNumber && data.building) {
                // 则表示构建开始， 监听构建状态
                let buildId = md5(jobName + buildNumber)
                let buildInfo = {
                  ...otherInfo,
                  jobName: jobName,
                  buildNumber: buildNumber,
                  status: conf.JENKINS_JOB_BUILD_STATUS_BUILDING,
                  estimatedDuration: data.estimatedDuration,
                  startedTime: new Date(),
                  failedCount: 0,
                  buildId: buildId
                }
                jenkinsBuildMaps[buildId] = buildInfo
                watchJenkinsBuilding(buildId)
                resolve(buildInfo)
              } else {
                reject(new Error('构建任务提交失败， 请到jenkins页面检测失败原因！！！'))
              }
            })
          }
        })
      }
    }))
}

// 模块构建
// moduleId
// versionId
// jobName
// parameters // jenkins构建使用参数
function buildModule (moduleInfo) {
  moduleDAO.updateModuleOperationTime(moduleInfo.moduleId)
  return buildJenkinsJob(moduleInfo.jobName, moduleInfo.parameters, {
    moduleId: moduleInfo.moduleId,
    versionId: moduleInfo.versionId,
    publish: moduleInfo.parameters.PUBLISH,
    released: moduleInfo.parameters.RELEASED,
    buildType: conf.JENKINS_BUILD_TYPE_MODULE_BUILD
  })
}

// 这里只处理模块接入， 不处理模块的清理。
// 传入参数 importList [{importId , name, version, moduleVersionId}]
function handleModuleImport (appVersion, importList, handleUser) {
  // 组装jenkins使用的参数，  {APP_VERSION : '1.0.0' , IMPORT_MODULES: {'moduleA': '1.1.1'}}
  let importModules = {}
  let jenkinsParams = {
    APP_VERSION: appVersion
  }
  importList.forEach(module => {
    importModules[module.name] = module.version
  })
  jenkinsParams['IMPORT_MODULES'] = JSON.stringify(importModules)
  return buildJenkinsJob(config.jenkinsModuleImportJobName, jenkinsParams, {
    importList: importList,
    appVersion: appVersion,
    handleUser: handleUser,
    buildType: conf.JENKINS_BUILD_TYPE_MODULE_IMPORT
  })
}

// 根据buildId 来检测状态。
function checkBuildStatus (buildId) {
  return new Promise((resolve, reject) => {
    let buildInfo = jenkinsBuildMaps[buildId]
    if (buildInfo) {
      resolve(buildInfo)
    } else {
      reject(new Error('并未找到构建任务， 请刷新页面或者检查Jenkins！！'))
    }
  })
}

module.exports = {
  checkJenkinsJobExists: checkJenkinsJobExists,
  checkJenkinsJobStatus: checkJenkinsJobStatus,
  buildModule: buildModule,
  handleModuleImport: handleModuleImport,
  checkBuildStatus: checkBuildStatus
}
