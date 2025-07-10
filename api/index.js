const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 静态文件路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

// API路由
app.use('/api/generate-report', require('./generate-report'));
app.use('/api/send-email', require('./send-email'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});