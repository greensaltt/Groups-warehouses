from fastapi import APIRouter, HTTPException, Depends
from datetime import date, timedelta, datetime
from typing import List, Optional

# 导入依赖
from app.api.deps import get_current_user

# 导入模型和Schema
from app.models.plant import Plant
from app.models.user import User
from app.schemas.user import BaseResponse
from app.schemas.reminder import ReminderItem, ReminderListResponse, PlantOperationResponse, PlantCreate
from pydantic import BaseModel  # 补充导入 BaseModel

router = APIRouter()


# --- 辅助函数 ---

def calculate_days_overdue(last_date: Optional[object], cycle: int) -> int:
    """
    计算逾期天数：(今天 - 上次日期) - 周期
    修复：增加了类型兼容处理，同时支持 date 和 datetime
    """
    if not last_date:
        return 999

    # 【修复核心】如果数据库返回的是 datetime 对象，强制转换为 date 对象
    if isinstance(last_date, datetime):
        last_date_obj = last_date.date()
    elif isinstance(last_date, date):
        last_date_obj = last_date
    else:
        # 防御性编程：如果是字符串或其他类型，尝试解析或忽略
        return 999

    today = date.today()
    # 此时 today 和 last_date_obj 都是 date 类型，可以安全相减
    days_passed = (today - last_date_obj).days
    return days_passed - cycle


def get_urgency_level(days_overdue: int, cycle: int) -> str:
    """判断紧急程度"""
    if days_overdue < 0:
        return "low"  # 还没到期

    safe_cycle = cycle if cycle > 0 else 1
    ratio = days_overdue / safe_cycle

    if ratio > 0.5: return "high"
    if ratio > 0.2: return "medium"
    return "low"


def get_icon(operation_type: str, urgency: str) -> str:
    base_icons = {"water": "💧", "fertilize": "🌱"}
    base = base_icons.get(operation_type, "🍃")

    if urgency == "high": return f"{base}🔥"
    if urgency == "medium": return f"{base}⏰"
    return base


# --- 路由定义 ---

@router.post("/plants", response_model=BaseResponse)
async def create_plant(
        plant_in: PlantCreate,
        current_user: User = Depends(get_current_user)
):
    """
    添加植物 (用于测试数据)
    """
    # 处理日期字符串转对象
    w_date = None
    if plant_in.last_watered:
        try:
            w_date = datetime.strptime(plant_in.last_watered, "%Y-%m-%d").date()
        except ValueError:
            pass  # 或者抛出错误

    f_date = None
    if plant_in.last_fertilized:
        try:
            f_date = datetime.strptime(plant_in.last_fertilized, "%Y-%m-%d").date()
        except ValueError:
            pass

    plant = await Plant.create(
        user=current_user,
        nickname=plant_in.nickname,
        species=plant_in.species,
        water_cycle=plant_in.water_cycle,
        fertilize_cycle=plant_in.fertilize_cycle,
        last_watered=w_date,
        last_fertilized=f_date
    )

    return BaseResponse(
        msg="植物添加成功",
        data={"plant_id": plant.id, "nickname": plant.nickname}
    )


@router.get("/reminders", response_model=BaseResponse)
async def get_reminders(
        current_user: User = Depends(get_current_user)
):
    """
    获取智能提醒列表 (从数据库实时计算)
    """
    reminders: List[ReminderItem] = []

    # 1. 查询当前用户未删除的植物
    plants = await Plant.filter(user=current_user, is_deleted=False).all()

    today = date.today()

    for plant in plants:
        # --- 检查浇水 ---
        if plant.water_cycle > 0:
            overdue = calculate_days_overdue(plant.last_watered, plant.water_cycle)

            if overdue >= -1:
                urgency = get_urgency_level(max(0, overdue), plant.water_cycle)

                # 计算预计日期 (需要处理 last_watered 可能是 datetime 的情况)
                last_w = plant.last_watered
                if isinstance(last_w, datetime):
                    last_w = last_w.date()

                # 如果为空，默认设为一个很久以前的时间确保计算逻辑不崩，或者设为今天
                base_date = last_w or today
                due_date_obj = base_date + timedelta(days=plant.water_cycle)

                msg = f"{plant.nickname}明天需要浇水" if overdue == -1 else f"{plant.nickname}已逾期{overdue}天未浇水"

                reminders.append(ReminderItem(
                    plant_id=plant.id,
                    plant_name=plant.nickname,
                    type="water",
                    message=msg,
                    days_overdue=max(0, overdue),
                    urgency=urgency,
                    due_date=due_date_obj.strftime("%Y-%m-%d"),
                    icon=get_icon("water", urgency)
                ))

        # --- 检查施肥 ---
        if plant.fertilize_cycle > 0:
            overdue = calculate_days_overdue(plant.last_fertilized, plant.fertilize_cycle)

            if overdue >= -1:
                urgency = get_urgency_level(max(0, overdue), plant.fertilize_cycle)

                last_f = plant.last_fertilized
                if isinstance(last_f, datetime):
                    last_f = last_f.date()

                base_date = last_f or today
                due_date_obj = base_date + timedelta(days=plant.fertilize_cycle)

                msg = f"{plant.nickname}明天需要施肥" if overdue == -1 else f"{plant.nickname}已逾期{overdue}天未施肥"

                reminders.append(ReminderItem(
                    plant_id=plant.id,
                    plant_name=plant.nickname,
                    type="fertilize",
                    message=msg,
                    days_overdue=max(0, overdue),
                    urgency=urgency,
                    due_date=due_date_obj.strftime("%Y-%m-%d"),
                    icon=get_icon("fertilize", urgency)
                ))

    # 排序
    urgency_map = {"high": 0, "medium": 1, "low": 2}
    reminders.sort(key=lambda x: (urgency_map[x.urgency], -x.days_overdue))

    return BaseResponse(
        data=ReminderListResponse(reminders=reminders, total=len(reminders)).model_dump()
    )


@router.post("/plants/{plant_id}/water", response_model=BaseResponse)
async def record_watering(
        plant_id: int,
        current_user: User = Depends(get_current_user)
):
    """完成浇水打卡"""
    plant = await Plant.get_or_none(id=plant_id, user=current_user, is_deleted=False)

    if not plant:
        return BaseResponse(code=404, msg="植物不存在或无权操作")

    # 更新数据库，使用 date.today() 确保是日期类型
    plant.last_watered = date.today()
    await plant.save()

    return BaseResponse(
        msg="浇水打卡成功",
        data=PlantOperationResponse(
            plant_id=plant.id,
            operation="water",
            operated_at=str(plant.last_watered)
        ).dict()
    )


@router.post("/plants/{plant_id}/fertilize", response_model=BaseResponse)
async def record_fertilizing(
        plant_id: int,
        current_user: User = Depends(get_current_user)
):
    """完成施肥打卡"""
    plant = await Plant.get_or_none(id=plant_id, user=current_user, is_deleted=False)

    if not plant:
        return BaseResponse(code=404, msg="植物不存在或无权操作")

    plant.last_fertilized = date.today()
    await plant.save()

    return BaseResponse(
        msg="施肥打卡成功",
        data=PlantOperationResponse(
            plant_id=plant.id,
            operation="fertilize",
            operated_at=str(plant.last_fertilized)
        ).dict()
    )