const conf = require('../../conf')

let db
// 初始化与建表
function initDB (_db) {
  db = _db
  // 建立模块概览表。 模块信息只能设置，不能修改。 常见合理需求是仓库迁移。。。
  // id 自增主键
  // name, 模块名 ，唯一。
  // jenkins_job, jenkins上配置的job名，以进行打包调用处理
  // type , 这里的type 为枚举， iOS, h5, react, 三种， 之后再添加 Android
  // home_url , 仓库地址 ， 如 https://github.com/axe-org/demo-ground
  // git_type , 仓库类型， 暂时设定github和gitlab两种。 推荐使用gitlab，这里支持github只是为了在github上展示项目
  // created_time 创建时间
  // operation_time 操作时间， 操作时间为 创建时间、或创建版本时间、或完成版本时间，用来排序。。。
  return db.run(`CREATE TABLE IF NOT EXISTS module (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    jenkins_job VARCHAR(40) NOT NULL,
    type VARCHAR(10) NOT NULL,
    home_url VARCHAR(200) NOT NULL,
    git_type INT(1) NOT NULL,
    created_time DATETIME NOT NULL,
    operation_time DATETIME NOT NULL
)`).then(() =>
    // 创建模块版本信息表， 记录模块版本相关信息
    // id 自增主键
    // module_id 模块id ,外建
    // app_version_id 模块版本要绑定在app开发版本计划中， 外建。
    // imported 是否以接入到app版本中。
    // version 版本号， 三段式
    // version_code 转换成int类型。
    // current_version 当前版本号， 如果是开发阶段，就是beta版本，如果开发完成就是prd版本。
    // build_count 构建次数统计
    // build_failed 失败次数
    // build_success 成功次数。
    // created_time 创建时间
    // released 是否已发布prd版本。
    // change_log 使用markdown格式编写的 变更日志。
    // status 状态 ， 0 进行中，1未开始，2已完成
    // timeline_id 链接时间线详情，不设外键
    db.run(`CREATE TABLE IF NOT EXISTS module_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    app_version_id INTEGER NOT NULL,
    imported INT(1) NOT NULL,
    version VARCHAR(30) NOT NULL,
    version_code INTEGER NOT NULL,
    current_version VARCHAR(30) DEFAULT NULL,
    build_count NOT NULL DEFAULT 0,
    build_failed NOT NULL DEFAULT 0,
    build_success NOT NULL DEFAULT 0,
    created_time DATETIME NOT NULL,
    released INT(1) NOT NULL,
    change_log TEXT NOT NULL,
    status INT(1) NOT NULL,
    timeline_id INTEGER
  );`))
}

// 创建一个新的模块。
function createModule (moduleInfo) {
  return db.run(`INSERT INTO module VALUES (NULL,?,?,?,?,?,DATETIME('now','localtime'),DATETIME('now','localtime'))`,
    [moduleInfo.name, moduleInfo.jenkinsJob, moduleInfo.type, moduleInfo.homeURL, moduleInfo.gitType]).then(stmt => {
    return {moduleId: stmt.lastID}
  })
}

// 暂不支持修改。

// 删除模块， 只能删除无版本的模块。
function deleteModule (moduleId) {
  return db.run(`DELETE FROM module WHERE id = ?`, [moduleId])
}

// 获取基础的模块信息，通过模块名
function getModuleByName (name) {
  return db.get('SELECT * FROM module WHERE name = ?', [name]).then(row => {
    if (!row) {
      return null
    }
    return {
      moduleId: row.id,
      name: row.name,
      jenkinsJob: row.jenkins_job,
      type: row.type,
      homeURL: row.home_url,
      gitType: row.git_type,
      createdTime: row.created_time,
      operationTime: row.operation_time
    }
  })
}

function getBareModuleInfo (moduleId) {
  return db.get('SELECT * FROM module WHERE id =?', [moduleId]).then(row => {
    if (!row) {
      return Promise.reject(new Error('未查到指定的module信息,moduleId 为' + moduleId))
    }
    return {
      moduleId: row.id,
      name: row.name,
      jenkinsJob: row.jenkins_job,
      type: row.type,
      homeURL: row.home_url,
      gitType: row.git_type,
      createdTime: row.created_time,
      operationTime: row.operation_time
    }
  })
}

