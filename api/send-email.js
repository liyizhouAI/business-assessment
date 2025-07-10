const express = require('express');
const { Resend } = require('resend');
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { email, reportContent, userData } = req.body;
    
    // 你的邮件发送逻辑（保持原有逻辑）
    const result = await resend.emails.send({
      from: `AI一人公司 <${process.env.FROM_EMAIL}>`,
      to: [email],
      subject: '🎯 您的商业项目定位分析报告',
      html: formatEmailHTML(reportContent, userData)
    });
    
    res.json({
      success: true,
      messageId: result.data.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
