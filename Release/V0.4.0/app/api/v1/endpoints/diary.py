import base64
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, date as date_type
from typing import List, Optional

# 导入依赖
from app.api.deps import get_current_user

# 导入模型和Schema
from app.models.user import User
from app.models.plant import Plant
from app.models.diary import Diary
from app.schemas.user import BaseResponse
from app.schemas.diary import (
    DiaryCreate,
    DiaryUpdate,
    DiaryItem,
    DiaryListData,
    DiaryOperationData,
    PlantFilterItem
)

router = APIRouter()


# ==========================================
# 图片处理逻辑 (保存到 app/uploads/diary)
# ==========================================
def save_base64_image(base64_str: str) -> str:
    """
    将Base64字符串解码保存为图片文件，并返回访问URL
    """
    if not base64_str or base64_str.startswith("http"):
        return base64_str

    try:
        if "," in base64_str:
            header, encoded = base64_str.split(",", 1)
        else:
            return base64_str

        extension = ".jpg"
        if "png" in header:
            extension = ".png"
        elif "gif" in header:
            extension = ".gif"

        image_data = base64.b64decode(encoded)

        # ============================================================
        # 【核心修复】使用绝对路径，防止出现 app/app/uploads
        # ============================================================

        # 1. 获取当前脚本 (diary.py) 的绝对路径
        current_file_path = Path(__file__).resolve()

        # 2. 向上回溯找到 app 目录
        # diary.py 在: app/api/v1/endpoints/diary.py
        # parents[0] = endpoints
        # parents[1] = v1
        # parents[2] = api
        # parents[3] = app  <-- 我们要找这个目录
        app_dir = current_file_path.parents[3]

        # 3. 拼接目标路径: app/uploads/diary
        save_dir = app_dir / "uploads" / "diary"

        # 4. 创建目录 (如果不存在)
        # parents=True 可以创建多级目录, exist_ok=True 忽略已存在错误
        save_dir.mkdir(parents=True, exist_ok=True)

        # 5. 生成文件路径
        file_name = f"diary_{uuid.uuid4()}{extension}"
        file_path = save_dir / file_name

        # 6. 写入文件
        with open(file_path, "wb") as f:
            f.write(image_data)

        # ============================================================

        # 返回 URL
        return f"http://127.0.0.1:8000/uploads/diary/{file_name}"

    except Exception as e:
        print(f"图片保存失败: {e}")
        return base64_str


def process_image_list(photos: List[str]) -> List[str]:
    """批量处理图片列表"""
    if not photos:
        return []
    return [save_base64_image(p) for p in photos]


# ==========================================
# 辅助函数
# ==========================================
def get_plant_image_url(plant: Plant) -> Optional[str]:
    """获取植物图片URL"""
    if not plant:
        return None
    # 优先取 image_url，没有则取 icon，都没有返回 None
    return getattr(plant, 'image_url', None) or getattr(plant, 'icon', None)


# ==========================================
# 路由定义
# ==========================================

@router.get("/diaries", response_model=BaseResponse)
async def get_diaries(
        current_user: User = Depends(get_current_user),
        plant_id: Optional[str] = Query(None, description="按植物ID筛选"),
        activity_type: Optional[str] = Query(None, description="按活动类型筛选"),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
):
    """
    获取当前用户的日记列表
    """
    try:
        query = Diary.filter(user_id=current_user.id, is_deleted=False)

        if plant_id and plant_id != "":
            query = query.filter(plant_id=int(plant_id))

        if activity_type and activity_type != "":
            query = query.filter(activity_type=activity_type)

        total = await query.count()
        diaries = await query.offset(skip).limit(limit).prefetch_related("plant").order_by("-diary_date", "-created_at")

        diary_list = []
        for diary in diaries:
            plant = diary.plant if diary.plant else None
            diary_item = DiaryItem(
                id=str(diary.id),
                plantId=str(diary.plant_id),
                plantNickname=plant.nickname if plant else "未知植物",
                plantImageUrl=get_plant_image_url(plant),
                title=diary.title,
                content=diary.content,
                activityType=diary.activity_type or "",
                weather=diary.weather or "sunny",
                temperature=diary.temperature or "",
                photos=diary.images or [],
                date=diary.diary_date.isoformat() if diary.diary_date else "",
                createdAt=diary.created_at.isoformat() if diary.created_at else None
            )
            diary_list.append(diary_item)

        plants = await Plant.filter(user_id=current_user.id, is_deleted=False).all()
        plant_items = [
            PlantFilterItem(
                id=str(plant.id),
                nickname=plant.nickname,
                imageUrl=get_plant_image_url(plant)
            )
            for plant in plants
        ]

        data = DiaryListData(
            diaries=diary_list,
            total=total,
            plants=plant_items
        )

        return BaseResponse(code=200, msg="获取成功", data=data.model_dump())

    except Exception as e:
        return BaseResponse(code=500, msg=f"获取日记失败: {str(e)}", data=None)


