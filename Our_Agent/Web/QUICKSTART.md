# 🚀 快速启动指南

## 1️⃣ 环境配置

### 创建环境配置文件
```bash
# 在项目根目录创建 .env 文件
echo "API_KEY=your_deepseek_api_key_here" > .env
echo "BASE_URL=https://api.deepseek.com" >> .env
echo "MODEL=deepseek-chat" >> .env
```

### 安装依赖

#### 如果您使用uv环境（推荐）
```bash
uv sync
```

#### 如果您使用pip环境
```bash
pip install -r requirements.txt
```

## 2️⃣ 启动服务

### 方法一：使用uv启动脚本（推荐）
```bash
python start_with_uv.py
```

### 方法二：使用通用启动脚本
```bash
python start_server.py
```

### 方法三：直接启动
```bash
# uv环境
uv run python web_server.py

# pip环境
python web_server.py
```

## 3️⃣ 访问应用

打开浏览器访问：http://localhost:8000

## 4️⃣ 测试功能

### 基本测试
```bash
python test_system.py
```

### 示例对话
- "北京今天天气怎么样？"
- "上海未来3天天气预报"
- "给我列出一份深圳出行计划"

## 🔧 故障排除

### 常见问题
1. **端口被占用**：修改 `web_server.py` 中的端口号
2. **API密钥错误**：检查 `.env` 文件中的配置
3. **依赖缺失**：运行 `pip install -r requirements.txt`

### 获取帮助
- 查看完整文档：`README.md`
- 检查配置示例：`config_example.txt`
- 运行系统测试：`python test_system.py`
