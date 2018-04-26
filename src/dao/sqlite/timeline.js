// 时间线的数据库操作
const transaction = require('./transaction')
const conf = require('../../conf')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  // 建立 时间线表
  // id 自增主键
  // type 0 表示 APP ,1 表示模块
  // app_version_id 模块必须绑定在APP版本上。 设置外键，且自动删除。
  // module_version_id 模块版本。
  // status 当前状态 ， 0 表示未启动，1表示进行中，2表示已完成
  return db.run(`CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type INT(1) NOT NULL,
    app_version_id INTEGER NOT NULL,
    module_version_id INTEGER,
    status INT(1) NOT NULL,
    FOREIGN KEY(app_version_id) REFERENCES app_version(id) ON DELETE CASCADE
  )`).then(() => {
    // 创建 时间事件表
    // id 自增主键
    // line_id 为时间线ID， 外键
    // type ，0 表示默认 ， 1 表示用户添加 ， 之后加其他类型， 默认的不能删除。
    // expected_time , 预期完成时间
    // status , 当前状态 0 表示未完成， 1 表示已完成
    // title ， 标题 ，简要说明
    // detail , 详细说明 ， 提供一部分说明，用户可以修改以加上具体实施细节
    // logs , 日志说明， 记录用户操作， 如 xxx创建了事件，xxx修改了事件，xxx完成了事件等等。 暂时不添加。之后考虑日志数据库。
    // finished_time , 实际操作时间
    return db.run(`CREATE TABLE IF NOT EXISTS timeline_action (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL,
      type INT(1) NOT NULL,
      expected_time DATE NOT NULL,
      status INT(1) NOT NULL,
      title VARCHAR(50) NOT NULL,
      detail VARCHAR(500) NOT NULL,
      finished_time DATETIME,
      FOREIGN KEY(line_id) REFERENCES timeline(id) ON DELETE CASCADE
    )`)
  })
}

// 添加时间线信息
function addTimeLine (timelineInfo) {
  return db.run(`INSERT INTO timeline VALUES (NULL, ? , ? , ? , ? )`,
    [timelineInfo.type, timelineInfo.appVersionId, timelineInfo.moduleVersionId, timelineInfo.status]).then(stmt => {
    return {timelineId: stmt.lastID}
  })
}
// 获取timeline的简单信息。
function getTimeline (timelineId) {
  return db.get('SELECT * FROM timeline WHERE id = ?', [timelineId]).then(row => {
    if (!row) {
      return Promise.reject(new Error('查询 timeline 发生未知异常！！！'))
    }
    return {
      timelineId: row.id,
      type: row.type,
      appVersionId: row.app_version_id,
      moduleVersionId: row.module_version_id,
      status: row.status
    }
  })
}

// 不需要删除， 有自动删除。
// 改动只有状态的更新
function updateTimelineStatus (timeLineId, status) {
  return db.run(`UPDATE timeline SET status = ? WHERE id = ?`, [status, timeLineId])
}

// 查，按照需求来， 暂时无需求，不查。

// 添加时间事件
function createTimeLineAction (action) {
  return db.run(`INSERT INTO timeline_action VALUES (NULL, ? , ? , ? , ? , ? , ? , NULL )`,
    [action.lineId, action.type, action.expectedTime, action.status, action.title, action.detail]).then(stmt => {
    return {actionId: stmt.lastID}
  })
}

