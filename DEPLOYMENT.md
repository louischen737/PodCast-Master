# PodcastPro 部署指南

## 项目简介

PodcastPro 是一个基于AI的智能播客脚本生成系统，支持多格式文档内容提取、智能脚本生成和语音合成功能。

## 技术栈

- **后端**: Python + FastAPI + Uvicorn
- **前端**: React + Ant Design
- **AI服务**: 火山引擎Ark大模型 + MiniMax TTS语音合成
- **内容处理**: PyPDF2、python-docx、BeautifulSoup4

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone [your-repository-url]
cd PodcastPro

# 创建Python虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 安装Python依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑.env文件，填入必要的API密钥
```

**必需的配置项：**
- `ARK_API_KEY`: 火山引擎API密钥
- `ARK_API_SECRET`: 火山引擎API密钥
- `MINIMAX_API_KEY`: MiniMax API密钥（语音合成功能）
- `MINIMAX_GROUP_ID`: MiniMax Group ID

### 3. 启动后端服务

```bash
# 启动FastAPI服务
uvicorn webapp.main:app --reload --host 0.0.0.0 --port 8090
```

### 4. 启动前端服务

```bash
# 进入前端目录
cd podcastpro

# 安装Node.js依赖
npm install

# 启动React开发服务器
npm start
```

### 5. 访问应用

- 前端界面: http://localhost:3000
- 后端API: http://localhost:8090

## 功能演示

1. **内容上传**: 支持PDF、Word、TXT文件上传或网页URL输入
2. **脚本生成**: 填写播客信息，一键生成AI播客脚本
3. **脚本编辑**: 在线编辑生成的脚本内容
4. **语音合成**: 选择音色和参数，生成语音文件

## 注意事项

- 确保API密钥配置正确且账户余额充足
- 大文件处理和语音合成可能需要较长时间
- 建议在本地开发环境中测试

## 项目结构

```
PodcastPro/
├── ai_parser/          # AI脚本生成模块
├── content_extractor/  # 内容提取引擎
├── webapp/            # FastAPI后端
├── podcastpro/        # React前端
├── tests/             # 测试文件
└── requirements.txt   # Python依赖
```

## 技术亮点

- 模块化设计，支持多种文档格式统一处理
- 集成第三方AI服务，实现智能内容转换
- 前后端分离架构，响应式Web界面
- WebSocket实时通信，支持长任务进度跟踪
- 可扩展的插件式架构设计 