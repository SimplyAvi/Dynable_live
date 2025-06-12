/**
 * Database Configuration and Initialization
 * 
 * This file sets up the Sequelize ORM connection to PostgreSQL and handles
 * database synchronization. The configuration is loaded from config.json to
 * keep sensitive information separate from the code.
 */

const { Sequelize } = require('sequelize');
const config = require('./config.json'); // Assuming config.json is in the same directory

// Extract database configuration from config.json
// This separation allows different configurations for development, testing, and production
const { username, password, database, host, port, dialect } = config.development;

// Initialize Sequelize with the configuration
// This creates the connection to the PostgreSQL database
const sequelize = new Sequelize(database, username, password, {
  host: host,
  // port: port, // Port is commented out as it's typically the default 5432
  dialect: dialect, // Specifies we're using PostgreSQL
  logging: false, // Disables SQL query logging in console for cleaner output
});

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
  console.log('Database synchronized successfully');
}).catch(err => {
  console.error('Error synchronizing database:', err);
});

module.exports = sequelize;
