import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from unittest.mock import AsyncMock, patch
import io

pytestmark = pytest.mark.asyncio

API_PREFIX = settings.API_V1_STR

# D. AI 助手服务 (ai.py)

# API-A-001: 知识库查询
async def test_api_a_001_knowledge_query(authenticated_client: TestClient, db_setup_and_teardown):
    response = authenticated_client.get(f"{API_PREFIX}/plant/knowledge")
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["code"] == 200
    assert "knowledge_list" in res_data["data"]
    assert len(res_data["data"]["knowledge_list"]) > 0

# API-A-002: AI 聊天 (Mocking aiohttp)
# 使用 patch 模拟外部网络请求
@patch('aiohttp.ClientSession.post', new_callable=AsyncMock)
async def test_api_a_002_ai_chat(mock_post: AsyncMock, authenticated_client: TestClient, db_setup_and_teardown):
    
    mock_response_content = {
        "choices": [{
            "message": {"content": "我是一个模拟的AI回复：你的植物需要更多的水。"}
        }]
    }
    mock_post.return_value.__aenter__.return_value.json = AsyncMock(return_value=mock_response_content)
    mock_post.return_value.__aenter__.return_value.status = 200

    chat_data = {
        "user_id": 1, 
        "conversation_id": "new_chat_123",
        "message": "我的玫瑰花叶子发黄了怎么办？"
    }

    response = authenticated_client.post(f"{API_PREFIX}/plant/chat", json=chat_data)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["code"] == 200
    assert "content" in res_data["data"]
    assert "模拟的AI回复" in res_data["data"]["content"]

# API-A-003: 图片分析 (Mocking file I/O)
# Mock builtins.open 来防止测试环境写入文件
@patch('builtins.open', new_callable=AsyncMock) 
async def test_api_a_003_image_analysis(mock_open, authenticated_client: TestClient, db_setup_and_teardown):
    
    file_content = b"fake image data"
    # TestClient 使用 files 参数处理文件上传
    files = {'file': ('test_image.jpg', io.BytesIO(file_content), 'image/jpeg')}

    response = authenticated_client.post(f"{API_PREFIX}/plant/image-analysis", files=files)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] == True
    
    analysis = res_data["analysis"]
    assert "image_url" in analysis
    assert "/uploads/" in analysis["image_url"] 

# API-A-004: 获取对话历史
async def test_api_a_004_get_conversation_history(client: TestClient, db_setup_and_teardown):
    response = client.get(f"{API_PREFIX}/plant/conversations")
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["code"] == 200
    assert "conversations" in res_data["data"]
    
    conversations = res_data["data"]["conversations"]
    
    # 验证返回列表结构
    if conversations:
        assert all("last_message" in conv and "message_count" in conv for conv in conversations)