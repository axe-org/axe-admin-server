const appDAO = require('../dao').appDAO
const timelineDAO = require('../dao').timelineDAO
const dateFormat = require('dateformat')
const conf = require('../conf')
const config = require('../config')
const request = require('request')
const fs = require('fs')
const path = require('path')

// 获取当前进行中的app版本信息
function getOngoingAppVersions () {
  return appDAO.getOngoingAppVersions()
}

// 分页获取app信息列表。
function getAPPVersionDetailInfoList (ongoing, pageNum) {
  return appDAO.getAPPVersionDetailInfoList(ongoing, pageNum - 1, 10)
}

// 对于创建，会附带一些 默认事件线的创建。参数 version ： 版本号 ，actions // 默认事件详情。
function createAPPVersion (version, actions) {
  // 先检测版本号。
  let app = {}
  return new Promise((resolve, reject) => {
    appDAO.getVersionInfo({version: version}).then((appVersion) => {
      if (appVersion) {
        reject(new Error('当前版本号' + version + '已创建， 请修改版本号.'))
      } else {
        // 添加APP版本, 版本号必须为三段式。
        let splited = version.split('.')
        let versionCode = parseInt(splited[0]) * 1000 * 1000 + parseInt(splited[1]) * 1000 + parseInt(splited[2])
        app = {
          version: version,
          versionCode: versionCode,
          status: conf.TIMELINE_STATUS_WAITING
        }
        return appDAO.addVersion(app)
      }
    }).then(versionInfo => {
      let versionId = versionInfo.versionId
      app.versionId = versionId
      actions.forEach(action => {
        // 格式处理
        action.status = conf.TIMELINE_ACTION_STATUS_UNFINISHED
        // 格式化时间。
        action.expectedTime = dateFormat(new Date(action.expectedTime), 'yyyy-mm-dd')
      })
      return timelineDAO.initTimeLine({
        appVersionId: versionId,
        type: conf.TIMELINE_TYPE_APP,
        status: conf.TIMELINE_STATUS_WAITING,
        actions: actions
      })
    }).then((timeLineInfo) => {
      app.timelineId = timeLineInfo.timelineId
      return appDAO.setVersionTimeLine(app.versionId, timeLineInfo.timelineId)
    }).then(() => {
      resolve(app)
    }).catch(err => {
      // 失败时进行删除。
      appDAO.deleteVersion(app.versionId)
      reject(err)
    })
  })
}

// 获取APP信息
function getVersionInfo (version) {
  return appDAO.getAPPVersionDetailInfo(version)
}

// 只能删除 未完成，且无模块接入的版本。
function deleteAPPVersion (version) {
  // 检测 version状态。
  return appDAO.getAPPVersionDetailInfo(version).then(detailInfo => {
    // 检测是否完成
    if (detailInfo.versionInfo.status === conf.TIMELINE_STATUS_DONE) {
      return Promise.reject(new Error('不能删除已经完成的 APP版本 ！！！'))
    }
    if (detailInfo.moduleVersionList.length) {
      return Promise.reject(new Error('不能删除有模块接入的 APP版本！！！'))
    }
    return appDAO.deleteVersion(detailInfo.versionInfo.versionId)
  })
}

// 手动刷新APP 结构图。
function manualRefreshAPPStructureImage (version) {
  return new Promise((resolve, reject) => {
    // 查询版本信息
    let appVersionPath = path.join(config.appPath, version)
    if (!fs.existsSync(appVersionPath)) {
      fs.mkdirSync(appVersionPath)
    }
    let remoteURL = config.appGitHome
    if (config.appGitType === 'github') {
      // https://raw.githubusercontent.com/axe-org/demo-app/master/LICENSE
      let split = remoteURL.split('/')
      let userName = split[split.length - 2]
      let repository = split[split.length - 1]
      remoteURL = `https://raw.githubusercontent.com/${userName}/${repository}/version/${version}/axe/dependency.svg`
    } else if (config.appGitType === 'gitlab') {
      remoteURL += `/raw/version/${version}/axe/dependency.svg`
    }
    let dependencySVGPath = path.join(appVersionPath, 'dependency.svg')
    request(remoteURL, function (error, response, body) {
      if (error) {
        console.log('手动刷新APP结构图失败 图片地址 ： ' + remoteURL + ' 错误原因： ')
        console.log(error)
        reject(new Error('下载失败， 错误原因 : ' + error.message))
      } else {
        // 下载成功， 保存到本地
        fs.writeFileSync(dependencySVGPath, body)
        resolve({})
      }
    })
  })
}

module.exports = {
  getOngoingAppVersions: getOngoingAppVersions,
  getAPPVersionsByPage: getAPPVersionDetailInfoList,
  createAPPVersion: createAPPVersion,
  deleteAPPVersion: deleteAPPVersion,
  getVersionInfo: getVersionInfo,
  manualRefreshAPPStructureImage: manualRefreshAPPStructureImage
}
