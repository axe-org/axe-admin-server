// TODO 消息通知机制， 通过记录用户的操作，同时告知关联用户。
// 如APP管理员需要有 其他开发者提交模块版本引入的通知，其他开发者 获取APP版本里操作的通知， 同一个模块的开发者，了解APP的开发情况与模块的开发情况的通知， 等等。
// 通过事件通知机制，即记录所有开发者的操作， 又能告知管理用户。
// 优先级较低
// action 表， 记录系统中所有用户的操作。不包括动态路由和离线包

// 初始化与建表操作。
function initDB (_db) {

}

module.exports = {
  initDB: initDB
}
