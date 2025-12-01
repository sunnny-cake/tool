// 捕获 /api/* 的所有请求，交给同一个 Express 应用处理
const app = require('../app');//

module.exports = (req, res) => app(req, res);


