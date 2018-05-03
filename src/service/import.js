const importDAO = require('../dao').importDAO
const moduleDAO = require('../dao').moduleDAO
const conf = require('../conf')

// 模块管理员申请在某个APP版本上接入模块。
function applyImportModule (moduleVersionId, note, applicant) {
  let applyInfo = {}
  applyInfo.note = note
  applyInfo.applicant = applicant
  applyInfo.status = conf.MODULE_IMPORT_STATUS_WAITING
  applyInfo.moduleVersionId = moduleVersionId
  return moduleDAO.getModuleVersionInfoById(moduleVersionId).then(versionInfo => {
    applyInfo.appVersion = versionInfo.appVersion
    applyInfo.moduleId = versionInfo.moduleId
    applyInfo.moduleVersion = versionInfo.version
    return moduleDAO.getBareModuleInfo(versionInfo.moduleId)
  }).then(moduleInfo => {
    applyInfo.module = moduleInfo.name
    // 数据组装完成。 检测当前模块的接入是否已提交。
    return importDAO.getImportRecord(applyInfo.appVersion, applyInfo.moduleVersionId)
  }).then(importRecord => {
    if (importRecord) {
      return Promise.reject(new Error(`当前模块 ${applyInfo.module} ${applyInfo.moduleVersion} 接入到APP ${applyInfo.appVersion} 的申请已提交，请通知APP管理员以及时处理！！`))
    } else {
      return importDAO.createImportApply(applyInfo)
    }
  })
}

// 查询待处理接入列表
function getWaitingImportList (appVersion) {
  return importDAO.getWaitingImportList(appVersion)
}
// 分页查询所有记录
function getImportRecordList (appVersion, module, pageNum) {
  let query = {
    pageNum: pageNum - 1,
    pageSize: 10
  }
  if (appVersion && appVersion !== '') {
    query['appVersion'] = appVersion
  }
  if (module && module !== '') {
    query['module'] = module
  }
  return importDAO.getImportRecordList(query)
}

// 拒绝单独的一个引入
function rejectImport (importId, handleUser, note) {
  return importDAO.rejectImport(importId, handleUser, note)
}

module.exports = {
  applyImportModule: applyImportModule,
  getWaitingImportList: getWaitingImportList,
  getImportRecordList: getImportRecordList,
  rejectImport: rejectImport
}
