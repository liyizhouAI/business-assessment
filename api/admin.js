const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// 启用CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI一人公司后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 获取支持的AI服务商列表
app.get('/api/providers', (req, res) => {
  res.json({
    providers: [
      {
        id: 'deepseek',
        name: 'DeepSeek',
        models: ['deepseek-r1', 'deepseek-chat'],
        endpoint: 'https://api.deepseek.com/v1/chat/completions'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-o3', 'gpt-4o', 'gpt-4-turbo'],
        endpoint: 'https://api.openai.com/v1/chat/completions'
      },
      {
        id: 'claude',
        name: 'Claude (Anthropic)',
        models: ['claude-sonnet-4', 'claude-3-5-sonnet', 'claude-3-sonnet'],
        endpoint: 'https://api.anthropic.com/v1/messages'
      }
    ]
  });
});

// AI调用代理接口
app.post('/api/ai-proxy', async (req, res) => {
  try {
    const { 
      provider, 
      model, 
      prompt, 
      apiKey, 
      temperature = 0.7, 
      maxTokens = 2000,
      systemPrompt = null
    } = req.body;

    // 参数验证
    if (!apiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'API Key is required' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }

    if (!provider) {
      return res.status(400).json({ 
        success: false,
        error: 'Provider is required' 
      });
    }

    console.log(`AI调用请求 - Provider: ${provider}, Model: ${model}`);

    let apiConfig = {};

    // 根据不同的AI服务商配置API
    switch (provider) {
      case 'deepseek':
        const messages = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        apiConfig = {
          url: 'https://api.deepseek.com/v1/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'business-assessment/1.0'
          },
          data: {
            model: model || 'deepseek-r1',
            messages: messages,
            temperature: Math.max(0, Math.min(2, parseFloat(temperature))),
            max_tokens: Math.max(1, Math.min(4000, parseInt(maxTokens))),
            stream: false
          }
        };
        break;

      case 'openai':
        const openaiMessages = [];
        if (systemPrompt) {
          openaiMessages.push({ role: 'system', content: systemPrompt });
        }
        openaiMessages.push({ role: 'user', content: prompt });

        apiConfig = {
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'business-assessment/1.0'
          },
          data: {
            model: model || 'gpt-4o',
            messages: openaiMessages,
            temperature: Math.max(0, Math.min(2, parseFloat(temperature))),
            max_tokens: Math.max(1, Math.min(4000, parseInt(maxTokens)))
          }
        };
        break;

      case 'claude':
        apiConfig = {
          url: 'https://api.anthropic.com/v1/messages',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'User-Agent': 'business-assessment/1.0'
          },
          data: {
            model: model || 'claude-sonnet-4',
            max_tokens: Math.max(1, Math.min(4000, parseInt(maxTokens))),
            temperature: Math.max(0, Math.min(1, parseFloat(temperature))),
            messages: [{ role: 'user', content: prompt }]
          }
        };

        if (systemPrompt) {
          apiConfig.data.system = systemPrompt;
        }
        break;

      default:
        return res.status(400).json({ 
          success: false,
          error: `Unsupported provider: ${provider}` 
        });
    }

    // 调用AI API
    console.log(`正在调用 ${provider} API...`);
    const startTime = Date.now();
    
    const response = await axios.post(apiConfig.url, apiConfig.data, {
      headers: apiConfig.headers,
      timeout: 60000, // 60秒超时
      validateStatus: (status) => status < 500 // 允许4xx错误通过，便于处理
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.status >= 400) {
      console.error(`API错误 - Status: ${response.status}`, response.data);
      return res.status(response.status).json({
        success: false,
        error: response.data?.error?.message || `API请求失败: ${response.status}`,
        details: response.data
      });
    }

    // 处理不同API的响应格式
    let content = '';
    let usage = null;

    if (provider === 'claude') {
      content = response.data.content?.[0]?.text || '无响应内容';
      usage = response.data.usage;
    } else {
      content = response.data.choices?.[0]?.message?.content || '无响应内容';
      usage = response.data.usage;
    }

    console.log(`AI调用成功 - 响应时间: ${responseTime}ms`);

    res.json({
      success: true,
      content: content,
      usage: usage,
      provider: provider,
      model: model,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API调用错误:', error.message);
    
    let errorMessage = '服务器内部错误';
    let statusCode = 500;
    let errorDetails = null;

    if (error.response) {
      // API返回了错误响应
      statusCode = error.response.status;
      errorDetails = error.response.data;
      
      if (statusCode === 401) {
        errorMessage = 'API Key无效或已过期，请检查密钥';
      } else if (statusCode === 403) {
        errorMessage = 'API访问被拒绝，请检查权限设置';
      } else if (statusCode === 429) {
        errorMessage = 'API调用频率超限，请稍后重试';
      } else if (statusCode === 400) {
        errorMessage = errorDetails?.error?.message || 'API请求参数错误';
      } else {
        errorMessage = errorDetails?.error?.message || error.response.statusText || '未知API错误';
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请稍后重试';
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '网络连接失败，请检查网络设置';
      statusCode = 503;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = '连接被拒绝，API服务可能不可用';
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// 测试连接接口
app.post('/api/test-connection', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'API Key is required' 
      });
    }

    if (!provider) {
      return res.status(400).json({ 
        success: false,
        error: 'Provider is required' 
      });
    }

    console.log(`测试连接 - Provider: ${provider}`);

    // 简单的连接测试
    const testPrompt = '你好，这是一个连接测试。请简单回复"连接成功"。';
    
    // 构造内部API调用
    const testRequest = {
      provider,
      model: model || 'default',
      prompt: testPrompt,
      apiKey,
      maxTokens: 50,
      temperature: 0.1
    };

    // 调用内部AI代理接口
    const proxyResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai-proxy`, testRequest, {
      timeout: 30000
    });

    if (proxyResponse.data.success) {
      res.json({
        success: true,
        message: `${provider} 连接测试成功`,
        response: proxyResponse.data.content,
        responseTime: proxyResponse.data.responseTime,
        model: proxyResponse.data.model,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: proxyResponse.data.error || '连接测试失败'
      });
    }

  } catch (error) {
    console.error('连接测试错误:', error.message);
    
    let errorMessage = '连接测试失败';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage += ': ' + error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取API使用统计 (示例接口)
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalRequests: 0,
      successRate: '100%',
      averageResponseTime: '1200ms',
      lastUpdated: new Date().toISOString()
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API接口不存在',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function export
module.exports = app;

// 本地开发时启动服务器
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 AI一人公司后端服务启动成功！`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔧 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📊 API统计: http://localhost:${PORT}/api/stats`);
    console.log(`🤖 支持的AI服务商: http://localhost:${PORT}/api/providers`);
  });
}
