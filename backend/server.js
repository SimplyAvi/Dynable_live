// server.js
const express = require('express');
const sequelize = require('./db/database'); // Make sure this path is correct
const Food = require('./db/models/Food');
const FoodNutrient = require('./db/models/FoodNutrient');
const Nutrient = require('./db/models/Nutrient');
const FoodNutrientDerivation = require('./db/models/FoodNutrientDerivation');
const FoodNutrientSource = require('./db/models/FoodNutrientSource');
const FoodAttribute = require('./db/models/FoodAttribute');
const FoodAttributeType = require('./db/models/FoodAttributeType');

const app = express();
const PORT = 5000;

app.get('/api/data', (req, res) => {
  // Your backend logic here
  res.json({ message: 'Hello from the server!' });
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Define associations (foreign key relationships)
    Food.hasMany(FoodNutrient, { foreignKey: 'foodId' });
    FoodNutrient.belongsTo(Food, { foreignKey: 'foodId' });

    // Define other associations as needed

    // Step 4: Sync db/models with the database
    await sequelize.sync({ force: true });
    console.log('All db/models were synchronized successfully.');

    // Start your express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();