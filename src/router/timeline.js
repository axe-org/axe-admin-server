const timelineService = require('../service/timeline')
const moduleService = require('../service/module')
const conf = require('../conf')

// 添加事件
function addTimeLineAction (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 参数检测
  let lineId = req.body.lineId
  let expectedTime = req.body.expectedTime
  let title = req.body.title
  let detail = req.body.detail
  if (lineId === undefined || expectedTime === undefined || title === undefined || detail === undefined) {
    return res.json({error: '参数传入错误！！'})
  }
  lineId = parseInt(lineId)
  timelineService.getTimeline(lineId).then(timelineInfo => {
    // 需要检测用户是否是 app或者模块管理员。
    if (timelineInfo.type === conf.TIMELINE_TYPE_APP) {
      let appAdmin = req.session.userInfo.appAdmin
      if (!appAdmin) {
        return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
      }
    } else {
      let moduleId = req.body.moduleId
      if (moduleId === undefined) {
        return res.json({error: '参数传入错误！！'})
      }
      moduleId = parseInt(moduleId)
      let admin = false
      let moduleList = req.session.userInfo.moduleList
      moduleList.forEach(module => {
        if (module.id === moduleId) {
          admin = true
        }
      })
      if (!admin) {
        return res.json({error: '用户没有该模块的管理权限，不能进行相关管理操作！！！'})
      }
      moduleService.updateModuleOperationTime(moduleId)
    }
    timelineService.addTimeLineAction({
      lineId: lineId,
      expectedTime: new Date(expectedTime),
      title: title,
      detail: detail
    }).then(() => {
      res.json({})
    }).catch(err => {
      res.json({error: err.message})
    })
  }).catch(err => {
    res.json({error: err.message})
  })
}
// 删除事件。
function deleteTimeLineAction (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 参数检测
  let actionId = req.body.actionId
  let lineId = req.body.lineId
  if (actionId === undefined || lineId === undefined) {
    return res.json({error: '参数传入错误！！'})
  }
  actionId = parseInt(actionId)
  lineId = parseInt(lineId)
  timelineService.getTimeline(lineId).then(timelineInfo => {
    // 需要检测用户是否是 app或者模块管理员。
    if (timelineInfo.type === conf.TIMELINE_TYPE_APP) {
      let appAdmin = req.session.userInfo.appAdmin
      if (!appAdmin) {
        return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
      }
    } else {
      let moduleId = req.body.moduleId
      if (moduleId === undefined) {
        return res.json({error: '参数传入错误！！'})
      }
      moduleId = parseInt(moduleId)
      let admin = false
      let moduleList = req.session.userInfo.moduleList
      moduleList.forEach(module => {
        if (module.id === moduleId) {
          admin = true
        }
      })
      if (!admin) {
        return res.json({error: '用户没有该模块的管理权限，不能进行相关管理操作！！！'})
      }
      moduleService.updateModuleOperationTime(moduleId)
    }
    timelineService.deleteTimeLineAction(actionId).then(() => {
      res.json({})
    }).catch(err => {
      res.json({error: err.message})
    })
  }).catch(err => {
    res.json({error: err.message})
  })
}

function getTimelineInfo (req, res) {
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 参数检测
  let lineId = req.body.lineId
  if (lineId === undefined) {
    return res.json({error: '参数传入错误！！'})
  }
  lineId = parseInt(lineId)
  timelineService.getTimelineInfo(lineId).then(timelineInfo => {
    res.json(timelineInfo)
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 添加描述
function addDetailDescToAction (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 参数检测
  let actionId = req.body.actionId
  let lineId = req.body.lineId
  let detail = req.body.detail
  if (actionId === undefined || lineId === undefined || detail === undefined) {
    return res.json({error: '参数传入错误！！'})
  }
  actionId = parseInt(actionId)
  lineId = parseInt(lineId)
  timelineService.getTimeline(lineId).then(timelineInfo => {
    // 需要检测用户是否是 app或者模块管理员。
    if (timelineInfo.type === conf.TIMELINE_TYPE_APP) {
      let appAdmin = req.session.userInfo.appAdmin
      if (!appAdmin) {
        return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
      }
    } else {
      let moduleId = req.body.moduleId
      if (moduleId === undefined) {
        return res.json({error: '参数传入错误！！'})
      }
      moduleId = parseInt(moduleId)
      let admin = false
      let moduleList = req.session.userInfo.moduleList
      moduleList.forEach(module => {
        if (module.id === moduleId) {
          admin = true
        }
      })
      if (!admin) {
        return res.json({error: '用户没有该模块的管理权限，不能进行相关管理操作！！！'})
      }
      moduleService.updateModuleOperationTime(moduleId)
    }
    timelineService.addDetailDescToAction(detail, actionId).then(() => {
      res.json({})
    }).catch(err => {
      res.json({error: err.message})
    })
  }).catch(err => {
    res.json({error: err.message})
  })
}

// 完成事件。
function finishTimelineAction (req, res) {
  // 这里做安全检测，即每次先检测用户是否登录
  let login = !!req.session.userInfo
  if (!login) {
    return res.json({error: '未登录'})
  }
  // 参数检测
  let actionId = req.body.actionId
  let lineId = req.body.lineId
  let detail = req.body.detail
  if (actionId === undefined || lineId === undefined || detail === undefined) {
    return res.json({error: '参数传入错误！！'})
  }
  actionId = parseInt(actionId)
  lineId = parseInt(lineId)
  timelineService.getTimeline(lineId).then(timelineInfo => {
    // 需要检测用户是否是 app或者模块管理员。
    if (timelineInfo.type === conf.TIMELINE_TYPE_APP) {
      let appAdmin = req.session.userInfo.appAdmin
      if (!appAdmin) {
        return res.json({error: '当前用户 ' + req.session.userInfo.userName + ' 没有APP管理员权限!!'})
      }
    } else {
      let moduleId = req.body.moduleId
      if (moduleId === undefined) {
        return res.json({error: '参数传入错误！！'})
      }
      moduleId = parseInt(moduleId)
      let admin = false
      let moduleList = req.session.userInfo.moduleList
      moduleList.forEach(module => {
        if (module.id === moduleId) {
          admin = true
        }
      })
      if (!admin) {
        return res.json({error: '用户没有该模块的管理权限，不能进行相关管理操作！！！'})
      }
      moduleService.updateModuleOperationTime(moduleId)
    }
    timelineService.finishTimelineAction(detail, actionId).then(() => {
      res.json({})
    }).catch(err => {
      res.json({error: err.message})
    })
  }).catch(err => {
    res.json({error: err.message})
  })
}

function dispatchTimeline (app) {
  app.post('/timeline/add', addTimeLineAction)
  app.post('/timeline/delete', deleteTimeLineAction)
  app.post('/timeline/info', getTimelineInfo)
  app.post('/timeline/addDetail', addDetailDescToAction)
  app.post('/timeline/finish', finishTimelineAction)
}

module.exports = dispatchTimeline
