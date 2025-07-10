# Environment Setup Guide

## Quick Start

### 1. Frontend Setup
```bash
npm install
npm start
```

### 2. Backend Setup (Full Functionality)
If you want full functionality with the allergen/product/recipe database:

```bash
cd server
npm install
npm start
```

#### **Database Setup**
- Ensure your database is running and configured (see `server/db/config/config.json`).
- Run any required migrations:
  ```bash
  npx sequelize-cli db:migrate
  ```
- (Optional) Seed the database for initial data:
  ```bash
  npx sequelize-cli db:seed:all
  ```

### 3. Environment Configuration

#### For Development (with backend):
```bash
# Copy the example environment file
cp env.example .env
# The default configuration will work for local development
```

#### For Development (without backend):
```bash
echo "REACT_APP_API_URL=http://localhost:5001" > .env
echo "NODE_ENV=development" >> .env
```

#### For Production:
```bash
echo "REACT_APP_API_URL=https://your-backend-url.com" > .env
echo "NODE_ENV=production" >> .env
```

---

## Data Mapping, Audits, and Workflow

- **All ingredient mapping, normalization, and audit scripts are documented in:**
  - `server/DATA_METHODS_AND_IMPLEMENTATION.md`
- **To run the main audit:**
  ```bash
  cd server
  node phase3a_batch_optimized_audit.js
  ```
- **Audit results** are output to `auditRecipeIngredientProducts_after_cleanup.out` and related files. Only the latest outputs are kept; old files are regularly cleaned up.
- **For questions about mapping, normalization, or audit scripts,** see the documentation above or contact the data lead.

---

## Features by Environment

### ✅ With Backend Running
- Full allergen database (30+ allergens)
- Real-time product matching
- Advanced substitution logic
- Complete recipe functionality

### ✅ Without Backend (Fallback Mode)
- Basic allergen list (10 common allergens)
- Static product data
- Core functionality preserved
- Allergen scroller visible

---

## Troubleshooting

### Allergen Scroller Not Visible
1. Check browser console for API errors
2. Ensure backend is running (if using full features)
3. Check network connectivity
4. Verify environment variables are set correctly

### API Connection Issues
1. Verify backend server is running on correct port
2. Check firewall settings
3. Ensure CORS is properly configured
4. Try fallback mode if backend unavailable

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5001` |
| `NODE_ENV` | Environment mode | `development` |

---

## Fallback Behavior

The application gracefully handles missing backend services:
- Shows basic allergen list instead of empty scroller
- Logs helpful error messages to console
- Maintains core functionality
- Provides clear feedback about connection status

---

**For all data mapping, audit, and normalization questions, see `server/DATA_METHODS_AND_IMPLEMENTATION.md`.** 