// 查询模块信息， 附带一些统计数据 ： 负责人列表、版本数量、 最新发布版本、 进行中版本。
function getModuleInfo (moduleId) {
  let moduleInfo
  return db.get('SELECT * FROM module WHERE id = ?', [moduleId]).then(row => {
    if (!row) {
      return Promise.reject(new Error('未查到指定的module信息,moduleId 为' + moduleId))
    }
    moduleInfo = {
      moduleId: row.id,
      name: row.name,
      jenkinsJob: row.jenkins_job,
      type: row.type,
      homeURL: row.home_url,
      gitType: row.git_type,
      createdTime: row.created_time,
      operationTime: row.operation_time
    }
  }).then(() =>
    // 负责人列表
    db.all(`SELECT name, module_id FROM (SELECT * FROM user_group WHERE module_id = ?) 
    INNER JOIN user ON user_id = user.id`, [moduleInfo.moduleId])
  ).then((rows) => {
    let userList = []
    rows.forEach((row) => {
      userList.push(row.name)
    })
    moduleInfo['userList'] = userList
  }).then(() =>
    // 获取版本数量
    db.get(`SELECT COUNT(*) AS count FROM module_version WHERE module_id = ?`, [moduleInfo.moduleId])
  ).then((row) => {
    moduleInfo['versionCount'] = row.count
  }).then(() =>
    // 获取进行中版本列表。
    db.all(`SELECT version FROM module_version WHERE status != ? AND module_id = ?`,
      [conf.TIMELINE_STATUS_DONE, moduleInfo.moduleId])
  ).then((rows) => {
    let list = []
    rows.forEach((row) => {
      list.push(row.version)
    })
    moduleInfo['onGoingList'] = list
  }).then(() =>
    // 获取最新的prd版本号
    db.get(`SELECT * FROM module_version WHERE module_id = ? AND version_code = 
      (SELECT MAX(version_code) FROM module_version WHERE released = 1 AND module_id = ?)`,
    [moduleInfo.moduleId, moduleInfo.moduleId])
  ).then((row) => {
    if (row) {
      moduleInfo['maxPrdVersion'] = row.version
    }
  }).then(() => Promise.resolve(moduleInfo))
}

// 分页查询 , 参数为 {pageNum : 当前页数 ,从0开始，pageSize:每页数量, name:模糊搜索，type : 类型搜索，ios\react\html , adminUser: 是否为该用户管理,为用户id}
// 按 最新模块版本的 operationTime时间排序。
function getModuleList (query) {
  let data = {}
  let param = []
  let moduleIDList
  // 模块名限定SQL语句
  let nameLimitSQL = ''
  if (query.name && query.name !== '') {
    nameLimitSQL = ` AND name LIKE ? `
    param.push('%' + query.name + '%')
  }
  // 类型限定
  let typeLimitSQL = ''
  if (query.type) {
    typeLimitSQL = ` AND type = ? `
    param.push(query['type'])
  }
  // 模块管理员限定
  let adminLimitSql = ''
  if (query.adminUser) {
    adminLimitSql = `AND id IN (SELECT module_id FROM user_group WHERE user_id = ?)`
    param.push(query['adminUser'])
  }
  // 模块id限定，在第一步查询后， 通过该限定以获取一些统计信息。 (1,2,3)
  let moduleLimitStr = ' '
  param.push(query.pageSize)
  param.push(query.pageNum * query.pageSize)
  return db.all(`SELECT * FROM module WHERE 1 ${nameLimitSQL} ${typeLimitSQL} ${adminLimitSql}
  ORDER BY operation_time DESC LIMIT ? OFFSET ? ;`, param).then((rows) => {
    data['moduleList'] = []
    moduleIDList = []
    rows.forEach(row => {
      data['moduleList'].push({
        moduleId: row.id,
        name: row.name,
        jenkinsJob: row.jenkins_job,
        type: row.type,
        homeURL: row.home_url,
        gitType: row.git_type,
        createdTime: row.created_time,
        operationTime: row.operation_time
      })
      moduleIDList.push(row.id)
    })
    moduleLimitStr = ' ( ' + moduleIDList.join(',') + ' ) '
  }).then(() => {
    param.pop()
    param.pop()
    return db.get(`SELECT COUNT(*) AS count FROM module WHERE 1 ${nameLimitSQL} ${typeLimitSQL} ${adminLimitSql} `, param)
  }).then((row) => {
    let pageCount = parseInt(row.count / query.pageSize) + 1
    data['pageCount'] = pageCount
  }).then(() => {
    if (moduleIDList.length) {
      // 然后查询一些统计信息。
      // 负责人列表。
      return db.all(`SELECT name, module_id FROM (SELECT * FROM user_group WHERE module_id IN ${moduleLimitStr})
      INNER JOIN user ON user_id = user.id`).then((rows) => {
        let usersMap = {}
        moduleIDList.forEach(moduleId => {
          usersMap[moduleId] = []
        })
        rows.forEach(row => {
          usersMap[row.module_id].push(row.name)
        })
        data['moduleList'].forEach(moduleInfo => {
          moduleInfo['userList'] = usersMap[moduleInfo.moduleId]
        })
      }).then(() =>
        // 版本数量
        db.all(`SELECT module_id,COUNT(*) AS count FROM module_version GROUP BY module_id HAVING module_id IN ${moduleLimitStr} `)
      ).then(rows => {
        let countMap = {}
        data['moduleList'].forEach(moduleInfo => {
          moduleInfo['versionCount'] = 0
          countMap[moduleInfo.moduleId] = moduleInfo
        })
        rows.forEach(row => {
          countMap[row.module_id]['versionCount'] = row.count
        })
      }).then(() =>
        // 进行中版本列表
        db.all(`SELECT version, module_id FROM module_version WHERE status != ? AND module_id IN ${moduleLimitStr} `, [conf.TIMELINE_STATUS_DONE])
      ).then(rows => {
        let ongoingMap = {}
        moduleIDList.forEach(moduleId => {
          ongoingMap[moduleId] = []
        })
        rows.forEach(row => {
          ongoingMap[row.module_id].push(row.version)
        })
        data['moduleList'].forEach(moduleInfo => {
          moduleInfo['onGoingList'] = ongoingMap[moduleInfo.moduleId]
        })
      }).then(() =>
        // 获取最新prd版本号
        db.all(`SELECT module_id, version, MAX(version_code) FROM (SELECT * FROM module_version WHERE module_id IN ${moduleLimitStr} AND released = 1) GROUP BY module_id`)
      ).then(rows => {
        let maxPrdVersionMap = {}
        rows.forEach(row => {
          maxPrdVersionMap[row.module_id] = row.version
        })
        data['moduleList'].forEach(moduleInfo => {
          moduleInfo['maxPrdVersion'] = maxPrdVersionMap[moduleInfo.moduleId]
        })
      })
    }
  }).then(() => Promise.resolve(data))
}

