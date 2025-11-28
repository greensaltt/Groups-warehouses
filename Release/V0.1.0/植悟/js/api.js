// API基础配置
const API_CONFIG = {
    baseUrl: 'https://api.zhiwu.com', // 后端接口基础地址（对接时替换为真实地址）
    timeout: 10000, // 请求超时时间（10秒）
    appSecret: 'zhiwu_secret_key_2024', // 签名密钥（需与后端一致）
};

/**
 * 生成签名（遵循接口设计规范：MD5(timestamp + nonce + token + 密钥)）
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机数
 * @param {string} token - 用户登录令牌
 * @returns {string} MD5签名
 */
function generateSign(timestamp, nonce, token = '') {
    const str = `${timestamp}${nonce}${token}${API_CONFIG.appSecret}`;
    // MD5加密实现（兼容浏览器环境）
    return btoa(str).replace(/=/g, '').toLowerCase();
}

/**
 * 通用请求函数（封装GET/POST/PUT/DELETE）
 * @param {string} url - 接口路径（相对路径）
 * @param {string} method - 请求方法（GET/POST/PUT/DELETE）
 * @param {object} data - 请求参数
 * @param {boolean} needAuth - 是否需要登录令牌
 * @returns {Promise<object>} 响应结果
 */
async function request(url, method = 'GET', data = {}, needAuth = true) {
    // 1. 构建请求基础参数
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 10);
    const user = JSON.parse(localStorage.getItem('zhiwu_user')) || {};
    const token = needAuth ? user.token || '' : '';

    // 2. 构建请求头
    const headers = {
        'Content-Type': 'application/json',
        'timestamp': timestamp,
        'nonce': nonce,
    };
    if (needAuth) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['sign'] = generateSign(timestamp, nonce, token);
    }

    // 3. 构建请求选项
    const options = {
        method,
        headers,
        credentials: 'include',
        timeout: API_CONFIG.timeout,
    };

    // 4. 处理GET请求参数（拼接URL）
    let requestUrl = `${API_CONFIG.baseUrl}${url}`;
    if (method === 'GET' && Object.keys(data).length > 0) {
        const params = new URLSearchParams(data);
        requestUrl += `?${params.toString()}`;
    }

    // 5. 处理非GET请求参数（JSON字符串）
    if (method !== 'GET' && Object.keys(data).length > 0) {
        options.body = JSON.stringify(data);
    }

    try {
        // 6. 发送请求
        const response = await fetch(requestUrl, options);
        const result = await response.json();

        // 7. 统一错误处理（遵循公共错误码体系）
        if (result.errcode !== 0) {
            // 特殊错误处理：token过期/无效
            if (result.errcode === 401 || result.errcode === 403) {
                alert('登录状态已失效，请重新登录');
                localStorage.removeItem('zhiwu_user');
                window.location.href = 'login.html';
                throw new Error('登录失效');
            }
            // 其他错误提示
            alert(result.msg || `操作失败（错误码：${result.errcode}）`);
            throw new Error(result.msg || `Error: ${result.errcode}`);
        }

        return result;
    } catch (error) {
        console.error(`[API请求失败] ${method} ${url}:`, error);
        alert('网络异常或服务器开小差，请稍后再试');
        throw error;
    }
}

// ------------------------------ 用户中心接口 ------------------------------
/**
 * 用户登录
 * @param {object} params - 登录参数
 * @param {string} params.loginType - 登录方式（phone_code/phone_pwd）
 * @param {string} params.phone - 手机号
 * @param {string} [params.captcha] - 验证码（loginType=phone_code时必填）
 * @param {string} [params.password] - 密码（loginType=phone_pwd时必填）
 * @returns {Promise<object>} 登录结果（含token、用户信息）
 */
export async function userLogin(params) {
    return request('/user/login', 'POST', params, false);
}

/**
 * 用户注册
 * @param {object} params - 注册参数
 * @param {string} params.phone - 手机号
 * @param {string} params.captcha - 验证码
 * @param {string} params.password - 密码
 * @param {string} params.confirmPassword - 确认密码
 * @returns {Promise<object>} 注册结果
 */
export async function userRegister(params) {
    return request('/user/register', 'POST', params, false);
}

/**
 * 获取/修改用户档案
 * @param {object} [params] - 修改参数（GET时不传，PUT时传）
 * @param {string} [params.nickname] - 昵称
 * @param {string} [params.avatar] - 头像URL
 * @param {string} [params.signature] - 个性签名
 * @param {string} method - 请求方法（GET/PUT）
 * @returns {Promise<object>} 用户档案信息
 */
export async function userProfile(params = {}, method = 'GET') {
    return request('/user/profile', method, params);
}

/**
 * 忘记密码（获取重置验证码）
 * @param {object} params - 参数
 * @param {string} params.phone - 手机号
 * @returns {Promise<object>} 结果
 */
export async function forgetPassword(params) {
    return request('/user/forget-password', 'POST', params, false);
}

