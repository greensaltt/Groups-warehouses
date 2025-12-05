# 文件名: tests/models/test_plant_model.py
import pytest
from tortoise.exceptions import DoesNotExist
from app.models.user import User
from app.models.plant import Plant
from datetime import date, timedelta

# 确保所有测试都是异步的
pytestmark = pytest.mark.asyncio

# C. 植物模型测试 (models/plant.py)

# MOD-P-001: 植物创建与关联 (Create)
# 依赖已更改的夹具名称
async def test_mod_p_001_plant_creation_and_association(db_setup_and_teardown, create_user):
    """MOD-P-001: 验证 Plant 记录成功创建并关联到 User。"""
    
    plant = await Plant.create(
        user=create_user,  # 直接传递 User 实例作为外键
        nickname="仙人掌",
        species="多肉",
        water_cycle=14,
        fertilize_cycle=90,
    )
    
    # 1. 验证记录创建成功
    assert plant.id is not None
    assert plant.nickname == "仙人掌"
    
    # 2. 验证外键指向正确的用户 ID
    fetched_plant = await Plant.get(id=plant.id).select_related("user")
    assert fetched_plant.user_id == create_user.id
    assert fetched_plant.user.username == create_user.username

# MOD-P-002: 关系查询 (正向)
async def test_mod_p_002_relationship_forward_query(db_setup_and_teardown, create_user):
    """MOD-P-002: 验证通过 Plant 实例查询其所属 User 实例。"""
    
    plant = await Plant.create(user=create_user, nickname="绿萝", species="藤本")
    
    # 1. 查询 (需要 select_related 才能直接访问 user 属性)
    fetched_plant = await Plant.get(id=plant.id).select_related("user")
    
    # 2. 验证返回正确的 User 实例
    assert fetched_plant.user.id == create_user.id
    assert fetched_plant.user.email == create_user.email

# MOD-P-003: 关系查询 (反向)
async def test_mod_p_003_relationship_reverse_query(db_setup_and_teardown, create_user):
    """MOD-P-003: 验证通过 User 实例反向查询其拥有的植物列表。"""
    
    # 1. 为用户创建多个植物
    await Plant.create(user=create_user, nickname="薄荷", species="香草")
    await Plant.create(user=create_user, nickname="茉莉", species="花卉")
    
    # 2. 反向查询 (使用 related_name="plants")
    user_with_plants = await User.get(id=create_user.id).prefetch_related("plants")
    
    # 3. 验证返回列表数量
    plants_list = user_with_plants.plants
    assert len(plants_list) == 2
    
    # 4. 验证植物昵称在列表中
    nicknames = {p.nickname for p in plants_list}
    assert "薄荷" in nicknames
    assert "茉莉" in nicknames

# MOD-P-004: 日期/周期字段验证
async def test_mod_p_004_date_and_cycle_fields(db_setup_and_teardown, create_user):
    """MOD-P-004: 验证 last_watered/fertilized 的日期类型和周期默认值。"""
    
    today = date.today()
    
    # 创建包含日期和自定义周期值的植物
    plant = await Plant.create(
        user=create_user,
        nickname="多肉宝宝",
        species="多肉",
        last_watered=today,
        water_cycle=21,
        last_fertilized=None, # 测试 Optional[DateField] 为 None
    )
    
    # 验证读出数据
    fetched_plant = await Plant.get(id=plant.id)
    
    # 1. 验证 last_watered 字段类型和值
    assert isinstance(fetched_plant.last_watered, date)
    assert fetched_plant.last_watered == today
    
    # 2. 验证周期字段
    assert fetched_plant.water_cycle == 21
    assert fetched_plant.fertilize_cycle == 30 # 验证默认值
    
    # 3. 验证 Optional 字段为 None
    assert fetched_plant.last_fertilized is None

# MOD-P-005: 级联删除 (CASCADE)
# 依赖已更改的夹具名称
async def test_mod_p_005_on_delete_cascade(db_setup_and_teardown): 
    """MOD-P-005: 验证删除用户时，关联的植物是否被级联删除。"""
    
    # 1. 确认数据库初始为空 (现在由 function 范围的 db_setup_and_teardown 保证)
    assert await Plant.all().count() == 0
    
    # 2. 创建用户 U2
    user2 = await User.create(username="temp_user", email="temp@test.com", password="pwd")
    
    # 3. 为用户2创建植物 P1 和 P2
    plant1 = await Plant.create(user=user2, nickname="P1", species="S1")
    plant2 = await Plant.create(user=user2, nickname="P2", species="S2")
    
    # 记录植物 ID
    p1_id = plant1.id
    
    # 4. 确认植物总数是 2
    assert await Plant.all().count() == 2 
    
    # 5. 删除用户 U2
    await user2.delete()
    
    # 6. 预期结果: 再次查询植物 P1 应该失败 (已被级联删除)
    with pytest.raises(DoesNotExist):
        await Plant.get(id=p1_id)
        
    # 7. 验证数据库中植物数量清零
    assert await Plant.all().count() == 0