import pytest
from fastapi.testclient import TestClient
from app.models.plant import Plant
from datetime import date, timedelta # 新增导入 timedelta

# ----------------------------------------------------------------------
# 辅助数据
# ----------------------------------------------------------------------

VALID_PLANT_DATA = {
    "name": "多肉-玉露",
    "species": "Haworthia cooperi",
    "water_cycle_days": 14,
    "fertilize_cycle_days": 60
}

# ----------------------------------------------------------------------
# 测试用例 C. 植物管理与提醒 (reminder.py)
# ----------------------------------------------------------------------

# API-R-001: 植物创建成功 (保留原有逻辑)
@pytest.mark.asyncio
async def test_api_r_001_plant_create_success(authenticated_client: TestClient, db_setup_and_teardown):
    """
    测试 API-R-001: 植物创建成功。
    """
    # 为了简化，我们假设用户ID为 1 
    user_id = 1 
    
    # 1. 记录初始植物数量
    initial_plant_count = await Plant.filter(user_id=user_id).count()

    # 2. 发送创建请求
    response = authenticated_client.post("/api/v1/plants", json=VALID_PLANT_DATA)
    
    # 3. 断言响应
    assert response.status_code == 200 
    response_data = response.json()
    assert response_data["code"] == 200
    assert response_data["msg"] == "植物添加成功"
    
    # 关键修复点：使用 "plant_id" 进行断言，以匹配 API 实际返回结构
    assert "plant_id" in response_data["data"]
    
    # 4. 验证数据库
    final_plant_count = await Plant.filter(user_id=user_id).count()
    assert final_plant_count == initial_plant_count + 1
    
    new_plant_id = response_data["data"]["plant_id"]
    new_plant = await Plant.get_or_none(id=new_plant_id)
    assert new_plant is not None
    assert new_plant.name == VALID_PLANT_DATA["name"]
    # 验证默认的 last_watered 是否是今天
    assert new_plant.last_watered == date.today()

# API-R-002: 访问受保护资源 (无 Token)
def test_api_r_002_unauthorized_access(client: TestClient):
    """
    测试未登录用户尝试访问任何 /plants 或 /reminders 接口时返回 401。
    """
    # 尝试访问获取提醒列表的接口
    response = client.get("/api/v1/reminders") 
    assert response.status_code == 401
    
    # 尝试访问植物创建接口
    response = client.post("/api/v1/plants", json=VALID_PLANT_DATA)
    assert response.status_code == 401
    
    # 尝试访问打卡接口 (假设 plant_id=1)
    response = client.post("/api/v1/plants/1/water")
    assert response.status_code == 401
    
    # 尝试访问打卡接口 (假设 plant_id=1)
    response = client.post("/api/v1/plants/1/fertilize")
    assert response.status_code == 401

# API-R-003: 获取提醒列表
@pytest.mark.asyncio
async def test_api_r_003_list_reminders(authenticated_client: TestClient, db_setup_and_teardown):
    """
    测试 API-R-003: 获取提醒列表，验证提醒数量和过期天数计算。
    """
    # 1. 初始状态：应该没有提醒 (因为没有植物)
    response = authenticated_client.get("/api/v1/reminders")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["data"]["total"] == 0
    
    # 2. 创建一个新植物
    plant_data = {
        "name": "测试植物2",
        "species": "Monster",
        "water_cycle_days": 7, 
        "fertilize_cycle_days": 7 
    }
    create_response = authenticated_client.post("/api/v1/plants", json=plant_data)
    new_plant_id = create_response.json()["data"]["plant_id"]
    
    # 3. 强制让植物 overdue (设置 last_watered/last_fertilized 为 10 天前)
    overdue_date = date.today() - timedelta(days=10)
    await Plant.filter(id=new_plant_id).update(
        last_watered=overdue_date, 
        last_fertilized=overdue_date
    )
    
    # 4. 再次获取提醒列表
    response = authenticated_client.get("/api/v1/reminders")
    assert response.status_code == 200
    response_data = response.json()
    
    # 5. 断言提醒列表 - 应该有 2 个提醒 (浇水, 施肥)
    assert response_data["data"]["total"] == 2
    reminders = response_data["data"]["reminders"]
    
    water_reminder = next(r for r in reminders if r["operation"] == "water")
    fertilize_reminder = next(r for r in reminders if r["operation"] == "fertilize")
    
    # days_overdue = 10 days passed - 7 days cycle = 3 days overdue
    assert water_reminder["days_overdue"] == 3 
    assert water_reminder["urgency"] == "medium" # 3/7 ~= 0.43 < 0.5，应为 medium
    assert fertilize_reminder["days_overdue"] == 3
    assert fertilize_reminder["urgency"] == "medium"

# API-R-004: 记录浇水操作
@pytest.mark.asyncio
async def test_api_r_004_record_watering(authenticated_client: TestClient, db_setup_and_teardown):
    """
    测试 API-R-004: 记录浇水操作并验证数据库更新和错误处理。
    """
    # 1. 创建一个植物
    plant_data = {
        "name": "待浇水植物",
        "species": "Cactus",
        "water_cycle_days": 30,
        "fertilize_cycle_days": 90
    }
    create_response = authenticated_client.post("/api/v1/plants", json=plant_data)
    plant_id = create_response.json()["data"]["plant_id"]
    
    # 2. 强制设置 last_watered 为昨天
    yesterday = date.today() - timedelta(days=1)
    await Plant.filter(id=plant_id).update(last_watered=yesterday)
    
    # 3. 发送浇水打卡请求 (成功)
    response = authenticated_client.post(f"/api/v1/plants/{plant_id}/water")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["code"] == 200
    assert response_data["msg"] == "浇水打卡成功"
    
    # 4. 验证数据库中的 last_watered 字段是否更新为今天
    updated_plant = await Plant.get(id=plant_id)
    assert updated_plant.last_watered == date.today()
    
    # 5. 验证 API-R-006: 对不存在的植物操作 (404)
    response = authenticated_client.post("/api/v1/plants/99999/water")
    assert response.status_code == 404
    assert response.json()["msg"] == "植物不存在或无权操作"

# API-R-005: 记录施肥操作
@pytest.mark.asyncio
async def test_api_r_005_record_fertilizing(authenticated_client: TestClient, db_setup_and_teardown):
    """
    测试 API-R-005: 记录施肥操作并验证数据库更新和错误处理。
    """
    # 1. 创建一个植物
    plant_data = {
        "name": "待施肥植物",
        "species": "Rose",
        "water_cycle_days": 7,
        "fertilize_cycle_days": 30
    }
    create_response = authenticated_client.post("/api/v1/plants", json=plant_data)
    plant_id = create_response.json()["data"]["plant_id"]
    
    # 2. 强制设置 last_fertilized 为昨天
    yesterday = date.today() - timedelta(days=1)
    await Plant.filter(id=plant_id).update(last_fertilized=yesterday)
    
    # 3. 发送施肥打卡请求 (成功)
    response = authenticated_client.post(f"/api/v1/plants/{plant_id}/fertilize")
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["code"] == 200
    assert response_data["msg"] == "施肥打卡成功"
    
    # 4. 验证数据库中的 last_fertilized 字段是否更新为今天
    updated_plant = await Plant.get(id=plant_id)
    assert updated_plant.last_fertilized == date.today()
    
    # 5. 验证 API-R-006: 对不存在的植物操作 (404)
    response = authenticated_client.post("/api/v1/plants/99999/fertilize")
    assert response.status_code == 404
    assert response.json()["msg"] == "植物不存在或无权操作"