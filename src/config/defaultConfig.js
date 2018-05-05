// 以下是默认配置内容:
module.exports = {
  // port: 2678, // 端口号， 固定。
  sqlType: 'sqlite', // 数据库类型， 暂时只有 sqlite
  guestMode: false, // 默认关闭访客模式
  jenkinsURL: 'http://jenkins.luoxianming.cn',
  jenkinsUser: 'xxxxx', // 用户帐号与密码, 配置一个有权限访问模块管理和构建任务的帐号，以进行打包的调用。
  jenkinsPassword: 'xxxx',
  jenkinsModuleImportJobName: 'DemoModuleImport', // 模块接入job名
  appGitHome: 'https://github.com/axe-org/demo-app', // 仓库地址
  appGitType: 'github', // 默认类型， 虽然推荐使用gitlab ，但是当前demo是放在github上的。
  adminUserName: 'admin', // 初始化的管理员帐号与密码,
  adminPassword: 'admin',
  // 权限设定， 对于生产环境的 动态路由和离线包的修改接口进行限制，只有带有这个后台随机生成的path才能正确进行访问操作。
  dynamicServerAccessControlPath: 'awfjapwugpqjgou09d',
  offlineServerAccessControlPath: '12mt81207tywafuaw'
}
