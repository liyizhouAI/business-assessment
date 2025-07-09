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
    const { userData, test = false } = req.body;
    
    // 测试模式
    if (test) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'API连接正常'
      });
    }

    // 获取用户数据
    const { basicInfo, scores, finalScore } = userData;
    
    // 生成李一舟3.0风格报告
    const report = `# 【李一舟3.0】项目诊断报告

## 🎯 核心判断

**底层逻辑是**，你的项目定位精准度只有 **${Math.round(finalScore * 0.6)}%**，核心问题在商业闭环设计。

**讲白了就是**，${finalScore >= 70 ? '有一定基础，但流量获取和转化效率需要大幅提升' : '商业模式存在根本性问题，需要重新思考定位'}。

## 📊 深度解析

**项目定位分析**  
你的"${basicInfo.description || '项目描述'}"在${basicInfo.industry}领域，当前处于${basicInfo.stage}。从评分看，最大短板是流量获取能力。

**商业模式问题**  
目标用户${basicInfo.target_audience || '待明确'}，但价值主张不够清晰。${basicInfo.industry === 'AI从业者' ? '技术背景深厚，但商业化能力待提升' : basicInfo.industry === '一人公司' ? '资源有限，需要追求效率最大化' : '传统行业转型，需要数字化思维'}。

**运营效率瓶颈**  
标准化程度不足，个人执行效率有待提高。这直接影响了规模化的可能性。

**服务体验优化**  
用户体验设计和复购机制需要重新规划，单次交易思维是致命伤。

## ⚡ 行动清单

### 🔥 30天冲刺（流量突破）

**聚焦** 单一用户标签，重写价值主张  
*→ 7天内完成A/B测试，目标转化率提升50%*

**设计** 3个流量获客渠道，优先内容营销+私域运营  
*→ 30天内验证单客成本<200元*

### 📈 60天优化（运营升级）

**搭建** 标准化服务流程，提升复购率至40%  
*→ 60天内完成SOP制定*

**建立** 数据监控体系，追踪关键指标  
*→ 每周复盘流量-转化-留存数据*

### 🚀 90天验证（商业闭环）

**测试** 最小可行产品，验证核心假设  
*→ 90天内达成${finalScore < 50 ? '盈亏平衡' : finalScore < 70 ? '月收入1万+' : '规模化复制'}*

## 💡 心法提醒

核心在于先做对再做大。${finalScore < 50 ? '你现在需要的是产品市场匹配度，不是增长黑客' : '商业闭环已具雏形，重点是效率优化和规模复制'}。

选择大于努力，长期主义胜过投机取巧。

---
*本报告由"一舟一课 3.0知识库"结合优质大模型综合生成，内容和观点仅供参考，请您酌情采信。*`;

    return res.status(200).json({
      report: report,
      promptVersion: 'v1.0-basic',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: '报告生成失败',
      message: error.message
    });
  }
}