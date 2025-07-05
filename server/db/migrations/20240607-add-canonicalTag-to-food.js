module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Food', 'canonicalTag', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Main canonical ingredient/category for precise matching'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Food', 'canonicalTag');
  }
}; 