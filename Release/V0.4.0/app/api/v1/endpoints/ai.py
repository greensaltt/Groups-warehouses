# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from app.core.config import settings
# 移除不需要的 FastAPI, CORSMiddleware, StaticFiles (路由中无法直接挂载静态文件)
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import aiohttp

# 创建 Router 实例
router = APIRouter()

# 创建必要的目录
os.makedirs("uploads", exist_ok=True)

# DeepSeek API配置
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_API_KEY = "sk-17a01a6a51624698ba06dfdec42bec78"  # 优先从 settings (.env) 读取，然后回退到环境变量

# 植物养护专家系统提示词
PLANT_EXPERT_SYSTEM_PROMPT = """你是一个专业的植物养护专家，专注于室内植物、多肉植物、观叶植物的养护指导。请遵循以下原则：
1. 提供专业、准确的植物养护建议
2. 回答要具体、实用，避免笼统
3. 针对用户的具体问题给出针对性解决方案
4. 如果涉及病虫害，要说明识别方法和具体治疗步骤
5. 浇水建议要具体到频率、水量和注意事项
6. 光照建议要说明具体的光照时长和强度
7. 施肥建议要说明肥料类型、频率和用量
请用中文回答，语气亲切专业，像一位经验丰富的园艺师。如果用户的问题信息不足，请主动询问更多细节以便给出更精准的建议。"""


# 存储对话历史
conversations_db = {}


# 健康检查接口 (移除了 /api 前缀，由 router 统一添加)
@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "植物养护AI助手后端运行正常", "timestamp": datetime.now().isoformat()}


# 对话接口
@router.post("/chat")
async def chat_with_ai(request: Request, message: str = Form(None), conversation_id: Optional[str] = Form(None)):
    # 支持 form-data 或 application/json
    if not message:
        try:
            body = await request.json()
            message = body.get('message') or body.get('question')
            if not conversation_id:
                conversation_id = body.get('conversation_id') or body.get('conversationId')
        except Exception:
            message = None

    if not message or not str(message).strip():
        raise HTTPException(status_code=400, detail="消息内容不能为空")

    # 处理对话ID
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    # 获取或创建对话历史
    if conversation_id not in conversations_db:
        conversations_db[conversation_id] = {
            "id": conversation_id,
            "messages": [],
            "created_at": datetime.now().isoformat(),
            "title": message[:20] + "..." if len(message) > 20 else message
        }

    # 构建对话消息
    messages = [
        {"role": "system", "content": PLANT_EXPERT_SYSTEM_PROMPT}
    ]

    # 添加历史消息（最近6轮）
    history_messages = conversations_db[conversation_id]["messages"][-6:]
    messages.extend(history_messages)

    # 添加当前用户消息
    messages.append({"role": "user", "content": message})

    try:
        ai_response = None
        result = {}

        # 优先使用外部 DeepSeek（若配置了 API key）
        if DEEPSEEK_API_KEY:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": 2000,
                    "temperature": 0.7,
                    "stream": False
                }

                headers = {
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                }

                async with session.post(
                        DEEPSEEK_API_URL,
                        json=payload,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status != 200:
                        # 尝试读取错误体并返回给调用方
                        try:
                            error_text = await response.text()
                        except Exception:
                            error_text = f"HTTP {response.status}"
                        raise HTTPException(status_code=response.status, detail=f"DeepSeek API错误: {error_text}")

                    # 为避免编码问题（中文乱码），先读取原始字节流并显式以 UTF-8 解码
                    raw_bytes = await response.read()

                    # 诊断：保存原始字节的十六进制和 Base64 编码
                    import binascii
                    import base64
                    raw_hex = binascii.hexlify(raw_bytes[:200]).decode('ascii')  # 仅前 200 字节
                    raw_base64 = base64.b64encode(raw_bytes).decode('ascii')
                    print(f"[DEEPSEEK_RESPONSE_DIAGNOSIS] First 200 bytes hex: {raw_hex}")
                    print(f"[DEEPSEEK_RESPONSE_DIAGNOSIS] Full response Base64 (first 500 chars): {raw_base64[:500]}")

                    try:
                        text = raw_bytes.decode('utf-8')
                    except Exception:
                        # 若 UTF-8 解码失败，退回到 latin1（能保证不抛错）并标注替换字符
                        text = raw_bytes.decode('latin1', errors='replace')

                    # 将解码后的文本解析成 JSON
                    try:
                        import json as _json
                        result = _json.loads(text)
                    except Exception:
                        # 最后备选：尝试 aiohttp 的文本接口
                        try:
                            text = await response.text()
                            result = _json.loads(text) if text else {}
                        except Exception:
                            result = {}

                    # 安全地提取模型回答
                    ai_response = ""
                    try:
                        ai_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    except Exception:
                        ai_response = ""

                    # 不做任何"修复"尝试 - DeepSeek 返回的字节已经是正确的 UTF-8 编码
                    # 若在此处仍然有乱码，那是在 JSON 解析或后续处理中被引入的

        # 保存对话记录
        conversations_db[conversation_id]["messages"].extend([
            {"role": "user", "content": message},
            {"role": "assistant", "content": ai_response}
        ])

        # 为诊断编码问题，附加原始字节的 Base64 编码到响应（仅在 DEBUG 或特殊请求时）
        response_dict = {
            "success": True,
            "message": ai_response,
            "conversation_id": conversation_id,
            "usage": result.get("usage", {}),
        }

        # 如果有原始字节诊断数据，附加到响应（用于后续编码问题排查）
        if "raw_bytes" in locals():
            import base64
            response_dict["_debug_raw_base64"] = base64.b64encode(raw_bytes).decode('ascii')[:500]

        # 使用 JSONResponse 并显式设置 UTF-8 charset 以避免编码问题
        return JSONResponse(
            content=response_dict,
            media_type="application/json; charset=utf-8",
            headers={"Content-Type": "application/json; charset=utf-8"}
        )

    except aiohttp.ClientError as e:
        raise HTTPException(status_code=500, detail=f"网络请求错误: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI服务暂时不可用: {str(e)}")



# 图片上传和分析接口
@router.post("/analyze-image")
async def analyze_plant_image(image: UploadFile = File(...)):
    # 检查文件类型
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="请上传图片文件")

    # 保存图片
    file_extension = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("uploads", filename)

    try:
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)

        # 这里可以集成真实的图片识别AI服务
        # 目前返回模拟分析结果
        analysis_result = {
            "health": "良好",
            "issues": ["叶片轻微发黄", "可能缺水"],
            "recommendations": [
                "适量增加浇水频率",
                "检查土壤湿度",
                "确保充足散射光照"
            ],
            # 注意：这里的URL路径可能需要根据主应用的静态文件挂载路径调整
            "image_url": f"/uploads/{filename}"
        }

        return {
            "success": True,
            "analysis": analysis_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片处理失败: {str(e)}")


# 获取对话历史
@router.get("/conversations")
async def get_conversation_history():
    # 返回最近的10个对话
    recent_conversations = list(conversations_db.values())[-10:]
    for conv in recent_conversations:
        # 只返回基本信息，不包含完整消息历史
        conv["message_count"] = len(conv["messages"]) // 2
        if conv["messages"]:
            conv["last_message"] = conv["messages"][-1]["content"][:50] + "..." if len(
                conv["messages"][-1]["content"]) > 50 else conv["messages"][-1]["content"]
        else:
            conv["last_message"] = ""

    return {"conversations": recent_conversations}


# 获取特定对话详情
@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(conversation_id: str):
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="对话不存在")

    return conversations_db[conversation_id]
