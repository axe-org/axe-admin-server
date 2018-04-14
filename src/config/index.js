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
