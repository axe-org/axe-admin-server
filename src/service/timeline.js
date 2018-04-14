const appDAO = require('../dao').appDAO
const timelineDAO = require('../dao').timelineDAO
const dateFormat = require('dateformat')
// const config = require('../config')
const Promise = require('bluebird')
const conf = require('../conf')

// 添加事件
function addTimeLineAction (action) {
  action.type = conf.TIMELINE_ACTION_TYPE_USERSET
  action.status = conf.TIMELINE_ACTION_STATUS_UNFINISHED
  action.expectedTime = dateFormat(new Date(action.expectedTime), 'yyyy-mm-dd')
  return new Promise((resolve, reject) => {
    getTimelineInfo(action.lineId).then(timelineInfo => {
      // 添加事件也有一定的检测逻辑， 时间不能超过开始和完成时间。
      if (timelineInfo.timelineInfo.status === conf.TIMELINE_STATUS_DONE) {
        return reject(new Error('当前时间线已经完成， 不能添加新的事件'))
      }
      let startDate = new Date(timelineInfo.actionList[0].expectedTime)
      let endDate = new Date(timelineInfo.actionList[timelineInfo.actionList.length - 1].expectedTime)
      let actionDate = new Date(action.expectedTime)
      if (actionDate <= startDate) {
        return reject(new Error('创建的自定义事件，应该在项目开始时间之后！！'))
      }
      if (actionDate >= endDate) {
        return reject(new Error('创建的自定义事件，应该在项目完成时间之前！！'))
      }
      // 这里检测完成。
      timelineDAO.createTimeLineAction(action).then(data => {
        resolve(data)
      }).catch(err => {
        reject(err)
      })
    }).catch(err => {
      reject(err)
    })
  })
}

// 删除事件
function deleteTimeLineAction (actionId) {
  return timelineDAO.retrieveTimelineAction(actionId).then((timelineInfo) => {
    if (timelineInfo) {
      if (timelineInfo.type !== conf.TIMELINE_ACTION_TYPE_USERSET) {
        return new Promise((resolve, reject) => {
          reject(new Error('默认事件不能删除 ！！！'))
        })
      } else {
        return timelineDAO.deleteTimeLineAction(actionId)
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error('当前事件 ' + actionId + ' 并不存在！！！'))
      })
    }
  })
}

// 获取timeline相关信息
function getTimeline (timelineId) {
  return timelineDAO.getTimeline(timelineId)
}

// 查， 查一个timelineId的所有事件。以及APP或者模块的相关信息。
function getTimelineInfo (timelineId) {
  let ret
  return timelineDAO.retrieveTimeLineInfo(timelineId).then((timelineInfo) => {
    // 获取到信息后，要同时获取APP或者模块的信息。
    ret = timelineInfo
    return appDAO.getVersionInfo({versionId: timelineInfo.timelineInfo.appVersionId})
  }).then(appVersionInfo => {
    if (appVersionInfo) {
      ret['appVersionInfo'] = appVersionInfo
      // 然后检测是否要查询模块信息。
      if (ret.timelineInfo.type === conf.TIMELINE_TYPE_MODULE) {
        // TODO
      } else {
        return new Promise((resolve, reject) => {
          resolve(ret)
        })
      }
    } else {
      // 查不到APP信息，表示异常
      return new Promise((resolve, reject) => {
        reject(new Error('查询timeline信息发生未知异常 !!'))
      })
    }
  })
}

// 完成事件。 完成后会返回getTimelineInfo 的详细数据，以刷新前端状态。
// 同时检测事件类型，特殊类型修改APP状态。或者模块状态。
function finishTimelineAction (detail, actionId) {
  let actionInfo
  return timelineDAO.retrieveTimelineAction(actionId).then(timelineAction => {
    if (timelineAction) {
      actionInfo = timelineAction
      // 检测type
      return timelineDAO.retrieveTimeLineInfo(timelineAction.lineId)
    } else {
      // 不存在时，返回异常
      return new Promise((resolve, reject) => {
        reject(new Error('未找到该事件！！！'))
      })
    }
  }).then(timelineInfo => {
    // 获取全部的事件信息，以进行类型检测。
    // 事件检测只有三个， 已完成的项目不能完成，  开始任务必须要要求状态是未开始， 任务要求之前的任务都完成。
    if (actionInfo.status === conf.TIMELINE_ACTION_STATUS_FINISHED) {
      return new Promise((resolve, reject) => {
        reject(new Error('事件已完成！！！'))
      })
    } else if (actionInfo.type === conf.TIMELINE_ACTION_TYPE_START &&
       timelineInfo.timelineInfo.status !== conf.TIMELINE_STATUS_WAITING) {
      return new Promise((resolve, reject) => {
        reject(new Error('项目已开始，不能再设置开始任务！！！'))
      })
    } else {
      // 检测事件顺序。
      for (let index in timelineInfo.actionList) {
        let action = timelineInfo.actionList[index]
        // 已知查询结果是排序的。
        if (action.actionId === actionInfo.actionId) {
          break
        } else {
          if (action.status !== conf.TIMELINE_ACTION_STATUS_FINISHED) {
            return new Promise((resolve, reject) => {
              reject(new Error('需要完成前置的事件！！！'))
            })
          }
        }
      }
    }
    // 检测完成后， 进行修改
    return timelineDAO.finishTimelineAction({
      actionId: actionId,
      type: actionInfo.type,
      detail: detail,
      status: conf.TIMELINE_ACTION_STATUS_FINISHED,
      actionType: actionInfo.type,
      timelineType: timelineInfo.timelineInfo.type, // app 还是 module
      timelineId: timelineInfo.timelineInfo.timelineId,
      appVersionId: timelineInfo.timelineInfo.appVersionId
      // moduleVersionId: ... moduleId.
    })
  })
}

// 修改事件 , 修改的内容，只能是 detail , 以添加描述
function addDetailDescToAction (detail, actionId) {
  return timelineDAO.retrieveTimelineAction(actionId).then(timelineAction => {
    if (timelineAction) {
      return timelineDAO.updateTimeLineAction({
        actionId: actionId,
        detail: detail
      })
    } else {
      // 不存在时，返回异常
      return new Promise((resolve, reject) => {
        reject(new Error('未找到该事件！！！'))
      })
    }
  })
}

module.exports = {
  addTimeLineAction: addTimeLineAction,
  deleteTimeLineAction: deleteTimeLineAction,
  getTimeline: getTimeline,
  getTimelineInfo: getTimelineInfo,
  finishTimelineAction: finishTimelineAction,
  addDetailDescToAction: addDetailDescToAction
}
