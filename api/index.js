// Vercel Serverless Function 入口，将请求交给 Express 应用处理
const app = require('../app');

// 显式导出一个 (req, res) => ... 的处理函数，确保符合 @vercel/node 期望的接口
module.exports = (req, res) => {
  return app(req, res);
};


