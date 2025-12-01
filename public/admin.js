// 后台管理页面脚本

// ==================== DOM元素获取 ====================
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const tableBody = document.getElementById('tableBody');
const totalCount = document.getElementById('totalCount');
const lastUpdate = document.getElementById('lastUpdate');
const messageBox = document.getElementById('messageBox');

let submissionsData = [];

// ==================== 页面加载时获取数据 ====================
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// ==================== 刷新数据 ====================
refreshBtn.addEventListener('click', function() {
    loadData();
});

// ==================== 加载数据 ====================
async function loadData() {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '加载中...';

    try {
        // 不再额外添加 /api 前缀，Vercel 会将 /api/* 转发到我们的 Express 应用
        const response = await fetch('/submissions');
        const result = await response.json();

        if (result.success) {
            submissionsData = result.data || [];
            renderTable(submissionsData);
            updateStats(submissionsData);
            showMessage('数据加载成功', 'success');
        } else {
            showMessage('加载失败：' + result.message, 'error');
            tableBody.innerHTML = '<tr><td colspan="7" class="empty">加载失败，请刷新重试</td></tr>';
        }
    } catch (error) {
        console.error('加载错误:', error);
        showMessage('加载失败：网络错误，请稍后重试', 'error');
        tableBody.innerHTML = '<tr><td colspan="7" class="empty">网络错误，请刷新重试</td></tr>';
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '刷新数据';
    }
}

// ==================== 渲染表格 ====================
function renderTable(data) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty">暂无数据</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map((item, index) => {
        const coverLink = item.cover_image_url 
            ? `<a href="${item.cover_image_url}" target="_blank" class="image-link">查看图片</a>`
            : '<span class="image-link">-</span>';
        
        const copyrightLink = item.copyright_image_url 
            ? `<a href="${item.copyright_image_url}" target="_blank" class="image-link">查看图片</a>`
            : '<span class="image-link">-</span>';

        const submitTime = item.created_at 
            ? new Date(item.created_at).toLocaleString('zh-CN')
            : '-';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.device_serial || '-')}</td>
                <td>${escapeHtml(item.phone_number || '-')}</td>
                <td>${escapeHtml(item.isbn || '-')}</td>
                <td>${coverLink}</td>
                <td>${copyrightLink}</td>
                <td>${submitTime}</td>
            </tr>
        `;
    }).join('');
}

// ==================== 更新统计信息 ====================
function updateStats(data) {
    totalCount.textContent = data.length;
    if (data.length > 0) {
        const latest = data[0];
        if (latest.created_at) {
            lastUpdate.textContent = new Date(latest.created_at).toLocaleString('zh-CN');
        } else {
            lastUpdate.textContent = '-';
        }
    } else {
        lastUpdate.textContent = '-';
    }
}

// ==================== 导出Excel ====================
exportBtn.addEventListener('click', async function() {
    if (submissionsData.length === 0) {
        showMessage('暂无数据可导出', 'error');
        return;
    }

    exportBtn.disabled = true;
    exportBtn.textContent = '导出中...';

    try {
        const response = await fetch('/export-excel');
        
        if (!response.ok) {
            throw new Error('导出失败');
        }

        // 获取文件blob
        const blob = await response.blob();
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `教辅信息数据_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showMessage('Excel文件导出成功', 'success');
    } catch (error) {
        console.error('导出错误:', error);
        showMessage('导出失败：' + error.message, 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = '导出Excel';
    }
});

// ==================== 工具函数 ====================

// 显示消息提示
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// HTML转义（防止XSS）
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

