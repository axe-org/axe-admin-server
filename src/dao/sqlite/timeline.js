// 时间线的数据库操作
const Promise = require('bluebird')
const transaction = require('./transaction')
const conf = require('../../conf')
let db
// 初始化与建表操作。
function initDB (_db) {
  db = _db
  return new Promise((resolve, reject) => {
    // 建立 时间线表
    // id 自增主键
    // type 0 表示 APP ,1 表示模块
    // app_version_id 模块必须绑定在APP版本上。 设置外键，且自动删除。
    // TODO module_id 模块ID。
    // status 当前状态 ， 0 表示未启动，1表示进行中，2表示已完成
    db.run(`CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type INT(1) NOT NULL,
      app_version_id INTEGER NOT NULL,
      status INT(1) NOT NULL,
      FOREIGN KEY(app_version_id) REFERENCES app_version(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        reject(err)
      } else {
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
        db.run(`CREATE TABLE IF NOT EXISTS timeline_action (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          line_id INTEGER NOT NULL,
          type INT(1) NOT NULL,
          expected_time DATE NOT NULL,
          status INT(1) NOT NULL,
          title VARCHAR(50) NOT NULL,
          detail VARCHAR(500) NOT NULL,
          finished_time DATETIME,
          FOREIGN KEY(line_id) REFERENCES timeline(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  })
}

// 添加时间线信息
function addTimeLine (timelineInfo) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO timeline VALUES (NULL, ? , ? , ? )`,
      [timelineInfo.type, timelineInfo.appVersionId, timelineInfo.status], function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            timelineId: this.lastID
          })
        }
      })
  })
}
// 获取timeline的简单信息。
function getTimeline (timelineId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM timeline WHERE id = ?', [timelineId], function (err, row) {
      if (err) {
        reject(err)
      } else {
        if (!row) {
          reject(new Error('查询 timeline 发生未知异常！！！'))
        } else {
          resolve({
            timelineId: row.id,
            type: row.type,
            appVersionId: row.app_version_id,
            status: row.status
          })
        }
      }
    })
  })
}

// 不需要删除， 有自动删除。
// 改动只有状态的更新
function updateTimelineStatus (timeLineId, status) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE timeline SET status = ? WHERE id = ?`, [status, timeLineId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 查，按照需求来， 暂时无需求，不查。

// 添加时间事件
function createTimeLineAction (action) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO timeline_action VALUES (NULL, ? , ? , ? , ? , ? , ? , NULL )`,
      [action.lineId, action.type, action.expectedTime, action.status, action.title, action.detail], function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            actionId: this.lastID
          })
        }
      })
  })
}

// 更新 ，能修改的属性为 detail
function updateTimeLineAction (action) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE timeline_action SET detail = ?  WHERE id = ?`,
      [action.detail, action.actionId], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
  })
}
// 更新， 完成一个时间线上的事件。 使用事务以确保操作原子性。
function finishTimelineAction (actionInfo) {
  return new Promise((resolve, reject) => {
    let transactionDB = transaction()
    transactionDB.serialize(function () {
      transactionDB.begin()
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

        }
      } else if (actionInfo.type === conf.TIMELINE_ACTION_TYPE_FINISH) {
        // 特殊类型，要修改APP或者模块的状态。
        let status = conf.TIMELINE_STATUS_DONE
        transactionDB.run(`UPDATE timeline SET status = ? WHERE id = ?;`, [status, actionInfo.timelineId])
        if (actionInfo.timelineType === conf.TIMELINE_TYPE_APP) {
          transactionDB.run(`UPDATE app_version SET status = ? WHERE id = ?;`, [status, actionInfo.appVersionId])
        } else if (actionInfo.timelineType === conf.TIMELINE_TYPE_MODULE) {

        }
      }
      transactionDB.commit(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

// 查，查一个指定的action信息。
function retrieveTimelineAction (actionId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM timeline_action WHERE id = ?', [actionId], function (err, row) {
      if (err) {
        reject(err)
      } else {
        if (!row) {
          // reject(new Error('当前无用户 ' + userName))
          resolve(null)
        } else {
          resolve({
            actionId: row.id,
            lineId: row.line_id,
            type: row.type,
            expectedTime: row.expected_time,
            status: row.status,
            title: row.title,
            detail: row.detail,
            finishedTime: row.finished_time
          })
        }
      }
    })
  })
}

// 查, 查模块或者app的所有action
function retrieveTimeLineInfo (timelineId) {
  return new Promise((resolve, reject) => {
    // 进行排序。
    db.all('SELECT * FROM timeline_action WHERE line_id = ? ORDER BY expected_time ASC',
      [timelineId], function (err, rows) {
        if (err) {
          reject(err)
        } else {
          let array = []
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
          let timelineInfo = {
            actionList: array
          }
          db.get('SELECT * FROM timeline WHERE id = ?', [timelineId], function (err, row) {
            if (err) {
              reject(err)
            } else {
              if (!row) {
                reject(new Error('查询 timeline 发生未知异常！！！'))
              } else {
                timelineInfo['timelineInfo'] = {
                  timelineId: row.id,
                  type: row.type,
                  appVersionId: row.app_version_id,
                  status: row.status
                }
                resolve(timelineInfo)
              }
            }
          })
        }
      })
  })
}

// 删除 ， 需要注意，能够删除的type只能是用户添加的事件。
function deleteTimeLineAction (actionId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM timeline_action WHERE id = ?`,
      [actionId], function (err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
  })
}

// 初始化 时间线， 这里为初始化的方法， 用于模块和app版本创建时， 使用事务进行批量处理。
function initTimeLine (timeline) {
  return new Promise((resolve, reject) => {
    addTimeLine(timeline).catch(err => {
      reject(err)
    }).then(ret => {
      let timeLineId = ret.timelineId
      // 添加成功后，使用事务批量添加action.
      let transactionDB = transaction()
      transactionDB.serialize(function () {
        transactionDB.begin()
        timeline.actions.forEach((action) => {
          transactionDB.run(`INSERT INTO timeline_action VALUES (NULL, ? , ? , ? , ? , ? , ? , NULL)`,
            [timeLineId, action.type, action.expectedTime, action.status, action.title, action.detail])
        })
        transactionDB.commit((err) => {
          if (err) {
            // 出错时，要删除添加的 timeline
            db.run(`DELETE FROM timeline WHERE id = ?`, [timeLineId])
            reject(err)
          } else {
            resolve({
              timelineId: timeLineId
            })
          }
        })
      })
    })
  })
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
  deleteTimeLineAction: deleteTimeLineAction
}
