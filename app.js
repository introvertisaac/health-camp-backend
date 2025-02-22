const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check route
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive');
});

// Routes
app.use('/api/analytics', analyticsRoutes);

// Keep alive mechanism
const keepAlive = () => {
  setInterval(() => {
    fetch('https://health-camp-backend-htjy.onrender.com/ping')
      .catch(error => console.error('Keep-alive request failed:', error));
  }, 240000); // 4 minutes = 240000 milliseconds
};

keepAlive();

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;