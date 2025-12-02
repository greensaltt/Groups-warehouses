// 路由守卫：未登录跳转登录页
function checkLogin() {
    const user = localStorage.getItem('zhiwu_user');
    const currentPath = window.location.pathname;
    const ignorePaths = ['/login.html', '/register.html'];
    
    if (!user && !ignorePaths.some(path => currentPath.includes(path))) {
        window.location.href = 'login.html';
    }
}

// 页面加载时执行路由守卫
window.addEventListener('load', () => {
    checkLogin();
});

// 退出登录
function logout() {
    localStorage.removeItem('zhiwu_user');
    localStorage.removeItem('zhiwu_plants');
    localStorage.removeItem('zhiwu_diaries');
    localStorage.removeItem('zhiwu_ai_conversations');
    window.location.href = 'login.html';
}

// 存储植物数据
function savePlant(plant) {
    let plants = JSON.parse(localStorage.getItem('zhiwu_plants')) || [];
    plant.id = Date.now().toString(); // 生成唯一ID
    plants.push(plant);
    localStorage.setItem('zhiwu_plants', JSON.stringify(plants));
    return plant;
}

// 获取所有植物数据
function getPlants() {
    return JSON.parse(localStorage.getItem('zhiwu_plants')) || [];
}

// 根据ID获取单个植物
function getPlantById(plantId) {
    const plants = getPlants();
    return plants.find(plant => plant.id === plantId) || null;
}

// 更新植物数据
function updatePlant(updatedPlant) {
    let plants = getPlants();
    const index = plants.findIndex(plant => plant.id === updatedPlant.id);
    if (index !== -1) {
        plants[index] = { ...plants[index], ...updatedPlant };
        localStorage.setItem('zhiwu_plants', JSON.stringify(plants));
        return true;
    }
    return false;
}

// 删除植物数据
function deletePlantById(plantId) {
    let plants = getPlants();
    plants = plants.filter(plant => plant.id !== plantId);
    localStorage.setItem('zhiwu_plants', JSON.stringify(plants));
    
    // 关联删除日记
    let diaries = getDiaries();
    diaries = diaries.filter(diary => diary.plantId !== plantId);
    localStorage.setItem('zhiwu_diaries', JSON.stringify(diaries));
    return true;
}

// 存储日记数据
function saveDiary(diary) {
    let diaries = JSON.parse(localStorage.getItem('zhiwu_diaries')) || [];
    diary.id = Date.now().toString();
    diary.date = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    diaries.push(diary);
    localStorage.setItem('zhiwu_diaries', JSON.stringify(diaries));
    return diary;
}

// 获取所有日记数据（支持按植物ID筛选）
function getDiaries(plantId = '') {
    let diaries = JSON.parse(localStorage.getItem('zhiwu_diaries')) || [];
    if (plantId) {
        return diaries.filter(d => d.plantId === plantId);
    }
    // 按日期倒序排序
    return diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 根据ID获取单个日记
function getDiaryById(diaryId) {
    const diaries = getDiaries();
    return diaries.find(diary => diary.id === diaryId) || null;
}

// 更新日记数据
function updateDiary(updatedDiary) {
    let diaries = getDiaries();
    const index = diaries.findIndex(diary => diary.id === updatedDiary.id);
    if (index !== -1) {
        diaries[index] = { ...diaries[index], ...updatedDiary };
        localStorage.setItem('zhiwu_diaries', JSON.stringify(diaries));
        return true;
    }
    return false;
}

// 删除日记数据
function deleteDiaryById(diaryId) {
    let diaries = getDiaries();
    diaries = diaries.filter(diary => diary.id !== diaryId);
    localStorage.setItem('zhiwu_diaries', JSON.stringify(diaries));
    return true;
}

// 计算下次浇水时间文本
function getNextWateringText(plantDate) {
    const plantTime = new Date(plantDate);
    const now = new Date();
    const daysSincePlant = Math.floor((now - plantTime) / (1000 * 60 * 60 * 24));
    
    // 模拟逻辑：新植物（30天内）3天浇一次，老植物7天浇一次
    const cycle = daysSincePlant < 30 ? 3 : 7;
    const lastWateredKey = `zhiwu_lastWatered_${plantId}`;
    const lastWatered = localStorage.getItem(lastWateredKey) || plantDate;
    const lastWateredTime = new Date(lastWatered);
    
    // 计算下次浇水天数
    const nextWaterDays = Math.ceil((lastWateredTime - now) / (1000 * 60 * 60 * 24)) + cycle;
    
    if (nextWaterDays <= 0) return '今日需浇水';
    return `距离下次浇水还有${nextWaterDays}天`;
}

// 格式化日期（YYYY-MM-DD 转 MM月DD日）
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 存储AI对话记录
function saveAiConversation(conversation) {
    let conversations = JSON.parse(localStorage.getItem('zhiwu_ai_conversations')) || [];
    // 只保留最近10条对话
    if (conversations.length >= 10) {
        conversations.shift();
    }
    conversations.push(conversation);
    localStorage.setItem('zhiwu_ai_conversations', JSON.stringify(conversations));
    return conversation;
}

// 获取AI对话记录
function getAiConversations() {
    return JSON.parse(localStorage.getItem('zhiwu_ai_conversations')) || [];
}

// 删除AI对话记录
function deleteAiConversation(conversationId) {
    let conversations = getAiConversations();
    conversations = conversations.filter(conv => conv.id !== conversationId);
    localStorage.setItem('zhiwu_ai_conversations', JSON.stringify(conversations));
    return true;
}