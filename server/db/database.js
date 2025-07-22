/**
 * Database Configuration and Initialization
 * 
 * This file sets up the Sequelize ORM connection to PostgreSQL and handles
 * database synchronization. The configuration is loaded from config.json to
 * keep sensitive information separate from the code.
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Database sync function (currently disabled for safety)
const syncDatabase = async () => {
  console.log('Database sync disabled - using existing schema');
  return Promise.resolve();
};

// Health check endpoint for deployment
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.get('/health', (req, res) => res.status(200).send('OK'));
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`[HealthCheck] Listening on port ${port}`));
}

module.exports = sequelize;
