// 渲染日记列表
export function renderDiaryList(plantId = '') {
    const diaries = plantId ? getDiaries(plantId) : getDiaries();
    const diaryList = document.getElementById('diaryList');
    const emptyTip = document.getElementById('emptyDiaryTip');

    if (diaries.length === 0) {
        emptyTip.classList.remove('hidden');
        diaryList.innerHTML = '';
        return;
    }

    emptyTip.classList.add('hidden');
    diaryList.innerHTML = '';

    // 天气状态映射
    const weatherMap = {
        sunny: '晴',
        cloudy: '多云',
        rainy: '雨',
        windy: '风',
        snowy: '雪'
    };

    // 养护类型映射
    const activityMap = {
        watering: '浇水',
        fertilizing: '施肥',
        pruning: '剪枝',
        repotting: '换盆',
        '': '日常记录'
    };

    diaries.forEach(diary => {
        const plant = getPlantById(diary.plantId) || { nickname: '未知植物', species: '未知品种' };
        const imageUrls = diary.imageUrl ? diary.imageUrl.split(',') : [];
        const mainImage = imageUrls[0] || '';

        const diaryCard = `
            <div class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow mb-4">
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-lg font-semibold text-dark">${plant.nickname} - ${activityMap[diary.activityType]}</h3>
                            <p class="text-sm text-gray-500">
                                <span>${diary.date} · ${weatherMap[diary.weather] || '未知天气'}</span>
                                <span class="mx-2">·</span>
                                <span>${diary.temperatureRange || '暂无温度数据'}</span>
                            </p>
                        </div>
                        <div class="flex gap-1">
                            <button class="text-gray-400 hover:text-primary transition-colors" onclick="showEditDiaryModal('${diary.id}')">
                                <<i class="bi bi-pencil"></</i>
                            </button>
                            <button class="text-gray-400 hover:text-red-500 transition-colors" onclick="deleteDiaryConfirm('${diary.id}')">
                                <<i class="bi bi-trash"></</i>
                            </button>
                        </div>
                    </div>
                    ${mainImage ? 
                        `<div class="w-full h-48 rounded-lg overflow-hidden my-3">
                            <img src="${mainImage}" alt="日记照片" class="w-full h-full object-cover">
                        </div>` : ''
                    }
                    <p class="text-gray-700 text-sm">${diary.content}</p>
                </div>
            </div>
        `;

        diaryList.insertAdjacentHTML('beforeend', diaryCard);
    });
}

// 渲染首页日记精选
export function renderDiarySwipe() {
    const diaries = getDiaries();
    const diarySwipe = document.getElementById('diarySwipe')?.firstElementChild;
    if (!diarySwipe) return;

    if (diaries.length === 0) {
        diarySwipe.innerHTML = `
            <div class="w-48 bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <<i class="bi bi-journal-plus text-gray-300 text-3xl mb-2"></</i>
                <p class="text-sm text-gray-500">还没有日记哦~</p>
                <a href="diary.html#addDiary" class="text-xs text-primary hover:underline mt-1">立即记录</a>
            </div>
        `;
        return;
    }

    // 取最新3篇日记
    const latestDiaries = diaries.slice(0, 3);
    diarySwipe.innerHTML = '';

    latestDiaries.forEach(diary => {
        const plant = getPlantById(diary.plantId) || { nickname: '未知植物' };
        const imageUrls = diary.imageUrl ? diary.imageUrl.split(',') : [];
        const mainImage = imageUrls[0] || '';

        const swipeCard = `
            <div class="w-48 bg-white rounded-xl shadow-sm p-3 flex flex-col hover:shadow-md transition-shadow">
                <div class="w-full h-32 rounded-lg overflow-hidden mb-2">
                    ${mainImage ? 
                        `<img src="${mainImage}" alt="日记照片" class="w-full h-full object-cover">` : 
                        `<div class="w-full h-full bg-gray-100 flex items-center justify-center"><<i class="bi bi-image text-gray-300"></</i></div>`
                    }
                </div>
                <h3 class="text-sm font-medium text-dark truncate">${plant.nickname}</h3>
                <p class="text-xs text-gray-500 mt-1 truncate">${diary.date} · ${diary.activityType ? '浇水' : '日常记录'}</p>
                <p class="text-xs text-gray-600 mt-1 line-clamp-2">${diary.content}</p>
            </div>
        `;

        diarySwipe.insertAdjacentHTML('beforeend', swipeCard);
    });
}

