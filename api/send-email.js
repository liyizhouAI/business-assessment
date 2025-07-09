import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: '只支持POST请求'
    });
  }

  try {
    const { email, reportContent, userData } = req.body;

    // 验证必需的环境变量
    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY environment variable');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: '邮件服务配置错误'
      });
    }

    // 验证请求数据
    if (!email || !reportContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必要的邮箱地址或报告内容'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: '邮箱地址格式不正确'
      });
    }

    // 获取发件人邮箱
    const fromEmail = process.env.FROM_EMAIL || 'noreply@business-assessment.com';
    
    // 格式化报告内容为HTML
    const htmlContent = formatReportToHTML(reportContent);
    
    // 构建邮件内容
    const emailHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI一人公司 - 商业项目定位分析报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .report-content {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .report-content h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        .report-content h2 {
            color: #667eea;
            font-size: 20px;
            margin: 25px 0 15px 0;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
        }
        .report-content h3 {
            color: #495057;
            font-size: 16px;
            margin: 20px 0 10px 0;
        }
        .report-content p {
            margin-bottom: 12px;
            line-height: 1.8;
        }
        .report-content strong {
            color: #2c3e50;
            font-weight: 600;
        }
        .report-content em {
            color: #667eea;
            font-style: normal;
            font-weight: 500;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .tips {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-container { padding: 20px; }
            .report-content { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">AI一人公司</div>
            <div class="subtitle">商业项目定位分析报告</div>
        </div>
        
        <div class="greeting">
            尊敬的 ${userData?.basicInfo?.name || '用户'}，您好！
        </div>
        
        <p>感谢您使用AI一人公司商业项目定位自查系统。经过深度AI分析，您的专属商业定位报告已生成完成。</p>
        
        <div class="tips">
            <strong>💡 阅读建议：</strong><br>
            建议您仔细阅读分析结果，重点关注"行动清单"部分，按照30/60/90天计划逐步优化您的项目定位。
        </div>
        
        <div class="report-content">
            ${htmlContent}
        </div>
        
        <div class="footer">
            <p><strong>AI一人公司</strong> | 让每个人都能成为商业高手</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                本报告由AI大模型生成，内容仅供参考。如有疑问，请访问我们的官网获取更多资源。
            </p>
            <p style="font-size: 12px; color: #999;">
                发送时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
            </p>
        </div>
    </div>
</body>
</html>`;

    // 发送邮件
    console.log('开始发送邮件到:', email);
    
    const { data, error } = await resend.emails.send({
      from: `AI一人公司 <${fromEmail}>`,
      to: [email],
      subject: `🎯 您的商业项目定位分析报告 - ${userData?.basicInfo?.name || '专属定制'}`,
      html: emailHtml,
      // 添加纯文本版本作为备用
      text: `
AI一人公司 - 商业项目定位分析报告

尊敬的${userData?.basicInfo?.name || '用户'}，

感谢您使用AI一人公司商业项目定位自查系统。以下是您的分析报告：

${reportContent}

AI一人公司团队
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      `.trim()
    });

    if (error) {
      console.error('Resend API错误:', error);
      return res.status(400).json({
        success: false,
        error: 'Email sending failed',
        message: `邮件发送失败: ${error.message}`,
        details: error
      });
    }

    console.log('邮件发送成功:', data);
    
    return res.status(200).json({
      success: true,
      messageId: data.id,
      message: '报告已成功发送到您的邮箱'
    });

  } catch (error) {
    console.error('邮件发送异常:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器内部错误，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 辅助函数：将Markdown格式的报告转换为HTML
function formatReportToHTML(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // 标题转换
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // 文本格式
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 分隔线
    .replace(/^---$/gm, '<hr>')
    
    // 段落处理
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // 包装在段落中
  html = '<p>' + html + '</p>';
  
  // 清理多余的段落标签
  html = html
    .replace(/<p><h([1-6])>/g, '<h$1>')
    .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
    .replace(/<p><hr><\/p>/g, '<hr>')
    .replace(/<p><\/p>/g, '');
  
  return html;
}
