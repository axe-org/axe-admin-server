const appDAO = require('../dao').appDAO
const timelineDAO = require('../dao').timelineDAO
const dateFormat = require('dateformat')
// const config = require('../config')
const Promise = require('bluebird')
const conf = require('../conf')

// 获取当前进行中的app版本信息
function getOngoingAppVersions () {
  return appDAO.getOngoingAppVersions()
}

// 分页获取app信息列表。
function getAPPVersionsByPage (pageNum) {
  return appDAO.getAppVersionsByPage(pageNum - 1, 10)
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
        // action.type = conf.TIMELINE_ACTION_TYPE_DEFAULT ,type由前台进行设定
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
  return appDAO.getVersionInfo({version: version})
}

// 未开始的APP版本才可以删除， 但是需要注意删除可能导致其他模块版本异常。 所以TODO检测模块版本。 传入参数为 version 为版本号，不是id。。。
function deleteAPPVersion (version) {
  // 检测 version状态。
  return appDAO.getVersionInfo({version: version}).then(versionInfo => {
    if (versionInfo.status !== conf.TIMELINE_STATUS_WAITING) {
      return new Promise((resolve, reject) => {
        reject(new Error('只有未启动的版本，才可以进行删除.'))
      })
    } else {
      return appDAO.deleteVersion(versionInfo.versionId)
    }
  })
}

// TODO 启动与停止。

module.exports = {
  getOngoingAppVersions: getOngoingAppVersions,
  getAPPVersionsByPage: getAPPVersionsByPage,
  createAPPVersion: createAPPVersion,
  deleteAPPVersion: deleteAPPVersion,
  getVersionInfo: getVersionInfo
}
