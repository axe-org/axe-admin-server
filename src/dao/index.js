const config = require('../config')
let sql
if (config.sqlType === 'sqlite') {
  sql = require('./sqlite')
} else if (config.sqlType === 'mysql') {
  // sql = require('./mysql')
}
module.exports = sql
