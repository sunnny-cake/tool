// Vercel Serverless Function 入口 - 适配 Express 应用
const app = require('../app');
const { createServer } = require('http');
const { parse } = require('url');

module.exports = async (req, res) => {
  const parsedUrl = parse(req.url, true);
  req.url = parsedUrl.pathname;

  const server = createServer(app);
  server.emit('request', req, res);
};


