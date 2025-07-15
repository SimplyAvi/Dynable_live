module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Food');
    if (!tableInfo.canonicalTagConfidence) {
      await queryInterface.addColumn('Food', 'canonicalTagConfidence', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Food');
    if (tableInfo.canonicalTagConfidence) {
      await queryInterface.removeColumn('Food', 'canonicalTagConfidence');
    }
  }
}; 