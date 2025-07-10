# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

# Backend & API Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Setup Backend
```bash
cd server
npm install
npm start
```
Backend runs on `http://localhost:5001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile (requires auth)
- `GET /api/auth/google/callback` - Google OAuth callback

### Products & Ingredients
- `GET /api/product/foods` - List all foods (paginated)
- `GET /api/product/search?name=<query>` - Search products
- `POST /api/product/by-ingredient` - Get products by ingredient name
- `POST /api/product/subcat` - Get products by subcategory (with allergen filtering)
- `POST /api/product/nosubcat` - Get products without subcategory

### Recipes
- `GET /api/recipe/?id=<id>` - Get recipe by ID
- `POST /api/recipe/` - Search/filter recipes
- `GET /api/recipe/substitute-products?canonicalIngredient=<name>` - Get substitutes for ingredient

### Categories & Allergens
- `GET /api/foodCategories` - Get category hierarchy with subcategories
- `GET /api/allergens` - Get all available allergens
- `GET /api/allergens/derivatives?allergen=<name>` - Get allergen derivatives

### Cart (requires authentication)
- `GET /api/cart/` - Get user's cart
- `POST /api/cart/` - Add item to cart
- `POST /api/cart/checkout` - Checkout cart
- `GET /api/cart/orders` - Get user's order history

## 🛠️ Data Processing Scripts

### Location
All data processing scripts are in `server/scripts/data-processing/`

### Key Scripts
- `cleanIngredientName.js` - Clean ingredient names (removes measurements, etc.)
- `debug_product_matching.js` - Debug product matching logic
- `comprehensive_recipe_audit.js` - Audit recipe ingredient mappings
- `add_core_pure_products.js` - Add missing pure products for core ingredients

### Run Health Check
```bash
cd server
node test_api_endpoint.js
```

### Run Data Audit
```bash
cd server/scripts/data-processing
node comprehensive_recipe_audit.js
```

## 📊 Current System Status

### Mapping Coverage
- **83.9%** of recipe ingredients successfully mapped
- **43.5%** have real/branded products available
- **15.2%** remain unmapped

### Database Models
- **Food** - Product database with allergen info
- **Recipe/Ingredient** - Recipe ingredients and quantities
- **Category/Subcategory** - Food categorization hierarchy
- **CanonicalIngredient** - Standardized ingredient names
- **IngredientToCanonical** - Mapping messy names to canonicals
- **AllergenDerivative** - Allergen substitution logic

## 🔧 Troubleshooting

### Common Issues

#### 1. 500 Error on `/api/foodCategories`
**Cause**: Missing `as: 'subcategories'` in Category association
**Fix**: Ensure `Category.hasMany(Subcategory, { foreignKey: 'CategoryID', as: 'subcategories' })` in `server/db/models/index.js`

#### 2. 400 Error on `/api/recipe/substitute-products`
**Cause**: Missing `canonicalIngredient` query parameter
**Fix**: Always include `?canonicalIngredient=<ingredient_name>`

#### 3. 401 Unauthorized on Cart/Auth endpoints
**Cause**: Missing or invalid JWT token
**Fix**: Include `Authorization: Bearer <token>` header

#### 4. Empty product results
**Cause**: Ingredient not mapped to canonical
**Fix**: Run `add_core_pure_products.js` or check mapping in database

### Database Issues
- **Foreign key constraints**: Run `fix_subcategories_fk.js`
- **Missing canonicals**: Run `add_missing_canonicals.js`
- **Broken mappings**: Run `fix_broken_mappings.js`

## 🎯 Development Workflow

1. **Test endpoints**: `node test_api_endpoint.js`
2. **Audit data quality**: `node comprehensive_recipe_audit.js`
3. **Fix mappings**: Run appropriate data processing scripts
4. **Verify changes**: Re-run health check

## 📈 Performance Notes

- **Caching**: Category hierarchy is cached for 1 hour
- **Pagination**: Product/recipe endpoints support pagination
- **Allergen filtering**: Real-time filtering based on user preferences
- **Substitute logic**: Automatic allergen-based substitution suggestions

For detailed data processing documentation, see `server/scripts/data-processing/README.md`