// 初始化添加日记表单
export function initAddDiaryForm() {
    const addDiaryForm = document.getElementById('addDiaryForm');
    if (!addDiaryForm) return;

    // 加载植物下拉选项
    const plantSelect = document.getElementById('diaryPlantId');
    const plants = getPlants();
    plants.forEach(plant => {
        const option = document.createElement('option');
        option.value = plant.id;
        option.textContent = plant.nickname;
        plantSelect.appendChild(option);
    });

    addDiaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plantId = document.getElementById('diaryPlantId').value.trim();
        const content = document.getElementById('diaryContent').value.trim();
        const activityType = document.getElementById('diaryActivityType').value.trim();
        const weather = document.getElementById('diaryWeather').value.trim();
        const temperatureRange = document.getElementById('diaryTemperature').value.trim();
        const imageUrls = document.getElementById('diaryImageUrls').value.trim();

        // 表单验证
        if (!plantId) {
            alert('请选择植物');
            return;
        }

        if (!content || content.length > 500) {
            alert('日记内容不能为空，且不能超过500字');
            return;
        }

        // 保存日记
        const diary = {
            plantId: plantId,
            content: content,
            activityType: activityType,
            weather: weather,
            temperatureRange: temperatureRange,
            imageUrl: imageUrls
        };
        saveDiary(diary);

        // 关闭弹窗并刷新列表
        hideAddDiaryModal();
        renderDiaryList();
        renderDiarySwipe(); // 刷新首页精选
        alert('日记添加成功！');
    });

    // 初始化日记图片上传
    initDiaryPhotoUploads();
}

