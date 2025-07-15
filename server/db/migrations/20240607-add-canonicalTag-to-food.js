module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Food');
    if (!tableInfo.canonicalTag) {
      await queryInterface.addColumn('Food', 'canonicalTag', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Food');
    if (tableInfo.canonicalTag) {
      await queryInterface.removeColumn('Food', 'canonicalTag');
    }
  }
}; 