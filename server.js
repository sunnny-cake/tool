// 教辅信息收集工具 - 本地启动入口（仅本地开发用）
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看前端页面`);
  console.log(`访问 http://localhost:${PORT}/admin.html 查看后台管理页面`);
});