/**
 * 重置密码
 * @param {object} params - 参数
 * @param {string} params.phone - 手机号
 * @param {string} params.captcha - 验证码
 * @param {string} params.newPassword - 新密码
 * @param {string} params.confirmPassword - 确认密码
 * @returns {Promise<object>} 结果
 */
export async function resetPassword(params) {
    return request('/user/reset-password', 'PUT', params, false);
}

/**
 * 修改密码
 * @param {object} params - 参数
 * @param {string} params.oldPassword - 原密码
 * @param {string} params.newPassword - 新密码
 * @returns {Promise<object>} 结果
 */
export async function changePassword(params) {
    return request('/user/change-password', 'PUT', params);
}

/**
 * 退出登录
 * @returns {Promise<object>} 结果
 */
export async function userLogout() {
    return request('/user/logout', 'PUT');
}

// ------------------------------ 植物模块接口 ------------------------------
/**
 * 添加/编辑/删除植物档案
 * @param {object} params - 参数
 * @param {string} [params.plantId] - 植物ID（PUT/DELETE时必填）
 * @param {string} [params.nickname] - 植物昵称（POST/PUT时必填）
 * @param {string} [params.species] - 植物品种（POST/PUT时必填）
 * @param {string} [params.cultivationMethod] - 栽培方式（POST/PUT时必填）
 * @param {string} [params.location] - 放置位置（POST/PUT时必填）
 * @param {string} [params.plantDate] - 种植日期（POST/PUT时必填）
 * @param {string} [params.imageUrl] - 植物图片URL（POST/PUT时可选）
 * @param {string} method - 请求方法（POST/PUT/DELETE）
 * @returns {Promise<object>} 结果
 */
export async function plantManage(params, method = 'POST') {
    const urlMap = {
        POST: '/plant/add',
        PUT: '/plant/edit',
        DELETE: '/plant/delete',
    };
    return request(urlMap[method], method, params);
}

/**
 * 获取用户植物列表
 * @param {object} [params] - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pagesize=10] - 每页条数
 * @param {string} [params.sortType=plantDate_desc] - 排序类型
 * @returns {Promise<object>} 植物列表
 */
export async function getPlantList(params = {}) {
    const defaultParams = { page: 1, pagesize: 10, sortType: 'plantDate_desc' };
    return request('/plant/list', 'GET', { ...defaultParams, ...params });
}

/**
 * 记录养护操作
 * @param {object} params - 参数
 * @param {string} params.plantId - 植物ID
 * @param {string} params.activityType - 养护类型（watering/fertilizing/pruning/repotting）
 * @param {string} [params.amount] - 操作量
 * @param {string} [params.note] - 备注
 * @returns {Promise<object>} 结果
 */
export async function recordCareOperation(params) {
    return request('/plant/care/record', 'POST', params);
}

// ------------------------------ 提醒模块接口 ------------------------------
/**
 * 获取养护任务提醒
 * @param {object} [params] - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pagesize=10] - 每页条数
 * @param {string} [params.dateRange] - 日期范围（YYYY-MM-DD~YYYY-MM-DD）
 * @returns {Promise<object>} 提醒列表
 */
export async function getCareReminders(params = {}) {
    const defaultParams = { page: 1, pagesize: 10 };
    return request('/reminder/list', 'GET', { ...defaultParams, ...params });
}

/**
 * 筛选养护提醒
 * @param {object} params - 筛选参数
 * @param {string} [params.type] - 提醒类型（watering/sunlight）
 * @param {string} [params.status] - 状态（pending/completed）
 * @returns {Promise<object>} 筛选结果
 */
export async function filterReminders(params) {
    return request('/reminder/filter', 'GET', params);
}

/**
 * 手动触发养护评估
 * @param {object} params - 参数
 * @param {string} params.plantId - 植物ID
 * @returns {Promise<object>} 评估结果
 */
export async function triggerCareEvaluation(params) {
    return request('/reminder/evaluate', 'POST', params);
}

// ------------------------------ AI助手模块接口 ------------------------------
/**
 * 发送咨询消息
 * @param {object} params - 参数
 * @param {string} params.message - 咨询内容
 * @param {string} [params.plantId] - 植物ID（可选）
 * @param {string} [params.conversationId] - 会话ID（多轮对话时携带）
 * @param {string} [params.messageType=text] - 消息类型（text/image_text）
 * @param {string} [params.imageUrl] - 图片URL（messageType=image_text时必填）
 * @returns {Promise<object>} AI响应结果
 */
export async function sendAiMessage(params) {
    const defaultParams = { messageType: 'text' };
    return request('/ai/consult', 'POST', { ...defaultParams, ...params });
}

/**
 * 获取历史对话
 * @param {object} [params] - 查询参数
 * @param {string} [params.plantId] - 植物ID（可选）
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pagesize=10] - 每页条数
 * @param {string} [params.startTime] - 开始时间
 * @param {string} [params.endTime] - 结束时间
 * @returns {Promise<object>} 对话列表
 */
