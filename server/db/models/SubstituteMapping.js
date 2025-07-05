const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const SubstituteMapping = sequelize.define('SubstituteMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  substituteType: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  searchTerms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = SubstituteMapping; 