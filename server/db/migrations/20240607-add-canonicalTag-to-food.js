module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientCategorized');
    if (!tableInfo.canonicalTag) {
      await queryInterface.addColumn('IngredientCategorized', 'canonicalTag', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientCategorized');
    if (tableInfo.canonicalTag) {
      await queryInterface.removeColumn('IngredientCategorized', 'canonicalTag');
    }
  }
}; 