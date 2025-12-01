// 捕获 /api/* 的所有请求，交给同一个 Express 应用处理
const app = require('../app');
const { createServer } = require('http');
const { parse } = require('url');

module.exports = async (req, res) => {
  const parsedUrl = parse(req.url, true);
  req.url = parsedUrl.pathname;

  const server = createServer(app);
  server.emit('request', req, res);
};