// 在每个模块操作完成后，更新模块的操作时间。 操作时间用于列表排序模块
function updateModuleOperationTime (moduleId) {
  return db.run(`UPDATE module SET operation_time = DATETIME('now','localtime') WHERE id = ?`, [moduleId])
}

// 创建版本前，先检测版本号是否能创建， 即大于最大生产版本号， 且重复。
function checkModuleVersionCanCreate (moduleId, versionCode) {
  return db.get(`SELECT MAX(version_code),version FROM module_version WHERE released = 1 AND module_id = ?`, [moduleId]).then(row => {
    if (row && row['MAX(version_code)']) {
      // 如果有最大值
      if (row['MAX(version_code)'] >= versionCode) {
        return Promise.reject(new Error(`新版本的版本号应该大于当前最大生产版本号 ${row.version}`))
      }
    }
  }).then(() =>
    db.get(`SELECT * FROM module_version WHERE module_id = ? AND version_code = ?`, [moduleId, versionCode]).then(row => {
      if (row) {
        return Promise.reject(new Error(`当前模块已经创建了版本号 ${row.version} ,请更改版本号！！`))
      }
    })
  )
}

// 创建模块版本
function createModuleVersion (versionInfo) {
  return db.run(`INSERT INTO module_version VALUES (NULL, ?, ?, 0, ?, ?, NULL, 0, 0, 0, DATETIME('now','localtime'), 0, ?, ?, NULL)`,
    [versionInfo.moduleId, versionInfo.appVersionId, versionInfo.version, versionInfo.versionCode, versionInfo.changeLog, conf.TIMELINE_STATUS_WAITING]).then(stmt => {
    return stmt.lastID
  })
}
// 创建模块，以及创建 timeline完成后，设置timeline_id
function addTimelineIDForVersion (versionId, timelineId) {
  return db.run(`UPDATE module_version SET timeline_id = ? WHERE id = ?`, [timelineId, versionId])
}

// 删除未开始的模块版本
function deleteModuleVersion (versionId) {
  return db.run(`DELETE FROM module_version WHERE id = ?`, versionId)
}

// 更新 变更日志
function updateVersionChangeLog (versionId, changeLog) {
  return db.run(`UPDATE module_version SET change_log = ? WHERE id = ?`, [changeLog, versionId])
}

// 在构建失败后， 更新这里的统计信息， 参数为 versionId
function updateVersionWithFailedBuild (versionId) {
  return db.run(`UPDATE module_version SET build_failed = build_failed + 1 , build_count = build_count + 1
   WHERE id = ?`, versionId)
}