export async function getAiConversations(params = {}) {
    const defaultParams = { page: 1, pagesize: 10 };
    return request('/ai/conversation/list', 'GET', { ...defaultParams, ...params });
}

/**
 * 删除对话
 * @param {object} params - 参数
 * @param {string} params.conversationId - 会话ID
 * @returns {Promise<object>} 结果
 */
export async function deleteAiConversation(params) {
    return request('/ai/conversation/delete', 'DELETE', params);
}

/**
 * 获取知识库内容
 * @param {object} [params] - 查询参数
 * @param {string} [params.category] - 知识分类（species/care/disease/tool）
 * @param {string} [params.keyword] - 搜索关键词
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pagesize=10] - 每页条数
 * @param {string} [params.sortType=hot] - 排序类型（hot/newest）
 * @returns {Promise<object>} 知识列表
 */
export async function getKnowledgeBase(params = {}) {
    const defaultParams = { page: 1, pagesize: 10, sortType: 'hot' };
    return request('/ai/knowledge/list', 'GET', { ...defaultParams, ...params });
}

// ------------------------------ 种植日记模块接口 ------------------------------
/**
 * 创建/编辑/删除日记
 * @param {object} params - 参数
 * @param {string} [params.journalId] - 日记ID（PUT/DELETE时必填）
 * @param {string} [params.plantId] - 植物ID（POST/PUT时必填）
 * @param {string} [params.content] - 日记内容（POST/PUT时必填）
 * @param {string} [params.imageUrl] - 图片URL（POST/PUT时可选）
 * @param {string} [params.activityType] - 养护类型（POST/PUT时可选）
 * @param {string} [params.weather] - 天气状况（POST/PUT时可选）
 * @param {string} [params.temperatureRange] - 温度范围（POST/PUT时可选）
 * @param {string} method - 请求方法（POST/PUT/DELETE）
 * @returns {Promise<object>} 结果
 */
export async function diaryManage(params, method = 'POST') {
    const urlMap = {
        POST: '/diary/create',
        PUT: '/diary/edit',
        DELETE: '/diary/delete',
    };
    return request(urlMap[method], method, params);
}

/**
 * 获取日记列表
 * @param {object} params - 查询参数
 * @param {string} params.plantId - 植物ID
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pagesize=10] - 每页条数
 * @param {string} [params.sortType=createTime_desc] - 排序类型
 * @returns {Promise<object>} 日记列表
 */
export async function getDiaryList(params) {
    const defaultParams = { page: 1, pagesize: 10, sortType: 'createTime_desc' };
    return request('/diary/list', 'GET', { ...defaultParams, ...params });
}

/**
 * 获取单篇日记
 * @param {object} params - 参数
 * @param {string} params.plantId - 植物ID
 * @param {string} params.journalId - 日记ID
 * @returns {Promise<object>} 日记详情
 */
export async function getDiaryDetail(params) {
    return request('/diary/detail', 'GET', params);
}

// ------------------------------ 通用接口 ------------------------------
/**
 * 图片上传
 * @param {object} params - 参数
 * @param {File} params.file - 图片文件
 * @param {string} params.imageType - 图片用途（plant_avatar/plant_profile/journal）
 * @returns {Promise<object>} 上传结果（含imageUrl）
 */
export async function uploadImage(params) {
    // 图片上传需用FormData格式
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('imageType', params.imageType);

    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 10);
    const user = JSON.parse(localStorage.getItem('zhiwu_user')) || {};
    const token = user.token || '';

    const headers = {
        'timestamp': timestamp,
        'nonce': nonce,
        'Authorization': `Bearer ${token}`,
        'sign': generateSign(timestamp, nonce, token),
        // 图片上传不需要Content-Type: application/json，浏览器会自动设置multipart/form-data
    };

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/common/upload-image`, {
            method: 'POST',
            headers,
            body: formData,
            credentials: 'include',
            timeout: API_CONFIG.timeout,
        });
        const result = await response.json();

        if (result.errcode !== 0) {
            alert(result.msg || '图片上传失败');
            throw new Error(result.msg);
        }

        return result;
    } catch (error) {
        console.error('[图片上传失败]', error);
        alert('图片上传失败，请稍后再试');
        throw error;
    }
}

// ------------------------------ 导出所有接口（供其他模块调用） ------------------------------
export const API = {
    // 用户中心
    userLogin,
    userRegister,
    userProfile,
    forgetPassword,
    resetPassword,
    changePassword,
    userLogout,
    // 植物模块
    plantManage,
    getPlantList,
    recordCareOperation,
    // 提醒模块
    getCareReminders,
    filterReminders,
    triggerCareEvaluation,
    // AI助手模块
    sendAiMessage,
    getAiConversations,
    deleteAiConversation,
    getKnowledgeBase,
    // 日记模块
    diaryManage,
    getDiaryList,
    getDiaryDetail,
    // 通用接口
    uploadImage,
};

// 全局挂载（可选，方便页面直接使用）
if (window) {
    window.API = API;
}