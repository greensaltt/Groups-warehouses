// 全局变量：当前会话ID
let currentConversationId = '';

// 初始化AI对话核心功能
export function initAiChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContent = document.getElementById('chatContent');

    // 发送消息核心逻辑
    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (!message) return;

        // 添加用户消息到对话界面
        addUserMessage(message);
        chatInput.value = '';

        // 生成AI回复（模拟实时对话）
        generateAiReply(message);

        // 保存对话到本地历史
        saveConversation(message);
    };

    // 绑定发送事件（点击按钮/回车）
    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 图片咨询功能（支持拍照/上传图片提问）
    const imageUpload = document.getElementById('imageUpload');
    document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
        imageUpload?.click();
    });

    imageUpload?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (res) => {
            // 添加图片消息到对话
            addImageMessage(res.target.result);

            // 模拟AI图片识别与回复（结合植物状态+天气数据）
            setTimeout(() => {
                const reply = '从图片来看，这株植物叶片舒展、颜色鲜亮，状态良好～ 结合当前天气（晴，6°C-15°C），建议：1. 若土壤表面干燥，可沿盆边浇水200ml；2. 放置在散射光充足处，每天保持2-4小时光照；3. 近期无需施肥，避免烧根。如果是特定品种（如多肉/绿萝），可告诉我具体名称获取精准养护方案！';
                addAiMessage(reply);
                saveConversation('上传图片咨询植物状态');
            }, 1800);
        };
        reader.readAsDataURL(file);
    });

    // 选择植物关联咨询（绑定已有植物档案）
    document.getElementById('selectPlantBtn')?.addEventListener('click', () => {
        const plants = getPlants();
        if (plants.length === 0) {
            alert('你还没有添加植物档案，请先去「我的植物」页面添加～');
            return;
        }

        let plantOptions = '请选择要咨询的植物：\n';
        plants.forEach((plant, idx) => {
            plantOptions += `${idx + 1}. ${plant.nickname}（${plant.species}）\n`;
        });

        const selectedIdx = prompt(plantOptions);
        if (!selectedIdx || isNaN(selectedIdx) || selectedIdx < 1 || selectedIdx > plants.length) {
            return;
        }

        const selectedPlant = plants[selectedIdx - 1];
        chatInput.value = `咨询${selectedPlant.nickname}（${selectedPlant.species}）的养护问题：`;
        chatInput.focus();
    });

    // 清空当前对话
    document.getElementById('clearChatBtn')?.addEventListener('click', () => {
        if (confirm('确定要清空当前对话吗？清空后无法恢复')) {
            chatContent.innerHTML = '';
            addWelcomeMessage(); // 重新添加欢迎消息
            currentConversationId = '';
        }
    });

    // 初始化加载历史对话
    loadHistoryConversations();

    // 添加欢迎消息（首次进入/清空对话后）
    addWelcomeMessage();
}

