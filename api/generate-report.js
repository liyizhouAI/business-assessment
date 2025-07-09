export default async function handler(req, res) {
  // 允许跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // 返回当前配置信息
    return res.status(200).json({
      currentModel: process.env.CURRENT_MODEL || 'local',
      availableModels: ['local', 'deepseek', 'openai', 'claude', 'tongyi', 'wenxin'],
      hasCustomPrompt: !!process.env.CUSTOM_PROMPT,
      version: '2.0.0'
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userData, test = false, useCustomPrompt = false } = req.body;
    
    // 测试模式
    if (test) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'API连接正常',
        model: process.env.CURRENT_MODEL || 'local',
        timestamp: new Date().toISOString()
      });
    }

    // 获取用户数据
    const { basicInfo, scores, finalScore } = userData;
    
    // 获取当前模型配置
    const currentModel = process.env.CURRENT_MODEL || 'local';
    
    let report;
    
    // 根据模型类型生成报告
    if (currentModel === 'local') {
      report = await generateLocalReport(userData, useCustomPrompt);
    } else {
      report = await generateAIReport(userData, currentModel, useCustomPrompt);
    }

    return res.status(200).json({
      report: report,
      model: currentModel,
      promptVersion: useCustomPrompt ? 'custom' : 'default',
      timestamp: new Date().toISOString(),
      usage: {
        tokens: report.length / 4, // 估算token数
        cost: calculateCost(currentModel, report.length)
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: '报告生成失败',
      message: error.message,
      model: process.env.CURRENT_MODEL || 'local'
    });
  }
}

// 本地报告生成
async function generateLocalReport(userData, useCustomPrompt) {
  const { basicInfo, scores, finalScore } = userData;
  
  // 使用自定义prompt或默认prompt
  const prompt = useCustomPrompt ? getCustomPrompt() : getDefaultPrompt();
  
  // 替换变量
  let report = prompt
    .replace(/{name}/g, basicInfo.name || '用户')
    .replace(/{industry}/g, basicInfo.industry || '未知行业')
    .replace(/{stage}/g, basicInfo.stage || '未明确阶段')
    .replace(/{description}/g, basicInfo.description || '项目描述')
    .replace(/{target_audience}/g, basicInfo.target_audience || '待明确')
    .replace(/{traffic_score}/g, scores.traffic.total)
    .replace(/{operation_score}/g, scores.operation.total)
    .replace(/{service_score}/g, scores.service.total)
    .replace(/{preference_score}/g, scores.preference.total)
    .replace(/{final_score}/g, finalScore);
  
  // 动态内容生成
  report = enhanceReport(report, userData);
  
  return report;
}

// AI模型报告生成
async function generateAIReport(userData, model, useCustomPrompt) {
  const { basicInfo, scores, finalScore } = userData;
  
  // 准备提示词
  const systemPrompt = getSystemPrompt();
  const userPrompt = buildUserPrompt(userData, useCustomPrompt);
  
  // 根据模型类型调用不同的API
  switch (model) {
    case 'deepseek':
      return await callDeepSeekAPI(systemPrompt, userPrompt);
    case 'openai':
      return await callOpenAIAPI(systemPrompt, userPrompt);
    case 'claude':
      return await callClaudeAPI(systemPrompt, userPrompt);
    case 'tongyi':
      return await callTongyiAPI(systemPrompt, userPrompt);
    case 'wenxin':
      return await callWenxinAPI(systemPrompt, userPrompt);
    default:
      return await generateLocalReport(userData, useCustomPrompt);
  }
}

// DeepSeek API调用
async function callDeepSeekAPI(systemPrompt, userPrompt) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// OpenAI API调用
async function callOpenAIAPI(systemPrompt, userPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API调用
async function callClaudeAPI(systemPrompt, userPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });
  
  const data = await response.json();
  return data.content[0].text;
}

// 通义千问API调用
async function callTongyiAPI(systemPrompt, userPrompt) {
  // 这里需要根据通义千问的实际API格式调整
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TONGYI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 2000
      }
    })
  });
  
  const data = await response.json();
  return data.output.text;
}

// 文心一言API调用
async function callWenxinAPI(systemPrompt, userPrompt) {
  // 这里需要根据文心一言的实际API格式调整
  const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WENXIN_API_KEY}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      temperature: 0.7,
      max_output_tokens: 2000
    })
  });
  
  const data = await response.json();
  return data.result;
}

