# 🗄️ SUPABASE SETUP GUIDE

**Last Updated:** January 2025  
**Status:** ✅ CURRENT - Production Ready

---

## 📋 OVERVIEW

Dynable uses **Supabase** as the primary backend service, providing authentication, database, and real-time capabilities. This guide covers the complete setup and configuration process.

### **Key Features:**
- ✅ PostgreSQL database with Row Level Security (RLS)
- ✅ Built-in authentication with OAuth support
- ✅ Real-time subscriptions
- ✅ Automatic API generation
- ✅ Database migrations and versioning
- ✅ Backup and recovery

---

## 🚀 INITIAL SETUP

### **1. Create Supabase Project**

#### **Via Supabase Dashboard:**
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name:** `dynable-app`
   - **Database Password:** Generate strong password
   - **Region:** Choose closest to users
5. Click "Create new project"

#### **Project Configuration:**
- **Project URL:** `https://your-project-id.supabase.co`
- **API Key:** `your-anon-key`
- **Service Role Key:** `your-service-role-key` (keep secret)

### **2. Environment Configuration**

#### **Environment Variables:**
```bash
# .env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **Client Configuration:**
```javascript
// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'dynable-app'
    }
  }
})
```

---

## 🗄️ DATABASE SCHEMA

### **1. Core Tables**

#### **Products Table:**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand_name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
```

#### **Carts Table:**
```sql
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_carts_user_id ON carts(supabase_user_id);
```

#### **Search Preferences Table:**
```sql
CREATE TABLE search_preferences (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_term VARCHAR(255),
  allergens JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_search_preferences_user_id ON search_preferences(supabase_user_id);
```

### **2. Row Level Security (RLS)**

#### **Enable RLS on All Tables:**
```sql
-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_preferences ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update own cart" ON carts
  FOR UPDATE USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can delete own cart" ON carts
  FOR DELETE USING (auth.uid() = supabase_user_id);

-- Search preferences policies
CREATE POLICY "Users can view own preferences" ON search_preferences
  FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert own preferences" ON search_preferences
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update own preferences" ON search_preferences
  FOR UPDATE USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can delete own preferences" ON search_preferences
  FOR DELETE USING (auth.uid() = supabase_user_id);
```

### **3. Database Functions**

#### **Cart Merge Function:**
```sql
CREATE OR REPLACE FUNCTION merge_carts(
  anonymous_user_id UUID,
  authenticated_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  anonymous_cart JSONB;
  authenticated_cart JSONB;
  merged_items JSONB;
BEGIN
  -- Get anonymous cart
  SELECT items INTO anonymous_cart
  FROM carts
  WHERE supabase_user_id = anonymous_user_id;
  
  -- Get authenticated cart
  SELECT items INTO authenticated_cart
  FROM carts
  WHERE supabase_user_id = authenticated_user_id;
  
  -- Merge items
  merged_items = COALESCE(authenticated_cart, '[]'::JSONB);
  
  -- Add anonymous items to authenticated cart
  IF anonymous_cart IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(anonymous_cart) - 1 LOOP
      DECLARE
        anonymous_item JSONB;
        existing_item_index INTEGER;
      BEGIN
        anonymous_item = anonymous_cart->i;
        
        -- Find existing item
        existing_item_index = -1;
        FOR j IN 0..jsonb_array_length(merged_items) - 1 LOOP
          IF (merged_items->j->>'id')::INTEGER = (anonymous_item->>'id')::INTEGER THEN
            existing_item_index = j;
            EXIT;
          END IF;
        END LOOP;
        
        -- Update or add item
        IF existing_item_index >= 0 THEN
          merged_items = jsonb_set(
            merged_items,
            ARRAY[existing_item_index::TEXT, 'quantity'],
            to_jsonb(
              (merged_items->existing_item_index->>'quantity')::INTEGER + 
              (anonymous_item->>'quantity')::INTEGER
            )
          );
        ELSE
          merged_items = merged_items || anonymous_item;
        END IF;
      END;
    END LOOP;
  END IF;
  
  -- Update authenticated cart
  INSERT INTO carts (supabase_user_id, items, updated_at)
  VALUES (authenticated_user_id, merged_items, NOW())
  ON CONFLICT (supabase_user_id)
  DO UPDATE SET
    items = merged_items,
    updated_at = NOW();
  
  -- Delete anonymous cart
  DELETE FROM carts WHERE supabase_user_id = anonymous_user_id;
  
  RETURN merged_items;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 AUTHENTICATION SETUP

### **1. Enable Authentication Providers**

#### **Anonymous Auth:**
```sql
-- Anonymous auth is enabled by default
-- No additional setup required
```

#### **Google OAuth Setup:**
1. **Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (development)

2. **Supabase Dashboard:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Enter Google OAuth credentials:
     - **Client ID:** Your Google OAuth client ID
     - **Client Secret:** Your Google OAuth client secret
   - Save configuration

### **2. Authentication Configuration**

#### **Auth Settings:**
```sql
-- Configure auth settings
UPDATE auth.config SET
  enable_signup = true,
  enable_confirmations = false,
  enable_manual_linking = false,
  jwt_expiry = 3600,
  refresh_token_rotation_enabled = true;
