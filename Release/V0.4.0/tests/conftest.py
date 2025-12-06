import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app # 假设您的 FastAPI 应用实例在 app.main.py 中
from app.core.config import settings
from tortoise import Tortoise

# 假设 User 模型和依赖项已正确导入
from app.models.user import User 
from app.core.security import create_access_token

# ----------------------------------------------------------------------
# 数据库夹具 (db_setup_and_teardown)
# ----------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop(request):
    """确保会话级别的事件循环用于异步测试"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def init_db():
    """
    会话级别夹具：初始化测试数据库连接
    使用 SQLite 内存数据库进行快速测试
    """
    # 确保使用测试数据库配置
    TEST_DATABASE_URL = settings.TEST_DATABASE_URL 
    
    await Tortoise.init(
        db_url=TEST_DATABASE_URL,
        modules={"models": ["app.models.user", "app.models.plant", "app.models.base"]} # 确保列出所有模型文件
    )
    # 在会话开始时创建表
    await Tortoise.generate_schemas()
    yield
    # 在会话结束时关闭连接 (对于内存数据库，关闭连接即清理)
    await Tortoise.close_connections()

@pytest.fixture(scope="function", autouse=True)
async def db_setup_and_teardown(init_db):
    """
    函数级别夹具：在每次测试前清理数据并创建测试用户
    """
    # 1. 清理数据（防止测试之间的数据污染）
    # 清空 User 和 Plant 表
    await User.all().delete()
    # 确保其他模型也清空，例如 await Plant.all().delete()
    
    # 2. 创建一个默认测试用户 (ID=1)
    test_user = await User.create(
        username="testuser",
        email="test@example.com",
        password="hashedpassword" # 密码是散列过的
    )
    
    # 3. 在测试运行时执行
    yield test_user
    
    # 4. 销毁（在每次测试结束后再次清理，确保环境干净）
    await User.all().delete()
    # await Plant.all().delete()

# ----------------------------------------------------------------------
# 客户端夹具 (client 和 authenticated_client)
# ----------------------------------------------------------------------
@pytest.fixture(scope="module")
def client():
    """未认证的测试客户端"""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def authenticated_client(db_setup_and_teardown):
    """已认证的测试客户端，带有有效的 Bearer Token"""
    test_user = db_setup_and_teardown
    
    # 1. 为测试用户生成一个访问 Token
    # 注意：这里的 'sub' 应该与您的 create_access_token 逻辑一致，通常是用户ID
    access_token = create_access_token(data={"sub": str(test_user.id)})
    
    # 2. 创建带有 Authorization 头的 TestClient
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # 3. 返回客户端
    with TestClient(app, headers=headers) as c:
        yield c