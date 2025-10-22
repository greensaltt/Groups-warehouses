#!/usr/bin/env python3
"""
Web服务器 - 连接HTML前端和MCP客户端
这个服务器接收来自HTML前端的请求，然后调用MCP客户端处理，最后返回结果给前端
"""

import asyncio
import json
import os
import sys
from typing import Optional
from contextlib import AsyncExitStack
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# 导入MCP客户端
sys.path.append(str(project_root / "mcp-client"))
from client import DeepSeekMCPClient

# Web框架
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

# 请求模型
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    success: bool
    error: Optional[str] = None

# 创建FastAPI应用
app = FastAPI(title="WeaTrip MCP Web Server", version="1.0.0")

# 添加CORS中间件，允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局MCP客户端实例
mcp_client: Optional[DeepSeekMCPClient] = None

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化MCP客户端"""
    global mcp_client
    
    try:
        print("正在初始化MCP客户端...")
        mcp_client = DeepSeekMCPClient()
        
        # 连接到天气MCP服务器
        weather_server_path = project_root / "weather" / "weather.py"
        if weather_server_path.exists():
            await mcp_client.connect_to_server(str(weather_server_path))
            print("✅ MCP客户端初始化成功，已连接到天气服务器")
        else:
            print("❌ 天气服务器文件不存在:", weather_server_path)
            raise FileNotFoundError(f"天气服务器文件不存在: {weather_server_path}")
            
    except Exception as e:
        print(f"❌ MCP客户端初始化失败: {e}")
        mcp_client = None

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    global mcp_client
    if mcp_client:
        try:
            await mcp_client.cleanup()
            print("✅ MCP客户端资源已清理")
        except Exception as e:
            print(f"❌ 清理MCP客户端资源时出错: {e}")

@app.get("/")
async def serve_index():
    """提供HTML主页"""
    index_path = project_root / "web" / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    else:
        raise HTTPException(status_code=404, detail="HTML文件不存在")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """处理聊天请求"""
    global mcp_client
    
    if not mcp_client:
        return ChatResponse(
            reply="❌ 服务器未正确初始化，请稍后再试",
            success=False,
            error="MCP客户端未初始化"
        )
    
    try:
        print(f"收到用户消息: {request.message}")
        
        # 调用MCP客户端处理用户查询
        response = await mcp_client.process_query(request.message)
        
        print(f"MCP客户端响应: {response}")
        
        return ChatResponse(
            reply=response,
            success=True
        )
        
    except Exception as e:
        error_msg = f"处理请求时出错: {str(e)}"
        print(f"❌ {error_msg}")
        
        return ChatResponse(
            reply="❌ 抱歉，处理您的请求时出现了错误，请稍后再试",
            success=False,
            error=error_msg
        )

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "mcp_client_ready": mcp_client is not None,
        "message": "WeaTrip MCP Web Server is running"
    }

@app.get("/api/status")
async def status_check():
    """状态检查端点"""
    if mcp_client and mcp_client.session:
        return {
            "status": "ready",
            "message": "MCP客户端已连接并准备就绪"
        }
    else:
        return {
            "status": "not_ready", 
            "message": "MCP客户端未连接"
        }

if __name__ == "__main__":
    # 检查环境变量
    required_env_vars = ["API_KEY", "BASE_URL", "MODEL"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ 缺少必要的环境变量:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n请创建 .env 文件并设置这些变量")
        sys.exit(1)
    
    print("🚀 启动WeaTrip MCP Web服务器...")
    print("📱 前端地址: http://localhost:8000")
    print("🔧 API文档: http://localhost:8000/docs")
    
    # 启动服务器
    uvicorn.run(
        "web_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 开发模式下自动重载
        log_level="info"
    )
