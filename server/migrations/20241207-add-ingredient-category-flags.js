'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subcategories', 'is_basic_ingredient', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('Subcategories', 'is_fresh_produce', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('Subcategories', 'is_processed_food', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Subcategories', ['is_basic_ingredient']);
    await queryInterface.addIndex('Subcategories', ['is_fresh_produce']);
    await queryInterface.addIndex('Subcategories', ['is_processed_food']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subcategories', 'is_basic_ingredient');
    await queryInterface.removeColumn('Subcategories', 'is_fresh_produce');
    await queryInterface.removeColumn('Subcategories', 'is_processed_food');
  }
}; 