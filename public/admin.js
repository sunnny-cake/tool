// 后台管理页面脚本

// ==================== DOM元素获取 ====================
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const tableBody = document.getElementById('tableBody');
const totalCount = document.getElementById('totalCount');
const lastUpdate = document.getElementById('lastUpdate');
const messageBox = document.getElementById('messageBox');

let submissionsData = []; // 原始数据
let filteredData = []; // 筛选后的数据

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
        // 通过 /api 前缀访问后端函数
        const response = await fetch('/api/submissions');
        const result = await response.json();

        if (result.success) {
            submissionsData = result.data || [];
            applyFilter(); // 加载数据后应用筛选
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
        // 检查图片URL是否有效
        const isValidUrl = (url) => {
            if (!url) return false;
            try {
                const urlObj = new URL(url);
                return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
            } catch {
                return false;
            }
        };

        const coverLink = item.cover_image_url && isValidUrl(item.cover_image_url)
            ? `<a href="${item.cover_image_url}" target="_blank" class="image-link" onclick="return checkImageUrl(this.href, event)">查看图片</a>`
            : '<span class="image-link" title="图片URL无效或不存在">-</span>';
        
        const copyrightLink = item.copyright_image_url && isValidUrl(item.copyright_image_url)
            ? `<a href="${item.copyright_image_url}" target="_blank" class="image-link" onclick="return checkImageUrl(this.href, event)">查看图片</a>`
            : '<span class="image-link" title="图片URL无效或不存在">-</span>';

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
    const totalCountEl = document.getElementById('totalCount');
    const filteredCountEl = document.getElementById('filteredCount');
    
    if (totalCountEl) {
        totalCountEl.textContent = submissionsData.length; // 总记录数
    }
    if (filteredCountEl) {
        filteredCountEl.textContent = data.length; // 筛选后的记录数
    }
    
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

// ==================== 筛选功能 ====================

// 筛选输入框
const filterDeviceSerial = document.getElementById('filterDeviceSerial');
const filterPhoneNumber = document.getElementById('filterPhoneNumber');
const filterISBN = document.getElementById('filterISBN');
const filterDateFrom = document.getElementById('filterDateFrom');
const filterDateTo = document.getElementById('filterDateTo');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// 绑定筛选事件（实时筛选）
if (filterDeviceSerial) {
    filterDeviceSerial.addEventListener('input', applyFilter);
}
if (filterPhoneNumber) {
    filterPhoneNumber.addEventListener('input', applyFilter);
}
if (filterISBN) {
    filterISBN.addEventListener('input', applyFilter);
}
if (filterDateFrom) {
    filterDateFrom.addEventListener('change', applyFilter);
}
if (filterDateTo) {
    filterDateTo.addEventListener('change', applyFilter);
}
if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', clearFilter);
}

// 应用筛选
function applyFilter() {
    if (!submissionsData || submissionsData.length === 0) {
        filteredData = [];
        renderTable(filteredData);
        updateStats(filteredData);
        return;
    }

    // 获取筛选条件
    const deviceSerial = (filterDeviceSerial?.value || '').trim().toLowerCase();
    const phoneNumber = (filterPhoneNumber?.value || '').trim();
    const isbn = (filterISBN?.value || '').trim().toLowerCase();
    const dateFrom = filterDateFrom?.value || '';
    const dateTo = filterDateTo?.value || '';

    // 筛选数据
    filteredData = submissionsData.filter(item => {
        // 设备序列号筛选
        if (deviceSerial && !(item.device_serial || '').toLowerCase().includes(deviceSerial)) {
            return false;
        }

        // 手机号筛选
        if (phoneNumber && !(item.phone_number || '').includes(phoneNumber)) {
            return false;
        }

        // ISBN筛选
        if (isbn && !(item.isbn || '').toLowerCase().includes(isbn)) {
            return false;
        }

        // 日期范围筛选
        if (dateFrom || dateTo) {
            const itemDate = item.created_at ? new Date(item.created_at) : null;
            if (!itemDate) return false;

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (itemDate < fromDate) return false;
            }

            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (itemDate > toDate) return false;
            }
        }

        return true;
    });

    // 重新渲染表格
    renderTable(filteredData);
    updateStats(filteredData);
}

// 清除筛选
function clearFilter() {
    if (filterDeviceSerial) filterDeviceSerial.value = '';
    if (filterPhoneNumber) filterPhoneNumber.value = '';
    if (filterISBN) filterISBN.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    applyFilter();
}

// ==================== 导出Excel ====================
exportBtn.addEventListener('click', async function() {
    // 导出筛选后的数据
    const dataToExport = filteredData.length > 0 ? filteredData : submissionsData;
    
    if (dataToExport.length === 0) {
        showMessage('暂无数据可导出', 'error');
        return;
    }

    exportBtn.disabled = true;
    exportBtn.textContent = '导出中...';

    try {
        const response = await fetch('/api/export-excel');
        
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

// 检查图片URL是否可访问
function checkImageUrl(url, event) {
    // 不阻止默认行为，让链接正常打开
    // 如果图片404，浏览器会显示错误，这是正常的
    // 这里可以添加额外的错误处理逻辑
    return true;
}

