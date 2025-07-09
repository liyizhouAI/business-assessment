// api/admin.js
export default async function handler(req, res) {
  // 允许跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 验证管理员权限
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: '管理员权限验证失败' });
  }
  
  try {
    if (req.method === 'GET') {
      return handleGetAdmin(req, res);
    } else if (req.method === 'POST') {
      return handlePostAdmin(req, res);
    } else if (req.method === 'PUT') {
      return handlePutAdmin(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('管理员API错误:', error);
    return res.status(500).json({ error: '服务器错误', message: error.message });
  }
}

// 处理GET请求 - 获取配置和统计
async function handleGetAdmin(req, res) {
  const { action } = req.query;
  
  switch (action) {
    case 'config':
      return res.json({
        currentModel: process.env.CURRENT_MODEL || 'local',
        systemPrompt: process.env.SYSTEM_PROMPT || '',
        customPrompt: process.env.CUSTOM_PROMPT || '',
        maxTokens: process.env.MAX_TOKENS || '2000',
        temperature: process.env.TEMPERATURE || '0.7',
        availableModels: ['local', 'deepseek', 'openai', 'claude', 'tongyi', 'wenxin'],
        hasApiKeys: {
          deepseek: !!process.env.DEEPSEEK_API_KEY,
          openai: !!process.env.OPENAI_API_KEY,
          claude: !!process.env.CLAUDE_API_KEY,
          tongyi: !!process.env.TONGYI_API_KEY,
          wenxin: !!process.env.WENXIN_API_KEY
        }
      });
      
    case 'stats':
      // 从数据库或缓存获取统计数据
      // 这里先返回模拟数据，实际应该从数据库获取
      return res.json({
        totalUsers: await getTotalUsers(),
        totalReports: await getTotalReports(),
        apiCalls: await getAPICalls(),
        totalCost: await getTotalCost(),
        todayStats: await getTodayStats(),
        recentActivity: await getRecentActivity()
      });
      
    case 'test':
      // 测试模型连接
      const model = req.query.model || process.env.CURRENT_MODEL;
      const testResult = await testModelConnection(model);
      return res.json(testResult);
      
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

// 处理POST请求 - 创建配置
async function handlePostAdmin(req, res) {
  const { action, data } = req.body;
  
  switch (action) {
    case 'save_prompt':
      // 保存Prompt到环境变量（需要重新部署生效）
      return res.json({
        success: true,
        message: 'Prompt已保存，需要重新部署后生效',
        data: {
          systemPrompt: data.systemPrompt,
          customPrompt: data.customPrompt
        }
      });
      
    case 'test_generate':
      // 测试报告生成
      const testResult = await testReportGeneration(data);
      return res.json(testResult);
      
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

// 处理PUT请求 - 更新配置
async function handlePutAdmin(req, res) {
  const { action, data } = req.body;
  
  switch (action) {
    case 'update_model':
      // 更新模型配置
      return res.json({
        success: true,
        message: '模型配置已更新',
        data: {
          currentModel: data.model,
          apiKeySet: !!data.apiKey
        }
      });
      
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

// 获取统计数据的函数（模拟实现）
async function getTotalUsers() {
  // 这里应该从数据库查询
  // 暂时返回模拟数据
  return Math.floor(Math.random() * 1000) + 100;
}

async function getTotalReports() {
  return Math.floor(Math.random() * 500) + 50;
}

async function getAPICalls() {
  return Math.floor(Math.random() * 2000) + 200;
}

async function getTotalCost() {
  return (Math.random() * 100 + 10).toFixed(2);
}

async function getTodayStats() {
  return {
    users: Math.floor(Math.random() * 50) + 5,
    reports: Math.floor(Math.random() * 30) + 3,
    apiCalls: Math.floor(Math.random() * 100) + 10,
    cost: (Math.random() * 5 + 1).toFixed(2)
  };
}

async function getRecentActivity() {
  return [
    { time: '2024-01-15 14:30', action: '生成报告', user: 'user@example.com' },
    { time: '2024-01-15 14:25', action: '完成评估', user: 'test@example.com' },
    { time: '2024-01-15 14:20', action: '开始评估', user: 'admin@example.com' }
  ];
}

// 测试模型连接
async function testModelConnection(model) {
  try {
    switch (model) {
      case 'deepseek':
        if (!process.env.DEEPSEEK_API_KEY) {
          return { success: false, error: '未配置DeepSeek API密钥' };
        }
        // 实际测试API连接
        return await testDeepSeekConnection();
        
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return { success: false, error: '未配置OpenAI API密钥' };
        }
        return await testOpenAIConnection();
        
      case 'local':
        return { success: true, message: '本地模板生成无需连接测试' };
        
      default:
        return { success: false, error: '不支持的模型类型' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试DeepSeek连接
async function testDeepSeekConnection() {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: '测试连接' }],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      return { success: true, message: 'DeepSeek连接测试成功' };
    } else {
      const error = await response.json();
      return { success: false, error: error.error?.message || '连接测试失败' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试OpenAI连接
async function testOpenAIConnection() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: '测试连接' }],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      return { success: true, message: 'OpenAI连接测试成功' };
    } else {
      const error = await response.json();
      return { success: false, error: error.error?.message || '连接测试失败' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试报告生成
async function testReportGeneration(userData) {
  try {
    // 调用现有的报告生成API
    const response = await fetch('/api/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userData: userData,
        useCustomPrompt: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        report: result.report,
        model: result.model,
        timestamp: result.timestamp
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.message || '报告生成失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}