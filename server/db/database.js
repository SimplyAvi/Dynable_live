/**
 * Database Configuration and Initialization
 * 
 * This file sets up the Sequelize ORM connection to PostgreSQL and handles
 * database synchronization. The configuration is loaded from config.json to
 * keep sensitive information separate from the code.
 */

const { Sequelize } = require('sequelize');
const allConfig = require('./config.json');
const config = allConfig[process.env.NODE_ENV || 'development'];
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

// ADD DEBUG LOGGING
console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV);
console.log('DEBUG: config.use_env_variable:', config.use_env_variable);
console.log('DEBUG: process.env[config.use_env_variable]:', process.env[config.use_env_variable]);
console.log('DEBUG: Full config:', config);

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config;

// Allow override with DB_URL (for Supabase or cloud)
let DB_URL = process.env.SUPABASE_DB_URL || process.env.DB_URL;

// Helper: ensure ?sslmode=require is present in connection string
function ensureSSLMode(url) {
  if (!url) return url;
  if (url.includes('sslmode=')) return url;
  return url.includes('?') ? url + '&sslmode=require' : url + '?sslmode=require';
}

console.log('[DB INIT] NODE_ENV:', env);
console.log('[DB INIT] DB_URL:', DB_URL ? DB_URL.replace(/:[^:]*@/, ':****@') : 'none');
console.log('[DB INIT] dbConfig:', dbConfig);

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

/**
 * Database Synchronization
 * 
 * This section keeps the database schema in sync with our Sequelize models.
 * { alter: true } will:
 * 1. Keep existing tables and data
 * 2. Add any missing columns
 * 3. Update column types if needed
 * 
 * This is safer than { force: true } as it preserves existing data
 * while ensuring the schema matches our models.
 */
sequelize.sync({ alter: true }).then(() => {
  console.log(`Database synchronized successfully [${env}]`);
}).catch(err => {
  console.error('Error synchronizing database:', err);
});

// Health check endpoint for deployment
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.get('/health', (req, res) => res.status(200).send('OK'));
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`[HealthCheck] Listening on port ${port}`));
}

module.exports = sequelize;
