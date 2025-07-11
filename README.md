# AI一人公司 - 商业评估系统

## 🎯 项目简介

基于AI的商业项目评估系统，使用李一舟"诊断动刀指南"风格的提示词，为创业项目提供犀利、实用的商业分析报告。

## ✨ 核心功能

- 🎨 **智能提示词编辑器** - 支持李一舟风格的"诊断动刀指南"
- 🤖 **多AI模型支持** - DeepSeek、OpenAI、Claude
- 📊 **实时报告生成** - 根据问卷数据生成商业分析
- 🔧 **版本管理** - 提示词版本控制和A/B测试
- 📈 **使用统计** - 成功率、响应时间等数据监控
- 🌐 **后端代理** - 解决CORS跨域问题

## 🚀 快速开始

### 在线使用

访问部署地址：[https://business-assessment.vercel.app](https://business-assessment.vercel.app)

1. 打开管理控制台：`/admin.html`
2. 配置AI模型和API Key
3. 填充测试数据
4. 生成商业分析报告

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/liyizhouAI/business-assessment.git
   cd business-assessment
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - 前端页面：http://localhost:3000/admin.html
   - API文档：http://localhost:3000/api/health

## 📁 项目结构

```
business-assessment/
├── package.json          # 项目配置和依赖
├── vercel.json           # Vercel部署配置
├── README.md             # 项目说明文档
├── api/                  # 后端API接口
│   └── admin.js          # 主要API逻辑
└── public/               # 静态文件
    ├── index.html        # 前端问卷页面
    └── admin.html        # 管理控制台
```

## 🔧 API接口

### 健康检查
```
GET /api/health
```

### AI代理调用
```
POST /api/ai-proxy
Content-Type: application/json

{
  "provider": "deepseek",
  "model": "deepseek-r1", 
  "prompt": "用户提示词",
  "apiKey": "your-api-key",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### 测试连接
```
POST /api/test-connection
Content-Type: application/json

{
  "provider": "deepseek",
  "apiKey": "your-api-key"
}
```

## 🎨 提示词格式

使用李一舟"诊断动刀指南"风格：

```
✦ 输出结构(铁律)
**开场一句——判决书式结论**
* **≥ 90** 强推:加杠杆、加资源、加速干。
* **80-89** 优质:好胎盘,但骨架还缺一根梁。
* **70-79** 鸡肋:流量或模式不翻新,等于瞎折腾。
* **60-69** 不优:赶紧调头,别再烧时间。
* **< 60** 重启:方向+打法双失配,马上重定位。

**三刀精准拆(每刀一句)**
* **流量** → 钩子?通路?客群是否对味。
* **运营** → 节奏?交付?人岗是否错位。
* **服务** → 同质?复购?毛利是否塌陷。

**一句制胜动作(第一性原理)**
**100 字内回显打分**
```

## 🌐 部署说明

### Vercel部署

1. **推送到GitHub**
   ```bash
   git add .
   git commit -m "初始化项目"
   git push origin main
   ```

2. **连接Vercel**
   - 在Vercel控制台导入GitHub项目
   - 自动检测并部署

3. **环境变量**（可选）
   - 在Vercel设置中配置环境变量
   - 如：`NODE_ENV=production`

### 自定义域名

在Vercel项目设置中添加自定义域名。

## 🔐 API Key配置

支持以下AI服务商：

### DeepSeek
- 注册：https://platform.deepseek.com
- 获取API Key
- 选择模型：deepseek-r1 / deepseek-chat

### OpenAI  
- 注册：https://platform.openai.com
- 获取API Key
- 选择模型：gpt-o3 / gpt-4o / gpt-4-turbo

### Claude
- 注册：https://console.anthropic.com
- 获取API Key  
- 选择模型：claude-sonnet-4 / claude-3-5-sonnet

## 📊 使用统计

系统会自动记录：
- 总报告生成数
- API调用成功率
- 平均响应时间
- 错误日志

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **后端**: Node.js + Express + Axios
- **部署**: Vercel Serverless Functions
- **AI模型**: DeepSeek R1 / OpenAI GPT / Claude

## 🔄 更新日志

### v1.0.0 (2025-01-15)
- ✅ 初始版本发布
- ✅ 支持多AI模型调用
- ✅ 李一舟风格提示词
- ✅ 后端代理解决CORS
- ✅ 版本管理功能
- ✅ Vercel一键部署

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

- 作者：李一舟
- GitHub：https://github.com/liyizhouAI
- 项目地址：https://github.com/liyizhouAI/business-assessment

## ⭐ Star支持

如果这个项目对你有帮助，请给个Star ⭐！
