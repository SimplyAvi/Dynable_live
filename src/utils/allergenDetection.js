// File: src/utils/allergenDetection.js
// Bulletproof allergen detection utilities

import { supabase } from './supabaseClient';

/**
 * Detect allergens in a product description using the database function
 */
export const detectAllergensInProduct = async (productDescription, targetAllergen) => {
  const defaultResponse = {
    detected_allergens: [],
    safe_allergens: [],
    has_cross_contamination: false,
    confidence: 0.5
  };

  try {
    const { data, error } = await supabase.rpc('detect_allergens_in_description', {
      product_description: productDescription,
      target_allergen: targetAllergen
    });
    
    if (error) {
      console.error('Error in allergen detection:', error);
      return defaultResponse;
    }
    
    // Handle both object and string responses from the database function
    let result;
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw data:', data);
        return defaultResponse;
      }
    } else if (typeof data === 'object' && data !== null) {
      result = data;
    } else {
      console.error('Unexpected data type from allergen detection:', typeof data, data);
      return defaultResponse;
    }
    
    // Validate the result structure
    if (!result || typeof result !== 'object') {
      console.error('Invalid result structure:', result);
      return defaultResponse;
    }
    
    // Ensure all required fields exist
    return {
      detected_allergens: Array.isArray(result.detected_allergens) ? result.detected_allergens : [],
      safe_allergens: Array.isArray(result.safe_allergens) ? result.safe_allergens : [],
      has_cross_contamination: Boolean(result.has_cross_contamination),
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
    };
  } catch (error) {
    console.error('Failed to detect allergens:', error);
    return defaultResponse;
  }
};

/**
 * Check if a product is safe for multiple allergens
 */
export const isProductSafeForAllergens = async (productDescription, userAllergens) => {
  if (!userAllergens || userAllergens.length === 0) return true;
  
  try {
    for (const allergen of userAllergens) {
      const detection = await detectAllergensInProduct(productDescription, allergen);
      
      // Product is unsafe if it contains the allergen and is NOT explicitly safe
      if (detection.detected_allergens.includes(allergen) && 
          !detection.safe_allergens.includes(allergen)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking product safety:', error);
    // Fail safe - if we can't determine safety, assume unsafe
    return false;
  }
};

/**
 * Get comprehensive allergen analysis for a product
 */
export const analyzeProductAllergens = async (productDescription, userAllergens = []) => {
  const analysis = {
    detectedAllergens: new Set(),
    safeForAllergens: new Set(),
    hasCrossContamination: false,
    overallConfidence: 0,
    isSafeForUser: true,
    warnings: []
  };
  
  try {
    // Check each potential allergen
    const allAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'];
    
    for (const allergen of allAllergens) {
      const detection = await detectAllergensInProduct(productDescription, allergen);
      
      // Track detected allergens
      detection.detected_allergens.forEach(a => analysis.detectedAllergens.add(a));
      detection.safe_allergens.forEach(a => analysis.safeForAllergens.add(a));
      
      if (detection.has_cross_contamination) {
        analysis.hasCrossContamination = true;
      }
      
      // Update overall confidence (average)
      analysis.overallConfidence += detection.confidence;
      
      // Check if unsafe for user's specific allergens
      if (userAllergens.includes(allergen)) {
        if (detection.detected_allergens.includes(allergen) && 
            !detection.safe_allergens.includes(allergen)) {
          analysis.isSafeForUser = false;
          analysis.warnings.push(`Contains ${allergen} allergen`);
        }
      }
    }
    
    analysis.overallConfidence /= allAllergens.length;
    
    // Convert sets to arrays for easier use
    analysis.detectedAllergens = Array.from(analysis.detectedAllergens);
    analysis.safeForAllergens = Array.from(analysis.safeForAllergens);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing product allergens:', error);
    return {
      ...analysis,
      detectedAllergens: [],
      safeForAllergens: [],
      isSafeForUser: false,
      warnings: ['Unable to analyze allergens - manual verification required']
    };
  }
};

/**
 * Batch allergen safety check for multiple products
 */
export const batchCheckProductSafety = async (products, userAllergens) => {
  if (!userAllergens || userAllergens.length === 0) {
    return products.map(p => ({ ...p, isSafeForUser: true, allergenAnalysis: null }));
  }
  
  const results = [];
  
  for (const product of products) {
    try {
      const isSafe = await isProductSafeForAllergens(product.description, userAllergens);
      const analysis = await analyzeProductAllergens(product.description, userAllergens);
      
      results.push({
        ...product,
        isSafeForUser: isSafe,
        allergenAnalysis: analysis
      });
    } catch (error) {
      console.error(`Error checking safety for product ${product.id}:`, error);
      results.push({
        ...product,
        isSafeForUser: false,
        allergenAnalysis: {
          warnings: ['Safety check failed - manual verification required']
        }
      });
    }
  }
  
  return results;
}; 