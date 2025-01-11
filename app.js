const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const pool = require('./db')
// Import routes
const coinRoute = require('./src/routes/coin.routes');
const saleTargetHeaderRoute = require('./src/routes/sale-target-header.routes');
const adminRoute = require('./src/routes/admin.routes');
const userTypeRoute = require('./src/routes/user-type.routes');
const targetStatusRoute = require('./src/routes/target-status.routes');
const complitionStatusRoute = require('./src/routes/complition-status.routes');
const currentPriceRoute = require('./src/routes/current-price.routes')
// const organizationRoutes = require('./src/routes/super-admin/organization.routes');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

// Serve static files
app.use(
  '/images/logo1',
  express.static(path.join(__dirname, 'images', 'logo1'))
);
app.use(
  '/images/logo2',
  express.static(path.join(__dirname, 'images', 'logo2'))
);
app.use(
  '/images/sports',
  express.static(path.join(__dirname, 'images', 'sports'))
);
app.use(
  '/images/headshots',
  express.static(path.join(__dirname, 'images', 'headshots'))
);

// CORS Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});

// API Routes
app.use('/v1/api/coin', coinRoute);
app.use('/v1/api/sale-target-header', saleTargetHeaderRoute);
app.use('/v1/api/admin', adminRoute);
app.use('/v1/api/user-type', userTypeRoute);
app.use('/v1/api/target-status', targetStatusRoute);
app.use('/v1/api/complition-status', complitionStatusRoute);
app.use('/v1/api/current-price', currentPriceRoute);
// app.use('/v1/api/organization', organizationRoutes);
app.get('/health', async (req, res) => {
  res.json("Server is running");
});
const baseUrl = 'http://localhost:3000/v1';
// const baseUrl = 'https://wmdevelopment.co.in:3002/v1/';
const endpoint = '/api/current-price/add-update';
setInterval(async () => {
  try {
    const response = await axios.post(`${baseUrl}${endpoint}`);

  } catch (error) {
    // console.error('Error hitting current price endpoint:', error.message);
  }
}, 7000);
// Export the app
module.exports = app;
