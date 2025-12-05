import pytest
from tortoise.exceptions import IntegrityError, DoesNotExist
from app.models.user import User
# 假设您的密码哈希函数路径在 app.core.security
from app.core.security import get_password_hash 

# 确保所有测试都是异步的
pytestmark = pytest.mark.asyncio

# A. 用户模型基础测试 (models/user.py)

# MOD-U-001: 用户创建
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_001_user_creation(db_setup_and_teardown):
    """MOD-U-001: 验证 User.create 能够成功写入新用户。"""
    initial_count = await User.all().count()

    hashed_pwd = get_password_hash("testpassword123")
    new_user = await User.create(
        username="test_user_mod_001",
        email="test_mod_001@qq.com",
        password=hashed_pwd
    )

    # 1. 验证数量增加
    assert await User.all().count() == initial_count + 1

    # 2. 通过 ID 查询返回新创建的对象
    fetched_user = await User.get(id=new_user.id)
    assert fetched_user.username == "test_user_mod_001"
    assert fetched_user.password == hashed_pwd 
    assert fetched_user.is_deleted is False

# MOD-U-002: username 唯一性约束
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_002_username_unique_constraint(db_setup_and_teardown, create_user):
    """MOD-U-002: 验证 username 唯一性约束。"""

    # 尝试使用 fixture 用户相同的 username
    with pytest.raises(IntegrityError):
        await User.create(
            username=create_user.username,  # 使用已存在的 username
            email="new_unique_email@qq.com",
            password="somepassword"
        )

# MOD-U-003: email 唯一性约束
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_003_email_unique_constraint(db_setup_and_teardown, create_user):
    """MOD-U-003: 验证 email 唯一性约束。"""

    # 尝试使用 fixture 用户相同的 email
    with pytest.raises(IntegrityError):
        await User.create(
            username="new_unique_username",
            email=create_user.email,  # 使用已存在的 email
            password="somepassword"
        )

# MOD-U-004: 用户字段更新
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_004_user_update(db_setup_and_teardown, create_user):
    """MOD-U-004: 验证用户字段更新和 updated_at 字段。"""

    original_updated_at = create_user.updated_at

    # 1. 更新字段
    new_city = "Shenzhen"
    create_user.location_city = new_city
    await create_user.save()

    # 2. 再次查询验证更新
    updated_user = await User.get(id=create_user.id)
    assert updated_user.location_city == new_city

    # 3. 验证 updated_at 时间戳更新
    assert updated_user.updated_at > original_updated_at


# MOD-U-005: is_deleted 字段
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_005_is_deleted_field(db_setup_and_teardown, create_user):
    """MOD-U-005: 验证 is_deleted 字段的默认值和更新。"""

    # 1. 验证默认值
    assert create_user.is_deleted is False

    # 2. 成功更新为 True
    create_user.is_deleted = True
    await create_user.save()

    # 3. 再次查询验证更新
    deleted_user = await User.get(id=create_user.id)
    assert deleted_user.is_deleted is True

# MOD-U-006: 用户删除
# 修复: 将 db_init 替换为 db_setup_and_teardown
async def test_mod_u_006_user_deletion(db_setup_and_teardown, create_user):
    """MOD-U-006: 验证用户删除操作。"""

    user_id = create_user.id
    initial_count = await User.all().count()

    # 1. 删除用户
    await create_user.delete()

    # 2. 数据库中用户数量减少 1
    assert await User.all().count() == initial_count - 1

    # 3. 再次查询该用户 ID 时返回 DoesNotExist 异常
    with pytest.raises(DoesNotExist):
        await User.get(id=user_id)