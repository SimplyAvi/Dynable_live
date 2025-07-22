require('dotenv').config();
// server.js
const express = require('express');
const cors = require('cors')
const sequelize = require('./db/database'); // Simple database connection
const IngredientCategorized = require('./db/models/IngredientCategorized');
const FoodNutrient = require('./db/models/FoodNutrient'); // Fixed import
const Recipe = require('./db/models/Recipe/Recipe')
const RecipeIngredient = require('./db/models/Recipe/RecipeIngredient') // Fixed import
const foodRoutes = require('./api/foodRoutes')
const recipeRoutes = require('./api/recipeRoutes')
const foodCategoryRoutes = require('./api/catagoriesRoutes')
const authRoutes = require('./api/authRoutes')
const cartRoutes = require('./api/cartRoutes')
const allergenRoutes = require('./api/allergenRoutes')
const sellerRoutes = require('./api/sellerRoutes') // New seller routes
// const Nutrient = require('./db/models/Nutrient');
// const IngredientCategorizedNutrientDerivation = require('./db/models/IngredientCategorizedNutrientDerivation');
// const IngredientCategorizedNutrientSource = require('./db/models/IngredientCategorizedNutrientSource');
// const IngredientCategorizedAttribute = require('./db/models/IngredientCategorizedAttribute');
// const IngredientCategorizedAttributeType = require('./db/models/IngredientCategorizedAttributeType');

const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

// Parse application/json
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true,
}));

// API Routes
app.use('/api/product', foodRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api', foodCategoryRoutes);
app.use('/api', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', allergenRoutes);
app.use('/api', sellerRoutes); // New seller routes

app.get('/api/data', (req, res) => {
  // Your backend logic here
  res.json({ message: 'Hello from the server!' });
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Define associations (foreign key relationships)
    IngredientCategorized.hasMany(FoodNutrient, { foreignKey: 'foodId' });
    FoodNutrient.belongsTo(IngredientCategorized, { foreignKey: 'foodId' });

    // Define other associations as needed

    // Step 4: Database sync disabled to avoid RLS policy conflicts
    // await syncDatabase(); // Temporarily disabled for safety
    // await sequelize.sync({force:true}); //For clearing the table on connection
    console.log('Database sync disabled - using existing schema');

    // Start your express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('RBAC System Status:');
      console.log('✅ Authentication routes with role-based access');
      console.log('✅ Seller management routes');
      console.log('✅ Identity linking for anonymous users');
      console.log('✅ JWT utilities with role claims');
      console.log('✅ Role-based middleware protection');
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();