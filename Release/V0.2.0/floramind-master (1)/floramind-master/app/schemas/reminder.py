from pydantic import BaseModel
from typing import List, Optional

# 单个提醒项的结构
class ReminderItem(BaseModel):
    plant_id: int
    plant_name: str
    type: str  # 'water' 或 'fertilize'
    message: str
    days_overdue: int
    urgency: str # 'high', 'medium', 'low'
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