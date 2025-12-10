import os
import sys

# ==========================================================
# 【调试版路径修复补丁】
# ==========================================================
current_file_path = os.path.abspath(__file__)
current_dir = os.path.dirname(current_file_path)
project_root = os.path.dirname(current_dir)

# 强行加入根目录
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# --- 打印调试信息 (请把这部分输出发给我) ---
print("\n" + "="*30)
print("--- DEBUG START ---")
print(f"1. 正在运行的文件: {current_file_path}")
print(f"2. 这里的目录是:   {current_dir}")
print(f"3. 项目根目录是:   {project_root}")
print(f"4. Python 搜索路径 (sys.path) 前3项:")
for i, p in enumerate(sys.path[:3]):
    print(f"   [{i}] {p}")

print("5. 检查 app 文件夹是否存在:", os.path.exists(os.path.join(project_root, "app")))
print("6. 检查 core 文件夹是否存在:", os.path.exists(os.path.join(project_root, "app", "core")))
print("--- DEBUG END ---")
print("="*30 + "\n")
# ==========================================================

import uvicorn
import asyncpg.connection
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise

# 这里是你报错的地方
try:
    from app.core.config import settings
    print("✅ 成功导入 settings!")
    from app.api.v1.api import api_router
    print("✅ 成功导入 api_router!")
except ImportError as e:
    print(f"❌ 导入失败，错误详情: {e}")
    # 这里不抛出异常，为了让你看到上面的打印信息，但程序后续会挂掉
    exit(1)

# ==========================================================
# 华为云补丁
async def override_reset(self, timeout=None):
    pass
asyncpg.connection.Connection.reset = override_reset
# ==========================================================

uploads_path = os.path.join(project_root, "uploads")
os.makedirs(uploads_path, exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={
        "models": ["app.models.user", "app.models.plant", "app.models.diary"]
    },
    generate_schemas=True,
    add_exception_handlers=True,
)

if __name__ == "__main__":
    # 为了调试方便，这里暂时去掉 app.main 的前缀，只用 main:app
    # 因为我们是直接运行脚本的
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)