// 构建成功后，更新数据 参数 versionId , newVersion, released 是否是prd构建
function updateVersionWithSuccessBuild (versionId, newVersion, released) {
  return db.run(`UPDATE module_version SET build_success = build_success + 1 , build_count = build_count + 1 ,
    current_version = ? , released = ?  WHERE id = ?`, [newVersion, released ? 1 : 0, versionId])
}

// 获取模块版本相关信息, 找不到会报错
function getModuleVersionInfo (moduleId, version) {
  return db.get(`SELECT *  FROM module_version WHERE module_id = ? AND version = ?`, [moduleId, version]).then(row => {
    if (row) {
      return {
        versionId: row.id,
        moduleId: row.module_id,
        appVersionId: row.app_version_id,
        imported: row.imported,
        version: row.version,
        versionCode: row.version_code,
        currentVersion: row.current_version,
        buildCount: row.build_count,
        buildFailed: row.build_failed,
        buildSuccess: row.build_success,
        createdTime: row.created_time,
        released: row.released,
        changeLog: row.change_log,
        status: row.status,
        timelineId: row.timeline_id
      }
    } else {
      return Promise.reject(new Error(`未找到 模块ID 为 ${moduleId} 的 ${version} 版本！！！`))
    }
  })
}

function getModuleVersionInfoById (versionId) {
  return db.get(`SELECT module_version.*, app_version.version AS app_version  FROM module_version
    INNER JOIN app_version ON module_version.id = ? AND module_version.app_version_id = app_version.id`, [versionId]).then(row => {
    if (row) {
      return {
        versionId: row.id,
        moduleId: row.module_id,
        appVersion: row.app_version,
        appVersionId: row.app_version_id,
        imported: row.imported,
        version: row.version,
        versionCode: row.version_code,
        currentVersion: row.current_version,
        buildCount: row.build_count,
        buildFailed: row.build_failed,
        buildSuccess: row.build_success,
        createdTime: row.created_time,
        released: row.released,
        changeLog: row.change_log,
        status: row.status,
        timelineId: row.timeline_id
      }
    } else {
      return Promise.reject(new Error(`未找到 ID 为 ${versionId} 的版本！！！`))
    }
  })
}

// 分页获取模块版本列表信息
function getModuleVersionList (moduleId, pageNum, pageSize) {
  let ret = {}
  return db.all(`SELECT module_version.*, app_version.version AS app_version FROM module_version
    INNER JOIN app_version ON module_version.module_id = ? AND module_version.app_version_id = app_version.id
    ORDER BY module_version.status ASC, module_version.version_code DESC LIMIT ? OFFSET ?`, [moduleId, pageSize, pageSize * pageNum]).then(rows => {
    let list = []
    rows.forEach(row => {
      list.push({
        versionId: row.id,
        moduleId: row.module_id,
        appVersion: row.app_version,
        appVersionId: row.app_version_id,
        imported: row.imported,
        version: row.version,
        versionCode: row.version_code,
        currentVersion: row.current_version,
        buildCount: row.build_count,
        buildFailed: row.build_failed,
        buildSuccess: row.build_success,
        createdTime: row.created_time,
        released: row.released,
        changeLog: row.change_log,
        status: row.status,
        timelineId: row.timeline_id
      })
    })
    ret['versionList'] = list
  }).then(() =>
    db.get(`SELECT COUNT(*) FROM module_version WHERE module_id = ?`, [moduleId])
  ).then(row => {
    ret['pageCount'] = parseInt(row['COUNT(*)'] / pageSize) + 1
    return ret
  })
}

module.exports = {
  initDB: initDB,
  createModule: createModule,
  getModuleInfo: getModuleInfo,
  getBareModuleInfo: getBareModuleInfo,
  deleteModule: deleteModule,
  getModuleList: getModuleList,
  getModuleByName: getModuleByName,
  createModuleVersion: createModuleVersion,
  addTimelineIDForVersion: addTimelineIDForVersion,
  deleteModuleVersion: deleteModuleVersion,
  checkModuleVersionCanCreate: checkModuleVersionCanCreate,
  updateModuleOperationTime: updateModuleOperationTime,
  getModuleVersionInfo: getModuleVersionInfo,
  getModuleVersionInfoById: getModuleVersionInfoById,
  getModuleVersionList: getModuleVersionList,
  updateVersionChangeLog: updateVersionChangeLog,
  updateVersionWithFailedBuild: updateVersionWithFailedBuild,
  updateVersionWithSuccessBuild: updateVersionWithSuccessBuild
}