```

#### **Custom Claims (Optional):**
```sql
-- Add custom claims to JWT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔧 API CONFIGURATION

### **1. CORS Setup**

#### **Supabase Dashboard Configuration:**
1. Go to Settings → API
2. Add CORS origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
   - `https://www.your-domain.com` (production)

#### **Client Configuration:**
```javascript
// CORS is handled automatically by Supabase client
// No additional configuration required
```

### **2. API Rate Limiting**

#### **Configure Rate Limits:**
```sql
-- Set rate limits for API calls
-- This is handled by Supabase automatically
-- Free tier: 50,000 requests/month
-- Pro tier: 500,000 requests/month
```

### **3. Real-time Subscriptions**

#### **Enable Real-time:**
```sql
-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE carts;
ALTER PUBLICATION supabase_realtime ADD TABLE search_preferences;
```

#### **Client Subscription:**
```javascript
// Subscribe to cart changes
const subscription = supabase
  .channel('cart-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'carts' },
    (payload) => {
      console.log('Cart changed:', payload)
      // Update Redux state
    }
  )
  .subscribe()
```

---

## 📊 DATABASE MIGRATIONS

### **1. Migration Strategy**

#### **Using Supabase CLI:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Create migration
supabase migration new create_initial_schema

# Apply migrations
supabase db push
```

#### **Manual Migration:**
```sql
-- Run SQL scripts directly in Supabase SQL Editor
-- Version control your migrations
-- Test migrations in development first
```

### **2. Migration Best Practices**

#### **Version Control:**
```sql
-- Always version your migrations
-- Use descriptive names
-- Include rollback scripts
-- Test in development environment
```

#### **Data Migration:**
```sql
-- Backup data before major changes
-- Use transactions for data migrations
-- Test with sample data first
-- Monitor performance impact
```

---

## 🔍 MONITORING & DEBUGGING

### **1. Supabase Dashboard**

#### **Key Metrics to Monitor:**
- **Database Performance:** Query execution time
- **API Usage:** Request count and errors
- **Authentication:** Login attempts and failures
- **Storage:** File uploads and usage
- **Real-time:** Subscription connections

#### **Logs:**
- **Database Logs:** SQL queries and errors
- **API Logs:** HTTP requests and responses
- **Auth Logs:** Authentication events
- **Function Logs:** Edge function execution

### **2. Performance Optimization**

#### **Database Indexes:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_brand_search ON products USING gin(to_tsvector('english', brand_name));
```

#### **Query Optimization:**
```sql
-- Use efficient queries
-- Avoid SELECT *
-- Use LIMIT for large datasets
-- Implement pagination
```

---

## 🚨 TROUBLESHOOTING

### **Common Issues:**

#### **1. CORS Errors:**
- Check CORS origins in Supabase dashboard
- Verify domain is correctly configured
- Check for typos in URLs

#### **2. Authentication Errors:**
- Verify OAuth credentials
- Check redirect URLs
- Review auth configuration
- Check JWT expiration

#### **3. Database Connection Issues:**
- Check database password
- Verify connection string
- Check network connectivity
- Review RLS policies

#### **4. Performance Issues:**
- Monitor query performance
- Add database indexes
- Optimize queries
- Check rate limits

---

## 🔒 SECURITY

### **1. API Key Management**

#### **Environment Variables:**
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for development/production

#### **Service Role Key:**
- Keep service role key secret
- Only use for server-side operations
- Never expose in client code
- Use for admin operations only

### **2. Row Level Security**

#### **Policy Best Practices:**
```sql
-- Always enable RLS on user data tables
-- Write policies for all operations (SELECT, INSERT, UPDATE, DELETE)
-- Test policies thoroughly
-- Use auth.uid() for user-specific data
```

### **3. Data Validation**

#### **Input Validation:**
```sql
-- Use CHECK constraints
-- Validate JSON data
-- Sanitize user inputs
-- Use parameterized queries
```

---

## 📚 RELATED DOCUMENTATION

- [Authentication Guide](./AUTHENTICATION.md)
- [Cart System Guide](./CART_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Reference](./API_REFERENCE.md)

---

**Status:** ✅ PRODUCTION READY - All systems operational 