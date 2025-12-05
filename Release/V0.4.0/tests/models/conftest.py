import pytest
from tortoise import Tortoise
from app.models.user import User 
from app.models.plant import Plant
from app.core.security import get_password_hash 


# --- 1. 数据库初始化/清理 Fixture (函数/Function 范围) ---
@pytest.fixture(scope="function") # 关键改变：作用域改为 function，确保隔离
async def db_setup_and_teardown(): # 新的夹具名称
    """
    初始化 Tortoise ORM 连接并生成表结构。
    作用域为 function，确保每个测试使用一个全新的内存数据库。
    """
    
    # 1. 初始化 Tortoise ORM
    await Tortoise.init(
        db_url="sqlite://:memory:",
        # 确保这里包含了您所有的模型路径
        modules={"models": ["app.models.user", "app.models.plant"]}, 
    )
    
    # 2. 生成表结构
    await Tortoise.generate_schemas()
    
    # 在测试运行期间保持连接
    yield
    
    # 3. 测试结束后关闭连接 (销毁 in-memory 数据库)
    await Tortoise.close_connections()

# --- 2. 唯一用户创建 Fixture (函数/Function 范围) ---
@pytest.fixture(scope="function")
# 依赖 db_setup_and_teardown 以确保在干净的数据库中创建
async def create_user(request, db_setup_and_teardown): 
    """
    为每个测试函数创建一个具有唯一邮箱和用户名的用户，并处理用户名长度限制。
    """
    # 1. 从测试名称获取基础字符串
    unique_suffix = request.node.name.replace("/", "_").replace("[", "_").replace("]", "_")
    
    # 核心修复：健壮的用户名截断逻辑 (max_length=50)
    MAX_USERNAME_LEN = 50
    required_prefix = "fixture_user_" 
    
    # 计算留给测试名称的长度
    max_suffix_len = MAX_USERNAME_LEN - len(required_prefix) 
    truncated_suffix = unique_suffix[:max_suffix_len]
    username = f"{required_prefix}{truncated_suffix}" 
    email = f"{username}@test.com"
    
    # 确保 get_password_hash 可用
    try:
        password_hash = get_password_hash("testpassword123")
    except NameError:
        password_hash = "dummy_hashed_password" 

    user = await User.create(
        username=username,
        email=email,
        password=password_hash,
    )
    return user

# --- 3. 唯一植物创建 Fixture ---
@pytest.fixture(scope="function")
async def create_plant(create_user):
    """创建一个植物实例，依赖于 create_user Fixture。"""
    user = create_user
    plant = await Plant.create(
        user=user,
        nickname="UniquePlantNick",
        species="UniquePlantSpecies",
        water_cycle=10,
        fertilize_cycle=40,
    )
    return plant