// 模块接入管理
const transaction = require('./transaction')
const conf = require('../../conf')
let db

function initDB (_db) {
  db = _db
  // 创建接入管理表
  // id : 自增主键
  // app_version : 接入的APP版本
  // module : 模块名
  // module_id : 模块id
  // module_version : 新的模块版本。
  return db.run(`CREATE TABLE IF NOT EXISTS import (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_version VARCHAR(30) NOT NULL,
    module VARCHAR(30) NOT NULL,
    module_id INTEGER NOT NULL,
    module_version VARCHAR(30) NOT NULL,
    module_version_id INTEGER NOT NULL,
    applicant VARCHAR(30) NOT NULL,
    apply_time DATETIME NOT NULL,
    status INT(1) NOT NULL,
    note VARCHAR(50) NOT NULL,
    handle_user VARCHAR(30),
    handle_time DATETIME
  )`)
}

// 提交一个模块接入的申请
function createImportApply (applyInfo) {
  return db.run(`INSERT INTO import VALUES (NULL,?,?,?,?,?,?,DATETIME('now','localtime'),?,?, NULL, NULL)`,
    [applyInfo.appVersion, applyInfo.module, applyInfo.moduleId, applyInfo.moduleVersion, applyInfo.moduleVersionId,
      applyInfo.applicant, applyInfo.status, applyInfo.note])
}
// 处理模块接入， 根据jenkins结果决定状态 , 使用事务， 处理一批模块的接入 [{importId, status,handlerUser, moduleVersionId}]
function handleImport (importList) {
  return transaction().then(tr => {
    importList.forEach(moduleImport => {
      tr.run(`UPDATE import SET status = ? , handle_user = ? , handle_time = DATETIME('now','localtime') WHERE id = ?`,
        [moduleImport.status, moduleImport.handleUser, moduleImport.importId])
      // 同时修改模块版本的接入状态。
      if (moduleImport.status === conf.MODUEL_IMPORT_STATUS_SUCCESS) {
        tr.run(`UPDATE module_version SET imported = 1 WHERE id = ?`, moduleImport.moduleVersionId)
      }
    })
    return tr.commit()
  })
}

// 没有删除操作。

// 查询操作
// 查询 指定APP版本下，等待处理的模块接入请求
function getWaitingImportList (appVersion) {
  return db.all(`SELECT * FROM import WHERE app_version = ? AND (status == ? OR status == ?)`,
    [appVersion, conf.MODULE_IMPORT_STATUS_WAITING, conf.MODULE_IMPORT_STATUS_FAILED]).then((rows) => {
    let list = []
    rows.forEach(row => {
      list.push({
        importId: row.id,
        appVersion: row.app_version,
        module: row.module,
        moduleId: row.module_id,
        moduleVersion: row.module_version,
        moduleVersionId: row.module_version_id,
        applicant: row.applicant,
        applyTime: row.apply_time,
        status: row.status,
        note: row.note,
        handleUser: row.handle_user,
        handleTime: row.handleTime
      })
    })
    return list
  })
}

// 根据条件进行分页查询 ， 参数为 {appVersion: app版本号，module: 模块名，pageNum, pageSize }
function getImportRecordList (query) {
  let params = []
  let limitVersion = ''
  if (query.appVersion) {
    limitVersion = ' AND app_version = ? '
    params.push(query.appVersion)
  }
  let limitModule = ''
  if (query.module) {
    limitModule = ' AND module = ? '
    params.push(query.module)
  }
  params.push(query.pageSize)
  params.push(query.pageNum * query.pageSize)
  let ret = {}
  return db.all(`SELECT * FROM import WHERE 1 = 1 ${limitVersion} ${limitModule} ORDER BY apply_time DESC LIMIT ? OFFSET ?;`,
    params).then(rows => {
    let list = []
    rows.forEach(row => {
      list.push({
        importId: row.id,
        appVersion: row.app_version,
        module: row.module,
        moduleId: row.module_id,
        moduleVersion: row.module_version,
        moduleVersionId: row.module_version_id,
        applicant: row.applicant,
        applyTime: row.apply_time,
        status: row.status,
        note: row.note,
        handleUser: row.handle_user,
        handleTime: row.handleTime
      })
    })
    ret['importList'] = list
  }).then(() => {
    params.pop()
    params.pop()
    return db.get(`SELECT COUNT(*) AS count FROM import WHERE 1 = 1 ${limitVersion} ${limitModule} ;`, params)
  }).then(row => {
    let pageCount = parseInt(row.count / query.pageSize) + 1
    ret['pageCount'] = pageCount
    return ret
  })
}

// 查询具体 模块引入
function getImportRecord (appVersion, moduleVersionId) {
  return db.get(`SELECT * FROM import WHERE app_version = ? AND module_version_id = ?;`, [appVersion, moduleVersionId]).then(row => {
    if (row) {
      return {
        importId: row.id,
        appVersion: row.app_version,
        module: row.module,
        moduleId: row.module_id,
        moduleVersion: row.module_version,
        moduleVersionId: row.module_version_id,
        applicant: row.applicant,
        applyTime: row.apply_time,
        status: row.status,
        note: row.note,
        handleUser: row.handle_user,
        handleTime: row.handleTime
      }
    }
  })
}

module.exports = {
  initDB: initDB,
  createImportApply: createImportApply,
  handleImport: handleImport,
  getWaitingImportList: getWaitingImportList,
  getImportRecordList: getImportRecordList,
  getImportRecord: getImportRecord
}
