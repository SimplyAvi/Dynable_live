# Environment Setup Guide

## Quick Start

### 1. Frontend Setup
```bash
npm install
npm start
```

### 2. Backend Setup (Optional)
If you want full functionality with allergen database:

```bash
cd server
npm install
npm start
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
# Create .env file with fallback configuration
echo "REACT_APP_API_URL=http://localhost:5001" > .env
echo "NODE_ENV=development" >> .env
```

#### For Production:
```bash
# Set your production API URL
echo "REACT_APP_API_URL=https://your-backend-url.com" > .env
echo "NODE_ENV=production" >> .env
```

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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5001` |
| `NODE_ENV` | Environment mode | `development` |

## Fallback Behavior

The application gracefully handles missing backend services:
- Shows basic allergen list instead of empty scroller
- Logs helpful error messages to console
- Maintains core functionality
- Provides clear feedback about connection status 