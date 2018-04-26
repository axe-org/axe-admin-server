const path = require('path')
const fs = require('fs')
let config = {}

function initConfig (binPath, workPath) {
  config.workPath = workPath
  config.serverPath = path.join(binPath, '../')
  // 检测是否已有配置文件和其他目录。
  if (!fs.existsSync(workPath)) {
    fs.mkdirSync(workPath)
    // 创建工作目录。
  }
  // 创建静态资源目录，存放相关构建文件
  let staticPath = path.join(workPath, 'static')
  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath)
  }
  config.staticPath = staticPath
  // 创建 模块相关信息存储目录 , 存储 api头文件，与依赖信息图。
  let modulePath = path.join(staticPath, 'module')
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath)
  }
  config.modulePath = modulePath
  // 创建 app文件存储， 暂时只有一个结构图
  let appPath = path.join(staticPath, 'app')
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath)
  }
  config.appPath = appPath
  // tmp文件夹
  let tmpPath = path.join(workPath, 'tmp')
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath)
  }
  config.tmpPath = tmpPath

  let configPath = path.join(workPath, 'config.js')
  if (!fs.existsSync(configPath)) {
    console.log('以默认配置初始化。。。 ')
    fs.writeFileSync(configPath, fs.readFileSync(path.join(config.serverPath, 'src/config/defaultConfig.js')))
  }
  // 读取配置内容
  let setting = require(configPath)
  config = Object.assign(config, setting)
  console.log('当前配置为 : ' + JSON.stringify(config))
}

config.initConfig = initConfig
module.exports = config
