const { Sequelize } = require('sequelize');
const config = require('./config.json'); // Assuming config.json is in the same directory

// Use the 'development' configuration from config.json
const { username, password, database, host, port, dialect } = config.development;


// Replace with your actual database connection details
const sequelize = new Sequelize(database, username, password, {
  host: host,
  // port: port,
  dialect: dialect,
});

module.exports = sequelize;
