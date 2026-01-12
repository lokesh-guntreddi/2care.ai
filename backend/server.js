require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


require('./database');


const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const vitalsRoutes = require('./routes/vitals');
const sharingRoutes = require('./routes/sharing');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/sharing', sharingRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Health Wallet API is running' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
