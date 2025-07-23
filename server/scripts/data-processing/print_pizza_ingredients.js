const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:5001/api/recipe/?page=1&limit=100', {
      search: 'pizza',
      excludeIngredients: []
    });
    res.data.forEach(recipe => {
      console.log('Recipe:', recipe.title);
      recipe.ingredients.forEach(ing => {
        if (ing.name) {
          console.log('  Ingredient:', ing.name);
        }
      });
    });
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err);
  }
})();
