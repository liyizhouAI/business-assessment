// api/send-email.js
export default async function handler(req, res) {
  // 允许跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, reportContent, userData } = req.body;
    
    if (!email || !reportContent) {
      return res.status(400).json({ error: '邮箱和报告内容不能为空' });
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    
    // 发送邮件
    const result = await sendEmail(email, reportContent, userData);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '报告已成功发送到您的邮箱',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        error: '邮件发送失败',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('邮件发送API错误:', error);
    return res.status(500).json({
      error: '邮件发送失败',
      message: error.message
    });
  }
}

// 邮件发送函数
async function sendEmail(email, reportContent, userData) {
  const { basicInfo, finalScore } = userData;
  
  // 使用Resend邮件服务（推荐，免费额度够用）
  if (process.env.RESEND_API_KEY) {
    return await sendWithResend(email, reportContent, userData);
  }
  
  // 使用SendGrid邮件服务（备选）
  if (process.env.SENDGRID_API_KEY) {
    return await sendWithSendGrid(email, reportContent, userData);
  }
  
  // 使用腾讯云邮件服务（国内推荐）
  if (process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY) {
    return await sendWithTencent(email, reportContent, userData);
  }
  
  // 使用Nodemailer SMTP（通用方案）
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return await sendWithSMTP(email, reportContent, userData);
  }
  
  return {
    success: false,
    error: '未配置邮件服务，请在环境变量中设置邮件服务API密钥'
  };
}

// 使用Resend发送邮件（推荐）
async function sendWithResend(email, reportContent, userData) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'AI一人公司 <noreply@yourdomain.com>',
        to: [email],
        subject: `【AI一人公司】您的商业项目定位分析报告 - ${userData.basicInfo.name || '用户'}`,
        html: generateEmailHTML(reportContent, userData)
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        messageId: data.id
      };
    } else {
      return {
        success: false,
        error: data.message || '邮件发送失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用SendGrid发送邮件
async function sendWithSendGrid(email, reportContent, userData) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }],
          subject: `【AI一人公司】您的商业项目定位分析报告 - ${userData.basicInfo.name || '用户'}`
        }],
        from: {
          email: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
          name: 'AI一人公司'
        },
        content: [{
          type: 'text/html',
          value: generateEmailHTML(reportContent, userData)
        }]
      })
    });
    
    if (response.ok) {
      return {
        success: true,
        messageId: response.headers.get('x-message-id')
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.errors?.[0]?.message || '邮件发送失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用腾讯云邮件服务（国内用户推荐）
async function sendWithTencent(email, reportContent, userData) {
  try {
    // 这里需要实现腾讯云邮件服务的API调用
    // 由于比较复杂，建议使用Resend或SendGrid
    return {
      success: false,
      error: '腾讯云邮件服务暂未实现，请使用Resend或SendGrid'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用SMTP发送邮件（通用方案）
async function sendWithSMTP(email, reportContent, userData) {
  try {
    // 这里需要实现SMTP发送逻辑
    // 在Vercel Serverless环境中，建议使用第三方邮件服务而不是SMTP
    return {
      success: false,
      error: 'SMTP方案暂未实现，建议使用Resend或SendGrid'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 生成邮件HTML模板
function generateEmailHTML(reportContent, userData) {
  const { basicInfo, finalScore } = userData;
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI一人公司 - 商业项目定位分析报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        .header h1 {
            color: #667eea;
            font-size: 28px;
            margin: 0;
        }
        .header p {
            color: #666;
            font-size: 16px;
            margin: 10px 0;
        }
        .score-summary {
            background: linear-gradient(135deg, #667eea20, #764ba220);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
        }
        .score-number {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            margin: 0;
        }
        .score-label {
            color: #666;
            font-size: 16px;
            margin: 5px 0;
        }
        .report-content {
            margin: 30px 0;
            line-height: 1.8;
        }
        .report-content h1 {
            color: #2c3e50;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .report-content h2 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .report-content h3 {
            color: #667eea;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        .report-content p {
            margin-bottom: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .user-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .user-info h3 {
            color: #667eea;
            margin-top: 0;
        }
        .user-info p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI一人公司</h1>
            <p>商业项目定位分析报告</p>
            <p>报告生成时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="user-info">
            <h3>📋 项目基本信息</h3>
            <p><strong>项目负责人：</strong>${basicInfo.name || '未填写'}</p>
            <p><strong>所属行业：</strong>${basicInfo.industry || '未填写'}</p>
            <p><strong>项目阶段：</strong>${basicInfo.stage || '未填写'}</p>
            <p><strong>目标用户：</strong>${basicInfo.target_audience || '未填写'}</p>
        </div>
        
        <div class="score-summary">
            <div class="score-number">${finalScore}</div>
            <div class="score-label">综合评分（满分100分）</div>
        </div>
        
        <div class="report-content">
            ${reportContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
        </div>
        
        <div class="footer">
            <p>本报告由 <strong>AI一人公司</strong> 系统生成</p>
            <p>如有疑问，请访问：<a href="https://business-assessment-8ghc.vercel.app" style="color: #667eea;">business-assessment-8ghc.vercel.app</a></p>
            <p>© 2024 AI一人公司 - 商业项目定位自查系统</p>
        </div>
    </div>
</body>
</html>
  `;
}`;