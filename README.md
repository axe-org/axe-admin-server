# axe-admin-server

axe-admin node server

## 使用 nodejs开发的 axe-admin后台

部署`axe`管理系统，建议通过[docker](https://github.com/axe-org/axe-admin-docker) 镜像进行安装。

手动安装 ：

  npm install axe-admin-server -g

启动

  axe-admin-server /path/to/save/data

## 配置介绍

建议设置 `axe-admin-docker`， 而不是单独设置 `axe-admin-server`：

* sqlType ： 数据库类型，暂时只支持`sqlite`
* guestMode : 访客模式， 默认关闭。 开启访客模式后，不对查询接口做校验，但是操作接口还是会检测权限。 
* jenkinsURL： jenkins地址
* jenkinsUser： jenkins账户名
* jenkinsPassword: 用户密码
* jenkinsModuleImportJobName : 模块接入任务名。
* appGitHome ： 仓库地址
* appGitType ： github / gitlab 二选一。
* adminUserName : 初始化时设置的管理员帐号
* adminPassword : 初始化时设置的管理员密码
* dynamicServerAccessControlPath ：授权路径 
* offlineServerAccessControlPath ：授权路径 

#### 授权路径

授权路径是用来做 `offline-pack-server` 和`dynamic-router-server` 两个服务的权限控制的。

已知这两个服务都是简单的页面，没有用户管理权限的设定， 所以我们通过授权路径和反向代理来处理， 以控制生产环境两个服务的操作权限。

第一步，限制原服务的访问， 原服务限定IP，只允许`axe-admin-server`访问。

第二步， `axe-admin-server`反向代理到原服务管理页面，以进行正常访问。

第三步 ： 反向代理过滤掉 操作接口， 使普通用户只能看到数据，而不能操作。

第四步 ： 设置一个授权路径， 授权路径是一个随机的字符串如 `afjwaiolghlaivhaoiwpqjgpouqtlkjgag` ，进行正常的反向代理以访问没有过滤操作接口的原服务。 

由于这个随机的授权字符串 构成的路径，普通用户无法知道这个路径，而`APP`管理权限的用户才通过这个特殊路径进行管理操作。