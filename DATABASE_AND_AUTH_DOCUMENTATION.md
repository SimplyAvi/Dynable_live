# 📊 Database and Authentication Documentation

## 🔐 Authentication System

### **JWT Token System:**
- **Provider:** Supabase Auth
- **Token Type:** JWT (JSON Web Tokens)
- **Storage:** Redux state + localStorage
- **Anonymous Users:** Supported via Supabase anonymous auth
- **Session Management:** Auto-refresh enabled

### **Authentication Flow:**
1. **Anonymous Users:** Automatically signed in via Supabase anonymous auth
2. **Authenticated Users:** Google OAuth → Supabase Auth → JWT token
3. **Token Storage:** `authSlice.js` manages tokens in Redux state
4. **Session Persistence:** Tokens persist across browser sessions

## 🗄️ Database Tables

### **Core Tables:**

#### **1. Users Table**
```sql
Columns:
- id (Primary Key)
- supabase_user_id (UUID) - Links to Supabase auth.users
- email (VARCHAR)
- name (VARCHAR)
- role (ENUM: 'admin', 'end_user', 'seller')
- store_name (VARCHAR) - For sellers
- store_description (TEXT) - For sellers
- is_verified_seller (BOOLEAN)
- converted_from_anonymous (BOOLEAN)
- anonymous_cart_data (JSONB)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### **2. AllergenDerivatives Table**
```sql
Columns:
- id (Primary Key)
- allergen (VARCHAR) - Main allergen name
- derivative (VARCHAR) - Derivative/allergen variant
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### **3. IngredientCategorized Table**
```sql
Columns:
- id (Primary Key)
- description (TEXT) - Product description
- brandName (VARCHAR) - Brand name
- allergens (JSONB) - Array of allergens
- canonicalTag (VARCHAR) - Canonical ingredient tag
- is_active (BOOLEAN) - Product availability
- [Additional columns for nutrition data]
```

#### **4. Other Tables:**
- **RecipeIngredients:** Recipe ingredient mappings
- **Recipes:** Recipe data
- **SubstituteMappings:** Ingredient substitution data
- **IngredientCanonical:** Canonical ingredient mappings
- **Carts:** User cart data

## 🔄 Authentication State Management

### **Redux Auth Slice (`authSlice.js`):**
```javascript
State:
- user: User object with role information
- token: JWT token
- supabaseToken: Supabase session token
- isAuthenticated: Authentication status
- role: User role ('admin', 'end_user', 'seller')
- isVerifiedSeller: Seller verification status
```

### **User Data Flow:**
1. **Login:** Google OAuth → Supabase Auth → JWT token
2. **Token Storage:** Redux state + localStorage
3. **API Calls:** JWT token sent in Authorization header
4. **Session Refresh:** Automatic token refresh via Supabase
5. **Logout:** Clear tokens and session data

## 🎯 Custom Allergen Implementation Plan

### **Database Schema Addition:**
```sql
-- Add custom allergens to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens 
ON "Users" USING GIN (custom_allergens);
```

### **Frontend Implementation:**
1. **Green Plus Button** in AllergyFilter component
2. **Custom Allergen Modal** for input
3. **Grammar Check** for allergen names
4. **Database Storage** in Users table
5. **Toggle Integration** with existing allergen system

### **API Endpoints:**
- `POST /api/users/custom-allergens` - Add custom allergen
- `GET /api/users/custom-allergens` - Get user's custom allergens
- `DELETE /api/users/custom-allergens/:id` - Remove custom allergen

## 🔒 Security Considerations

### **Row Level Security (RLS):**
- All user data protected by Supabase RLS
- Users can only access their own data
- Admin users have elevated permissions
- Anonymous users have limited access

### **Data Validation:**
- Custom allergens validated for grammar/spelling
- Sanitized input to prevent injection attacks
- Rate limiting on custom allergen creation
- Duplicate prevention logic

## 📱 User Experience Flow

### **Custom Allergen Addition:**
1. User clicks green plus button in allergen filter
2. Modal opens with text input
3. User types custom allergen name
4. Grammar check validates input
5. Allergen saved to database
6. Allergen appears in list (toggled on)
7. Allergen follows alphabetical sorting rules

### **Integration with Existing System:**
- Custom allergens work with existing filtering logic
- Maintains toggle + alphabetical sorting
- Persists across sessions
- Syncs with search preferences