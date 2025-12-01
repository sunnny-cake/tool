// Vercel Serverless Function 入口，将请求交给 Express 应用处理
const app = require('../app');

// 直接导出 Express 实例，@vercel/node 会自动适配
module.exports = app;


