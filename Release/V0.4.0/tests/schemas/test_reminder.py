# 文件名: tests/schemas/test_reminder_schemas.py
import pytest
from pydantic import ValidationError
from datetime import date
# 假设你的 schema 文件在 app/schemas 目录下
from app.schemas.reminder import PlantOut, PlantCreate, ReminderItem

# SCH-R-001: 测试 PlantOut 模型从 ORM 属性加载有效数据
def test_sch_r_001_plant_out_valid():
    """SCH-R-001: 测试 PlantOut 模型接受所有必需和可选字段，并支持 from_attributes。"""
    # 模拟从数据库取出的 ORM 对象属性
    class MockPlant:
        id = 1
        nickname = "小可爱"
        species = "多肉"
        icon = "🌵"
        water_cycle = 14
        fertilize_cycle = 90
        last_watered = date(2025, 12, 1)
        last_fertilized = None # 可选字段为 None

    plant_out = PlantOut.model_validate(MockPlant()) # 使用 model_validate 模拟 from_attributes
    
    assert plant_out.id == 1
    assert plant_out.nickname == "小可爱"
    assert plant_out.last_watered == date(2025, 12, 1)
    assert plant_out.last_fertilized is None

# SCH-R-002: 测试 ReminderItem 模型接受有效数据
def test_sch_r_002_reminder_item_valid():
    """SCH-R-002: 测试 ReminderItem 模型接受所有有效字段。"""
    data = {
        "plant_id": 2,
        "plant_name": "薄荷",
        "type": "water",
        "message": "是时候浇水了",
        "days_overdue": 3,
        "urgency": "high",
        "due_date": "2025-11-28",
        "icon": "💧"
    }
    reminder_item = ReminderItem(**data)
    assert reminder_item.plant_id == 2
    assert reminder_item.type == "water"
    assert reminder_item.urgency == "high"
    assert reminder_item.days_overdue == 3

# SCH-R-003: 测试 PlantCreate 模型处理日期字符串（非日期对象）
def test_sch_r_003_plant_create_dates_as_strings():
    """SCH-R-003: 测试 PlantCreate 模型接受 'last_watered' 和 'last_fertilized' 字段为字符串。"""
    data = {
        "nickname": "富贵竹",
        "species": "水生植物",
        "water_cycle": 7,
        "fertilize_cycle": 30,
        "last_watered": "2025-11-20", # 传入字符串
        "last_fertilized": None
    }
    plant_create = PlantCreate(**data)
    assert plant_create.last_watered == "2025-11-20"
    assert plant_create.last_fertilized is None
    # 检查类型是否为 str，确认没有被 pydantic 自动转换为 date
    assert isinstance(plant_create.last_watered, str)

# SCH-R-004: 测试 PlantCreate 缺少必需字段时的验证失败
def test_sch_r_004_plant_create_missing_required_fields():
    """SCH-R-004: 测试 PlantCreate 缺少必需字段 'nickname' 或 'species' 时抛出 ValidationError。"""
    data = {
        "species": "兰花", # 缺少 nickname
        "water_cycle": 10
    }
    with pytest.raises(ValidationError) as excinfo_nickname:
        PlantCreate(**data)
    
    assert "nickname" in str(excinfo_nickname.value)

    data_missing_species = {
        "nickname": "我的兰花" # 缺少 species
    }
    with pytest.raises(ValidationError) as excinfo_species:
        PlantCreate(**data_missing_species)
    
    assert "species" in str(excinfo_species.value)