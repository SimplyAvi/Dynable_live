module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientCategorized');
    if (!tableInfo.canonicalTagConfidence) {
      await queryInterface.addColumn('IngredientCategorized', 'canonicalTagConfidence', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientCategorized');
    if (tableInfo.canonicalTagConfidence) {
      await queryInterface.removeColumn('IngredientCategorized', 'canonicalTagConfidence');
    }
  }
}; 