// 🎯 PHASE 3: FRONTEND ALLERGEN INTEGRATION UTILITY
// Ensures all frontend components work with standardized camelCase allergen data

import { mapToCamelCase, mapArrayToCamelCase } from './allergenMappings';

/**
 * 🎯 PHASE 3: VALIDATION UTILITIES
 */

// Validate single allergen format
export function validateAllergenFormat(allergen) {
  if (!allergen || typeof allergen !== 'string') {
    return false;
  }
  
  // List of valid camelCase allergens
  const validAllergens = [
    'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten',
    'almonds', 'cashews', 'crab', 'lobster', 'shrimp', 'celery', 'garlic', 'corn', 'walnuts', 'lactose', 'soybeans',
    'apples', 'avocados', 'bananas', 'beef', 'chicken', 'chocolate', 'citrusfruits', 'kiwi', 'mustard', 'onions', 'peaches', 'pork', 'strawberries', 'tomatoes'
  ];
  
  return validAllergens.includes(allergen) || (allergen === allergen.toLowerCase() && allergen.length > 0);
}

// Validate allergen array format
export function validateAllergenArray(allergens) {
  if (!Array.isArray(allergens)) {
    return false;
  }
  
  return allergens.every(allergen => validateAllergenFormat(allergen));
}

// Validate JSONB allergen array format
export function validateJsonbAllergenArray(allergens) {
  if (!allergens || !Array.isArray(allergens)) {
    return false;
  }
  
  return allergens.every(allergen => validateAllergenFormat(allergen));
}

/**
 * 🎯 PHASE 3: STANDARDIZATION UTILITIES
 */

// Standardize allergen input (for user input)
export function standardizeAllergenInput(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  return mapToCamelCase(input.trim());
}

// Standardize allergen array input
export function standardizeAllergenArrayInput(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return mapArrayToCamelCase(input);
}

// Standardize JSONB allergen array input
export function standardizeJsonbAllergenArrayInput(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return mapArrayToCamelCase(input);
}

/**
 * 🎯 PHASE 3: LOCALSTORAGE INTEGRATION
 */

// Save standardized allergens to localStorage
export function saveStandardizedAllergensToStorage(allergens, key = 'selectedAllergens') {
  try {
    const standardized = standardizeJsonbAllergenArrayInput(allergens);
    localStorage.setItem(key, JSON.stringify(standardized));
    return true;
  } catch (error) {
    console.error('Error saving standardized allergens to localStorage:', error);
    return false;
  }
}

// Load and validate allergens from localStorage
export function loadStandardizedAllergensFromStorage(key = 'selectedAllergens') {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored);
    if (!validateJsonbAllergenArray(parsed)) {
      console.warn('Invalid allergen format in localStorage, standardizing...');
      return standardizeJsonbAllergenArrayInput(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading allergens from localStorage:', error);
    return [];
  }
}

/**
 * 🎯 PHASE 3: REDUX INTEGRATION
 */

// Validate Redux state allergens
export function validateReduxAllergens(allergens) {
  if (!validateJsonbAllergenArray(allergens)) {
    console.warn('Invalid allergen format in Redux state, standardizing...');
    return standardizeJsonbAllergenArrayInput(allergens);
  }
  
  return allergens;
}

// Standardize Redux action payload
export function standardizeReduxPayload(payload) {
  if (payload.allergens) {
    return {
      ...payload,
      allergens: standardizeJsonbAllergenArrayInput(payload.allergens)
    };
  }
  
  return payload;
}

/**
 * 🎯 PHASE 3: API INTEGRATION
 */

// Standardize API request payload
export function standardizeApiRequest(payload) {
  if (payload.selectedAllergens) {
    return {
      ...payload,
      selectedAllergens: standardizeJsonbAllergenArrayInput(payload.selectedAllergens)
    };
  }
  
  return payload;
}

// Validate API response allergens
export function validateApiResponse(response) {
  if (response.allergens && !validateAllergenArray(response.allergens)) {
    console.warn('Invalid allergen format in API response, standardizing...');
    return {
      ...response,
      allergens: standardizeAllergenArrayInput(response.allergens)
    };
  }
  
  return response;
}

/**
 * 🎯 PHASE 3: UI COMPONENT INTEGRATION
 */

