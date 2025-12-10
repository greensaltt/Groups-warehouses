import base64
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, date as date_type
from typing import List, Optional
import httpx

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
# 天气服务（增强版：3小时缓存）
# ==========================================
class WeatherService:
    """天气服务类，带3小时缓存"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY", "d7aadb72af4007994d98593361db009b")
        self.base_url = "https://api.openweathermap.org/data/2.5"
        # 添加天气缓存：{city: (weather_data, timestamp)}
        self.weather_cache = {}
        self.cache_timeout = 3 * 3600  # 3小时（秒）
    
    def _is_cache_valid(self, city: str) -> bool:
        """检查缓存是否有效（3小时内）"""
        if city not in self.weather_cache:
            return False
        
        data, timestamp = self.weather_cache[city]
        current_time = datetime.now().timestamp()
        
        return (current_time - timestamp) < self.cache_timeout
    
    async def get_current_weather(self, city: str = "北京") -> dict:
        """获取当前天气，使用3小时缓存"""
        try:
            # 如果城市为空或None，使用默认值"北京"
            if not city or city.strip() == "":
                city = "北京"
            
            # 检查缓存是否有效
            if self._is_cache_valid(city):
                print(f"使用缓存天气数据：{city}")
                data, _ = self.weather_cache[city]
                return data
            
            print(f"获取最新天气数据：{city}")
            
            # 中英文城市名映射
            city_map = {
                "北京": "Beijing", "上海": "Shanghai", "广州": "Guangzhou",
                "深圳": "Shenzhen", "杭州": "Hangzhou", "成都": "Chengdu",
                "南京": "Nanjing", "武汉": "Wuhan", "西安": "Xian",
                "重庆": "Chongqing", "天津": "Tianjin", "福州": "Fuzhou",
                "苏州": "Suzhou", "厦门": "Xiamen", "青岛": "Qingdao",
                "长沙": "Changsha", "郑州": "Zhengzhou", "沈阳": "Shenyang",
                "大连": "Dalian", "济南": "Jinan", "哈尔滨": "Harbin",
                "长春": "Changchun", "石家庄": "Shijiazhuang", "太原": "Taiyuan",
                "合肥": "Hefei", "南昌": "Nanchang", "南宁": "Nanning",
                "昆明": "Kunming", "贵阳": "Guiyang", "兰州": "Lanzhou",
                "西宁": "Xining", "银川": "Yinchuan", "乌鲁木齐": "Urumqi",
                "拉萨": "Lhasa", "海口": "Haikou", "香港": "Hong Kong",
                "澳门": "Macau", "台北": "Taipei"
            }
            
            # 如果是中文城市名，转换为英文
            if city in city_map:
                api_city = city_map[city]
            else:
                api_city = city  # 默认使用输入的城市名
            
            url = f"{self.base_url}/weather"
            params = {
                "q": api_city,
                "appid": self.api_key,
                "units": "metric",  # 摄氏度
                "lang": "zh_cn"     # 中文
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    weather_data = self._parse_weather_data(data, city)
                    
                    # 更新缓存
                    self.weather_cache[city] = (weather_data, datetime.now().timestamp())
                    
                    return weather_data
                else:
                    print(f"天气API错误: {response.status_code}")
                    # 返回默认天气，不缓存
                    return self._get_default_weather(city)
                    
        except Exception as e:
            print(f"获取天气失败: {e}")
            # 返回默认天气，不缓存
            return self._get_default_weather(city if city else "北京")
    
    def _parse_weather_data(self, data: dict, original_city: str) -> dict:
        """解析天气数据"""
        # 天气描述映射为中文
        weather_map = {
            "Clear": "晴", "Clouds": "多云", "Rain": "雨",
            "Snow": "雪", "Thunderstorm": "雷雨", "Drizzle": "毛毛雨",
            "Mist": "雾", "Fog": "雾", "Haze": "霾", "Smoke": "烟霾"
        }
        
        weather = data["weather"][0]
        main = data["main"]
        wind = data.get("wind", {})
        
        # 获取中文描述
        weather_en = weather["main"]
        weather_desc = weather_map.get(weather_en, weather_en)
        
        # 风向转换
        def get_wind_direction(deg):
            if deg is None:
                return "无风"
            directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"]
            index = round((deg % 360) / 45) % 8
            return directions[index]
        
        return {
            "city": original_city,
            "text": weather_desc,
            "temp": str(round(main["temp"])),
            "feels_like": str(round(main["feels_like"])),
            "humidity": str(main["humidity"]),
            "pressure": str(main["pressure"]),
            "wind_speed": str(round(wind.get("speed", 0), 1)),
            "wind_direction": get_wind_direction(wind.get("deg")),
            "icon": weather.get("icon", "01d"),
            "update_time": datetime.now().strftime("%H:%M")
        }
    
    def _get_default_weather(self, city: str = "北京") -> dict:
        """获取默认天气数据"""
        return {
            "city": city,
            "text": "晴",
            "temp": "20",
            "feels_like": "20",
            "humidity": "50",
            "pressure": "1013",
            "wind_speed": "2.5",
            "wind_direction": "北",
            "icon": "01d",
            "update_time": datetime.now().strftime("%H:%M")
        }

# 创建天气服务实例
weather_service = WeatherService()

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
         # 从用户模型中获取 location_city，如果为空则使用默认值"北京"
        user_city = current_user.location_city
        if not user_city or user_city.strip() == "":
            user_city = "北京"  # 默认值
        
        current_weather = await weather_service.get_current_weather(user_city)

        
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
            plants=plant_items,
            currentWeather=current_weather
        )

        return BaseResponse(code=200, msg="获取成功", data=data.model_dump())

    except Exception as e:
        return BaseResponse(code=500, msg=f"获取日记失败: {str(e)}", data=None)


@router.get("/weather/current", response_model=BaseResponse)
async def get_current_weather_api(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户所在城市的天气
    - 优先使用用户存储的 location_city
    - 如果为空则使用默认值"北京"
    - 使用3小时缓存
    """
    try:
        # 获取用户存储的城市，如果为空则使用默认值"北京"
        user_city = current_user.location_city
        if not user_city or user_city.strip() == "":
            user_city = "北京"
        
        weather_data = await weather_service.get_current_weather(user_city)
        return BaseResponse(code=200, msg="获取成功", data=weather_data)
        
    except Exception as e:
        print(f"天气接口异常: {e}")
        # 返回默认天气
        user_city = current_user.location_city or "北京"
        default_weather = weather_service._get_default_weather(user_city)
        return BaseResponse(code=200, msg="使用默认天气", data=default_weather)


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
    - 自动获取用户所在城市的当前天气和温度
    - 天气缓存3小时
    - 完全自动添加，不需要用户输入
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

        # 3. 自动获取当前天气
        user_city = current_user.location_city
        if not user_city or user_city.strip() == "":
            user_city = "北京"
        
        current_weather = await weather_service.get_current_weather(user_city)
        
        # 4. 提取天气和温度
        weather_text = current_weather["text"]
        temperature = current_weather["temp"] + "°C"
        
        # 5. 处理图片 (Base64 -> 文件)
        processed_photos = process_image_list(diary_in.photos)

        # 6. 创建日记（完全使用自动获取的天气）
        diary = await Diary.create(
            user_id=current_user.id,
            plant_id=int(diary_in.plantId),
            title=diary_in.title,
            content=diary_in.content,
            activity_type=diary_in.activityType if diary_in.activityType != "" else None,
            weather=weather_text,  # 直接使用中文天气描述
            temperature=temperature,  # 带单位的温度
            images=processed_photos,
            diary_date=diary_date,
            # 保存完整的天气信息
            extra_data={
                "auto_weather": {
                    "city": user_city,
                    "text": weather_text,
                    "temp": current_weather["temp"],
                    "temp_with_unit": temperature,
                    "feels_like": current_weather["feels_like"],
                    "humidity": current_weather["humidity"],
                    "wind": f"{current_weather['wind_speed']}m/s {current_weather['wind_direction']}风",
                    "icon": current_weather["icon"],
                    "fetched_at": datetime.now().isoformat(),
                    "cached": False  # 标记是否来自缓存
                }
            }
        )

        operation_data = DiaryOperationData(
            diaryId=str(diary.id),
            operation="create",
            success=True,
            message="日记保存成功！已自动添加当前天气信息。",
            extra_info={
                "weather": weather_text,
                "temperature": temperature,
                "city": user_city
            }
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
    - 注意：更新时不会自动修改天气，保持原天气
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
        
        # 注意：更新时不自动修改天气
        # 如果用户要修改天气，可以通过传入 weather 和 temperature 参数
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
