# 文件名: tests/core/test_security.py
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt, ExpiredSignatureError # 导入 jose 库来手动解码和验证过期
# 修正导入路径：现在从 app.core.security 导入
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

# -----------------------------------------------------------
# B. 安全模块测试 (CORE-S-001 到 CORE-S-007)
# -----------------------------------------------------------

# CORE-S-001: 密码哈希一致性
def test_core_s_001_password_hash_inconsistency():
    """CORE-S-001: 验证 get_password_hash 每次生成的结果都不一致 (盐不同)。"""
    password = "testpassword"
    h1 = get_password_hash(password)
    h2 = get_password_hash(password)
    # 预期结果: 两个哈希值不相等
    assert h1 != h2

# CORE-S-002: 密码校验 (成功)
def test_core_s_002_password_verification_success():
    """CORE-S-002: 验证正确的明文密码能通过校验。"""
    plain_password = "correctpassword"
    hashed = get_password_hash(plain_password)
    # 预期结果: 校验返回 True
    assert verify_password(plain_password, hashed) is True

# CORE-S-003: 密码校验 (失败)
def test_core_s_003_password_verification_failure():
    """CORE-S-003: 验证错误的明文密码不能通过校验。"""
    correct_password = "correctpassword"
    wrong_password = "wrongpassword"
    hashed = get_password_hash(correct_password)
    # 预期结果: 校验返回 False
    assert verify_password(wrong_password, hashed) is False

# CORE-S-004: 密码哈希类型
def test_core_s_004_password_hash_return_type():
    """CORE-S-004: 验证 get_password_hash 返回 str 类型。"""
    hashed = get_password_hash("test")
    # 预期结果: 返回 str 类型
    assert isinstance(hashed, str)

# CORE-S-005: JWT Token 生成
def test_core_s_005_jwt_token_generation():
    """CORE-S-005: 验证 access token 能被生成且格式正确。"""
    test_subject = "user_id_123"
    token = create_access_token(test_subject)
    # 预期结果: 返回非空字符串，格式为 Header.Payload.Signature (由 . 分隔的三部分)
    assert isinstance(token, str)
    assert len(token.split('.')) == 3

# CORE-S-006: JWT Token 解码与验证
def test_core_s_006_jwt_token_decoding_and_verification():
    """CORE-S-006: 验证生成的 token 能被成功解码且 subject 正确。"""
    test_subject = "test_user_id"
    token = create_access_token(test_subject)
    
    # 使用 jose.jwt 手动解码 token
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={"verify_signature": True, "verify_aud": False}
    )
    
    # 预期结果: 解码后的 subject 字段等于 "test_user_id"
    assert payload["sub"] == test_subject
    assert "exp" in payload

# CORE-S-007: JWT 过期处理
def test_core_s_007_jwt_expired_signature_error():
    """CORE-S-007: 验证过期 Token 尝试解码时抛出 ExpiredSignatureError。"""
    
    # 1. 直接构建一个过期的 Token (设置 exp 为过去的时间)
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=1)
    
    to_encode = {"sub": "expired_user", "exp": expired_time}
    
    expired_token = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    # 2. 尝试解码，预期抛出 ExpiredSignatureError
    with pytest.raises(ExpiredSignatureError):
        jwt.decode(
            expired_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": True, "verify_aud": False}
        )