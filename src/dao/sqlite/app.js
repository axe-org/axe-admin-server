// sql 实现， 这里使用 sqlite3
const Promise = require('bluebird')
const conf = require('../../conf')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  return new Promise((resolve, reject) => {
    // 建立APP version 信息表。APP信息表里只有一个APP， 进行一些内容的配置，
    // version 版本号
    // version_code , 将版本号转换为数字，以便排序与比较。 1.10.0 -> 001,010,000
    // status 状态  0 进行中  ，1 未开始， ，2已完成
    // timeline_id 时间线id , 这个不设置外建。
    // created_time 创建时间
    // 对于未开始的APP版本，可以进行删除。
    db.run(`CREATE TABLE IF NOT EXISTS app_version (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version VARCHAR(30) NOT NULL UNIQUE,
      version_code INTEGER NOT NULL,
      status INT(1) NOT NULL,
      created_time DATETIME NOT NULL,
      timeline_id INTEGER
    )`, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 获取版本信息 , 传入值 二选一 ， version 或者 versionId
function getVersionInfo (versionInfo) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM app_version WHERE version = ? OR id = ?', [versionInfo.version, versionInfo.versionId], function (err, row) {
      if (err) {
        reject(err)
      } else {
        if (!row) {
          // reject(new Error('当前无用户 ' + userName))
          resolve(null)
        } else {
          resolve({
            versionId: row.id,
            version: row.version,
            versionCode: row.version_code,
            status: row.status,
            timelineId: row.timeline_id,
            createdTime: row.created_time
          })
        }
      }
    })
  })
}

// 添加新app版本 ， 要先检测有没有版
function addVersion (versionInfo) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO app_version VALUES (NULL, ? , ? , ? , DATETIME('now','localtime') , NULL )`,
      [versionInfo.version, versionInfo.versionCode, versionInfo.status], function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            versionId: this.lastID
          })
        }
      })
  })
}

// 删除版本， 只能删除未开始的版本。
function deleteVersion (versionId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM app_version WHERE id = ?`,
      [versionId], function (err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
  })
}

// 设置状态
function updateVersionState (versionId, status) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE app_version SET status = ? WHERE id = ?`, [status, versionId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 设置timelineID
function setVersionTimeLine (versionId, timelineId) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE app_version SET timeline_id = ? WHERE id = ?`, [timelineId, versionId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 获取正在进行中的 APP版本列表，即未开始和已开始的， 不做分页处理.
function getOngoingAppVersions () {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM app_version WHERE status != ?  ORDER BY status ASC , version_code DESC',
      [conf.TIME_LINE_STATUS_DONE], function (err, rows) {
        if (err) {
          reject(err)
        } else {
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
          resolve({
            versionList: array
          })
        }
      })
  })
}

// 获取全部APP版本列表， 进行分页处理。 而且进行排序， 先进行中的，再未开始的，然后才是已经完成的，且版本号由高到低。
function getAppVersionsByPage (pageNum, pageCount) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM app_version ORDER BY status ASC , version_code DESC LIMIT ? OFFSET ?',
      [pageCount, pageCount * pageNum], function (err, rows) {
        if (err) {
          reject(err)
        } else {
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
          db.get('SELECT count(*) FROM app_version ', function (err, row) {
            if (err) {
              reject(err)
            } else {
              let count = row['count(*)']
              resolve({
                versionList: array,
                pageCount: parseInt(count / 12) + 1
              })
            }
          })
        }
      })
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
