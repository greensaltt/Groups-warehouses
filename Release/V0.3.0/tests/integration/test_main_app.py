import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
# 修正: 导入 pathlib 和更细致的 mock
from unittest.mock import patch
import pathlib

pytestmark = pytest.mark.asyncio

API_V1_STR = settings.API_V1_STR
PROJECT_NAME = settings.PROJECT_NAME

# E. 主应用测试 (main.py)

# APP-001: 根路径连通性
async def test_app_001_root_path_connectivity(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": PROJECT_NAME}

# APP-002: 路由前缀验证
async def test_app_002_router_prefix_validation(client: TestClient, db_setup_and_teardown):
    # 访问一个受保护的 V1 路由
    response = client.get(f"{API_V1_STR}/reminders")
    
    assert response.status_code == 401 # 证明路由被正确找到，但被认证依赖拦截
    assert response.json()["detail"] == "Not authenticated"

# APP-003: CORS 中间件
async def test_app_003_cors_middleware(client: TestClient):
    # 修正: 定义 origin_header
    origin_header = "http://test-domain.com"
    
    # 发送 OPTIONS 预检请求到 /api/v1/auth/login
    response = client.options(
        f"{API_V1_STR}/auth/login",
        headers={
            "Origin": origin_header,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        }
    )
    
    assert response.status_code == 200
    # 验证 CORS 允许的 Origin。假设配置允许了此 Origin 或使用了 "*"。
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == origin_header
    
    # 验证允许的方法和头是否被正确设置
    assert "access-control-allow-methods" in response.headers
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "access-control-allow-headers" in response.headers
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


# APP-004: 静态文件挂载
# 修正: 使用更深层的 mock 来模拟文件存在、是文件、以及文件内容，避免实际的文件IO错误
# 假设主应用将 `/uploads` 目录挂载为 `/uploads` 路由
@patch('pathlib.Path.exists', return_value=True) # 假设文件路径存在
@patch('pathlib.Path.read_bytes', return_value=b'JPEG file content') # 模拟文件内容
@patch('pathlib.Path.is_file', return_value=True) # 假设是一个文件
async def test_app_004_static_files_mounting(mock_is_file, mock_read_bytes, mock_exists, client: TestClient):
    # 尝试访问 /uploads/test.jpg
    response = client.get("/uploads/test.jpg")
    
    assert response.status_code == 200
    # 验证 Content-Type 标头。修正: .jpg 文件应该返回 image/jpeg
    assert "content-type" in response.headers
    assert response.headers["content-type"] == "image/jpeg"
    
    # 验证 mock 被调用，确保逻辑流经了 StaticFiles
    mock_exists.assert_called() 
    mock_read_bytes.assert_called()