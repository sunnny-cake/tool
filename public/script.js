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

// ==================== 扫描按钮（占位功能） ====================
document.getElementById('scanBtn').addEventListener('click', function() {
    // 提示：这里需要集成实际的扫码SDK
    // 例如：微信JS-SDK、ZXing、QuaggaJS等
    alert('扫描功能需要集成扫码SDK。\n\n实际使用时，可以：\n1. 使用微信JS-SDK的扫一扫功能\n2. 使用ZXing等开源库\n3. 调用手机相机API进行识别');
    
    // 占位：模拟扫描结果（实际使用时删除）
    // isbnInput.value = '9787111544937';
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

