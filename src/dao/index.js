const config = require('../config')
// sql 函数规范， 入参，小于3个，都直接传入。返回结果全部放在object中。
let sql
if (config.sqlType === 'sqlite') {
  sql = require('./sqlite')
} else if (config.sqlType === 'mysql') {
  // sql = require('./mysql')
}
module.exports = sql
