# AI播客生成器 - React前端

这是AI播客生成器的React前端应用，提供了现代化的用户界面和完整的播客生成流程。

## 项目亮点

- 一键将文档/网页内容转为口语化播客脚本，极大提升内容创作效率
- 支持AI智能脚本生成与多音色语音合成，适合播客、短视频等场景
- 前后端分离，界面友好，支持在线编辑、历史管理、音频下载

## 快速体验

- [项目截图](#功能展示)
- [部署指南](DEPLOYMENT.md)

## 快速启动

1. 克隆仓库并安装依赖
2. 配置 `.env` 文件（参考 `env.example`）
3. 启动后端：`uvicorn webapp.main:app --reload --host 0.0.0.0`
4. 启动前端：`cd podcastpro && npm install && npm start`
5. 访问 http://localhost:3000

详细部署说明见 [DEPLOYMENT.md](DEPLOYMENT.md)

## 功能展示

### 主界面
![主界面](screenshots/main-interface.png)

### 脚本生成
![脚本生成](screenshots/script-generation.png)

### 语音合成
![语音合成](screenshots/voice-synthesis.png)

## 功能特点

- 🎯 **四步式工作流**：上传内容 → 参数设置 → 生成脚本 → 语音合成
- 📁 **多格式支持**：PDF、Word、TXT文件上传，网页URL内容提取
- 🎙️ **双模式播客**：单人模式和双人对话模式
- 🌍 **多语言支持**：中文和英文脚本生成
- 🎵 **TTS语音合成**：MiniMax TTS服务，多种音色和参数调节
- 📱 **响应式设计**：适配桌面和移动设备
- 🎨 **现代化UI**：基于Ant Design组件库

## 项目结构

```
src/
├── components/           # React组件
│   ├── ContentUpload.js     # 内容上传模块
│   ├── PodcastSettings.js   # 播客参数设置
│   ├── ScriptGenerator.js   # 脚本生成模块
│   └── TTSSynthesis.js      # TTS语音合成
├── App.js               # 主应用组件
├── index.js             # 应用入口
└── index.css            # 全局样式
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动

### 3. 构建生产版本

```bash
npm run build
```

## 使用流程

### 第一步：上传内容
- 选择本地文件上传（支持PDF、Word、TXT格式）
- 或输入网页URL进行内容提取
- 系统自动提取并显示内容摘要

### 第二步：参数设置
- 填写播客名称和下期预告
- 选择脚本语种（中文/英文）
- 选择播客模式（单人/双人）
- 配置角色名称和语音风格

### 第三步：生成脚本
- 点击"生成播客脚本"按钮
- AI自动生成口语化播客脚本
- 支持脚本复制和下载

### 第四步：语音合成
- 选择音色和调节语音参数
- 点击"开始语音合成"
- 在线播放和下载音频文件

## 技术栈

- **React 19** - 前端框架
- **Ant Design 5** - UI组件库
- **React Hooks** - 状态管理
- **Fetch API** - 后端通信

## 后端API

本前端需要配合Python FastAPI后端使用，主要API接口：

- `POST /api/extract_file` - 文件内容提取
- `POST /api/extract_url` - URL内容提取
- `POST /api/generate_script` - 播客脚本生成
- `POST /api/generate_audio` - TTS语音合成

## 环境要求

- Node.js 16+
- npm 或 yarn
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 开发说明

### 组件通信
- 使用props进行父子组件通信
- 使用useState管理组件状态
- 使用message组件显示用户反馈

### 样式设计
- 基于Ant Design设计系统
- 响应式布局，支持移动端
- 统一的色彩和间距规范

### 错误处理
- 完整的try-catch错误捕获
- 用户友好的错误提示
- 网络请求超时处理

## 注意事项

1. 确保后端服务正常运行
2. 配置正确的API端点
3. 检查网络连接和CORS设置
4. 大文件上传可能需要较长时间

## 许可证

MIT License
