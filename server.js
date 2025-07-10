// 📁 项目根目录结构
business-assessment-8ghc/
├── package.json          // ✅ 必需
├── server.js             // ✅ 新增 - 主服务器文件
├── index.html            // ✅ 保留
├── admin.html            // ✅ 保留
├── api/
│   ├── generate-report.js // ✅ 修改为Express格式
│   └── send-email.js      // ✅ 修改为Express格式
└── public/               // ✅ 新增 - 静态资源目录
    ├── index.html        // ✅ 复制主页面
    └── admin.html        // ✅ 复制管理页面

// 📝 package.json - 完整配置
{
  "name": "business-assessment-zeabur",
  "version": "1.0.0",
  "description": "AI一人公司商业项目定位自查系统",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "resend": "^3.0.0",
    "path": "^0.12.7"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

// 📝 server.js - 主服务器文件
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 路由配置
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API路由
app.post('/api/generate-report', async (req, res) => {
  try {
    const { userData } = req.body;
    
    if (!userData) {
      return res.status(400).json({
        success: false,
        error: 'Missing user data'
      });
    }

    // 生成报告的逻辑
    const report = await generateReport(userData);
    
    res.json({
      success: true,
      report: report,
      promptVersion: 'zeabur-v1.0'
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { email, reportContent, userData } = req.body;
    
    if (!email || !reportContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 模拟邮件发送（你需要添加真实的邮件发送逻辑）
    const result = await sendEmail(email, reportContent, userData);
    
    res.json({
      success: true,
      messageId: result.messageId || 'test-message-id'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 报告生成函数
async function generateReport(userData) {
  const { basicInfo, scores, finalScore, rating } = userData;
  
  return `# 【AI一人公司】商业项目定位分析报告

## 🎯 核心判断

**底层逻辑是**，你的项目定位精准度只有 **${Math.round(finalScore * 0.6)}%**，核心问题在商业闭环设计。

**讲白了就是**，${finalScore >= 70 ? '有一定基础，但流量获取和转化效率需要大幅提升' : '商业模式存在根本性问题，需要重新思考定位'}。

## 📊 深度解析

**项目定位分析**  
你的"${basicInfo.description ? basicInfo.description.substring(0, 50) + '...' : '项目描述'}"在${basicInfo.industry || '未知'}领域，当前处于${basicInfo.stage || '未明确'}阶段。

**商业模式问题**  
目标用户${basicInfo.target_audience || '待明确'}，但价值主张不够清晰。

## ⚡ 行动清单

### 🔥 30天冲刺（流量突破）
**聚焦** 单一用户标签，重写价值主张  
*→ 7天内完成A/B测试*

### 📈 60天优化（运营升级）
**搭建** 标准化服务流程，提升复购率  
*→ 60天内完成SOP制定*

### 🚀 90天验证（商业闭环）
**测试** 最小可行产品，验证核心假设  
*→ 90天内达成盈亏平衡*

---
*本报告由AI一人公司生成，${new Date().toLocaleString()}*`;
}

// 邮件发送函数
async function sendEmail(email, reportContent, userData) {
  // 这里你需要集成真实的邮件服务
  console.log('Sending email to:', email);
  console.log('Report content length:', reportContent.length);
  
  // 模拟发送成功
  return {
    messageId: 'zeabur-' + Date.now(),
    status: 'sent'
  };
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

module.exports = app;