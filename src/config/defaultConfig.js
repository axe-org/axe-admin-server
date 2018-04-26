module.exports = {
  port: 2678, // 服务器接口
  adminUserName: 'admin', // 管理员用户只有一个，建议手动设置后，再使用。这个帐号只进行用户的管理。
  adminPassword: 'asdfgh', // 默认提供一个最高权限的管理员用户， 可以管理其他所有用户，且进行用户创建
  sqlType: 'sqlite', // 只有两种类型 sqlite和 mysql ，暂时只实现 sqlite
  corsOrigin: 'http://localhost:8080', // 跨域请求的源， 后续考虑使用 docker部署来解决这个跨域问题。
  offlinePackAdminServer: 'http://localhost:2677/admin', // 生产环境的离线包的服务地址,用于反向代理访问。
  dynamicRouterAdminServer: 'http://localhost:2676/admin', // 生产环境的动态路由的服务地址,用于反向代理访问。
  offlineAppId: 'xxapp', // 离线包使用的APPID
  appName: 'MyAPP', // 应用展示名称。
  gitUrl: '',
  jenkinsURL: 'http://jenkins.luoxianming.cn', // jeninsURL
  jenkinsUser: 'luoxianming',
  jenkinsPassword: 'q981932962',
  jenkinsModuleManagerJobName: 'DemoModuleImport', // jenkins中， 负责app的模块管理的任务名称， 对接管理平台的接入管理。
}