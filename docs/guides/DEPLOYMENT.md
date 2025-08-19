# 🚀 DEPLOYMENT GUIDE

**Last Updated:** January 2025  
**Status:** ✅ CURRENT - Production Ready

---

## 📋 OVERVIEW

This guide covers the complete deployment process for Dynable, including environment setup, build configuration, and production deployment strategies.

### **Key Features:**
- ✅ Environment configuration
- ✅ Build optimization
- ✅ Production deployment
- ✅ Environment variables management
- ✅ Performance optimization
- ✅ Monitoring and logging

---

## 🛠️ PREREQUISITES

### **Required Tools:**
- Node.js 18+ 
- npm or yarn
- Git
- Supabase CLI (optional)
- Vercel CLI (for Vercel deployment)

### **Accounts:**
- Supabase account
- Vercel account (or other hosting provider)
- Google Cloud Console (for OAuth)

---

## 🔧 ENVIRONMENT SETUP

### **1. Environment Variables**

#### **Development (.env.local):**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (Development)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
REACT_APP_ENV=development
REACT_APP_API_TIMEOUT=20000
```

#### **Production (.env.production):**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (Production)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
REACT_APP_ENV=production
REACT_APP_API_TIMEOUT=30000
```

### **2. Supabase Configuration**

#### **Production Database Setup:**
1. **Create Production Project:**
   - Go to Supabase Dashboard
   - Create new project for production
   - Choose production region
   - Set strong database password

2. **Configure Authentication:**
   - Enable Google OAuth
   - Add production redirect URLs
   - Configure CORS origins

3. **Database Migration:**
   ```bash
   # Apply production schema
   supabase db push --project-ref your-production-project-ref
   ```

### **3. Google OAuth Setup**

#### **Production OAuth Configuration:**
1. **Google Cloud Console:**
   - Go to Google Cloud Console
   - Select your project
   - Go to APIs & Services → Credentials
   - Edit your OAuth 2.0 client
   - Add production redirect URIs:
     - `https://your-domain.com/auth/callback`
     - `https://your-production-supabase-project.supabase.co/auth/v1/callback`

2. **Update Environment Variables:**
   - Update `REACT_APP_GOOGLE_CLIENT_ID` with production client ID

---

## 🏗️ BUILD CONFIGURATION

### **1. Package.json Scripts**

#### **Development Scripts:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "build:prod": "GENERATE_SOURCEMAP=false react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/**/*.{js,jsx}",
    "lint:fix": "eslint --fix src/**/*.{js,jsx}"
  }
}
```

#### **Build Optimization:**
```json
{
  "scripts": {
    "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
    "build:clean": "rm -rf build && npm run build",
    "build:prod": "GENERATE_SOURCEMAP=false npm run build"
  }
}
```

### **2. Build Configuration**

#### **Optimize Bundle Size:**
```javascript
// webpack.config.js (if ejected)
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
          },
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

#### **Environment-Specific Builds:**
```bash
# Development build
npm run build

# Production build (no source maps)
npm run build:prod

# Production build with bundle analysis
npm run build:analyze
```

---

## 🚀 DEPLOYMENT STRATEGIES

### **1. Vercel Deployment (Recommended)**

#### **Setup Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

#### **Vercel Configuration (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/manifest.json",
      "dest": "/manifest.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_ENV": "production"
  }
}
```

#### **Environment Variables in Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all production environment variables

### **2. Netlify Deployment**

#### **Setup Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to Netlify
netlify deploy --prod --dir=build
```

#### **Netlify Configuration (netlify.toml):**
```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  GENERATE_SOURCEMAP = "false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[headers]
  [headers."/*"]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### **3. AWS S3 + CloudFront**

#### **S3 Bucket Setup:**
```bash
# Create S3 bucket
aws s3 mb s3://your-app-bucket

# Configure bucket for static website hosting
aws s3 website s3://your-app-bucket --index-document index.html --error-document index.html

# Upload build files
aws s3 sync build/ s3://your-app-bucket --delete

