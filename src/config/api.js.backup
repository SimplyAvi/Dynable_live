// Supabase API Configuration for different environments
const config = {
  development: {
    baseURL: 'https://fdojimqdhuqhimgjpdai.supabase.co',
    apiEndpoints: {
      // Supabase REST API endpoints
      allergens: '/rest/v1/AllergenDerivatives',
      allergensDerivatives: '/rest/v1/AllergenDerivatives',
      products: '/rest/v1/IngredientCategorized',
      recipes: '/rest/v1/Recipes',
      auth: '/auth/v1', // Supabase Auth endpoints
      cart: '/rest/v1/Carts',
      users: '/rest/v1/Users',
      categories: '/rest/v1/Categories',
      subcategories: '/rest/v1/Subcategories',
      ingredients: '/rest/v1/Ingredients'
    }
  },
  production: {
    baseURL: process.env.REACT_APP_SUPABASE_URL || 'https://fdojimqdhuqhimgjpdai.supabase.co',
    apiEndpoints: {
      allergens: '/rest/v1/AllergenDerivatives',
      allergensDerivatives: '/rest/v1/AllergenDerivatives',
      products: '/rest/v1/IngredientCategorized',
      recipes: '/rest/v1/Recipes',
      auth: '/auth/v1',
      cart: '/rest/v1/Carts',
      users: '/rest/v1/Users',
      categories: '/rest/v1/Categories',
      subcategories: '/rest/v1/Subcategories',
      ingredients: '/rest/v1/Ingredients'
    }
  },
  test: {
    baseURL: 'https://fdojimqdhuqhimgjpdai.supabase.co',
    apiEndpoints: {
      allergens: '/rest/v1/AllergenDerivatives',
      allergensDerivatives: '/rest/v1/AllergenDerivatives',
      products: '/rest/v1/IngredientCategorized',
      recipes: '/rest/v1/Recipes',
      auth: '/auth/v1',
      cart: '/rest/v1/Carts',
      users: '/rest/v1/Users',
      categories: '/rest/v1/Categories',
      subcategories: '/rest/v1/Subcategories',
      ingredients: '/rest/v1/Ingredients'
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

// Helper function to get Supabase headers
export const getSupabaseHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2ppbXFkaHVxaGltZ2pwZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTgwNzksImV4cCI6MjA2NjAzNDA3OX0.thlmaThwEBFvRUsWjQGr9JnKa-X5cdZEVm_Luz_GsXc',
    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2ppbXFkaHVxaGltZ2pwZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTgwNzksImV4cCI6MjA2NjAzNDA3OX0.thlmaThwEBFvRUsWjQGr9JnKa-X5cdZEVm_Luz_GsXc'}`
  };

  // Add auth token if requested and available
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function for Supabase REST API calls
export const supabaseApiCall = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const headers = getSupabaseHeaders(options.includeAuth !== false);
  
  const config = {
    method: options.method || 'GET',
    headers,
    ...options
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[SUPABASE API] Error:', error);
    throw error;
  }
};

// Export individual endpoints for convenience
export const {
  allergens,
  allergensDerivatives,
  products,
  recipes,
  auth,
  cart,
  users,
  categories,
  subcategories,
  ingredients
} = apiConfig.apiEndpoints; 