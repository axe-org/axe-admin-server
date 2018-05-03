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

// // 获取全部APP版本列表， 进行分页处理。 而且进行排序， 先进行中的，再未开始的，然后才是已经完成的，且版本号由高到低。
// function getAppVersionsByPage (pageNum, pageCount) {
//   let array = []
//   return db.all('SELECT * FROM app_version ORDER BY status ASC , version_code DESC LIMIT ? OFFSET ?',
//     [pageCount, pageCount * pageNum]).then(rows => {
//     rows.forEach(function (row) {
//       array.push({
//         versionId: row.id,
//         version: row.version,
//         versionCode: row.version_code,
//         status: row.status,
//         timelineId: row.timeline_id
//       })
//     })
//   }).then(() => db.get('SELECT count(*) FROM app_version ')).then(row => {
//     let count = row['count(*)']
//     return {
//       versionList: array,
//       pageCount: parseInt(count / 12) + 1
//     }
//   })
// }

// 获取详细的APP信息
// TODO dao层，只能处理自己数据的数据， 多余的操作放在service中进行 ?
function getAPPVersionDetailInfo (moduleVersion) {
  let data = {}
  return db.get(`SELECT * FROM app_version WHERE version = ?;`, [moduleVersion]).then(row => {
    if (!row) {
      return Promise.reject(new Error(`未找到 ${moduleVersion} 版本的数据 ！！！`))
    }
    data['versionInfo'] = {
      versionId: row.id,
      version: row.version,
      versionCode: row.version_code,
      status: row.status,
      timelineId: row.timeline_id,
      createdTime: row.created_time
    }
  }).then(() =>
    // 查询进度情况
    db.all(`SELECT * FROM timeline_action WHERE line_id = ?`, data.versionInfo.timelineId)
  ).then(rows => {
    let actions = {}
    rows.forEach((row) => {
      // 只获取基本事件。
      if (row.type !== conf.TIMELINE_ACTION_TYPE_USERSET) {
        actions[row.type] = {
          actionId: row.id,
          lineId: row.line_id,
          type: row.type,
          expectedTime: row.expected_time,
          status: row.status,
          title: row.title,
          // detail: row.detail, 不要详细描述
          finishedTime: row.finished_time
        }
      }
      data['actions'] = actions
    })
  }).then(() =>
    // 查询模块信息。
    db.all(`SELECT module_version.*, module.name AS name FROM module_version INNER JOIN module ON  app_version_id = ? AND module_id = module.id`, data.versionInfo.versionId)
  ).then(rows => {
    let array = []
    rows.forEach(row => {
      array.push({
        versionId: row.id,
        name: row.name,
        moduleId: row.module_id,
        imported: row.imported,
        version: row.version,
        currentVersion: row.current_version,
        buildCount: row.build_count,
        buildFailed: row.build_failed,
        buildSuccess: row.build_success,
        createdTime: row.created_time,
        released: row.released,
        status: row.status
      })
    })
    data['moduleVersionList'] = array
    return data
  })
}

// 查询详细APP版本信息列表
// ongoing 查询正在进行中， 或者已完成的。
// pageNum 页数
// pageSize 分页大小
function getAPPVersionDetailInfoList (ongoing, pageNum, pageSize) {
  let versionList = []
  let limitSQL
  if (ongoing) {
    limitSQL = ' WHERE status != 2 '
  } else {
    limitSQL = ' WHERE status = 2 '
  }
  return db.all(`SELECT * FROM app_version ${limitSQL} ORDER BY version_code DESC LIMIT ? OFFSET ?`,
    [pageSize, pageNum * pageSize]).then(rows => {
    let lineIDList = []
    let versionIDList = []
    rows.forEach(function (row) {
      versionList.push({
        versionInfo: {
          versionId: row.id,
          version: row.version,
          versionCode: row.version_code,
          status: row.status,
          timelineId: row.timeline_id,
          createdTime: row.created_time
        },
        actions: {},
        moduleVersionList: []
      })
      lineIDList.push(row.timeline_id)
      versionIDList.push(row.id)
    })
    if (lineIDList.length) {
      let lineMap = {}
      let moduleMap = {}
      versionList.forEach(version => {
        lineMap[version.versionInfo.timelineId] = version
        moduleMap[version.versionInfo.versionId] = version
      })
      // 查询时间信息
      return db.all(`SELECT * FROM timeline_action WHERE line_id IN (${lineIDList.join(',')})`).then(rows => {
        rows.forEach(row => {
          if (row.type !== conf.TIMELINE_ACTION_TYPE_USERSET) {
            lineMap[row.line_id].actions[row.type] = {
              actionId: row.id,
              lineId: row.line_id,
              type: row.type,
              expectedTime: row.expected_time,
              status: row.status,
              title: row.title,
              finishedTime: row.finished_time
            }
          }
        })
      }).then(() =>
        // 查询模块版本信息
        db.all(`SELECT module_version.*, module.name AS name FROM module_version INNER JOIN module ON  app_version_id IN (${versionIDList.join(',')}) AND module_id = module.id`)
      ).then(rows => {
        rows.forEach(row => {
          moduleMap[row.app_version_id].moduleVersionList.push({
            versionId: row.id,
            name: row.name,
            moduleId: row.module_id,
            imported: row.imported,
            version: row.version,
            currentVersion: row.current_version,
            buildCount: row.build_count,
            buildFailed: row.build_failed,
            buildSuccess: row.build_success,
            createdTime: row.created_time,
            released: row.released,
            status: row.status
          })
        })
      })
    }
  }).then(() => db.get(`SELECT count(*) FROM app_version ${limitSQL}`)).then(row => {
    let count = row['count(*)']
    return {
      versionList: versionList,
      pageCount: parseInt(count / pageSize) + 1
    }
  })
}

module.exports = {
  initDB: initDB,
  getVersionInfo: getVersionInfo,
  addVersion: addVersion,
  deleteVersion: deleteVersion,
  getOngoingAppVersions: getOngoingAppVersions,
  // getAppVersionsByPage: getAppVersionsByPage,
  setVersionTimeLine: setVersionTimeLine,
  getAPPVersionDetailInfo: getAPPVersionDetailInfo,
  getAPPVersionDetailInfoList: getAPPVersionDetailInfoList
}
