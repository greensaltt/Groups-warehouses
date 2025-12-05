# 文件名: tests/schemas/test_user.py
import pytest
from pydantic import ValidationError
# 假设你的 schema 文件在 app/schemas 目录下
from app.schemas.user import UserRegister, UserLogin, Token

# SCH-U-001: 测试 UserRegister 模型的有效数据加载
def test_sch_u_001_user_register_valid():
    """SCH-U-001: 测试 UserRegister 接受所有必需的有效字段。"""
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    user = UserRegister(**data)
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.password == "securepassword123"

# SCH-U-002: 测试 UserRegister 缺少 email 字段时的验证失败
def test_sch_u_002_user_register_missing_email():
    """SCH-U-002: 测试 UserRegister 缺少 'email' 字段时抛出 ValidationError。"""
    data = {
        "username": "testuser",
        "password": "securepassword123"
    }
    with pytest.raises(ValidationError) as excinfo:
        UserRegister(**data)
    
    # 验证错误信息是否包含 email 字段
    assert "email" in str(excinfo.value)
    assert "Field required" in str(excinfo.value)

# SCH-U-003: 测试 UserRegister email 格式无效时的验证失败
def test_sch_u_003_user_register_invalid_email_format():
    """SCH-U-003: 测试 UserRegister 的 'email' 字段格式不正确时抛出 ValidationError。"""
    data = {
        "username": "testuser",
        "email": "invalid-email-format", # 无效格式
        "password": "securepassword123"
    }
    with pytest.raises(ValidationError) as excinfo:
        UserRegister(**data)
    
    # 验证错误信息是否与 email 格式有关
    assert "value is not a valid email address" in str(excinfo.value)

# SCH-U-004: 测试 UserLogin 模型接受有效的 'account' 和 'password'
def test_sch_u_004_user_login_valid():
    """SCH-U-004: 测试 UserLogin 接受有效的 'account' 和 'password'。"""
    data = {
        "account": "test@example.com", # 可以是邮箱
        "password": "loginpass"
    }
    login_data = UserLogin(**data)
    assert login_data.account == "test@example.com"
    
    data_username = {
        "account": "testuser", # 也可以是用户名
        "password": "loginpass"
    }
    login_data_username = UserLogin(**data_username)
    assert login_data_username.account == "testuser"

# SCH-U-005: 测试 Token 模型正确加载所有返回字段
def test_sch_u_005_token_valid():
    """SCH-U-005: 测试 Token 模型正确加载所有返回字段。"""
    data = {
        "access_token": "a.very.long.jwt.token",
        "token_type": "bearer",
        "user_id": 101,
        "username": "tokenuser"
    }
    token = Token(**data)
    assert token.access_token == "a.very.long.jwt.token"
    assert token.token_type == "bearer"
    assert token.user_id == 101
    assert token.username == "tokenuser"