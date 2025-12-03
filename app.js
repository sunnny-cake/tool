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

// ==================== 存储桶检查和初始化 ====================

// 存储桶名称（支持大小写不敏感查找）
const BUCKET_NAME = 'images'; // 默认名称

// 实际使用的存储桶名称（会在检查时自动确定）
let actualBucketName = BUCKET_NAME;

/**
 * 检查并确保存储桶存在，自动检测实际名称（不区分大小写）
 */
async function ensureStorageBucket() {
  if (!supabase) {
    console.error('❌ Supabase 客户端未初始化');
    return false;
  }

  try {
    // 检查存储桶是否存在
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ 检查存储桶失败:', listError);
      return false;
    }

    if (!buckets || buckets.length === 0) {
      console.warn('⚠️  未找到任何存储桶');
      return false;
    }

    console.log('📦 找到的存储桶列表:', buckets.map(b => b.name).join(', '));

    // 不区分大小写查找存储桶
    const imagesBucket = buckets.find(bucket => 
      bucket.name.toLowerCase() === BUCKET_NAME.toLowerCase()
    );
    
    if (!imagesBucket) {
      console.error('❌ 存储桶 "' + BUCKET_NAME + '" 不存在');
      console.log('💡 可用的存储桶:', buckets.map(b => b.name).join(', '));
      console.log('💡 请确保存储桶名称正确（区分大小写）');
      return false;
    }

    // 使用实际存储桶名称（保持原始大小写）
    actualBucketName = imagesBucket.name;
    console.log('✅ 找到存储桶:', actualBucketName);
    console.log('   - 是否公开:', imagesBucket.public ? '是' : '否');
    console.log('   - 创建时间:', imagesBucket.created_at);

    if (!imagesBucket.public) {
      console.warn('⚠️  存储桶未设置为公开，图片可能无法通过URL访问');
    }

    return true;
  } catch (error) {
    console.error('❌ 存储桶检查异常:', error);
    return false;
  }
}

// 应用启动时检查存储桶（仅本地开发环境）
if (!process.env.VERCEL && supabase) {
  ensureStorageBucket().catch(err => {
    console.error('存储桶初始化失败:', err);
  });
}

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

    // 确保存储桶存在
    const bucketExists = await ensureStorageBucket();
    if (!bucketExists) {
      return res.status(500).json({
        success: false,
        message: '存储桶配置错误：请确保 Supabase Storage 中存在名为 "images" 的公开存储桶'
      });
    }

    console.log('📤 开始上传封皮图片到存储桶:', actualBucketName);
    console.log('   - 文件名:', coverFileName);
    console.log('   - 文件大小:', (coverFile.size / 1024).toFixed(2), 'KB');

    // 上传封皮图片（使用实际存储桶名称）
    const { error: coverError, data: coverUploadData } = await supabase.storage
      .from(actualBucketName)
      .upload(coverFileName, coverFile.buffer, {
        contentType: coverFile.mimetype,
        upsert: false
      });

    if (coverError) {
      console.error('❌ 封皮上传错误:', coverError);
      console.error('   - 错误详情:', JSON.stringify(coverError, null, 2));
      let errorMessage = '封皮图片上传失败：' + coverError.message;
      
      // 如果是存储桶不存在错误，提供更友好的提示
      if (coverError.message && coverError.message.includes('Bucket not found')) {
        errorMessage = `存储桶不存在：当前使用的存储桶名称是 "${actualBucketName}"，请检查 Supabase 控制台中的存储桶名称是否正确。详见 SUPABASE_SETUP.md`;
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }

    console.log('✅ 封皮图片上传成功');
    if (coverUploadData) {
      console.log('   - 上传路径:', coverUploadData.path);
    }

    // 获取封皮图片公开URL（使用实际存储桶名称）
    const { data: coverUrlData } = supabase.storage
      .from(actualBucketName)
      .getPublicUrl(coverFileName);
    const coverUrl = coverUrlData.publicUrl;
    console.log('   - 公开URL:', coverUrl);

    // 上传版权页图片（如果存在）
    let copyrightUrl = null;
    if (copyrightFile) {
      console.log('📤 开始上传版权页图片到存储桶:', actualBucketName);
      console.log('   - 文件名:', copyrightFileName);
      console.log('   - 文件大小:', (copyrightFile.size / 1024).toFixed(2), 'KB');

      const { error: copyrightError, data: copyrightUploadData } = await supabase.storage
        .from(actualBucketName)
        .upload(copyrightFileName, copyrightFile.buffer, {
          contentType: copyrightFile.mimetype,
          upsert: false
        });

      if (copyrightError) {
        console.error('❌ 版权页上传错误:', copyrightError);
        console.error('   - 错误详情:', JSON.stringify(copyrightError, null, 2));
        // 版权页上传失败不影响主流程
      } else {
        console.log('✅ 版权页图片上传成功');
        if (copyrightUploadData) {
          console.log('   - 上传路径:', copyrightUploadData.path);
        }
        const { data: copyrightUrlData } = supabase.storage
          .from(actualBucketName)
          .getPublicUrl(copyrightFileName);
        copyrightUrl = copyrightUrlData.publicUrl;
        console.log('   - 公开URL:', copyrightUrl);
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


