// 教辅信息收集工具 - 前端脚本

// ==================== DOM元素获取 ====================
const form = document.getElementById('submitForm');
const deviceSerialInput = document.getElementById('deviceSerial');
const phoneNumberInput = document.getElementById('phoneNumber');
const isbnInput = document.getElementById('isbn');
const coverImageInput = document.getElementById('coverImage');
const copyrightImageInput = document.getElementById('copyrightImage');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitLoading = document.getElementById('submitLoading');
const messageBox = document.getElementById('messageBox');

// ==================== 表单验证 ====================

// 清除错误提示
function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// 显示错误提示
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// 验证手机号格式（11位，1开头，第二位3-9）
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// 手机号输入验证
phoneNumberInput.addEventListener('input', function() {
    const phone = this.value.trim();
    if (phone.length > 0) {
        if (!validatePhone(phone)) {
            showError('phoneNumber', '手机号格式不正确，请输入11位有效手机号');
        } else {
            clearError('phoneNumber');
        }
    } else {
        clearError('phoneNumber');
    }
});

// 设备序列号验证
deviceSerialInput.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        clearError('deviceSerial');
    }
});

// ISBN验证
isbnInput.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        clearError('isbn');
    }
});

// ==================== 扫码功能（基于 QuaggaJS） ====================

let currentFacingMode = 'environment'; // 'environment' 后置摄像头, 'user' 前置摄像头
let scanStream = null;

// 扫描按钮点击事件
document.getElementById('scanBtn').addEventListener('click', function() {
    openScanModal();
});

// 打开扫码弹窗
function openScanModal() {
    const modal = document.getElementById('scanModal');
    modal.style.display = 'flex';
    startScanning();
}

// 关闭扫码弹窗
function closeScanModal() {
    const modal = document.getElementById('scanModal');
    modal.style.display = 'none';
    stopScanning();
}

// 关闭按钮事件
document.getElementById('scanCloseBtn').addEventListener('click', closeScanModal);
document.getElementById('scanCancelBtn').addEventListener('click', closeScanModal);

// 切换摄像头
document.getElementById('scanSwitchBtn').addEventListener('click', function() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    stopScanning();
    setTimeout(() => startScanning(), 300);
});

// 开始扫码
function startScanning() {
    // 检查浏览器是否支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMessage('您的浏览器不支持摄像头访问，请使用现代浏览器（Chrome、Firefox、Safari等）', 'error');
        closeScanModal();
        return;
    }

    Quagga.init({
        inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: document.querySelector('#scanVideo'),
            constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: currentFacingMode
            }
        },
        decoder: {
            readers: [
                'ean_reader',      // EAN-13 (ISBN常用)
                'ean_8_reader',    // EAN-8
                'code_128_reader', // Code 128
                'code_39_reader',  // Code 39
                'upc_reader',      // UPC
                'upc_e_reader'     // UPC-E
            ]
        },
        locate: true
    }, function(err) {
        if (err) {
            console.error('扫码初始化失败:', err);
            showMessage('扫码初始化失败：' + (err.message || '未知错误'), 'error');
            closeScanModal();
            return;
        }
        Quagga.start();
    });

    // 监听扫码结果
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        
        // 验证是否为有效的ISBN格式（10位或13位数字）
        if (isValidISBN(code)) {
            isbnInput.value = code;
            clearError('isbn');
            showMessage('ISBN扫描成功：' + code, 'success');
            Quagga.stop();
            closeScanModal();
        } else {
            // 如果不是标准ISBN，也尝试使用（可能是其他条形码）
            console.log('扫描到的代码:', code);
            isbnInput.value = code;
            clearError('isbn');
            showMessage('已识别：' + code + '（请确认是否为ISBN）', 'success');
            Quagga.stop();
            closeScanModal();
        }
    });
}

// 停止扫码
function stopScanning() {
    if (Quagga) {
        Quagga.stop();
    }
    // 停止所有媒体流
    if (scanStream) {
        scanStream.getTracks().forEach(track => track.stop());
        scanStream = null;
    }
}

// 验证ISBN格式（简单验证：10位或13位数字）
function isValidISBN(code) {
    if (!code) return false;
    // 移除可能的连字符和空格
    const cleaned = code.replace(/[-\s]/g, '');
    // 检查是否为10位或13位数字（ISBN-10或ISBN-13）
    return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

// 页面关闭时清理资源
window.addEventListener('beforeunload', function() {
    stopScanning();
});

// ==================== 图片上传处理 ====================

// 封皮图片上传
setupImageUpload(
    coverImageInput,
    'coverPlaceholder',
    'coverPreview',
    'coverPreviewImg',
    'coverRemoveBtn',
    'coverProgress',
    'coverProgressBar',
    'coverProgressText',
    'coverImage'
);

// 版权页图片上传（可选）
setupImageUpload(
    copyrightImageInput,
    'copyrightPlaceholder',
    'copyrightPreview',
    'copyrightPreviewImg',
    'copyrightRemoveBtn',
    'copyrightProgress',
    'copyrightProgressBar',
    'copyrightProgressText',
    'copyrightImage'
);

// 图片上传通用设置函数
function setupImageUpload(input, placeholderId, previewId, previewImgId, removeBtnId, progressId, progressBarId, progressTextId, fieldName) {
    const placeholder = document.getElementById(placeholderId);
    const preview = document.getElementById(previewId);
    const previewImg = document.getElementById(previewImgId);
    const removeBtn = document.getElementById(removeBtnId);
    const progress = document.getElementById(progressId);
    const progressBar = document.getElementById(progressBarId);
    const progressText = document.getElementById(progressTextId);

    // 点击占位符选择文件
    placeholder.addEventListener('click', () => {
        input.click();
    });

    // 文件选择处理
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 验证文件类型
            if (!file.type.startsWith('image/')) {
                showError(fieldName, '请选择图片文件');
                return;
            }

            // 验证文件大小（10MB）
            if (file.size > 10 * 1024 * 1024) {
                showError(fieldName, '图片大小不能超过10MB');
                return;
            }

            clearError(fieldName);

            // 显示预览
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                placeholder.style.display = 'none';
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // 移除图片
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        input.value = '';
        placeholder.style.display = 'block';
        preview.style.display = 'none';
        progress.style.display = 'none';
        clearError(fieldName);
    });
}

