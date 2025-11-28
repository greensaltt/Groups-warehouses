import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. 导入 CORS 中间件
from tortoise.contrib.fastapi import register_tortoise
from app.core.config import settings
from app.api.v1.endpoints import user

# ==========================================================
# 【新增修复代码】 针对华为云 GaussDB/OpenGauss 的兼容性补丁
# 原因：GaussDB 不支持 UNLISTEN 命令，而 asyncpg 默认会调用它
# ==========================================================
import asyncpg.connection

async def override_reset(self, timeout=None):
    # 这里的原始逻辑是执行 'RESET ALL; UNLISTEN *'
    # 我们将其覆盖为空操作，跳过重置，避免报错
    pass

# 将补丁应用到 asyncpg 的 Connection 类上
asyncpg.connection.Connection.reset = override_reset
# ==========================================================


app = FastAPI(title=settings.PROJECT_NAME)

# 2. 配置跨域中间件 (加在 register_tortoise 之前)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（开发环境方便，生产环境建议指定域名）
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法 (POST, GET, PUT...)
    allow_headers=["*"],  # 允许所有请求头
)

# 注册路由
app.include_router(user.router, prefix="/api/v1/user", tags=["用户认证"])

# 注册数据库 (Tortoise ORM)
register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={"models": ["app.models.user"]},
    generate_schemas=True,
    add_exception_handlers=True,
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)