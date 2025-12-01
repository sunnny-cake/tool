// 教辅信息收集工具 - Express 应用（不直接监听端口）
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const XLSX = require('xlsx');

// 加载环境变量（本地开发时生效，Vercel 上由系统注入）
require('dotenv').config();

const app = express();

// ==================== 中间件配置 ====================
app.use(cors());
app.use(express.json());

const isVercel = Boolean(process.env.VERCEL);
let publicPath = null;

// 仅在本地开发环境提供静态文件服务
if (!isVercel) {
  publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
}

// ==================== Supabase 客户端 ====================
// 注意：需要在环境变量中配置 SUPABASE_URL 和 SUPABASE_KEY
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  警告：未配置 SUPABASE_URL 和 SUPABASE_KEY 环境变量');
  console.warn('   请参考 SUPABASE_SETUP.md 文档完成配置');
}

// 创建 Supabase 客户端（如果未配置则为 null）
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ==================== 文件上传配置（Multer） ====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

// ==================== 路由配置 ====================
const withApi = (path) => [path, `/api${path}`];

// 健康检查接口
app.get(withApi('/health'), (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 本地开发时返回静态首页；Vercel 部署由平台直接托管 public 目录
if (!isVercel) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 提交表单数据接口
app.post(withApi('/submit'), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'copyrightImage', maxCount: 1 }
]), async (req, res) => {
  // 检查 Supabase 配置
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: '服务器配置错误：请配置 Supabase 环境变量'
    });
  }

  try {
    const { deviceSerial, phoneNumber, isbn } = req.body;
    const coverFile = req.files?.coverImage?.[0];
    const copyrightFile = req.files?.copyrightImage?.[0];

    // 验证必填字段
    if (!deviceSerial || !phoneNumber || !isbn || !coverFile) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填项（设备序列号、手机号、ISBN、封皮图片）'
      });
    }

    // 验证手机号格式（11位数字）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确，请输入11位有效手机号'
      });
    }

    // 上传图片到 Supabase Storage
    // 为避免 Supabase 对 key 的限制问题，不直接使用原始文件名，只保留后缀并生成安全 key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const coverExt = path.extname(coverFile.originalname || '').toLowerCase() || '.jpg';
    const coverFileName = `covers/${timestamp}_${randomSuffix}${coverExt}`;
    const copyrightExt = copyrightFile
      ? (path.extname(copyrightFile.originalname || '').toLowerCase() || '.jpg')
      : null;
    const copyrightFileName = copyrightFile
      ? `copyrights/${timestamp}_${randomSuffix}${copyrightExt}`
      : null;

    // 上传封皮图片
    const { error: coverError } = await supabase.storage
      .from('images')
      .upload(coverFileName, coverFile.buffer, {
        contentType: coverFile.mimetype,
        upsert: false
      });

    if (coverError) {
      console.error('封皮上传错误:', coverError);
      return res.status(500).json({
        success: false,
        message: '封皮图片上传失败：' + coverError.message
      });
    }

    // 获取封皮图片公开URL
    const { data: coverUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(coverFileName);
    const coverUrl = coverUrlData.publicUrl;

    // 上传版权页图片（如果存在）
    let copyrightUrl = null;
    if (copyrightFile) {
      const { error: copyrightError } = await supabase.storage
        .from('images')
        .upload(copyrightFileName, copyrightFile.buffer, {
          contentType: copyrightFile.mimetype,
          upsert: false
        });

      if (copyrightError) {
        console.error('版权页上传错误:', copyrightError);
        // 版权页上传失败不影响主流程
      } else {
        const { data: copyrightUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(copyrightFileName);
        copyrightUrl = copyrightUrlData.publicUrl;
      }
    }

    // 保存数据到 Supabase 数据库
    const { data: dbData, error: dbError } = await supabase
      .from('submissions')
      .insert([{
        device_serial: deviceSerial,
        phone_number: phoneNumber,
        isbn,
        cover_image_url: coverUrl,
        copyright_image_url: copyrightUrl,
        created_at: new Date().toISOString()
      }])
      .select();

    if (dbError) {
      console.error('数据库保存错误:', dbError);
      return res.status(500).json({
        success: false,
        message: '数据保存失败：' + dbError.message
      });
    }

    res.json({
      success: true,
      message: '提交成功！',
      data: dbData[0]
    });
  } catch (error) {
    console.error('提交错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误：' + error.message
    });
  }
});

// 获取所有提交数据（用于后台管理）
app.get(withApi('/submissions'), async (req, res) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: '服务器配置错误：请配置 Supabase 环境变量'
    });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查询错误:', error);
      return res.status(500).json({
        success: false,
        message: '查询失败：' + error.message
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('查询错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误：' + error.message
    });
  }
});

// 导出Excel接口
app.get(withApi('/export-excel'), async (req, res) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: '服务器配置错误：请配置 Supabase 环境变量'
    });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查询错误:', error);
      return res.status(500).json({
        success: false,
        message: '查询失败：' + error.message
      });
    }

    const excelData = (data || []).map(item => ({
      '序号': item.id,
      '设备序列号': item.device_serial,
      '手机号': item.phone_number,
      'ISBN': item.isbn,
      '封皮图片链接': item.cover_image_url || '',
      '版权页图片链接': item.copyright_image_url || '',
      '提交时间': item.created_at || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 50 },
      { wch: 50 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '教辅信息数据');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `教辅信息数据_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    res.send(excelBuffer);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败：' + error.message
    });
  }
});

module.exports = app;