// 更新 ，能修改的属性为 detail
function updateTimeLineAction (action) {
  return db.run(`UPDATE timeline_action SET detail = ?  WHERE id = ?`, [action.detail, action.actionId])
}
// 更新， 完成一个时间线上的事件。 使用事务以确保操作原子性。
function finishTimelineAction (actionInfo) {
  return transaction().then(transactionDB => {
    transactionDB.run(`UPDATE timeline_action SET detail = ? , status = ? , finished_time = DATETIME('now','localtime') WHERE id = ?;`
      , [actionInfo.detail, actionInfo.status, actionInfo.actionId])
    // 然后判断是否是特殊类型.
    if (actionInfo.type === conf.TIMELINE_ACTION_TYPE_START) {
      // 特殊类型，要修改APP或者模块的状态。
      let status = conf.TIMELINE_STATUS_DOING
      transactionDB.run(`UPDATE timeline SET status = ? WHERE id = ?;`, [status, actionInfo.timelineId])
      if (actionInfo.timelineType === conf.TIMELINE_TYPE_APP) {
        transactionDB.run(`UPDATE app_version SET status = ? WHERE id = ?;`, [status, actionInfo.appVersionId])
      } else if (actionInfo.timelineType === conf.TIMELINE_TYPE_MODULE) {
        transactionDB.run(`UPDATE module_version SET status = ? WHERE id = ?`, [status, actionInfo.moduleVersionId])
      }
    } else if (actionInfo.type === conf.TIMELINE_ACTION_TYPE_FINISH) {
      // 特殊类型，要修改APP或者模块的状态。
      let status = conf.TIMELINE_STATUS_DONE
      transactionDB.run(`UPDATE timeline SET status = ? WHERE id = ?;`, [status, actionInfo.timelineId])
      if (actionInfo.timelineType === conf.TIMELINE_TYPE_APP) {
        transactionDB.run(`UPDATE app_version SET status = ? WHERE id = ?;`, [status, actionInfo.appVersionId])
      } else if (actionInfo.timelineType === conf.TIMELINE_TYPE_MODULE) {
        transactionDB.run(`UPDATE module_version SET status = ? WHERE id =?`, [status, actionInfo.moduleVersionId])
      }
    }
    return transactionDB.commit()
  })
}

// 查，查一个指定的action信息。
function retrieveTimelineAction (actionId) {
  return db.get('SELECT * FROM timeline_action WHERE id = ?', [actionId]).then(row => {
    if (row) {
      return {
        actionId: row.id,
        lineId: row.line_id,
        type: row.type,
        expectedTime: row.expected_time,
        status: row.status,
        title: row.title,
        detail: row.detail,
        finishedTime: row.finished_time
      }
    }
  })
}

// 查, 查模块或者app的所有action
function retrieveTimeLineInfo (timelineId) {
  let array = []
  return db.all('SELECT * FROM timeline_action WHERE line_id = ? ORDER BY expected_time ASC', [timelineId]).then(rows => {
    rows.forEach(function (row) {
      array.push({
        actionId: row.id,
        lineId: row.line_id,
        type: row.type,
        expectedTime: row.expected_time,
        status: row.status,
        title: row.title,
        detail: row.detail,
        finishedTime: row.finished_time
      })
    })
  }).then(() => db.get('SELECT * FROM timeline WHERE id = ?', [timelineId])).then(row => {
    if (!row) {
      return Promise.reject(new Error('查询 timeline 发生未知异常！！！'))
    } else {
      return {
        actionList: array,
        timelineInfo: {
          timelineId: row.id,
          type: row.type,
          appVersionId: row.app_version_id,
          moduleVersionId: row.module_version_id,
          status: row.status
        }
      }
    }
  })
}

// 删除 ， 需要注意，能够删除的type只能是用户添加的事件。
function deleteTimeLineAction (actionId) {
  return db.run(`DELETE FROM timeline_action WHERE id = ?`, [actionId])
}

// 初始化 时间线， 这里为初始化的方法， 用于模块和app版本创建时， 使用事务进行批量处理。
function initTimeLine (timeline) {
  let timeLineId
  return addTimeLine(timeline).then(ret => {
    timeLineId = ret.timelineId
    return transaction()
  }).then(transactionDB => {
    timeline.actions.forEach((action) => {
      transactionDB.run(`INSERT INTO timeline_action VALUES (NULL, ? , ? , ? , ? , ? , ? , NULL)`,
        [timeLineId, action.type, action.expectedTime, action.status, action.title, action.detail])
    })
    return transactionDB.commit()
  }).catch(err => {
    if (timeLineId) {
      db.run(`DELETE FROM timeline WHERE id = ?`, [timeLineId])
    }
    return Promise.reject(err)
  }).then(() => {
    return {timelineId: timeLineId}
  })
}

// 模块对象的timeline，由于无法设置外键，要手动删除。
function deleteTimeline (timelineId) {
  return db.run(`DELETE FROM timeline WHERE id = ?`, [timelineId])
}

module.exports = {
  initDB: initDB,
  initTimeLine: initTimeLine,
  addTimeLine: addTimeLine,
  getTimeline: getTimeline,
  updateTimelineStatus: updateTimelineStatus,
  createTimeLineAction: createTimeLineAction,
  updateTimeLineAction: updateTimeLineAction,
  finishTimelineAction: finishTimelineAction,
  retrieveTimelineAction: retrieveTimelineAction,
  retrieveTimeLineInfo: retrieveTimeLineInfo,
  deleteTimeLineAction: deleteTimeLineAction,
  deleteTimeline: deleteTimeline
}