@router.get("/diaries/{diary_id}", response_model=BaseResponse)
async def get_diary(
        diary_id: str,
        current_user: User = Depends(get_current_user),
):
    """
    获取单个日记详情
    """
    try:
        diary = await Diary.get_or_none(
            id=int(diary_id),
            user_id=current_user.id,
            is_deleted=False
        ).prefetch_related("plant")

        if not diary:
            return BaseResponse(code=404, msg="日记不存在", data=None)

        plant = diary.plant if diary.plant else None
        diary_item = DiaryItem(
            id=str(diary.id),
            plantId=str(diary.plant_id),
            plantNickname=plant.nickname if plant else "未知植物",
            plantImageUrl=get_plant_image_url(plant),
            title=diary.title,
            content=diary.content,
            activityType=diary.activity_type or "",
            weather=diary.weather or "sunny",
            temperature=diary.temperature or "",
            photos=diary.images or [],
            date=diary.diary_date.isoformat() if diary.diary_date else "",
            createdAt=diary.created_at.isoformat() if diary.created_at else None
        )

        return BaseResponse(code=200, msg="获取成功", data=diary_item.model_dump())

    except ValueError:
        return BaseResponse(code=400, msg="日记ID格式错误", data=None)
    except Exception as e:
        return BaseResponse(code=500, msg=f"获取日记详情失败: {str(e)}", data=None)


@router.post("/diaries", response_model=BaseResponse)
async def create_diary(
        diary_in: DiaryCreate,
        current_user: User = Depends(get_current_user),
):
    """
    创建新的植物日记
    """
    try:
        # 1. 验证植物
        plant = await Plant.get_or_none(
            id=int(diary_in.plantId),
            user_id=current_user.id,
            is_deleted=False
        )

        if not plant:
            return BaseResponse(code=404, msg="植物不存在", data=None)

        # 2. 处理日期
        diary_date = diary_in.date if diary_in.date else date_type.today()

        # 3. 处理图片 (Base64 -> 文件)
        processed_photos = process_image_list(diary_in.photos)

        # 4. 创建日记
        diary = await Diary.create(
            user_id=current_user.id,
            plant_id=int(diary_in.plantId),
            title=diary_in.title,
            content=diary_in.content,
            activity_type=diary_in.activityType if diary_in.activityType != "" else None,
            weather=diary_in.weather,
            temperature=diary_in.temperature,
            images=processed_photos,
            diary_date=diary_date
        )

        operation_data = DiaryOperationData(
            diaryId=str(diary.id),
            operation="create",
            success=True,
            message="日记保存成功！"
        )

        return BaseResponse(code=200, msg="创建成功", data=operation_data.model_dump())

    except ValueError:
        return BaseResponse(code=400, msg="数据格式错误", data=None)
    except Exception as e:
        return BaseResponse(code=500, msg=f"创建日记失败: {str(e)}", data=None)


@router.put("/diaries/{diary_id}", response_model=BaseResponse)
async def update_diary(
        diary_id: str,
        diary_update: DiaryUpdate,
        current_user: User = Depends(get_current_user),
):
    """
    更新日记
    """
    try:
        diary = await Diary.get_or_none(
            id=int(diary_id),
            user_id=current_user.id,
            is_deleted=False
        )

        if not diary:
            return BaseResponse(code=404, msg="日记不存在", data=None)

        # 验证新植物归属
        if diary_update.plantId is not None:
            plant = await Plant.get_or_none(
                id=int(diary_update.plantId),
                user_id=current_user.id,
                is_deleted=False
            )
            if not plant:
                return BaseResponse(code=404, msg="植物不存在", data=None)

        update_data = {}
        if diary_update.plantId is not None:
            update_data["plant_id"] = int(diary_update.plantId)
        if diary_update.title is not None:
            update_data["title"] = diary_update.title
        if diary_update.content is not None:
            update_data["content"] = diary_update.content
        if diary_update.activityType is not None:
            update_data["activity_type"] = diary_update.activityType if diary_update.activityType != "" else None
        if diary_update.weather is not None:
            update_data["weather"] = diary_update.weather
        if diary_update.temperature is not None:
            update_data["temperature"] = diary_update.temperature

        # 处理图片更新
        if diary_update.photos is not None:
            update_data["images"] = process_image_list(diary_update.photos)

        if diary_update.date is not None:
            update_data["diary_date"] = diary_update.date

        if update_data:
            await diary.update_from_dict(update_data)
            await diary.save()

        operation_data = DiaryOperationData(
            diaryId=diary_id,
            operation="update",
            success=True,
            message="日记更新成功！"
        )

        return BaseResponse(code=200, msg="更新成功", data=operation_data.model_dump())

    except ValueError:
        return BaseResponse(code=400, msg="ID格式错误", data=None)
    except Exception as e:
        return BaseResponse(code=500, msg=f"更新日记失败: {str(e)}", data=None)


@router.delete("/diaries/{diary_id}", response_model=BaseResponse)
async def delete_diary(
        diary_id: str,
        current_user: User = Depends(get_current_user),
):
    """
    删除日记
    """
    try:
        diary = await Diary.get_or_none(
            id=int(diary_id),
            user_id=current_user.id,
            is_deleted=False
        )

        if not diary:
            return BaseResponse(code=404, msg="日记不存在", data=None)

        diary.is_deleted = True
        await diary.save()

        operation_data = DiaryOperationData(
            diaryId=diary_id,
            operation="delete",
            success=True,
            message="日记已删除"
        )

        return BaseResponse(code=200, msg="删除成功", data=operation_data.model_dump())

    except ValueError:
        return BaseResponse(code=400, msg="日记ID格式错误", data=None)
    except Exception as e:
        return BaseResponse(code=500, msg=f"删除日记失败: {str(e)}", data=None)