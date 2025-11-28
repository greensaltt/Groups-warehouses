# app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import user

api_router = APIRouter()
# 挂载 auth 模块到 /auth 路径下
api_router.include_router(user.router, prefix="/auth", tags=["用户中心"])