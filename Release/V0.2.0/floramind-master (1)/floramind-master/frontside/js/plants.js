// 渲染植物列表
export function renderPlantList() {
    const plants = getPlants();
    const plantList = document.getElementById('plantList');
    const emptyTip = document.getElementById('emptyPlantTip');

    if (plants.length === 0) {
        emptyTip.classList.remove('hidden');
        plantList.innerHTML = '';
        return;
    }

    emptyTip.classList.add('hidden');
    plantList.innerHTML = '';

    // 植物位置映射
    const locationMap = {
        balcony: '阳台',
        study: '书房',
        office: '公司',
        livingRoom: '客厅',
        bedroom: '卧室'
    };

    plants.forEach(plant => {
        const nextWatering = getNextWateringText(plant.plantDate, plant.id);
        const imageUrls = plant.imageUrl ? plant.imageUrl.split(',') : [];
        const mainImage = imageUrls[0] || '';

        const plantCard = `
            <div class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="relative">
                    ${mainImage ? 
                        `<img src="${mainImage}" alt="${plant.nickname}" class="w-full h-48 object-cover">` : 
                        `<div class="w-full h-48 bg-green-100 flex items-center justify-center"><<i class="bi bi-leaf text-primary text-4xl"></</i></div>`
                    }
                    <button class="absolute top-3 right-3 bg-white/80 rounded-full p-1.5 text-gray-600 hover:text-primary transition-colors" onclick="showEditPlantModal('${plant.id}')">
                        <<i class="bi bi-pencil"></</i>
                    </button>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-dark">${plant.nickname}</h3>
                        <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${plant.species}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500 mb-3">
                        <<i class="bi bi-geo-alt mr-1"></</i>
                        <span>${locationMap[plant.location] || plant.location}</span>
                        <span class="mx-2">·</span>
                        <<i class="bi bi-calendar mr-1"></</i>
                        <span>种植于 ${formatDate(plant.plantDate)}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <<i class="bi bi-droplet text-primary mr-1"></</i>
                            <span class="text-sm text-gray-700">${nextWatering}</span>
                        </div>
                        <div class="flex gap-2">
                            <button class="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors" onclick="recordCare('${plant.id}', 'watering')">
                                浇水
                            </button>
                            <button class="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors" onclick="recordCare('${plant.id}', 'fertilizing')">
                                施肥
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        plantList.insertAdjacentHTML('beforeend', plantCard);
    });
}

// 记录养护操作
export function recordCare(plantId, activityType) {
    const plant = getPlantById(plantId);
    if (!plant) return;

    // 养护类型映射
    const activityMap = {
        watering: '浇水',
        fertilizing: '施肥',
        pruning: '剪枝',
        repotting: '换盆'
    };

    // 记录最后养护时间
    const key = `zhiwu_last${activityType.charAt(0).toUpperCase() + activityType.slice(1)}_${plantId}`;
    localStorage.setItem(key, new Date().toISOString().split('T')[0]);

    // 自动生成日记
    const diary = {
        plantId: plantId,
        content: `今日给${plant.nickname}进行了${activityMap[activityType]}操作`,
        activityType: activityType,
        weather: 'sunny', // 模拟天气
        temperatureRange: '6°C-15°C', // 模拟温度
        imageUrl: ''
    };
    saveDiary(diary);

    // 刷新植物列表
    renderPlantList();
    alert(`成功记录${plant.nickname}的${activityMap[activityType]}操作！`);
}

// 初始化添加植物表单
export function initAddPlantForm() {
    const addPlantForm = document.getElementById('addPlantForm');
    if (!addPlantForm) return;

    addPlantForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickname = document.getElementById('plantNickname').value.trim();
        const species = document.getElementById('plantSpecies').value.trim();
        const cultivationMethod = document.getElementById('cultivationMethod').value.trim();
        const location = document.getElementById('plantLocation').value.trim();
        const plantDate = document.getElementById('plantDate').value.trim();
        const imageUrls = document.getElementById('plantImageUrls').value.trim();

        // 表单验证
        if (!nickname) {
            alert('请输入植物昵称');
            return;
        }

        if (!species) {
            alert('请选择植物品种');
            return;
        }

        if (!cultivationMethod) {
            alert('请选择栽培方式');
            return;
        }

        if (!plantDate) {
            alert('请选择种植日期');
            return;
        }

        // 保存植物信息
        const plant = {
            nickname: nickname,
            species: species,
            cultivationMethod: cultivationMethod,
            location: location,
            plantDate: plantDate,
            imageUrl: imageUrls
        };
        savePlant(plant);

        // 关闭弹窗并刷新列表
        hideAddPlantModal();
        renderPlantList();
        alert('植物档案添加成功！');
    });

    // 初始化图片上传
    initPlantPhotoUploads();
}

// 初始化植物图片上传
function initPlantPhotoUploads() {
    const uploadElements = [
        { el: document.getElementById('photoUpload1'), idx: 0 },
        { el: document.getElementById('photoUpload2'), idx: 1 },
        { el: document.getElementById('photoUpload3'), idx: 2 }
    ];

    uploadElements.forEach(({ el, idx }) => {
        el?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (res) => {
                    el.innerHTML = `<img src="${res.target.result}" alt="植物照片" class="w-full h-full object-cover">`;
                    el.classList.add('border-primary');

                    // 更新图片URL存储
                    const currentUrls = document.getElementById('plantImageUrls').value.split(',').filter(Boolean);
                    currentUrls[idx] = res.target.result;
                    document.getElementById('plantImageUrls').value = currentUrls.join(',');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    });
}

// 初始化编辑植物表单
export function initEditPlantForm() {
    const editPlantForm = document.getElementById('editPlantForm');
    if (!editPlantForm) return;

    editPlantForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plantId = document.getElementById('editPlantId').value.trim();
        const nickname = document.getElementById('editPlantNickname').value.trim();
        const species = document.getElementById('editPlantSpecies').value.trim();
        const cultivationMethod = document.getElementById('editCultivationMethod').value.trim();
        const location = document.getElementById('editPlantLocation').value.trim();
        const plantDate = document.getElementById('editPlantDate').value.trim();
        const imageUrls = document.getElementById('editPlantImageUrls').value.trim();

        // 表单验证
        if (!nickname) {
            alert('请输入植物昵称');
            return;
        }

        if (!species) {
            alert('请选择植物品种');
            return;
        }

        if (!plantDate) {
            alert('请选择种植日期');
            return;
        }

        // 更新植物信息
        const updatedPlant = {
            id: plantId,
            nickname: nickname,
            species: species,
            cultivationMethod: cultivationMethod,
            location: location,
            plantDate: plantDate,
            imageUrl: imageUrls
        };
        updatePlant(updatedPlant);

        // 关闭弹窗并刷新列表
        hideEditPlantModal();
        renderPlantList();
        alert('植物信息修改成功！');
    });

    // 初始化编辑页图片上传
    initEditPlantPhotoUploads();
}

// 初始化编辑植物图片上传
function initEditPlantPhotoUploads() {
    const uploadElements = [
        { el: document.getElementById('editPhotoUpload1'), idx: 0 },
        { el: document.getElementById('editPhotoUpload2'), idx: 1 },
        { el: document.getElementById('editPhotoUpload3'), idx: 2 }
    ];

    uploadElements.forEach(({ el, idx }) => {
        el?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (res) => {
                    el.innerHTML = `<img src="${res.target.result}" alt="植物照片" class="w-full h-full object-cover">`;
                    el.classList.add('border-primary');

                    // 更新图片URL存储
                    const currentUrls = document.getElementById('editPlantImageUrls').value.split(',').filter(Boolean);
                    currentUrls[idx] = res.target.result;
                    document.getElementById('editPlantImageUrls').value = currentUrls.join(',');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    });
}

// 显示添加植物弹窗
window.showAddPlantModal = function() {
    const addPlantModal = document.getElementById('addPlantModal');
    addPlantModal.classList.remove('hidden');
    // 重置表单
    document.getElementById('addPlantForm').reset();
    document.getElementById('plantImageUrls').value = '';
    // 重置图片预览
    document.querySelectorAll('#photoUpload1, #photoUpload2, #photoUpload3').forEach(el => {
        el.innerHTML = '<<i class="bi bi-camera text-gray-400"></</i>';
        el.classList.remove('border-primary');
    });
};

// 隐藏添加植物弹窗
window.hideAddPlantModal = function() {
    const addPlantModal = document.getElementById('addPlantModal');
    addPlantModal.classList.add('hidden');
};

// 显示编辑植物弹窗
window.showEditPlantModal = function(plantId) {
    const plant = getPlantById(plantId);
    if (!plant) return;

    const editPlantModal = document.getElementById('editPlantModal');
    // 填充表单数据
    document.getElementById('editPlantId').value = plant.id;
    document.getElementById('editPlantNickname').value = plant.nickname;
    document.getElementById('editPlantSpecies').value = plant.species;
    document.getElementById('editCultivationMethod').value = plant.cultivationMethod;
    document.getElementById('editPlantLocation').value = plant.location;
    document.getElementById('editPlantDate').value = plant.plantDate;
    document.getElementById('editPlantImageUrls').value = plant.imageUrl || '';

    // 渲染图片预览
    const imageUrls = plant.imageUrl ? plant.imageUrl.split(',') : [];
    const uploadElements = [
        document.getElementById('editPhotoUpload1'),
        document.getElementById('editPhotoUpload2'),
        document.getElementById('editPhotoUpload3')
    ];
    uploadElements.forEach((el, idx) => {
        if (imageUrls[idx]) {
            el.innerHTML = `<img src="${imageUrls[idx]}" alt="植物照片" class="w-full h-full object-cover">`;
            el.classList.add('border-primary');
        } else {
            el.innerHTML = '<<i class="bi bi-camera text-gray-400"></</i>';
            el.classList.remove('border-primary');
        }
    });

    editPlantModal.classList.remove('hidden');
};

// 隐藏编辑植物弹窗
window.hideEditPlantModal = function() {
    const editPlantModal = document.getElementById('editPlantModal');
    editPlantModal.classList.add('hidden');
};

// 删除植物
window.deletePlant = function() {
    const plantId = document.getElementById('editPlantId').value.trim();
    if (!confirm('确定要删除这株植物吗？删除后相关日记也会同步删除，且无法恢复')) {
        return;
    }

    deletePlantById(plantId);
    hideEditPlantModal();
    renderPlantList();
    alert('植物删除成功！');
};

// 页面加载时初始化
window.addEventListener('load', () => {
    if (window.location.pathname.includes('my-plants.html')) {
        renderPlantList();
        initAddPlantForm();
        initEditPlantForm();
        // 初始化日期选择器默认值
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('plantDate').value = today;
        document.getElementById('editPlantDate').value = today;
    }
});
// 热门植物模拟数据
export const popularPlantsData = [
    {
        id: 'popular_1',
        name: '多肉',
        species: '多肉植物',
        description: '多肉植物是一类蓄水组织发达的植物，具有耐旱、易养护的特点。适合初学者种植。',
        careTips: '喜阳光，耐旱，浇水要少量多次，避免积水。适宜温度15-25°C。',
        wateringFrequency: '7-10天',
        lightRequirement: '充足阳光',
        difficulty: '简单',
        imageUrl: 'https://picsum.photos/seed/succulent/300/200'
    },
    {
        id: 'popular_2', 
        name: '绿萝',
        species: '天南星科',
        description: '绿萝是常见的室内观叶植物，具有净化空气的作用，生长迅速，适应性强。',
        careTips: '喜半阴环境，保持土壤湿润但不要积水。适宜温度18-28°C。',
        wateringFrequency: '5-7天',
        lightRequirement: '散射光',
        difficulty: '简单',
        imageUrl: 'https://picsum.photos/seed/pothos/300/200'
    },
    {
        id: 'popular_3',
        name: '玫瑰',
        species: '蔷薇科',
        description: '玫瑰是著名的观赏花卉，花色艳丽，花香浓郁，象征爱情与美丽。',
        careTips: '需要充足阳光，定期施肥，及时修剪残花。适宜温度15-25°C。',
        wateringFrequency: '3-5天', 
        lightRequirement: '全日照',
        difficulty: '中等',
        imageUrl: 'https://picsum.photos/seed/rose/300/200'
    },
    {
        id: 'popular_4',
        name: '龟背竹',
        species: '天南星科',
        description: '龟背竹叶形奇特，孔裂纹状，极像龟背，是常见的室内观叶植物。',
        careTips: '喜温暖湿润，避免强光直射。适宜温度18-25°C。',
        wateringFrequency: '5-7天',
        lightRequirement: '散射光',
        difficulty: '简单',
        imageUrl: 'https://picsum.photos/seed/monstera/300/200'
    }
];

// 显示热门植物详情
export function showPopularPlantDetail(plantId) {
    const plant = popularPlantsData.find(p => p.id === plantId);
    if (!plant) return;

    const modal = document.getElementById('popularPlantModal');
    const content = document.getElementById('popularPlantContent');
    
    content.innerHTML = `
        <div class="bg-white rounded-2xl overflow-hidden">
            <div class="relative">
                <img src="${plant.imageUrl}" alt="${plant.name}" class="w-full h-48 object-cover">
                <button class="absolute top-3 right-3 bg-white/80 rounded-full p-1.5 text-gray-600 hover:text-red-500 transition-colors" onclick="hidePopularPlantModal()">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-dark">${plant.name}</h3>
                    <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">${plant.difficulty}难度</span>
                </div>
                <p class="text-gray-600 mb-4">${plant.description}</p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm">
                        <i class="bi bi-droplet text-blue-500 mr-2"></i>
                        <span class="text-gray-700">浇水频率：${plant.wateringFrequency}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="bi bi-brightness-high text-yellow-500 mr-2"></i>
                        <span class="text-gray-700">光照需求：${plant.lightRequirement}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="bi bi-flower1 text-purple-500 mr-2"></i>
                        <span class="text-gray-700">品种：${plant.species}</span>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-3">
                    <h4 class="font-semibold text-gray-800 mb-2">养护要点</h4>
                    <p class="text-sm text-gray-600">${plant.careTips}</p>
                </div>
                
                <button class="w-full mt-4 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors" onclick="addPopularPlantToMyCollection('${plant.id}')">
                    添加到我的植物
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// 隐藏热门植物详情
export function hidePopularPlantModal() {
    const modal = document.getElementById('popularPlantModal');
    modal.classList.add('hidden');
}

// 将热门植物添加到我的收藏
export function addPopularPlantToMyCollection(plantId) {
    const popularPlant = popularPlantsData.find(p => p.id === plantId);
    if (!popularPlant) return;

    // 创建新植物对象
    const newPlant = {
        id: Date.now().toString(),
        nickname: popularPlant.name,
        species: popularPlant.species,
        cultivationMethod: '土培', // 默认值
        location: 'balcony', // 默认值
        plantDate: new Date().toISOString().split('T')[0],
        imageUrl: popularPlant.imageUrl
    };

    // 保存到我的植物
    savePlant(newPlant);
    
    // 关闭弹窗
    hidePopularPlantModal();
    
    // 刷新植物列表
    renderPlantList();
    
    alert(`成功将${popularPlant.name}添加到我的植物！`);
}

// 后端接口接入方法（示例）
export async function fetchPopularPlantsFromAPI() {
    try {
        // 实际项目中替换为真实API端点
        const response = await fetch('/api/popular-plants');
        if (response.ok) {
            const data = await response.json();
            return data;
        }
        throw new Error('获取热门植物数据失败');
    } catch (error) {
        console.error('获取热门植物数据失败:', error);
        // 失败时返回模拟数据
        return popularPlantsData;
    }
}

// 初始化热门植物（可切换数据源）
export async function initPopularPlants(useAPI = false) {
    let plants;
    if (useAPI) {
        plants = await fetchPopularPlantsFromAPI();
    } else {
        plants = popularPlantsData;
    }
    
    // 渲染热门植物列表
    renderPopularPlants(plants);
}

// 渲染热门植物列表
export function renderPopularPlants(plants) {
    const popularPlantsContainer = document.getElementById('popularPlants');
    if (!popularPlantsContainer) return;

    popularPlantsContainer.innerHTML = plants.map(plant => `
        <div class="plant-card cursor-pointer transform hover:scale-105 transition-transform" onclick="showPopularPlantDetail('${plant.id}')">
            <img src="${plant.imageUrl}" alt="${plant.name}" class="popular-plant-img">
            <div class="popular-plant-name">${plant.name}</div>
        </div>
    `).join('');
}

