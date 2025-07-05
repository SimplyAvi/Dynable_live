// API Configuration for different environments
const config = {
  development: {
    baseURL: 'http://localhost:5001',
    apiEndpoints: {
      allergens: '/api/allergens',
      allergensDerivatives: '/api/allergens/derivatives',
      products: '/api/product',
      recipes: '/api/recipe',
      auth: '/api/auth',
      cart: '/api/cart'
    }
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://api.dynable.com',
    apiEndpoints: {
      allergens: '/api/allergens',
      allergensDerivatives: '/api/allergens/derivatives',
      products: '/api/product',
      recipes: '/api/recipe',
      auth: '/api/auth',
      cart: '/api/cart'
    }
  },
  test: {
    baseURL: 'http://localhost:5001',
    apiEndpoints: {
      allergens: '/api/allergens',
      allergensDerivatives: '/api/allergens/derivatives',
      products: '/api/product',
      recipes: '/api/recipe',
      auth: '/api/auth',
      cart: '/api/cart'
    }
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export current config
export const apiConfig = config[environment];

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};

// Export individual endpoints for convenience
export const {
  allergens,
  allergensDerivatives,
  products,
  recipes,
  auth,
  cart
} = apiConfig.apiEndpoints; 