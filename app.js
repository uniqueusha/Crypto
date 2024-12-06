const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const pool = require('./db')
// Import routes
const coinRoute = require('./src/routes/coin.routes');
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
// app.use('/v1/api/organization', organizationRoutes);
app.get('/health', async (req, res) => {
  res.json("Server is running");
});

// Export the app
module.exports = app;
