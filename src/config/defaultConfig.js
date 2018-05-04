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
  offlineServerAccessControlPath: '12mt81207tywafuaw',
  webConfig: { // 下发给前端的页面配置内容。
    appName: 'Demo', // APP名称， 展示使用
    appGitHome: 'https://github.com/axe-org/demo-app', // 仓库地址
    dynamicRouterAdminURL: 'https://dynamic.demo.axe-org.cn/admin/', // 生产环境的动态路由管理页面地址
    devDynamicRouterAdminURL: 'http://localhost:3111/admin/', // 测试环境的页面地址。需要注意这个测试环境地址。
    // 默认情况下axe构建是供本地测试使用的, 所以这里的地址是默认的地址， localhost + 端口号。 但是真正使用时，如果要在外部设置一层反向代理时，需要设定这里最终的对外URL.
    offlinePackAdminURL: 'https://offline.demo.axe-org.cn/admin/', // 离线包的管理页面地址，同上
    devOfflinePackAdminURL: 'http://localhost:3112/admin/',
    jenkinsURL: 'http://jenkins.luoxianming.cn', // jenkins服务器地址
    jenkinsModuleImportJobName: 'DemoModuleImport' // jenkins接入模块的job名。
  }
}