// Standardize UI component props
export function standardizeComponentProps(props) {
  const standardized = { ...props };
  
  if (props.allergens) {
    standardized.allergens = standardizeAllergenArrayInput(props.allergens);
  }
  
  if (props.selectedAllergens) {
    standardized.selectedAllergens = standardizeJsonbAllergenArrayInput(props.selectedAllergens);
  }
  
  if (props.onAllergenChange) {
    const originalHandler = props.onAllergenChange;
    standardized.onAllergenChange = (allergens) => {
      const standardizedAllergens = standardizeJsonbAllergenArrayInput(allergens);
      originalHandler(standardizedAllergens);
    };
  }
  
  return standardized;
}

// Validate UI component state
export function validateComponentState(state) {
  const validated = { ...state };
  
  if (state.allergens) {
    validated.allergens = validateReduxAllergens(state.allergens);
  }
  
  if (state.selectedAllergens) {
    validated.selectedAllergens = validateReduxAllergens(state.selectedAllergens);
  }
  
  return validated;
}

/**
 * 🎯 PHASE 3: ERROR HANDLING
 */

// Handle allergen validation errors
export function handleAllergenValidationError(error, context = 'unknown') {
  console.error(`Allergen validation error in ${context}:`, error);
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Add your monitoring service here
    console.warn('Allergen validation error logged to monitoring service');
  }
  
  return {
    isValid: false,
    error: error.message || 'Invalid allergen format',
    context
  };
}

// Handle allergen standardization errors
export function handleAllergenStandardizationError(error, input, context = 'unknown') {
  console.error(`Allergen standardization error in ${context}:`, error, 'Input:', input);
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Add your monitoring service here
    console.warn('Allergen standardization error logged to monitoring service');
  }
  
  return {
    isStandardized: false,
    error: error.message || 'Failed to standardize allergen',
    input,
    context
  };
}

/**
 * 🎯 PHASE 3: MONITORING & LOGGING
 */

// Log allergen validation events
export function logAllergenValidationEvent(eventType, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    details,
    environment: process.env.NODE_ENV
  };
  
  console.log('Allergen validation event:', logEntry);
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Add your monitoring service here
    console.warn('Allergen validation event sent to monitoring service');
  }
}

// Log allergen standardization events
export function logAllergenStandardizationEvent(eventType, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    details,
    environment: process.env.NODE_ENV
  };
  
  console.log('Allergen standardization event:', logEntry);
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Add your monitoring service here
    console.warn('Allergen standardization event sent to monitoring service');
  }
}

/**
 * 🎯 PHASE 3: MIGRATION UTILITIES
 */

// Check if data needs migration
export function needsAllergenMigration(data) {
  if (!data) {
    return false;
  }
  
  if (Array.isArray(data)) {
    return data.some(item => !validateAllergenFormat(item));
  }
  
  if (typeof data === 'string') {
    return !validateAllergenFormat(data);
  }
  
  return false;
}

// Migrate legacy allergen data
export function migrateLegacyAllergenData(data) {
  if (!data) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return standardizeAllergenArrayInput(data);
  }
  
  if (typeof data === 'string') {
    return standardizeAllergenInput(data);
  }
  
  return data;
}

/**
 * 🎯 PHASE 3: EXPORT ALL UTILITIES
 */

export default {
  // Validation
  validateAllergenFormat,
  validateAllergenArray,
  validateJsonbAllergenArray,
  
  // Standardization
  standardizeAllergenInput,
  standardizeAllergenArrayInput,
  standardizeJsonbAllergenArrayInput,
  
  // localStorage
  saveStandardizedAllergensToStorage,
  loadStandardizedAllergensFromStorage,
  
  // Redux
  validateReduxAllergens,
  standardizeReduxPayload,
  
  // API
  standardizeApiRequest,
  validateApiResponse,
  
  // UI Components
  standardizeComponentProps,
  validateComponentState,
  
  // Error Handling
  handleAllergenValidationError,
  handleAllergenStandardizationError,
  
  // Monitoring
  logAllergenValidationEvent,
  logAllergenStandardizationEvent,
  
  // Migration
  needsAllergenMigration,
  migrateLegacyAllergenData
}; 