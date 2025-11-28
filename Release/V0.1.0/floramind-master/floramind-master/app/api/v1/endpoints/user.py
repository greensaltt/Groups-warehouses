# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, HTTPException, status
from app.schemas.user import BaseResponse, UserRegister, UserLogin
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from tortoise.exceptions import DoesNotExist

router = APIRouter()


# --------------------------
# 注册接口 (无验证码)
# --------------------------
@router.post("/register", response_model=BaseResponse)
async def register(req: UserRegister):
    # 1. 检查用户名是否已存在
    if await User.filter(username=req.username).exists():
        return BaseResponse(code=400, msg="用户名已存在")

    # 2. 检查邮箱是否已存在
    if await User.filter(email=req.email).exists():
        return BaseResponse(code=400, msg="该邮箱已被注册")

    # 3. 创建用户 (密码加密存储)
    # 注意：id, created_at, updated_at, is_deleted 会自动处理
    new_user = await User.create(
        username=req.username,
        email=req.email,
        password=get_password_hash(req.password)
    )

    # 4. 注册成功，自动生成 Token 让用户免登直接进入? 或者要求重新登录
    # 这里演示直接返回注册成功
    return BaseResponse(
        msg="注册成功",
        data={"user_id": new_user.id, "username": new_user.username}
    )


# --------------------------
# 登录接口
# --------------------------
@router.post("/login", response_model=BaseResponse)
async def login(req: UserLogin):
    # 1. 查找用户 (支持用户名或邮箱登录)
    # 使用 OR 逻辑查找
    user = await User.filter(username=req.account).first()
    if not user:
        user = await User.filter(email=req.account).first()

    if not user:
        return BaseResponse(code=404, msg="账号不存在")

    # 2. 检查逻辑删除
    if user.is_deleted:
        return BaseResponse(code=403, msg="账号已被注销")

    # 3. 校验密码
    if not verify_password(req.password, user.password):
        return BaseResponse(code=401, msg="密码错误")

    # 4. 生成 Token
    token = create_access_token(subject=str(user.id))

    return BaseResponse(
        msg="登录成功",
        data={
            "token": token,
            "user_id": user.id,
            "username": user.username,
            "avatar": user.avatar_url
        }
    )