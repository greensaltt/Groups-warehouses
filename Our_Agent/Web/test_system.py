#!/usr/bin/env python3
"""
系统测试脚本
测试MCP客户端和Web服务器的连接和功能
"""

import asyncio
import json
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from mcp_client.client import DeepSeekMCPClient

async def test_mcp_client():
    """测试MCP客户端功能"""
    print("🧪 测试MCP客户端...")
    
    try:
        # 创建客户端实例
        client = DeepSeekMCPClient()
        
        # 连接到天气服务器
        weather_server_path = project_root / "weather" / "weather.py"
        if not weather_server_path.exists():
            print(f"❌ 天气服务器文件不存在: {weather_server_path}")
            return False
            
        await client.connect_to_server(str(weather_server_path))
        print("✅ MCP客户端连接成功")
        
        # 测试简单查询
        test_queries = [
            "北京今天天气怎么样？",
            "上海未来3天天气预报",
            "给我一个简单的天气报告"
        ]
        
        for query in test_queries:
            print(f"\n📝 测试查询: {query}")
            try:
                response = await client.process_query(query)
                print(f"✅ 响应: {response[:100]}...")
            except Exception as e:
                print(f"❌ 查询失败: {e}")
                return False
        
        # 清理资源
        await client.cleanup()
        print("✅ MCP客户端测试完成")
        return True
        
    except Exception as e:
        print(f"❌ MCP客户端测试失败: {e}")
        return False

async def test_weather_server():
    """测试天气服务器功能"""
    print("\n🧪 测试天气服务器...")
    
    try:
        # 导入天气服务器
        sys.path.append(str(project_root / "weather"))
        from weather import get_weather, get_forecast
        
        # 测试获取天气
        print("📝 测试获取北京天气...")
        weather_result = await get_weather("Beijing", "CN")
        print(f"✅ 天气结果: {weather_result[:100]}...")
        
        # 测试获取预报
        print("📝 测试获取上海预报...")
        forecast_result = await get_forecast("Shanghai", "CN")
        print(f"✅ 预报结果: {forecast_result[:100]}...")
        
        print("✅ 天气服务器测试完成")
        return True
        
    except Exception as e:
        print(f"❌ 天气服务器测试失败: {e}")
        return False

def test_web_server_import():
    """测试Web服务器导入"""
    print("\n🧪 测试Web服务器导入...")
    
    try:
        import web_server
        print("✅ Web服务器模块导入成功")
        return True
    except Exception as e:
        print(f"❌ Web服务器导入失败: {e}")
        return False

def test_dependencies():
    """测试依赖包"""
    print("\n🧪 测试依赖包...")
    
    required_packages = [
        "fastapi",
        "uvicorn", 
        "mcp",
        "openai",
        "httpx",
        "python-dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ 缺少依赖包: {', '.join(missing_packages)}")
        print("请运行: pip install -r requirements.txt")
        return False
    
    print("✅ 所有依赖包检查通过")
    return True

async def main():
    """主测试函数"""
    print("🌟 WeaTrip MCP 系统测试")
    print("=" * 50)
    
    # 测试依赖包
    if not test_dependencies():
        return False
    
    # 测试Web服务器导入
    if not test_web_server_import():
        return False
    
    # 测试天气服务器
    if not await test_weather_server():
        return False
    
    # 测试MCP客户端（需要API密钥）
    print("\n⚠️  MCP客户端测试需要配置API密钥")
    print("如果已配置.env文件，将进行MCP客户端测试...")
    
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv()
        
        if os.getenv("API_KEY") and os.getenv("API_KEY") != "your_deepseek_api_key_here":
            if not await test_mcp_client():
                return False
        else:
            print("⏭️  跳过MCP客户端测试（未配置API密钥）")
    except Exception as e:
        print(f"⏭️  跳过MCP客户端测试: {e}")
    
    print("\n🎉 系统测试完成！")
    print("✅ 所有核心组件工作正常")
    print("🚀 可以运行 python start_server.py 启动服务器")
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n👋 测试已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {e}")
        sys.exit(1)