# Set bucket policy for public read access
aws s3api put-bucket-policy --bucket your-app-bucket --policy file://bucket-policy.json
```

#### **CloudFront Distribution:**
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Configure custom domain (optional)
4. Set up SSL certificate
5. Configure cache behaviors

---

## 🔒 SECURITY CONFIGURATION

### **1. Environment Variables Security**

#### **Never Commit Secrets:**
```bash
# .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

#### **Use Environment-Specific Files:**
```bash
# Development
.env.local

# Production (set in hosting platform)
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

### **2. CORS Configuration**

#### **Supabase CORS Settings:**
1. Go to Supabase Dashboard → Settings → API
2. Add production domains:
   - `https://your-domain.com`
   - `https://www.your-domain.com`
3. Remove development URLs in production

### **3. Security Headers**

#### **Add Security Headers:**
```javascript
// In your hosting platform or CDN
{
  "headers": {
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-supabase-project.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-supabase-project.supabase.co;"
  }
}
```

---

## 📊 PERFORMANCE OPTIMIZATION

### **1. Build Optimization**

#### **Code Splitting:**
```javascript
// Use React.lazy for code splitting
const ProductPage = React.lazy(() => import('./pages/ProductPage'));
const RecipePage = React.lazy(() => import('./pages/RecipePage'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <ProductPage />
</Suspense>
```

#### **Bundle Analysis:**
```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer build/static/js/*.js
```

### **2. Image Optimization**

#### **Optimize Images:**
```bash
# Install image optimization tools
npm install --save-dev imagemin imagemin-webp

# Optimize images before build
npm run optimize-images
```

#### **Use WebP Format:**
```javascript
// Serve WebP images with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### **3. Caching Strategy**

#### **Static Asset Caching:**
```javascript
// Cache static assets for 1 year
{
  "headers": {
    "/static/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "/favicon.ico": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}
```

#### **API Response Caching:**
```javascript
// Cache API responses appropriately
const cacheHeaders = {
  'Cache-Control': 'public, max-age=300' // 5 minutes
}
```

---

## 🔍 MONITORING & LOGGING

### **1. Error Tracking**

#### **Sentry Integration:**
```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Initialize Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 1.0,
});
```

#### **Error Boundaries:**
```javascript
// Create error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### **2. Performance Monitoring**

#### **Web Vitals:**
```javascript
// Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### **3. Analytics**

#### **Google Analytics:**
```javascript
// Initialize Google Analytics
import ReactGA from 'react-ga';

ReactGA.initialize('GA_TRACKING_ID');
ReactGA.pageview(window.location.pathname);
```

---

## 🚨 TROUBLESHOOTING

### **Common Deployment Issues:**

#### **1. Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors
- Review build logs

#### **2. Environment Variables:**
- Verify all required variables are set
- Check variable names (case-sensitive)
- Ensure variables are prefixed with `REACT_APP_`
- Test in development first

#### **3. CORS Errors:**
- Check Supabase CORS configuration
- Verify domain is correctly added
- Check for typos in URLs
- Test with different browsers

#### **4. Authentication Issues:**
- Verify OAuth redirect URLs
- Check Google OAuth configuration
- Review Supabase auth settings
- Test authentication flow

#### **5. Performance Issues:**
- Analyze bundle size
- Check for large dependencies
- Optimize images
- Review caching strategy

---

## 📋 DEPLOYMENT CHECKLIST

### **Pre-Deployment:**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Supabase production project ready
- [ ] Google OAuth production credentials
- [ ] CORS origins updated
- [ ] Security headers configured

### **Deployment:**
- [ ] Build successful
- [ ] Static files uploaded
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] CDN configured (if applicable)

### **Post-Deployment:**
- [ ] Authentication working
- [ ] Cart functionality working
- [ ] All pages loading correctly
- [ ] Performance metrics acceptable
- [ ] Error tracking active
- [ ] Analytics configured

---

## 📚 RELATED DOCUMENTATION

- [Authentication Guide](./AUTHENTICATION.md)
- [Cart System Guide](./CART_SYSTEM.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [API Reference](./API_REFERENCE.md)

---

**Status:** ✅ PRODUCTION READY - All systems operational 