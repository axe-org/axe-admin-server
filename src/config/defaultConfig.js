module.exports = {
  port: 2678, // Admin 服务器端口
  host: 'localhost', // 管理服务器的host设置， 用于制作离线包和动态路由的反向代理时，做refer限定。
  adminUserName: 'admin', // 管理员用户只有一个，建议手动设置后，再使用。这个帐号只进行用户的管理。
  adminPassword: 'asdfgh', // 默认提供一个最高权限的管理员用户， 可以管理其他所有用户，且进行用户创建
  sqlType: 'sqlite', // 只有两种类型 sqlite和 mysql ，暂时只实现 sqlite
  // 两个服务器的生产地址。 管理系统是开发环境，所以要与生产环境隔离
  offlinePackAdminServer: 'https://axe-org.cn/admin/', // 生产环境的离线包的地址
  dynamicRouterAdminServer: 'https://dynamic.demo.axe-org.xyz/admin/', // 生产环境的动态路由的地址。
  // dynamicRouterAdminDevPort: 2679, // 暂时无法设置。
  // 两个开发环境的管理界面的host ，主要用于页面展示时的URL填充。
  devOfflinePackServerHost: 'localhost',
  devDynamicRouterServerHost: 'localhost',
  appName: 'MyAPP', // 应用展示名称。
  appGitHome: 'https://github.com/axe-org/demo-app',
  appGitType: 'github', // github或gitlab 。生产情况是使用的gitlab的，但是我这里要在github上展示。。
  guestMode: true, // 访客模式， 默认是关。 开放访客模式，不再对所有权限做登录校验，但是关键的增删改接口还是会进行校验的。
  jenkinsURL: 'http://jenkins.luoxianming.cn', // jeninsURL
  jenkinsUser: 'xxxxx',
  jenkinsPassword: 'xxxxx',
  jenkinsModuleImportJobName: 'DemoModuleImport', // jenkins中， 负责app的模块管理的任务名称， 对接管理平台的接入管理。
  devOfflinePackServerSetting: { // 开发环境下的离线包设定.
    port: 2677, // 不能修改。
    checkDownload: true,
    local: {
      downloadUrl: 'http://localhost:2677/download/',
      publicPath: '/download'
    },
    pem: `-----BEGIN RSA PRIVATE KEY-----
    MIIEpAIBAAKCAQEA4YXOMN8CxfZqDy2lpV+kbUgE4knWCG4k0M5/+lzOoEWl9eoo
    hXw0Ln3dY0Cjx2EGsVCR5KzZVIfjRCiyQwdd8QYpmXwkXwbSq4hLtRPMN/411WN/
    zTgycaDEXlgqz5YZ3RReQzdzqj/KkLvwjFvaW6Q57CeEM52VaRhtYzMIU0WJuUwh
    sDKODg8jYzAOp3n+gKdUToOGiC/wG9HyU/0qt37gA/eHgRjOUcNJ1KT085+ddTGK
    HyopN+cTtNQ0nq+nzj5ZhF3Zl6iQ92JWSV9ERE62CvX+dPnyVWjOc/1jmcDgcaej
    JldFGLc2DjRMn148LM93kLDeCw35vhZTQeS+AwIDAQABAoIBAH4MoaBjJVOsVL9D
    DjCOcoK6HDC2gDCaD2293X373WlrREVcqWVidG//3XuaJ3BK5Mi6dbDQg3Bhuz7f
    WDNqrLEIdrvYzSNn1twVA+ujsyMgrMomIMp9PISSDO+Ga/c2uCH/PmhnV/iySu/2
    e46X0EYkVlOOCrAmxdnF0238mgyf5mgiNgxVJ9N4D7LiRHDdhQ+6b86MsziiF13x
    ho+Lqo072RAL/krRm6HKiEN9Pe1ZdWmHmFRapkwobeIscWZOKkhmjlWbJrkyTGGZ
    Vhpc6h2vllFeQhTJPud6EOgS7877pgdYTupov3U3nonNqSDUu5jtwva9eRzyfiZ4
    2I32GkECgYEA+3moBdO3LFVryR9Cph8AX0oLgry1uPC7s2SFD4IOkldLVcfMY87P
    TCx9wLHC6smYt0orATy8GFR6fVFZ9++JZNqo8MZNc5VNS2nbw755mJ0EkSWrFq/k
    DPYeS+R0CHRbBb/MOWEmtna276hMpQY7eHzCPSrzGcljKzi7xHR2CzECgYEA5ZSb
    TTn0sTxLRYCBsAVLota5yjXenqjRrXH6pvXd61OeYf6FFUB7a1aciC+FrgFwtE2S
    NsfEjg1hQFaS6RfCzoOW0NUlCoX2bRiiAzfc7mDfWumX+1TLSSAa/1Z+uEsgkvuP
    BhAcrpJok+FIrkarOZAzf+P/fYpzjzzNjvbtZ3MCgYEA+SF3Af7SswsVMzTS9Hw2
    BDD44lZNuaBUc86bu9de1D/DFIJRzHcwCwjwtBvnPG7n6n2ByUIAHiJjDw+vD9+w
    v8eYIqByTpWU86c13uAu2rCDu8ATlPA//088iHcVNOMA4ds3WYkTryRA64BSHhLk
    i+MdEzgfimZm5oTYEDJIV6ECgYEA14MeGmuqUOpJuq+8jlEaRH2PoMva9FODqW8S
    ncK2FR/E0TbNFTsX4JZIkOsTcVn2w7sB45y53aOfxHbAqEFe5N/QJq+/etZwks8J
    3z2Ejt2vLjeULSHXRwj1bvZyNGyJ4pB1HXrogdP8ib10rey29W1xer+76cybWD36
    tRcFmxMCgYBSx18xn2yfnpb0vtSDnvIXsAPh0Cop5bVf9/VQF+bEqPUmXo6WuDeM
    LcZAjQZYjQ8JPYixFRz5Vl7bENOg4z6Ai3cznCrwqzB4+qt8XsoQsx/1+QeY4N+U
    f7xntR9Yw5QcEHXGj+V7tE1oWfU3mmJg9dRWKm8PFfQhv039qsUPMw==
    -----END RSA PRIVATE KEY-----
    `
  }
}