// ==================== 表单提交 ====================
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // 清除之前的错误提示
    clearError('deviceSerial');
    clearError('phoneNumber');
    clearError('isbn');
    clearError('coverImage');

    // 验证必填字段
    let hasError = false;

    if (!deviceSerialInput.value.trim()) {
        showError('deviceSerial', '请输入设备序列号');
        hasError = true;
    }

    if (!phoneNumberInput.value.trim()) {
        showError('phoneNumber', '请输入手机号');
        hasError = true;
    } else if (!validatePhone(phoneNumberInput.value.trim())) {
        showError('phoneNumber', '手机号格式不正确，请输入11位有效手机号');
        hasError = true;
    }

    if (!isbnInput.value.trim()) {
        showError('isbn', '请输入ISBN');
        hasError = true;
    }

    if (!coverImageInput.files || coverImageInput.files.length === 0) {
        showError('coverImage', '请上传封皮图片');
        hasError = true;
    }

    if (hasError) {
        showMessage('请检查并填写所有必填项', 'error');
        return;
    }

    // 禁用提交按钮
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline';

    // 显示上传进度（模拟）
    showUploadProgress('coverProgress', 'coverProgressBar', 'coverProgressText');
    if (copyrightImageInput.files && copyrightImageInput.files.length > 0) {
        showUploadProgress('copyrightProgress', 'copyrightProgressBar', 'copyrightProgressText');
    }

    try {
        // 创建FormData
        const formData = new FormData();
        formData.append('deviceSerial', deviceSerialInput.value.trim());
        formData.append('phoneNumber', phoneNumberInput.value.trim());
        formData.append('isbn', isbnInput.value.trim());
        formData.append('coverImage', coverImageInput.files[0]);
        if (copyrightImageInput.files && copyrightImageInput.files.length > 0) {
            formData.append('copyrightImage', copyrightImageInput.files[0]);
        }

        // 发送请求（在 Vercel 上通过 /api 前缀访问后端函数，本地同样可用）
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // 隐藏进度条
        hideUploadProgress('coverProgress');
        hideUploadProgress('copyrightProgress');

        if (result.success) {
            showMessage('提交成功！', 'success');
            // 重置表单
            form.reset();
            document.getElementById('coverPlaceholder').style.display = 'block';
            document.getElementById('coverPreview').style.display = 'none';
            document.getElementById('copyrightPlaceholder').style.display = 'block';
            document.getElementById('copyrightPreview').style.display = 'none';
        } else {
            showMessage('提交失败：' + result.message, 'error');
        }

    } catch (error) {
        console.error('提交错误:', error);
        hideUploadProgress('coverProgress');
        hideUploadProgress('copyrightProgress');
        showMessage('提交失败：网络错误，请稍后重试', 'error');
    } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';
    }
});

// ==================== 工具函数 ====================

// 显示消息提示
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// 显示上传进度（模拟）
function showUploadProgress(progressId, progressBarId, progressTextId) {
    const progress = document.getElementById(progressId);
    const progressBar = document.getElementById(progressBarId);
    const progressText = document.getElementById(progressTextId);

    if (!progress || !progressBar || !progressText) return;

    progress.style.display = 'block';
    let percent = 0;

    const interval = setInterval(() => {
        percent += Math.random() * 15;
        if (percent >= 90) {
            percent = 90; // 保持在90%，等待服务器响应
        }

        // 使用CSS变量设置进度
        progressBar.style.setProperty('--progress-width', percent + '%');
        progressText.textContent = Math.round(percent) + '%';

        if (percent >= 90) {
            clearInterval(interval);
        }
    }, 200);
}

// 隐藏上传进度
function hideUploadProgress(progressId) {
    const progress = document.getElementById(progressId);
    if (progress) {
        const progressBar = progress.querySelector('.progress-bar');
        const progressText = progress.querySelector('.progress-text');
        if (progressBar) {
            progressBar.style.setProperty('--progress-width', '100%');
        }
        if (progressText) {
            progressText.textContent = '100%';
        }
        setTimeout(() => {
            progress.style.display = 'none';
        }, 500);
    }
}

