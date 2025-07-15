const express = require('express');
const router = express.Router();
const { AllergenDerivative } = require('../db/models');

// GET /api/allergens - Get all available allergens from database
router.get('/allergens', async (req, res) => {
  console.log('[AllergenRoutes] GET /api/allergens request received');
  console.log('[AllergenRoutes] Request headers:', req.headers);
  try {
    // Get unique allergens from AllergenDerivative table
    const allergens = await AllergenDerivative.findAll({
      attributes: ['allergen'],
      group: ['allergen'],
      order: [['allergen', 'ASC']]
    });

    // Convert to frontend format
    const allergenList = {};
    allergens.forEach(item => {
      const allergenKey = item.allergen.toLowerCase().replace(/\s+/g, '');
      allergenList[allergenKey] = false; // Default to false for frontend state
    });

    console.log(`[AllergenRoutes] Returning ${Object.keys(allergenList).length} allergens`);
    res.json(allergenList);
  } catch (error) {
    console.error('[AllergenRoutes] Error fetching allergens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/allergens/derivatives - Get allergen derivatives for substitution logic
router.get('/allergens/derivatives', async (req, res) => {
  try {
    const { allergen } = req.query;
    
    if (!allergen) {
      return res.status(400).json({ error: 'Allergen parameter required' });
    }

    const derivatives = await AllergenDerivative.findAll({
      where: {
        allergen: allergen.toLowerCase()
      },
      attributes: ['derivative'],
      order: [['derivative', 'ASC']]
    });

    res.json(derivatives.map(d => d.derivative));
  } catch (error) {
    console.error('Error fetching allergen derivatives:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 