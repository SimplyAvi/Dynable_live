require('dotenv').config();
// server.js
const express = require('express');
const cors = require('cors')
const sequelize = require('./db/database'); // Make sure this path is correct
const Food = require('./db/models/Food');
const FoodNutrient = require('./db/models/FoodNutrient');
const Recipe = require('./db/models/Recipe/Recipe')
const Ingredient = require('./db/models/Recipe/Ingredient')
const foodRoutes = require('./api/foodRoutes')
const recipeRoutes = require('./api/recipeRoutes')
const foodCategoryRoutes = require('./api/catagoriesRoutes')
const authRoutes = require('./api/authRoutes')
const cartRoutes = require('./api/cartRoutes')
// const Nutrient = require('./db/models/Nutrient');
// const FoodNutrientDerivation = require('./db/models/FoodNutrientDerivation');
// const FoodNutrientSource = require('./db/models/FoodNutrientSource');
// const FoodAttribute = require('./db/models/FoodAttribute');
// const FoodAttributeType = require('./db/models/FoodAttributeType');

const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

// Parse application/json
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

app.use('/api', foodRoutes);
app.use('/api', recipeRoutes);
app.use('/api', foodCategoryRoutes);
app.use('/api', authRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api/data', (req, res) => {
  // Your backend logic here
  res.json({ message: 'Hello from the server!' });
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Define associations (foreign key relationships)
    Food.hasMany(FoodNutrient, { foreignKey: 'foodId' });
    FoodNutrient.belongsTo(Food, { foreignKey: 'foodId' });

    // Define other associations as needed

    // Step 4: Sync db/models with the database
    await sequelize.sync();
    // await sequelize.sync({force:true}); //For clearing the table on connection
    console.log('All db/models were synchronized successfully.');

    // Start your express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();