// 添加欢迎消息（含快捷提问按钮）
function addWelcomeMessage() {
    const chatContent = document.getElementById('chatContent');
    const welcomeMsg = `
        <div class="flex mb-6">
            <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <<i class="bi bi-robot text-primary"></</i>
            </div>
            <div class="bg-primary/10 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                <p class="text-gray-800">
                    你好呀！我是你的植物养护助手小植～ 结合实时天气和植物习性，为你提供精准建议！可以问我这些问题：
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                    <button class="bg-white text-primary text-xs px-2 py-1 rounded-full hover:bg-gray-50 transition-colors" onclick="sendSampleQuestion('多肉叶子发黄怎么办？')">
                        多肉叶子发黄怎么办？
                    </button>
                    <button class="bg-white text-primary text-xs px-2 py-1 rounded-full hover:bg-gray-50 transition-colors" onclick="sendSampleQuestion('绿萝多久浇一次水？')">
                        绿萝多久浇一次水？
                    </button>
                    <button class="bg-white text-primary text-xs px-2 py-1 rounded-full hover:bg-gray-50 transition-colors" onclick="sendSampleQuestion('室内植物需要晒太阳吗？')">
                        室内植物需要晒太阳吗？
                    </button>
                    <button class="bg-white text-primary text-xs px-2 py-1 rounded-full hover:bg-gray-50 transition-colors" onclick="sendSampleQuestion('植物长虫子了怎么处理？')">
                        植物长虫子了怎么处理？
                    </button>
                </div>
            </div>
        </div>
    `;
    chatContent.insertAdjacentHTML('beforeend', welcomeMsg);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 添加用户文本消息到对话界面
function addUserMessage(content) {
    const chatContent = document.getElementById('chatContent');
    const msgHtml = `
        <div class="flex mb-6 justify-end">
            <div class="bg-secondary/10 rounded-lg rounded-tr-none px-4 py-3 max-w-[80%]">
                <p class="text-gray-800">${content}</p>
            </div>
            <div class="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                <<i class="bi bi-person text-secondary"></</i>
            </div>
        </div>
    `;
    chatContent.insertAdjacentHTML('beforeend', msgHtml);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 添加用户图片消息到对话界面
function addImageMessage(imageUrl) {
    const chatContent = document.getElementById('chatContent');
    const msgHtml = `
        <div class="flex mb-6 justify-end">
            <div class="bg-secondary/10 rounded-lg rounded-tr-none px-2 py-2 max-w-[60%]">
                <img src="${imageUrl}" alt="用户上传植物图片" class="w-full rounded-lg object-cover">
            </div>
            <div class="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                <<i class="bi bi-person text-secondary"></</i>
            </div>
        </div>
    `;
    chatContent.insertAdjacentHTML('beforeend', msgHtml);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 添加AI回复消息到对话界面
function addAiMessage(content) {
    const chatContent = document.getElementById('chatContent');
    const msgHtml = `
        <div class="flex mb-6">
            <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <<i class="bi bi-robot text-primary"></</i>
            </div>
            <div class="bg-primary/10 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                <p class="text-gray-800 whitespace-pre-line">${content}</p>
            </div>
        </div>
    `;
    chatContent.insertAdjacentHTML('beforeend', msgHtml);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// 生成AI回复（基于问题关键词+植物习性+天气数据，模拟智能诊断）
function generateAiReply(question) {
    let reply = '';
    const weatherData = { type: '晴', tempRange: '6°C-15°C', humidity: '45%' }; // 模拟MCP获取的天气数据

    // 关键词匹配回复逻辑（覆盖系统设计的核心咨询场景）
    if (question.includes('多肉') && question.includes('发黄')) {
        reply = `多肉叶子发黄结合当前天气（${weatherData.type}，${weatherData.tempRange}），常见3种原因及解决方案：
1. 浇水过多：暂停浇水，放在通风处让土壤干燥（避免烂根），当前湿度${weatherData.humidity}，无需加湿；
2. 光照不足：移至散射光充足处（每天2-4小时），避免暴晒，晴天使劲晒更易出状态；
3. 缺肥：春/秋生长期每月施一次稀薄多肉专用肥，冬季温度低于10°C无需施肥。

建议先检查土壤干湿（插入2-3cm判断），再针对性处理～`;
    } else if (question.includes('浇水')) {
        if (question.includes('绿萝')) {
            reply = `绿萝浇水遵循"见干见湿"原则，结合当前天气（${weatherData.type}，${weatherData.humidity}）：
- 春/秋：3-5天一次，土壤表面干燥后浇水；
- 夏季：2-3天一次，高温时可向叶片喷水加湿；
- 冬季：7-10天一次，减少水量避免烂根。

浇水要浇透（盆底漏水），避免积水，当前天气干燥可适当缩短1天间隔～`;
        } else if (question.includes('多肉')) {
            reply = `多肉浇水"宁干勿湿"，结合当前天气（${weatherData.type}，${weatherData.tempRange}）：
- 春/秋生长季：7-10天一次，沿盆边浇水避免浇到叶片中心；
- 夏季：15-20天一次（少量浇水），高温休眠期减少水量；
- 冬季：5°C以上10-15天一次，5°C以下断水防冻。

当前温度适宜生长，若土壤完全干燥可浇水200ml左右～`;
        } else {
            reply = `不同植物浇水频率不同，核心原则"见干见湿"（土壤表面干燥后再浇）。结合当前天气（${weatherData.type}，${weatherData.humidity}）：
- 喜湿植物（绿萝/龟背竹）：3-5天一次；
- 耐旱植物（多肉/仙人掌）：7-15天一次；
- 开花植物（满天星/月季）：2-3天一次。

告诉我具体植物品种，可提供精准浇水建议！`;
        }
    } else if (question.includes('光照') || question.includes('晒太阳')) {
        reply = `结合当前天气（${weatherData.type}，光照充足），常见室内植物光照需求：
1. 多肉、满天星、月季：需充足散射光（每天2-4小时），适合放在南向阳台；
2. 绿萝、龟背竹、吊兰：耐阴（每天1小时散射光），适合放在东向/西向阳台或室内明亮处；
3. 发财树、幸福树、散尾葵：明亮通风处（避免阳光直射），防止叶片灼伤。

当前天气晴好，可将耐晒植物移出户外接受光照，午后强光时记得移回室内～`;
    } else if (question.includes('黄叶') || question.includes('枯萎')) {
        reply = `植物黄叶/枯萎结合当前天气（${weatherData.type}，${weatherData.tempRange}），可能原因及解决方案：
1. 浇水不当（过多/过少）：检查土壤干湿，干则浇透，湿则通风干燥；
2. 光照不足/过强：根据植物品种调整摆放位置，晴天使劲晒耐晒植物，阴天使劲移至亮处；
3. 缺肥/施肥过多：缺肥则施稀薄肥料，施肥过多则用清水冲洗土壤；
4. 病虫害：观察叶片正反面是否有虫子/斑点，如有可拍照咨询具体防治方法。

当前温度适宜，若排除以上原因，可能是植物正常代谢，及时修剪黄叶即可～`;
    } else if (question.includes('施肥')) {
        reply = `植物施肥原则"薄肥勤施"，结合当前天气（${weatherData.type}，${weatherData.tempRange}）：
1. 春/秋生长期（当前适合）：每月1-2次稀薄肥料，多肉专用肥、观叶植物肥区分使用；
2. 夏季/冬季：多数植物休眠，减少或停止施肥，避免烧根；
3. 施肥时间：选择晴天傍晚，施肥后浇水帮助吸收；
4. 常见肥料选择：
   - 多肉：多肉专用颗粒肥；
   - 绿萝/龟背竹：氮钾肥为主，促进叶片翠绿；
   - 开花植物：磷钾肥为主，促进开花。

当前天气适合施肥，建议根据植物品种选择对应肥料，控制用量避免过量～`;
    } else if (question.includes('虫子') || question.includes('病虫害')) {
        reply = `结合当前天气（${weatherData.type}，${weatherData.humidity}），常见植物病虫害防治方法：
1. 蚜虫（绿色/黑色小虫子）：用棉签蘸酒精擦拭叶片，或喷洒稀释肥皂水；
2. 红蜘蛛（叶片背面红色小斑点）：增加空气湿度，用清水冲洗叶片，或喷洒专用杀虫剂；
3. 白粉病（叶片白色粉末）：及时摘除病叶，保持通风，喷洒多菌灵溶液；
4. 介壳虫（叶片上白色/褐色介壳）：用牙签剔除，或喷洒介壳虫专用药。

当前湿度45%，容易滋生红蜘蛛，建议定期给植物喷水加湿，预防病虫害发生～`;
    } else if (question.includes('换盆')) {
        reply = `植物换盆最佳时间结合当前天气（${weatherData.type}，${weatherData.tempRange}）：
1. 换盆时机：春/秋季节（当前适合），植物生长旺盛，恢复快；
2. 换盆频率：一年生植物每年1次，多年生植物2-3年1次；
3. 换盆步骤：
   - 脱盆：轻轻拍打花盆，将植物取出，去除根部旧土；
   - 修根：修剪烂根、过长根须；
   - 上盆：新盆底部铺排水层，放入植物，填充新土并压实；
   - 缓苗：换盆后浇水浇透，放在阴凉通风处缓苗1-2周，再正常养护。

当前天气适宜换盆，建议选择比原盆大1-2号的花盆，使用疏松透气的土壤（如多肉用颗粒土，绿萝用腐叶土+珍珠岩）～`;
    } else {
        reply = `感谢你的提问！结合当前天气（${weatherData.type}，${weatherData.tempRange}），通用养护建议：
1. 浇水：遵循"见干见湿"，根据植物品种调整频率，当前天气干燥可适当缩短间隔；
2. 光照：晴天使劲晒耐晒植物，移至亮处耐阴植物，避免强光灼伤；
3. 通风：保持环境通风，减少病虫害发生；
4. 观察：定期检查植物叶片、根部状态，及时处理黄叶、病虫害。

如果能补充植物品种、生长环境（如放置位置、种植时长），我会为你提供更精准的养护方案！`;
    }

    // 模拟流式回复延迟（增强真实感）
    setTimeout(() => {
        addAiMessage(reply);
    }, 1000);
}

// 保存对话到本地存储（支持历史记录回溯）
function saveConversation(question) {
    if (!currentConversationId) {
        currentConversationId = Date.now().toString(); // 生成唯一会话ID
    }

    const conversation = {
        id: currentConversationId,
        title: question.length > 15 ? question.slice(0, 15) + '...' : question, // 会话标题（截取前15字）
        question: question,
        createTime: new Date().toISOString(),
        plantId: '' // 预留植物ID关联字段
    };

    // 存储对话（最多保留10条最近对话）
    let conversations = JSON.parse(localStorage.getItem('zhiwu_ai_conversations')) || [];
    if (conversations.length >= 10) {
        conversations.shift(); // 删除最早的对话
    }
    conversations.push(conversation);
    localStorage.setItem('zhiwu_ai_conversations', JSON.stringify(conversations));

    // 刷新历史对话列表
    loadHistoryConversations();
}

// 加载历史对话列表（左侧/手机端切换显示）
function loadHistoryConversations() {
    const conversations = JSON.parse(localStorage.getItem('zhiwu_ai_conversations')) || [];
    const historyContainer = document.getElementById('historyConversations');

    if (conversations.length === 0) {
        historyContainer.innerHTML = '<div class="text-center text-sm text-gray-500 py-4">暂无历史对话</div>';
        return;
    }

    historyContainer.innerHTML = '';
    conversations.forEach(conv => {
        const date = new Date(conv.createTime);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

        const convHtml = `
            <div class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onclick="loadConversation('${conv.id}')">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-dark truncate">${conv.title}</h3>
                    <span class="text-xs text-gray-500">${dateStr}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1 truncate">${conv.question}</p>
            </div>
        `;
        historyContainer.insertAdjacentHTML('beforeend', convHtml);
    });
}

// 加载历史对话详情（回溯之前的咨询记录）
window.loadConversation = function(conversationId) {
    const conversations = JSON.parse(localStorage.getItem('zhiwu_ai_conversations')) || [];
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    currentConversationId = conversationId;
    const chatContent = document.getElementById('chatContent');
    chatContent.innerHTML = '';

    // 加载用户问题和对应的AI回复
    addUserMessage(conv.question);
    setTimeout(() => {
        generateAiReply(conv.question);
    }, 800);
};

// 发送示例问题（快捷提问按钮）
window.sendSampleQuestion = function(question) {
    document.getElementById('chatInput').value = question;
    document.getElementById('sendBtn').click();
};

// 初始化知识库（搜索+详情展示）
export function initKnowledgeBase() {
    const searchInput = document.getElementById('knowledgeSearch');
    const mobileSearchInput = document.getElementById('mobileKnowledgeSearch');
    const knowledgeList = document.getElementById('knowledgeList');
    const mobileKnowledgeList = document.getElementById('mobileKnowledgeList');

    // 知识库核心数据（覆盖系统设计的知识分类）
    const knowledgeData = [
        { title: '多肉植物浇水指南', category: 'care', type: '多肉' },
        { title: '绿萝日常养护与黄叶处理', category: 'care', type: '绿萝' },
        { title: '常见室内植物光照需求表', category: 'care', type: '通用' },
        { title: '植物常见病虫害防治方法', category: 'disease', type: '通用' },
        { title: '多肉植物品种图鉴与养护差异', category: 'species', type: '多肉' },
        { title: '观叶植物施肥技巧', category: 'care', type: '观叶植物' },
        { title: '室内植物浇水频率大全', category: 'care', type: '通用' },
        { title: '植物换盆教程与注意事项', category: 'tool', type: '通用' },
        { title: '水培植物养护指南', category: 'care', type: '水培植物' },
        { title: '冬季植物保暖防冻技巧', category: 'care', type: '通用' },
        { title: '开花植物促花养护方法', category: 'care', type: '开花植物' },
        { title: '植物烂根原因与拯救方案', category: 'disease', type: '通用' }
    ];

    // 筛选知识库（支持关键词搜索）
    const filterKnowledge = (keyword, listEl) => {
        keyword = keyword.toLowerCase().trim();
        if (!keyword) {
            renderKnowledgeList(knowledgeData, listEl);
            return;
        }

        const filtered = knowledgeData.filter(item => 
            item.title.toLowerCase().includes(keyword) || 
            item.category.toLowerCase().includes(keyword) || 
            item.type.toLowerCase().includes(keyword)
        );

        renderKnowledgeList(filtered, listEl);
    };

    // 渲染知识库列表
    const renderKnowledgeList = (data, listEl) => {
        if (data.length === 0) {
            listEl.innerHTML = '<div class="text-center text-sm text-gray-500 py-4">未找到相关知识</div>';
            return;
        }

        listEl.innerHTML = '';
        data.forEach(item => {
            const itemHtml = `
                <div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onclick="showKnowledgeDetail('${item.title}')">
                    ${item.title}
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', itemHtml);
        });
    };

    // 绑定搜索事件（电脑端+手机端）
    searchInput?.addEventListener('input', (e) => {
        filterKnowledge(e.target.value, knowledgeList);
    });

    mobileSearchInput?.addEventListener('input', (e) => {
        filterKnowledge(e.target.value, mobileKnowledgeList);
    });

    // 初始化渲染知识库
    renderKnowledgeList(knowledgeData, knowledgeList);
    renderKnowledgeList(knowledgeData, mobileKnowledgeList);
}

// 显示知识库详情弹窗
window.showKnowledgeDetail = function(title) {
    const modal = document.getElementById('knowledgeModal');
    const titleEl = document.getElementById('knowledgeTitle');
    const contentEl = document.getElementById('knowledgeContent');

    titleEl.textContent = title;

    // 知识库详情内容（完整覆盖系统设计的知识要点）
    let content = '';
    switch (title) {
        case '多肉植物浇水指南':
            content = `
                <p class="font-medium">核心原则：宁干勿湿，浇则浇透</p>
                <p class="mt-2">1. 浇水频率（结合天气调整）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>春/秋（生长季）：7-10天一次，晴热天气可缩短至5-7天；</li>
                    <li>夏季：15-20天一次（少量浇水，避免积水烂根），高温休眠期减少水量；</li>
                    <li>冬季：5°C以上10-15天一次，5°C以下断水防冻。</li>
                </ul>
                <p class="mt-2">2. 浇水方法：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>沿盆边缓慢浇水，避免浇到叶片中心（容易导致叶片腐烂）；</li>
                    <li>浇至盆底漏水，确保根系充分吸收水分，避免"半截水"；</li>
                    <li>浇水后置于通风处，加速土壤干燥，减少病虫害风险。</li>
                </ul>
                <p class="mt-2">3. 判断是否需要浇水：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>手指插入土壤2-3cm，感觉干燥即可浇水；</li>
                    <li>观察叶片：叶片发软、发皱说明缺水，叶片饱满则无需浇水；</li>
                    <li>掂花盆重量：花盆明显变轻则缺水，较重则土壤仍湿润。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：多肉浇水最忌频繁浇水，宁可干一点也不要积水，新手可遵循"少浇多次"原则。</p>
            `;
            break;
        case '绿萝日常养护与黄叶处理':
            content = `
                <p>绿萝是耐阴、耐旱的常见室内观叶植物，养护简单，适合新手种植～</p>
                <p class="mt-2">1. 光照要求：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>适合散射光环境，避免阳光直射（会灼伤叶片，导致黄叶）；</li>
                    <li>放置在室内明亮处，每天1小时光照即可，可放在东向/西向阳台；</li>
                    <li>长期光照不足会导致叶片发黄、徒长，需定期移至亮处补光。</li>
                </ul>
                <p class="mt-2">2. 浇水方法：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>遵循"见干见湿"原则，土壤表面干燥后再浇水；</li>
                    <li>春/秋：3-5天一次；夏季：2-3天一次；冬季：7-10天一次；</li>
                    <li>浇水要浇透（盆底漏水），避免积水导致烂根，浇水后通风干燥。</li>
                </ul>
                <p class="mt-2">3. 黄叶处理：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>底部老叶发黄：正常代谢，及时用剪刀修剪即可；</li>
                    <li>新叶发黄：可能是光照不足或浇水过多，调整养护环境，减少浇水频率；</li>
                    <li>叶片尖端发黄：可能是空气干燥，可向叶片喷水加湿，或在花盆旁放一盆水；</li>
                    <li>整株黄叶：可能是烂根，需脱盆检查根部，修剪烂根后重新上盆。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：绿萝生长迅速，可定期修剪打顶，促进分枝，让植株更茂盛。</p>
            `;
            break;
        case '常见室内植物光照需求表':
            content = `
                <p>不同室内植物对光照需求不同，合理摆放能让植物生长更旺盛～</p>
                <p class="mt-2">1. 高光照需求（每天4-6小时，适合南向阳台）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>多肉植物（桃蛋、玉露、景天等）：需充足散射光，否则容易徒长；</li>
                    <li>开花植物（满天星、月季、三角梅等）：光照不足会导致不开花或开花少；</li>
                    <li>仙人掌、仙人球：极度喜光，可直接放在阳光下暴晒。</li>
                </ul>
                <p class="mt-2">2. 中光照需求（每天2-4小时，适合东向/西向阳台）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>观叶植物（绿萝、龟背竹、吊兰、常春藤等）：耐阴但需要一定光照；</li>
                    <li>发财树、幸福树：明亮通风处即可，避免阳光直射；</li>
                    <li>散尾葵、夏威夷椰子：适合半阴环境，光照过强会灼伤叶片。</li>
                </ul>
                <p class="mt-2">3. 低光照需求（每天1小时以下，适合北向阳台/室内）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>虎皮兰、一叶兰、万年青：极度耐阴，适合放在卧室、卫生间（通风良好）；</li>
                    <li>文竹、铁线蕨、豆瓣绿：喜欢阴凉潮湿环境，避免强光直射；</li>
                    <li>富贵竹（水培）：可放在室内任何明亮处，无需直接晒太阳。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：可根据植物叶片状态判断光照是否充足，叶片翠绿、舒展说明光照适宜；叶片发黄、发暗说明光照不足；叶片有灼伤斑点说明光照过强。</p>
            `;
            break;
        case '植物常见病虫害防治方法':
            content = `
                <p>室内植物常见病虫害及防治方法，以预防为主，及时处理～</p>
                <p class="mt-2">1. 蚜虫：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>症状：叶片上出现绿色/黑色小虫子，叶片卷曲、发黄，分泌黏液；</li>
                    <li>防治：用棉签蘸酒精擦拭叶片，或喷洒稀释的肥皂水（1:50比例），严重时用蚜虫专用杀虫剂。</li>
                </ul>
                <p class="mt-2">2. 红蜘蛛：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>症状：叶片背面出现红色小斑点，叶片发黄、脱落，有细密丝网；</li>
                    <li>防治：增加空气湿度（红蜘蛛喜干燥），用清水冲洗叶片，或喷洒红蜘蛛专用杀虫剂，连续喷洒2-3次。</li>
                </ul>
                <p class="mt-2">3. 白粉病：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>症状：叶片上出现白色粉末状物质，逐渐扩散，影响光合作用；</li>
                    <li>防治：及时摘除病叶，保持通风，喷洒多菌灵溶液（1:1000比例），每周1次，连续3次。</li>
                </ul>
                <p class="mt-2">4. 介壳虫：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>症状：叶片上出现白色/褐色介壳，吸附在叶片表面，吸食汁液；</li>
                    <li>防治：用牙签剔除介壳虫，或用酒精擦拭叶片，严重时喷洒介壳虫专用药。</li>
                </ul>
                <p class="mt-2">5. 根腐病：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>症状：叶片发软、发黄，根部腐烂有异味，植株倒伏；</li>
                    <li>防治：减少浇水，及时脱盆修剪烂根，用多菌灵溶液浸泡根部，更换新土壤重新上盆。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">预防小贴士：保持环境通风，避免浇水过多，定期清洁叶片，可有效减少病虫害发生。</p>
            `;
            break;
        case '多肉植物品种图鉴与养护差异':
            content = `
                <p>常见多肉植物品种及养护差异，不同品种习性不同，养护需针对性调整～</p>
                <p class="mt-2">1. 景天科（如桃蛋、吉娃娃、虹之玉）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>光照：喜充足散射光，每天2-4小时，适合南向阳台；</li>
                    <li>浇水：春/秋7-10天一次，夏季15-20天一次，冬季5°C以上浇水；</li>
                    <li>特点：容易出状态（变色），光照充足时叶片呈现粉色、红色等。</li>
                </ul>
                <p class="mt-2">2. 百合科（如玉露、寿、万象）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>光照：喜散射光，避免阳光直射，每天1-2小时即可；</li>
                    <li>浇水：比景天科更喜湿，春/秋5-7天一次，保持土壤微湿；</li>
                    <li>特点：叶片透明，有"窗"结构，适合放在明亮的室内。</li>
                </ul>
                <p class="mt-2">3. 番杏科（如生石花、肉锥）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>光照：喜充足光照，每天3-4小时，适合南向阳台；</li>
                    <li>浇水：非常耐旱，春/秋10-15天一次，夏季休眠期断水；</li>
                    <li>特点：外形像石头，每年脱皮一次，脱皮期需减少浇水。</li>
                </ul>
                <p class="mt-2">4. 仙人掌科（如仙人球、仙人掌）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>光照：极度喜光，可直接暴晒，每天4-6小时；</li>
                    <li>浇水：极度耐旱，春/秋15-20天一次，冬季断水；</li>
                    <li>特点：有刺，适合放在阳光充足的阳台，部分品种会开花。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：多肉植物养护核心是"光照+浇水"，根据品种调整，避免一概而论。</p>
            `;
            break;
        case '观叶植物施肥技巧':
            content = `
                <p>观叶植物（如绿萝、龟背竹、吊兰）施肥核心：以氮钾肥为主，促进叶片翠绿肥厚～</p>
                <p class="mt-2">1. 施肥时间：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>生长季（春/秋）：每月1-2次，此时植物生长旺盛，需肥量大；</li>
                    <li>夏季：温度高于30°C时减少施肥，避免烧根；</li>
                    <li>冬季：温度低于10°C时停止施肥，植物休眠期无需施肥。</li>
                </ul>
                <p class="mt-2">2. 肥料选择：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>氮肥：促进叶片生长，使叶片翠绿，适合绿萝、吊兰等；</li>
                    <li>钾肥：增强植物抗性，使叶片肥厚有光泽，适合龟背竹、橡皮树等；</li>
                    <li>复合肥：氮磷钾均衡，适合所有观叶植物，新手推荐使用；</li>
                    <li>有机肥：如腐熟的淘米水、豆饼水，需稀释后使用，效果温和。</li>
                </ul>
                <p class="mt-2">3. 施肥方法：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>薄肥勤施：每次施肥量要少，避免过量烧根，可稀释后浇灌；</li>
                    <li>施肥位置：沿盆边浇灌，避免直接浇在根部；</li>
                    <li>施肥后浇水：帮助肥料溶解，促进根系吸收；</li>
                    <li>叶面施肥：每月1次，将稀释的肥料喷洒在叶片上，吸收更快。</li>
                </ul>
                <p class="mt-2">4. 缺肥症状与处理：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>叶片发黄、变薄：缺氮，补充氮肥；</li>
                    <li>叶片暗淡、无光泽：缺钾，补充钾肥；</li>
                    <li>生长缓慢：缺复合肥，补充均衡肥料。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：观叶植物施肥忌施生肥、浓肥，施肥前确保土壤湿润，避免空腹施肥。</p>
            `;
            break;
        case '室内植物浇水频率大全':
            content = `
                <p>不同室内植物浇水频率参考，结合天气、土壤、环境调整，核心原则"见干见湿"～</p>
                <p class="mt-2">1. 耐旱植物（浇水间隔：7-15天）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>多肉植物、仙人掌、仙人球：宁干勿湿，避免积水；</li>
                    <li>发财树、金钱树：肉质根，怕积水，土壤干燥后再浇水；</li>
                    <li>虎皮兰、芦荟：叶片储水能力强，耐旱性好。</li>
                </ul>
                <p class="mt-2">2. 中性植物（浇水间隔：3-7天）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>绿萝、吊兰、常春藤：喜湿润但怕积水，土壤表面干燥后浇水；</li>
                    <li>龟背竹、橡皮树、散尾葵：保持土壤微湿，避免干燥；</li>
                    <li>文竹、铁线蕨：喜湿润，需经常向叶片喷水加湿。</li>
                </ul>
                <p class="mt-2">3. 喜湿植物（浇水间隔：2-3天）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>满天星、月季、三角梅：开花植物，需水量大，保持土壤湿润；</li>
                    <li>富贵竹（水培）：每周换水1次，保持水质清洁；</li>
                    <li>网纹草、竹芋：喜高湿度，需经常喷水，避免土壤干燥。</li>
                </ul>
                <p class="mt-2">4. 特殊植物（浇水方式特殊）：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>生石花、肉锥：脱皮期断水，平时10-15天一次；</li>
                    <li>蝴蝶兰：附生植物，忌积水，用喷壶喷洒根部，每周2-3次；</li>
                    <li>兰花：喜湿润但怕积水，用浸盆法浇水，每周1次。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">调整因素：晴热天气缩短间隔，阴雨天气延长间隔；通风好缩短间隔，通风差延长间隔；花盆大延长间隔，花盆小缩短间隔。</p>
            `;
            break;
        case '植物换盆教程与注意事项':
            content = `
                <p>植物换盆是促进生长的重要养护步骤，掌握正确方法避免伤苗～</p>
                <p class="mt-2">1. 换盆时机：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>最佳时间：春/秋季节，植物生长旺盛，恢复快；</li>
                    <li>换盆频率：一年生植物每年1次，多年生植物2-3年1次；</li>
                    <li>特殊情况：根系从盆底钻出、土壤板结、植物生长缓慢时需换盆。</li>
                </ul>
                <p class="mt-2">2. 换盆准备：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>花盆：选择比原盆大1-2号的花盆，盆底有排水孔；</li>
                    <li>土壤：根据植物品种选择（多肉用颗粒土，绿萝用腐叶土+珍珠岩）；</li>
                    <li>工具：剪刀（修剪根系）、喷壶（浇水）、手套（防刺/防脏）。</li>
                </ul>
                <p class="mt-2">3. 换盆步骤：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>脱盆：轻轻拍打花盆四周，将植物取出，避免用力拉扯；</li>
                    <li>修根：去除根部旧土，修剪烂根、过长根须、老化根系；</li>
                    <li>上盆：盆底铺一层排水层（陶粒/碎石），放入植物，填充新土并轻轻压实；</li>
                    <li>缓苗：换盆后浇水浇透，放在阴凉通风处缓苗1-2周，再正常养护。</li>
                </ul>
                <p class="mt-2">4. 注意事项：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>换盆时避免损伤主根，否则影响植物存活；</li>
                    <li>新盆需提前浸泡（陶瓷盆），避免烧根；</li>
                    <li>缓苗期间避免阳光直射、施肥，保持土壤微湿；</li>
                    <li>多肉植物换盆后可晾根1-2天再上盆，减少烂根风险。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：换盆后植物出现轻微黄叶、萎蔫是正常现象，缓苗后会恢复生长。</p>
            `;
            break;
        case '水培植物养护指南':
            content = `
                <p>水培植物（如富贵竹、绿萝、吊兰）干净卫生，养护简单，适合室内摆放～</p>
                <p class="mt-2">1. 容器选择：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>透明玻璃瓶：便于观察根系生长情况，适合富贵竹、转运竹；</li>
                    <li>陶瓷盆：美观大方，适合绿萝、吊兰，需有排水孔；</li>
                    <li>容器大小：根据植物根系大小选择，根系舒展为宜。</li>
                </ul>
                <p class="mt-2">2. 水质要求：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>首选自来水：提前晾晒24小时，去除氯气；</li>
                    <li>纯净水/矿泉水：也可使用，无需晾晒；</li>
                    <li>换水频率：夏季2-3天一次，冬季5-7天一次，保持水质清洁。</li>
                </ul>
                <p class="mt-2">3. 根系处理：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>剪去腐烂、老化根系，保留健康白色根系；</li>
                    <li>根系不要完全浸泡在水中，保留1/3暴露在空气中，便于呼吸；</li>
                    <li>定期清洗根系，去除黏液和杂质。</li>
                </ul>
                <p class="mt-2">4. 光照与温度：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>光照：喜散射光，避免阳光直射，放在室内明亮处；</li>
                    <li>温度：15°C-25°C最适宜，冬季温度不低于5°C，避免冻伤。</li>
                </ul>
                <p class="mt-2">5. 营养液使用：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>选择水培专用营养液，按照说明书稀释后添加；</li>
                    <li>添加频率：每月1-2次，夏季可增加至2-3次；</li>
                    <li>避免过量添加，否则会导致根系腐烂。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：水培植物容易出现黄叶，可能是光照不足或营养液缺乏，可适当补光、添加营养液。</p>
            `;
            break;
        case '冬季植物保暖防冻技巧':
            content = `
                <p>冬季气温低，植物容易冻伤，做好保暖措施是关键～</p>
                <p class="mt-2">1. 移至室内：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>霜降前后（气温低于10°C）将室外植物移至室内，避免冻伤；</li>
                    <li>放置位置：南向阳台、窗边等光照充足、温度较高的地方；</li>
                    <li>远离热源：避免放在暖气、空调出风口旁，防止叶片脱水。</li>
                </ul>
                <p class="mt-2">2. 保暖措施：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>套塑料袋：小型植物可套透明塑料袋，扎几个小孔透气，保暖保湿；</li>
                    <li>铺干草/泡沫：花盆底部铺一层干草或泡沫，减少热量流失；</li>
                    <li>群植保暖：将多盆植物放在一起，利用群体效应保暖。</li>
                </ul>
                <p class="mt-2">3. 浇水调整：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>减少浇水：冬季植物休眠，需水量减少，土壤干燥后再浇水；</li>
                    <li>浇水时间：选择晴天中午，水温接近室温，避免冷水刺激根系；</li>
                    <li>避免积水：冬季土壤蒸发慢，积水容易导致烂根+冻伤。</li>
                </ul>
                <p class="mt-2">4. 光照补充：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>冬季光照弱，可延长植物光照时间，每天4-6小时；</li>
                    <li>使用补光灯：缺乏光照时，用植物补光灯补光，每天2-3小时；</li>
                    <li>定期转盆：每周转动花盆一次，确保植物均匀受光。</li>
                </ul>
                <p class="mt-2">5. 停止施肥：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>冬季植物休眠，停止施肥，避免烧根；</li>
                    <li>若植物继续生长（如室内温暖），可少量施加稀薄肥料。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：不同植物耐寒性不同，多肉、绿萝、富贵竹等耐寒性差，需重点保暖；虎皮兰、仙人掌等耐寒性强，可适当减少保暖措施。</p>
            `;
            break;
        case '开花植物促花养护方法':
            content = `
                <p>想要开花植物（如月季、满天星、三角梅）多开花、开艳花，做好以下养护～</p>
                <p class="mt-2">1. 光照充足：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>开花植物需要充足光照，每天4-6小时，适合南向阳台；</li>
                    <li>光照不足会导致徒长、不开花或开花少，需移至亮处补光；</li>
                    <li>夏季强光时适当遮阴，避免灼伤叶片。</li>
                </ul>
                <p class="mt-2">2. 施肥得当：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>生长期（春/秋）：施加氮磷钾复合肥，促进枝叶生长；</li>
                    <li>花期前（现蕾期）：施加磷钾肥，促进花芽分化，如磷酸二氢钾（1:1000稀释）；</li>
                    <li>施肥频率：每月1-2次，薄肥勤施，避免过量烧根。</li>
                </ul>
                <p class="mt-2">3. 浇水合理：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>保持土壤湿润，避免干燥，花期需水量大，可适当增加浇水频率；</li>
                    <li>避免积水，浇水后通风干燥，防止烂根；</li>
                    <li>花期浇水时避免浇到花朵上，影响开花质量。</li>
                </ul>
                <p class="mt-2">4. 修剪整形：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>花后修剪：花朵凋谢后及时剪去花茎，促进分枝，再次开花；</li>
                    <li>疏枝修剪：剪去徒长枝、病弱枝、过密枝，集中养分供给开花枝；</li>
                    <li>冬季修剪：冬季休眠期进行重剪，为来年开花做准备。</li>
                </ul>
                <p class="mt-2">5. 温度适宜：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>多数开花植物适宜温度15°C-25°C，冬季温度不低于5°C；</li>
                    <li>部分植物需要低温春化（如月季），冬季需经历一段时间低温，来年才能开花。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：不同开花植物习性不同，需针对性调整养护，例如三角梅需要控水促花，满天星需要充足光照和肥料。</p>
            `;
            break;
        case '植物烂根原因与拯救方案':
            content = `
                <p>植物烂根是常见问题，多由浇水过多、土壤不透气、病虫害导致，及时处理可拯救～</p>
                <p class="mt-2">1. 烂根原因：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>浇水过多：土壤长期湿润，根系缺氧腐烂，是最常见原因；</li>
                    <li>土壤不透气：土壤板结、排水差，积水导致烂根；</li>
                    <li>施肥过量：浓肥、生肥烧伤根系，导致烂根；</li>
                    <li>病虫害：根腐病、线虫等侵害根系，导致腐烂。</li>
                </ul>
                <p class="mt-2">2. 烂根症状：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>叶片发黄、萎蔫，浇水后无改善；</li>
                    <li>植株倒伏、生长缓慢，甚至停止生长；</li>
                    <li>根部发黑、腐烂，有异味，健康根系为白色/淡黄色。</li>
                </ul>
                <p class="mt-2">3. 拯救方案：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>脱盆检查：轻轻将植物取出，去除土壤，检查根系腐烂情况；</li>
                    <li>修剪烂根：用消毒后的剪刀剪去所有烂根、发黑根系，保留健康部分；</li>
                    <li>消毒处理：将修剪后的根系浸泡在多菌灵溶液（1:1000比例）中10-15分钟，晾干；</li>
                    <li>重新上盆：更换新的疏松透气土壤，盆底铺排水层，避免再次积水；</li>
                    <li>缓苗养护：上盆后浇水浇透，放在阴凉通风处缓苗1-2周，期间避免阳光直射、施肥。</li>
                </ul>
                <p class="mt-2">4. 预防措施：</p>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>合理浇水：遵循"见干见湿"，避免频繁浇水；</li>
                    <li>选择透气土壤：根据植物品种选择合适土壤，如多肉用颗粒土，绿萝用腐叶土+珍珠岩；</li>
                    <li>花盆有排水孔：选择带排水孔的花盆，浇水后及时倒掉托盘积水；</li>
                    <li>薄肥勤施：避免施肥过量，施肥前确保土壤湿润。</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">提示：若植物烂根严重，根系所剩无几，可尝试扦插繁殖，保留植物品种。</p>
            `;
            break;
        default:
            content = `<p>暂无详细内容，你可以直接向我提问，我会为你提供专业的养护建议～</p>`;
    }

    contentEl.innerHTML = content;
    modal.classList.remove('hidden');
}

// 隐藏知识库详情弹窗
window.hideKnowledgeModal = function() {
    document.getElementById('knowledgeModal').classList.add('hidden');
};

// 页面加载时初始化AI助手功能
window.addEventListener('load', () => {
    if (window.location.pathname.includes('ai-assistant.html')) {
        initAiChat();
        initKnowledgeBase();
    }
});