'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('IngredientCategorized', 'description', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('IngredientCategorized', 'description', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  }
}; 