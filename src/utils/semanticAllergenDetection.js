// File: src/utils/semanticAllergenDetection.js
// Semantic-based allergen detection using the new database schema

import { supabase } from './supabaseClient';

/**
 * Semantic allergen detection using the new ingredient taxonomy
 * This replaces the old text-based detection that caused false positives
 */
export const detectAllergensSemantic = async (productDescription, targetAllergen) => {
  const defaultResponse = {
    detected_allergens: [],
    safe_allergens: [],
    has_cross_contamination: false,
    confidence: 0.5
  };

  try {
    // Step 1: Find the semantic ingredient for the target allergen
    const { data: ingredientData, error: ingredientError } = await supabase
      .from('ingredients')
      .select('id, canonical_name, category, allergens')
      .eq('canonical_name', targetAllergen)
      .single();

    if (ingredientError || !ingredientData) {
      console.log(`[SEMANTIC ALLERGEN] No semantic ingredient found for: ${targetAllergen}`);
      return defaultResponse;
    }

    // Step 2: Check if the product is mapped to this ingredient
    const { data: productMappings, error: mappingError } = await supabase
      .from('ingredient_product_mapping')
      .select('product_id, confidence_score, match_type')
      .eq('ingredient_id', ingredientData.id)
      .gte('confidence_score', 0.80);

    if (mappingError || !productMappings || productMappings.length === 0) {
      console.log(`[SEMANTIC ALLERGEN] No product mappings found for: ${targetAllergen}`);
      return defaultResponse;
    }

    // Step 3: Check if this specific product is mapped to this ingredient
    // We need to find the product by description to get its ID
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, description, allergens')
      .ilike('description', `%${productDescription.slice(0, 50)}%`)
      .limit(5);

    if (productError || !products || products.length === 0) {
      console.log(`[SEMANTIC ALLERGEN] Product not found in database`);
      return defaultResponse;
    }

    // Step 4: Check if any of the found products are mapped to the allergen ingredient
    const productIds = products.map(p => p.id);
    const relevantMappings = productMappings.filter(mapping => 
      productIds.includes(mapping.product_id)
    );

    if (relevantMappings.length === 0) {
      console.log(`[SEMANTIC ALLERGEN] Product not semantically mapped to: ${targetAllergen}`);
      return defaultResponse;
    }

    // Step 5: Check the product's actual allergen information
    const product = products.find(p => 
      relevantMappings.some(m => m.product_id === p.id)
    );

    if (!product) {
      return defaultResponse;
    }

    // Step 6: Determine if the product actually contains the allergen
    const hasAllergen = product.allergens && product.allergens.includes(targetAllergen);
    const isExplicitlySafe = product.allergens && product.allergens.includes(`${targetAllergen}-free`);

    const result = {
      detected_allergens: hasAllergen ? [targetAllergen] : [],
      safe_allergens: isExplicitlySafe ? [targetAllergen] : [],
      has_cross_contamination: false, // Semantic matching doesn't detect cross-contamination
      confidence: relevantMappings[0]?.confidence_score || 0.5
    };

    console.log(`[SEMANTIC ALLERGEN] Result for ${targetAllergen}:`, result);
    return result;

  } catch (error) {
    console.error('[SEMANTIC ALLERGEN] Error in semantic allergen detection:', error);
    return defaultResponse;
  }
};

/**
 * Check if a product is safe for multiple allergens using semantic matching
 */
export const isProductSafeForAllergensSemantic = async (productDescription, userAllergens) => {
  if (!userAllergens || userAllergens.length === 0) return true;
  
  try {
    for (const allergen of userAllergens) {
      const detection = await detectAllergensSemantic(productDescription, allergen);
      
      // Product is unsafe if it contains the allergen and is NOT explicitly safe
      if (detection.detected_allergens.includes(allergen) && 
          !detection.safe_allergens.includes(allergen)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking product safety with semantic matching:', error);
    // Fail safe - if we can't determine safety, assume unsafe
    return false;
  }
};

/**
 * Get comprehensive allergen analysis using semantic matching
 */
export const analyzeProductAllergensSemantic = async (productDescription, userAllergens = []) => {
  const analysis = {
    detectedAllergens: new Set(),
    safeForAllergens: new Set(),
    hasCrossContamination: false,
    overallConfidence: 0,
    isSafeForUser: true,
    warnings: []
  };
  
  try {
    // Only check user's allergens to reduce API calls
    const allergensToCheck = userAllergens.length > 0 ? userAllergens : 
      ['milk', 'eggs', 'fish', 'shellfish', 'treenuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'];
    
    for (const allergen of allergensToCheck) {
      const detection = await detectAllergensSemantic(productDescription, allergen);
      
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
    
    analysis.overallConfidence /= allergensToCheck.length;
    
    // Convert sets to arrays for easier use
    analysis.detectedAllergens = Array.from(analysis.detectedAllergens);
    analysis.safeForAllergens = Array.from(analysis.safeForAllergens);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing product allergens with semantic matching:', error);
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
 * Batch allergen safety check for multiple products using semantic matching
 */
export const batchCheckProductSafetySemantic = async (products, userAllergens) => {
  if (!userAllergens || userAllergens.length === 0) {
    return products.map(p => ({ ...p, isSafeForUser: true, allergenAnalysis: null }));
  }
  
  const results = [];
  
  for (const product of products) {
    try {
      const isSafe = await isProductSafeForAllergensSemantic(product.description, userAllergens);
      const analysis = await analyzeProductAllergensSemantic(product.description, userAllergens);
      
      results.push({
        ...product,
        isSafeForUser: isSafe,
        allergenAnalysis: analysis
      });
    } catch (error) {
      console.error(`Error checking safety for product ${product.id} with semantic matching:`, error);
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