// 构建用户提示词
function buildUserPrompt(userData, useCustomPrompt) {
  const { basicInfo, scores, finalScore } = userData;
  
  if (useCustomPrompt) {
    return getCustomPrompt()
      .replace(/{name}/g, basicInfo.name || '用户')
      .replace(/{industry}/g, basicInfo.industry || '未知行业')
      .replace(/{stage}/g, basicInfo.stage || '未明确阶段')
      .replace(/{description}/g, basicInfo.description || '项目描述')
      .replace(/{target_audience}/g, basicInfo.target_audience || '待明确')
      .replace(/{traffic_score}/g, scores.traffic.total)
      .replace(/{operation_score}/g, scores.operation.total)
      .replace(/{service_score}/g, scores.service.total)
      .replace(/{preference_score}/g, scores.preference.total)
      .replace(/{final_score}/g, finalScore);
  }
  
  return `请根据以下商业项目数据，生成一份李一舟3.0风格的商业分析报告：

用户信息：
- 姓名：${basicInfo.name || '用户'}
- 行业：${basicInfo.industry || '未知行业'}
- 项目阶段：${basicInfo.stage || '未明确阶段'}
- 项目描述：${basicInfo.description || '项目描述'}
- 目标用户：${basicInfo.target_audience || '待明确'}

评分数据：
- 流量维度：${scores.traffic.total}/30分
- 运营维度：${scores.operation.total}/30分
- 服务维度：${scores.service.total}/30分
- 个人喜好：${scores.preference.total}/10分
- 总分：${finalScore}/100分

请用李一舟的语言风格，包含"底层逻辑"、"讲白了就是"等口头禅，给出实用的商业建议。`;
}

// 获取系统提示词
function getSystemPrompt() {
  return process.env.SYSTEM_PROMPT || `你是李一舟3.0，一个专业的商业分析师和创业导师。你需要：
1. 用专业但接地气的语言进行分析
2. 经常使用"底层逻辑"、"讲白了就是"等口头禅
3. 给出具体可执行的建议
4. 保持客观但有态度的分析风格
5. 结合当前商业环境和趋势`;
}

// 获取自定义提示词
function getCustomPrompt() {
  return process.env.CUSTOM_PROMPT || getDefaultPrompt();
}

// 获取默认提示词
function getDefaultPrompt() {
  return `# 【李一舟3.0】项目诊断报告

## 🎯 核心判断

**底层逻辑是**，你的项目定位精准度只有 **{final_score}%**，核心问题在商业闭环设计。

**讲白了就是**，{final_score >= 70 ? '有一定基础，但流量获取和转化效率需要大幅提升' : '商业模式存在根本性问题，需要重新思考定位'}。

## 📊 深度解析

**项目定位分析**  
你的"{description}"在{industry}领域，当前处于{stage}。从评分看，最大短板是流量获取能力。

**商业模式问题**  
目标用户{target_audience}，但价值主张不够清晰。{industry === 'AI从业者' ? '技术背景深厚，但商业化能力待提升' : industry === '一人公司' ? '资源有限，需要追求效率最大化' : '传统行业转型，需要数字化思维'}。

## ⚡ 行动清单

### 🔥 30天冲刺（流量突破）
**聚焦** 单一用户标签，重写价值主张  
**设计** 3个流量获客渠道，优先内容营销+私域运营  

### 📈 60天优化（运营升级）
**搭建** 标准化服务流程，提升复购率至40%  
**建立** 数据监控体系，追踪关键指标  

### 🚀 90天验证（商业闭环）
**测试** 最小可行产品，验证核心假设  

## 💡 心法提醒

核心在于先做对再做大。选择大于努力，长期主义胜过投机取巧。

---
*本报告由"一舟一课 3.0知识库"结合优质大模型综合生成，内容和观点仅供参考，请您酌情采信。*`;
}

// 增强报告内容
function enhanceReport(report, userData) {
  const { finalScore } = userData;
  
  // 根据分数动态调整内容
  if (finalScore >= 85) {
    report = report.replace('需要重新思考定位', '有很大潜力，需要精细化运营');
  } else if (finalScore >= 70) {
    report = report.replace('需要重新思考定位', '有一定基础，需要重点优化');
  }
  
  return report;
}

// 计算成本
function calculateCost(model, textLength) {
  const tokens = textLength / 4; // 估算
  const costs = {
    'deepseek': tokens * 0.001 / 1000,
    'openai': tokens * 0.03 / 1000,
    'claude': tokens * 0.003 / 1000,
    'tongyi': tokens * 0.002 / 1000,
    'wenxin': tokens * 0.004 / 1000,
    'local': 0
  };
  
  return costs[model] || 0;
}
