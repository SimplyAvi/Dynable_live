# Cart Merging System Database Schema

## Core Tables

### 1. Users Table
```sql
CREATE TABLE "Users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true
);
```

### 2. Carts Table
```sql
CREATE TABLE "Carts" (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID NOT NULL, -- Links to Supabase auth.users
  items JSONB DEFAULT '[]', -- Cart items as JSON array
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UserId UUID REFERENCES "Users"(id), -- Optional link to Users table
  UNIQUE(supabase_user_id)
);
```

### 3. Cart Items Structure (JSONB in Carts table)
```json
{
  "id": "product_id",
  "name": "Product Name",
  "brandName": "Brand Name", 
  "price": 15.99,
  "quantity": 2,
  "image": "/path/to/image.png"
}
```

## Key Design Decisions

### Anonymous User Tracking
- **Anonymous users** get a `supabase_user_id` from Supabase Auth
- **No separate anonymous_users table** - uses same auth.users table
- **Anonymous sessions** are identified by `isAnonymousUser()` function
- **Cart data** is stored in same `Carts` table for both anonymous and authenticated users

### Cart Persistence Strategy
- **Primary storage**: Supabase database (Carts table)
- **Secondary storage**: Redux state (for UI responsiveness)
- **Session persistence**: localStorage for anonymous user ID tracking
- **Merge tracking**: localStorage key `anonymousUserIdForMerge`

## Database Relationships

```
Supabase Auth Users
├── Anonymous Users (role: 'anonymous')
│   └── Carts (supabase_user_id)
└── Authenticated Users (role: 'authenticated') 
    └── Carts (supabase_user_id)
```

## Indexes for Performance
```sql
CREATE INDEX idx_carts_supabase_user_id ON "Carts"(supabase_user_id);
CREATE INDEX idx_carts_created_at ON "Carts"(createdAt);
CREATE INDEX idx_users_email ON "Users"(email);
``` 