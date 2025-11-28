# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional

# 基础响应结构
class BaseResponse(BaseModel):
    code: int = 200
    msg: str = "success"
    data: Optional[dict] = None

# 注册请求参数
class UserRegister(BaseModel):
    username: str
    email: EmailStr # 数据库要求Email非空，这里必须传
    password: str

# 登录请求参数
class UserLogin(BaseModel):
    # 允许使用 用户名 或 邮箱 登录
    account: str
    password: str

# Token返回数据
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str