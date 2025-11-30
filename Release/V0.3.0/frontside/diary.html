// 渲染日记列表（优先调用接口）
export async function renderDiaryList(plantId = '') {
    try {
        const res = await API.getDiaryList({ plantId: plantId || '' });
        const diaries = res.data.list || [];
        renderDiaryCards(diaries);
    } catch (error) {
        console.error('获取日记列表失败，使用本地数据', error);
        const diaries = plantId ? getDiaries(plantId) : getDiaries();
        renderDiaryCards(diaries);
    }
}

// 渲染日记卡片（通用渲染函数）
export function renderDiaryCards(diaries) {
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
        // 适配接口返回的字段（如果接口字段名不同，这里做映射）
        const diaryId = diary.id || diary.journalId;
        const plantId = diary.plantId;
        const plant = getPlantById(plantId) || { nickname: '未知植物', species: '未知品种' };
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
                            <button class="text-gray-400 hover:text-primary transition-colors" onclick="showEditDiaryModal('${diaryId}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="text-gray-400 hover:text-red-500 transition-colors" onclick="deleteDiaryConfirm('${diaryId}')">
                                <i class="bi bi-trash"></i>
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

// 初始化添加日记表单
export function initAddDiaryForm() {
    const addDiaryForm = document.getElementById('addDiaryForm');
    if (!addDiaryForm) return;

    addDiaryForm.addEventListener('submit', async (e) => {
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

        const diaryData = {
            plantId: plantId,
            content: content,
            activityType: activityType,
            weather: weather,
            temperatureRange: temperatureRange,
            imageUrl: imageUrls
        };

        try {
            // 优先调用接口添加日记
            await API.diaryManage(diaryData, 'POST');
            alert('日记添加成功！');
            hideAddDiaryModal();
            renderDiaryList();
            renderDiarySwipe(); // 刷新首页精选
        } catch (error) {
            // 接口失败，使用本地存储
            console.error('添加日记接口失败，使用本地存储', error);
            saveDiary(diaryData);
            alert('网络异常，已保存至本地！');
            hideAddDiaryModal();
            renderDiaryList();
            renderDiarySwipe();
        }
    });

    // 初始化日记图片上传
    initDiaryPhotoUploads();
}

// 初始化编辑日记表单
export function initEditDiaryForm() {
    const editDiaryForm = document.getElementById('editDiaryForm');
    if (!editDiaryForm) return;

    editDiaryForm.addEventListener('submit', async (e) => {
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

        const updatedDiary = {
            journalId: diaryId, // 适配接口字段
            plantId: plantId,
            content: content,
            activityType: activityType,
            weather: weather,
            temperatureRange: temperatureRange,
            imageUrl: imageUrls
        };

        try {
            // 优先调用接口修改日记
            await API.diaryManage(updatedDiary, 'PUT');
            alert('日记修改成功！');
            hideEditDiaryModal();
            renderDiaryList();
            renderDiarySwipe();
        } catch (error) {
            // 接口失败，使用本地存储
            console.error('修改日记接口失败，使用本地存储', error);
            updateDiary({ ...updatedDiary, id: diaryId }); // 适配本地字段
            alert('网络异常，已更新本地数据！');
            hideEditDiaryModal();
            renderDiaryList();
            renderDiarySwipe();
        }
    });
}

// 显示编辑日记弹窗（优先调用接口获取详情）
window.showEditDiaryModal = async function(diaryId) {
    try {
        // 优先调用接口获取日记详情
        const res = await API.getDiaryDetail({ journalId: diaryId });
        const diary = res.data || {};
        fillEditDiaryForm(diary, diaryId);
    } catch (error) {
        // 接口失败，使用本地数据
        console.error('获取日记详情失败，使用本地数据', error);
        const diary = getDiaryById(diaryId);
        if (!diary) return;
        fillEditDiaryForm(diary, diaryId);
    }
};

// 填充编辑日记表单
function fillEditDiaryForm(diary, diaryId) {
    const editDiaryModal = document.getElementById('editDiaryModal');
    // 填充表单数据（适配接口字段）
    document.getElementById('editDiaryId').value = diaryId;
    document.getElementById('editDiaryPlantId').value = diary.plantId || '';
    document.getElementById('editDiaryContent').value = diary.content || '';
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
                <i class="bi bi-x-xs"></i>
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
    addUploadBtn.innerHTML = '<i class="bi bi-camera text-gray-400"></i>';
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
                        <i class="bi bi-x-xs"></i>
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
}

// 删除日记确认（优先调用接口）
window.deleteDiaryConfirm = async function(diaryId) {
    if (!confirm('确定要删除这篇日记吗？删除后无法恢复')) {
        return;
    }

    try {
        // 优先调用接口删除日记
        await API.diaryManage({ journalId: diaryId }, 'DELETE');
        alert('日记删除成功！');
        renderDiaryList();
        renderDiarySwipe();
    } catch (error) {
        // 接口失败，使用本地删除
        console.error('删除日记接口失败，使用本地删除', error);
        deleteDiaryById(diaryId);
        alert('网络异常，已删除本地数据！');
        renderDiaryList();
        renderDiarySwipe();
    }
};

// 其他原有函数（initDiaryPhotoUploads、renderDiarySwipe等）保持不变，此处省略...