// 初始化日记图片上传
function initDiaryPhotoUploads() {
    const uploadContainer = document.getElementById('diaryPhotoContainer');
    const imageUrlsInput = document.getElementById('diaryImageUrls');
    let imageUrls = [];

    // 添加上传按钮
    const addUploadBtn = document.createElement('div');
    addUploadBtn.className = 'w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors cursor-pointer';
    addUploadBtn.innerHTML = '<<i class="bi bi-camera text-gray-400"></</i>';
    addUploadBtn.id = 'diaryPhotoUpload';
    uploadContainer.appendChild(addUploadBtn);

    // 上传逻辑
    addUploadBtn.addEventListener('click', () => {
        if (imageUrls.length >= 9) {
            alert('最多只能上传9张图片');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (res) => {
                // 添加图片预览
                const preview = document.createElement('div');
                preview.className = 'w-20 h-20 relative rounded-lg overflow-hidden border border-primary';
                preview.innerHTML = `
                    <img src="${res.target.result}" alt="日记照片" class="w-full h-full object-cover">
                    <button class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors" data-url="${res.target.result}">
                        <<i class="bi bi-x-xs"></</i>
                    </button>
                `;
                uploadContainer.insertBefore(preview, addUploadBtn);

                // 存储图片URL
                imageUrls.push(res.target.result);
                imageUrlsInput.value = imageUrls.join(',');

                // 删除图片逻辑
                preview.querySelector('button').addEventListener('click', (e) => {
                    const url = e.currentTarget.dataset.url;
                    imageUrls = imageUrls.filter(u => u !== url);
                    imageUrlsInput.value = imageUrls.join(',');
                    preview.remove();
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    });
}

// 初始化编辑日记表单
export function initEditDiaryForm() {
    const editDiaryForm = document.getElementById('editDiaryForm');
    if (!editDiaryForm) return;

    // 加载植物下拉选项
    const plantSelect = document.getElementById('editDiaryPlantId');
    const plants = getPlants();
    plants.forEach(plant => {
        const option = document.createElement('option');
        option.value = plant.id;
        option.textContent = plant.nickname;
        plantSelect.appendChild(option);
    });

    editDiaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const diaryId = document.getElementById('editDiaryId').value.trim();
        const plantId = document.getElementById('editDiaryPlantId').value.trim();
        const content = document.getElementById('editDiaryContent').value.trim();
        const activityType = document.getElementById('editDiaryActivityType').value.trim();
        const weather = document.getElementById('editDiaryWeather').value.trim();
        const temperatureRange = document.getElementById('editDiaryTemperature').value.trim();
        const imageUrls = document.getElementById('editDiaryImageUrls').value.trim();

        // 表单验证
        if (!plantId) {
            alert('请选择植物');
            return;
        }

        if (!content || content.length > 500) {
            alert('日记内容不能为空，且不能超过500字');
            return;
        }

        // 更新日记
        const updatedDiary = {
            id: diaryId,
            plantId: plantId,
            content: content,
            activityType: activityType,
            weather: weather,
            temperatureRange: temperatureRange,
            imageUrl: imageUrls
        };
        updateDiary(updatedDiary);

        // 关闭弹窗并刷新列表
        hideEditDiaryModal();
        renderDiaryList();
        renderDiarySwipe();
        alert('日记修改成功！');
    });
}

// 显示添加日记弹窗
window.showAddDiaryModal = function() {
    const addDiaryModal = document.getElementById('addDiaryModal');
    addDiaryModal.classList.remove('hidden');
    // 重置表单
    document.getElementById('addDiaryForm').reset();
    document.getElementById('diaryImageUrls').value = '';
    // 清空图片预览
    const uploadContainer = document.getElementById('diaryPhotoContainer');
    uploadContainer.innerHTML = '';
    initDiaryPhotoUploads(); // 重新初始化上传按钮
};

// 隐藏添加日记弹窗
window.hideAddDiaryModal = function() {
    const addDiaryModal = document.getElementById('addDiaryModal');
    addDiaryModal.classList.add('hidden');
};

// 显示编辑日记弹窗
window.showEditDiaryModal = function(diaryId) {
    const diary = getDiaryById(diaryId);
    if (!diary) return;

    const editDiaryModal = document.getElementById('editDiaryModal');
    // 填充表单数据
    document.getElementById('editDiaryId').value = diary.id;
    document.getElementById('editDiaryPlantId').value = diary.plantId;
    document.getElementById('editDiaryContent').value = diary.content;
    document.getElementById('editDiaryActivityType').value = diary.activityType || '';
    document.getElementById('editDiaryWeather').value = diary.weather || 'sunny';
    document.getElementById('editDiaryTemperature').value = diary.temperatureRange || '';
    document.getElementById('editDiaryImageUrls').value = diary.imageUrl || '';

    // 渲染图片预览
    const uploadContainer = document.getElementById('editDiaryPhotoContainer');
    uploadContainer.innerHTML = '';
    const imageUrls = diary.imageUrl ? diary.imageUrl.split(',') : [];
    imageUrls.forEach(url => {
        const preview = document.createElement('div');
        preview.className = 'w-20 h-20 relative rounded-lg overflow-hidden border border-primary';
        preview.innerHTML = `
            <img src="${url}" alt="日记照片" class="w-full h-full object-cover">
            <button class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors" data-url="${url}">
                <<i class="bi bi-x-xs"></</i>
            </button>
        `;
        uploadContainer.appendChild(preview);

        // 删除图片逻辑
        preview.querySelector('button').addEventListener('click', (e) => {
            const currentUrls = document.getElementById('editDiaryImageUrls').value.split(',').filter(Boolean);
            const newUrls = currentUrls.filter(u => u !== url);
            document.getElementById('editDiaryImageUrls').value = newUrls.join(',');
            preview.remove();
        });
    });

    // 添加上传按钮
    const addUploadBtn = document.createElement('div');
    addUploadBtn.className = 'w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors cursor-pointer';
    addUploadBtn.innerHTML = '<<i class="bi bi-camera text-gray-400"></</i>';
    addUploadBtn.addEventListener('click', () => {
        if (imageUrls.length >= 9) {
            alert('最多只能上传9张图片');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (res) => {
                const preview = document.createElement('div');
                preview.className = 'w-20 h-20 relative rounded-lg overflow-hidden border border-primary';
                preview.innerHTML = `
                    <img src="${res.target.result}" alt="日记照片" class="w-full h-full object-cover">
                    <button class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors" data-url="${res.target.result}">
                        <<i class="bi bi-x-xs"></</i>
                    </button>
                `;
                uploadContainer.insertBefore(preview, addUploadBtn);

                const currentUrls = document.getElementById('editDiaryImageUrls').value.split(',').filter(Boolean);
                currentUrls.push(res.target.result);
                document.getElementById('editDiaryImageUrls').value = currentUrls.join(',');

                preview.querySelector('button').addEventListener('click', (e) => {
                    const url = e.currentTarget.dataset.url;
                    const newUrls = currentUrls.filter(u => u !== url);
                    document.getElementById('editDiaryImageUrls').value = newUrls.join(',');
                    preview.remove();
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    });
    uploadContainer.appendChild(addUploadBtn);

    editDiaryModal.classList.remove('hidden');
};

// 隐藏编辑日记弹窗
window.hideEditDiaryModal = function() {
    const editDiaryModal = document.getElementById('editDiaryModal');
    editDiaryModal.classList.add('hidden');
};

// 删除日记确认
window.deleteDiaryConfirm = function(diaryId) {
    if (!confirm('确定要删除这篇日记吗？删除后无法恢复')) {
        return;
    }

    deleteDiaryById(diaryId);
    renderDiaryList();
    renderDiarySwipe();
    alert('日记删除成功！');
};

// 页面加载时初始化
window.addEventListener('load', () => {
    if (window.location.pathname.includes('diary.html')) {
        renderDiaryList();
        initAddDiaryForm();
        initEditDiaryForm();
        // 监听植物筛选
        const plantFilter = document.getElementById('diaryPlantFilter');
        plantFilter?.addEventListener('change', (e) => {
            renderDiaryList(e.target.value);
        });
    } else if (window.location.pathname.includes('index.html')) {
        renderDiarySwipe();
    }
});