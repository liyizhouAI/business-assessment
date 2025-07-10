// 从Vercel风格改为Express风格
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  // 原来的handler逻辑
  try {
    const { userData } = req.body;
    
    // 你的AI报告生成逻辑
    const report = await generateAIReport(userData);
    
    res.json({
      success: true,
      report: report,
      promptVersion: "zeabur-v1.0"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
