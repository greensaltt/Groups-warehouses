from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# --- 新增：用于返回植物详细信息的模型 ---
class PlantOut(BaseModel):
    id: int
    nickname: str
    species: str
    icon: str = "🌱"
    water_cycle: int
    fertilize_cycle: int
    last_watered: Optional[date] = None
    last_fertilized: Optional[date] = None

    # 允许 ORM 模型直接转换为 Pydantic 模型
    class Config:
        from_attributes = True

# 单个提醒项结构
class ReminderItem(BaseModel):
    plant_id: int
    plant_name: str
    type: str  # 'water' or 'fertilize'
    message: str     # <--- 标准标题，如 "绿萝明天需要浇水"
    ai_message: str  # <--- 新增字段：AI 生成的趣味文案
    days_overdue: int
    urgency: str     # 'high', 'medium', 'low'
    due_date: str
    icon: str

# 响应数据结构 (对应 BaseResponse 中的 data)
class ReminderListResponse(BaseModel):
    reminders: List[ReminderItem]
    total: int

# 简单的操作响应 (浇水/施肥成功后的返回)
class PlantOperationResponse(BaseModel):
    plant_id: int
    operation: str
    operated_at: str

class PlantCreate(BaseModel):
    nickname: str
    species: str
    water_cycle: int = 7
    fertilize_cycle: int = 30
    last_watered: Optional[str] = None # 接收字符串 "2023-10-01"
    last_fertilized: Optional[str] = None