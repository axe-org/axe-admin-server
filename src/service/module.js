const moduleDAO = require('../dao').moduleDAO
const userDAO = require('../dao').userDAO
const timelineDAO = require('../dao').timelineDAO
const appDAO = require('../dao').appDAO
const dateFormat = require('dateformat')
const conf = require('../conf')

function createModule (moduleInfo) {
  // 创建时，需要检测是否有同名模块
  return moduleDAO.getModuleByName(moduleInfo.name).then(module => {
    if (module) {
      return Promise.reject(new Error(`当前模块 ${moduleInfo.name} 已存在，请检查！！！`))
    }
  }).then(() => moduleDAO.createModule(moduleInfo)).then((ret) => {
    // 创建成功后，要将创建用户id设置为该模块的管理员。
    return userDAO.addGroupInfo({
      userId: moduleInfo.userId,
      moduleName: moduleInfo.name,
      moduleId: ret.moduleId
    }).catch(err => {
      console.log('创建模块时，应该用事务, 添加模块管理权限失败 :' + err.message)
    }).then(() => {
      return ret
    })
  })
}

function deleteModule (moduleId) {
  // 删除时，需要确保 模块当前没有版本存在
  return moduleDAO.getModuleInfo(moduleId).then(moduleInfo => {
    if (moduleInfo['versionCount'] > 0) {
      return Promise.reject(new Error('当前设定，已有版本模块不能删除！！'))
    }
  }).then(() => moduleDAO.deleteModule(moduleId))
}

function getModuleInfo (moduleId) {
  return moduleDAO.getModuleInfo(moduleId)
}

// 这里使用的 pageNum是从1开始的。
function getModuleList (query) {
  query['pageNum'] = query['pageNum'] - 1
  query['pageSize'] = 10
  return moduleDAO.getModuleList(query)
}

//  获取模块的管理员列表
function getModuleAdminUserInfo (moduleId) {
  let allUsers = []
  return userDAO.getUserList().then(userList => {
    allUsers = userList
    return userDAO.getModuleAdminUserList(moduleId)
  }).then(adminUsers => {
    // 整合两部分数据。
    let ret = {
      adminUsers: [],
      otherUsers: []
    }
    allUsers.forEach(user => {
      if (adminUsers.includes(user.userId)) {
        ret.adminUsers.push(user)
      } else {
        ret.otherUsers.push(user)
      }
    })
    return ret
  })
}

// 提交用户管理员改动
function submitModuleAdminUserChange (moduleId, deleted, added) {
  return userDAO.submitModuleAdminChange(moduleId, deleted, added).then(() => {
    moduleDAO.updateModuleOperationTime(moduleId)
  })
}

// 创建模块版本 参数{ moduleId , appVersionId, version , changeLog, actions}
function createModuleVersion (versionInfo) {
  let versionId
  let splited = versionInfo.version.split('.')
  versionInfo.versionCode = parseInt(splited[0]) * 1000 * 1000 + parseInt(splited[1]) * 1000 + parseInt(splited[2])
  // 先检测版本号， 当前不能存在相同版本号，以及版本号必须大于当前最大生产版本号。
  return moduleDAO.checkModuleVersionCanCreate(versionInfo.moduleId, versionInfo.versionCode).then(() =>
    moduleDAO.createModuleVersion(versionInfo)
  ).then(ret => {
    versionId = ret
    versionInfo.actions.forEach(action => {
      // 格式处理
      action.status = conf.TIMELINE_ACTION_STATUS_UNFINISHED
      action.expectedTime = dateFormat(new Date(action.expectedTime), 'yyyy-mm-dd')
    })
    return timelineDAO.initTimeLine({
      appVersionId: versionInfo.appVersionId,
      type: conf.TIMELINE_TYPE_MODULE,
      status: conf.TIMELINE_STATUS_WAITING,
      actions: versionInfo.actions,
      moduleVersionId: versionId
    })
  }).then(ret => {
    moduleDAO.updateModuleOperationTime(versionInfo.moduleId)
    return moduleDAO.addTimelineIDForVersion(versionId, ret.timelineId)
  }).catch(err => {
    console.log('创建模块版本失败！！！')
    console.log(err)
    if (versionId) {
      moduleDAO.deleteModuleVersion(versionId)
    }
    return Promise.reject(err)
  }).then(() => versionId)
}

// 删除模块版本， 同时删除timeline,因为timeline没有外键
function deleteModuleVersion (versionId) {
  return moduleDAO.getModuleVersionInfoById(versionId).then((moduleVersionInfo) => {
    moduleDAO.updateModuleOperationTime(moduleVersionInfo.moduleId)
    return Promise.all([moduleDAO.deleteModuleVersion(versionId), timelineDAO.deleteTimeline(moduleVersionInfo.timelineId)])
  })
}

// 获取版本列表
function getModuleVersionList (moduleId, pageNum) {
  return moduleDAO.getModuleVersionList(moduleId, pageNum - 1, 10)
}

// 根据模块id和版本号， 查找版本信息 , 分别查 模块版本信息， 模块信息 ,app版本信息 和 模块timeline信息.
function getModuleVersion (moduleId, version) {
  let ret = {}
  return moduleDAO.getModuleVersionInfo(moduleId, version).then(moduleVersionInfo => {
    ret['moduleVersionInfo'] = moduleVersionInfo
    return appDAO.getVersionInfo({
      versionId: moduleVersionInfo.appVersionId
    })
  }).then(appVersionInfo => {
    if (!appVersionInfo) {
      return Promise.reject(new Error('异常 ：未找到APP版本信息 ！！！'))
    }
    ret['appVersionInfo'] = appVersionInfo
    return timelineDAO.getTimeline(ret.moduleVersionInfo.timelineId)
  }).then(timelineInfo => {
    ret['timelineInfo'] = timelineInfo
    return moduleDAO.getBareModuleInfo(moduleId)
  }).then(moduleInfo => {
    ret['moduleInfo'] = moduleInfo
    return ret
  })
}

// 更新 版本记录内容。 这个module service 每次操作的时候，都要额外传一下moduleId, 供 updateModuleOperationTime
function updateVersionChangeLog (versionId, moduleId, changeLog) {
  return moduleDAO.updateVersionChangeLog(versionId, changeLog).then(() => {
    moduleDAO.updateModuleOperationTime(moduleId)
  })
}

function updateModuleOperationTime (moduleId) {
  return moduleDAO.updateModuleOperationTime(moduleId)
}

module.exports = {
  createModule: createModule,
  deleteModule: deleteModule,
  getModuleInfo: getModuleInfo,
  getModuleList: getModuleList,
  getModuleAdminUserInfo: getModuleAdminUserInfo,
  submitModuleAdminChange: submitModuleAdminUserChange,
  createModuleVersion: createModuleVersion,
  deleteModuleVersion: deleteModuleVersion,
  getModuleVersionList: getModuleVersionList,
  getModuleVersion: getModuleVersion,
  updateVersionChangeLog: updateVersionChangeLog,
  updateModuleOperationTime: updateModuleOperationTime
}
