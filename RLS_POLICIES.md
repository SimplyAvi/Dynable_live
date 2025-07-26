# Supabase RLS Policies for Cart System

## Carts Table RLS Policies

### 1. Enable RLS
```sql
ALTER TABLE "Carts" ENABLE ROW LEVEL SECURITY;
```

### 2. Policy: Users can read their own cart
```sql
CREATE POLICY "Users can read their own cart" ON "Carts"
FOR SELECT USING (
  supabase_user_id = auth.uid()
);
```

### 3. Policy: Users can insert their own cart
```sql
CREATE POLICY "Users can insert their own cart" ON "Carts"
FOR INSERT WITH CHECK (
  supabase_user_id = auth.uid()
);
```

### 4. Policy: Users can update their own cart
```sql
CREATE POLICY "Users can update their own cart" ON "Carts"
FOR UPDATE USING (
  supabase_user_id = auth.uid()
);
```

### 5. Policy: Users can delete their own cart
```sql
CREATE POLICY "Users can delete their own cart" ON "Carts"
FOR DELETE USING (
  supabase_user_id = auth.uid()
);
```

## Key RLS Considerations

### Anonymous vs Authenticated Access
- **Same policies** apply to both anonymous and authenticated users
- **Anonymous users** have `auth.uid()` just like authenticated users
- **No special policies** needed for anonymous access
- **Cart isolation** is maintained by `supabase_user_id = auth.uid()`

### Cart Merge Access
- **Merge function** needs access to both anonymous and authenticated carts
- **Anonymous cart access**: Uses stored `anonymousUserIdForMerge` from localStorage
- **Authenticated cart access**: Uses current `auth.uid()`
- **No cross-user access** allowed by RLS - merge happens in application logic

### Security Implications
- **Anonymous carts** are isolated by user ID
- **No cart sharing** between users
- **Cart data** is private to each user (anonymous or authenticated)
- **Merge operation** requires both user IDs to be available

## Testing RLS Policies

### Anonymous User Access
```sql
-- Test anonymous user can access their cart
SELECT * FROM "Carts" WHERE supabase_user_id = 'anonymous-user-id';
```

### Authenticated User Access  
```sql
-- Test authenticated user can access their cart
SELECT * FROM "Carts" WHERE supabase_user_id = auth.uid();
```

### Cross-User Access (Should Fail)
```sql
-- This should fail due to RLS
SELECT * FROM "Carts" WHERE supabase_user_id != auth.uid();
``` 