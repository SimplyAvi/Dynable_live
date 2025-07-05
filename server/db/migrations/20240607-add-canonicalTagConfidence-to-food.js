module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Food', 'canonicalTagConfidence', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Confidence level for canonicalTag assignment: confident, suggested, none'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Food', 'canonicalTagConfidence');
  }
}; 