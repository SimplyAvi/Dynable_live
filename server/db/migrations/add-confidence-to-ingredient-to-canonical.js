module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientToCanonicals');
    if (!tableInfo.confidence) {
      await queryInterface.addColumn('IngredientToCanonicals', 'confidence', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'confident'
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('IngredientToCanonicals');
    if (tableInfo.confidence) {
      await queryInterface.removeColumn('IngredientToCanonicals', 'confidence');
    }
  }
}; 