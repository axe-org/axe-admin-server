// sql 实现， 这里使用 sqlite3
const conf = require('../../conf')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  // 建立APP 版本 信息表。
  // version 版本号
  // version_code , 将版本号转换为数字，以便排序与比较。 1.10.0 -> 001,010,000
  // status 状态  0 进行中  ，1 未开始， ，2已完成
  // timeline_id 时间线id , 这个不设置外建。
  // created_time 创建时间
  // 对于未开始的APP版本，可以进行删除。
  return db.run(`CREATE TABLE IF NOT EXISTS app_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version VARCHAR(30) NOT NULL UNIQUE,
    version_code INTEGER NOT NULL,
    status INT(1) NOT NULL,
    created_time DATETIME NOT NULL,
    timeline_id INTEGER
  )`)
}

// 获取版本信息 , 传入值 二选一 ， version 或者 versionId
function getVersionInfo (versionInfo) {
  return db.get('SELECT * FROM app_version WHERE version = ? OR id = ?', [versionInfo.version, versionInfo.versionId]).then((row) => {
    if (row) {
      return {
        versionId: row.id,
        version: row.version,
        versionCode: row.version_code,
        status: row.status,
        timelineId: row.timeline_id,
        createdTime: row.created_time
      }
    }
  })
}

// 添加新app版本 ， 要先检测有没有版本
function addVersion (versionInfo) {
  return db.run(`INSERT INTO app_version VALUES (NULL, ? , ? , ? , DATETIME('now','localtime') , NULL )`,
    [versionInfo.version, versionInfo.versionCode, versionInfo.status]).then(stmt => {
    return {
      versionId: stmt.lastID
    }
  })
}

// 删除版本， 只能删除未开始的版本。
function deleteVersion (versionId) {
  return db.run(`DELETE FROM app_version WHERE id = ?`, [versionId])
}

// 设置状态
function updateVersionState (versionId, status) {
}

// 设置timelineID
function setVersionTimeLine (versionId, timelineId) {
  return db.run(`UPDATE app_version SET timeline_id = ? WHERE id = ?`, [timelineId, versionId])
}

// 获取正在进行中的 APP版本列表，即未开始和已开始的， 不做分页处理.
function getOngoingAppVersions () {
  return db.all('SELECT * FROM app_version WHERE status != ?  ORDER BY status ASC , version_code DESC',
    [conf.TIMELINE_STATUS_DONE]).then(rows => {
    let array = []
    rows.forEach(function (row) {
      array.push({
        versionId: row.id,
        version: row.version,
        versionCode: row.version_code,
        status: row.status,
        timelineId: row.timeline_id
      })
    })
    return {
      versionList: array
    }
  })
}

// 获取全部APP版本列表， 进行分页处理。 而且进行排序， 先进行中的，再未开始的，然后才是已经完成的，且版本号由高到低。
function getAppVersionsByPage (pageNum, pageCount) {
  let array = []
  return db.all('SELECT * FROM app_version ORDER BY status ASC , version_code DESC LIMIT ? OFFSET ?',
    [pageCount, pageCount * pageNum]).then(rows => {
    rows.forEach(function (row) {
      array.push({
        versionId: row.id,
        version: row.version,
        versionCode: row.version_code,
        status: row.status,
        timelineId: row.timeline_id
      })
    })
  }).then(() => db.get('SELECT count(*) FROM app_version ')).then(row => {
    let count = row['count(*)']
    return {
      versionList: array,
      pageCount: parseInt(count / 12) + 1
    }
  })
}

module.exports = {
  initDB: initDB,
  getVersionInfo: getVersionInfo,
  addVersion: addVersion,
  deleteVersion: deleteVersion,
  getOngoingAppVersions: getOngoingAppVersions,
  getAppVersionsByPage: getAppVersionsByPage,
  updateVersionState: updateVersionState,
  setVersionTimeLine: setVersionTimeLine
}
