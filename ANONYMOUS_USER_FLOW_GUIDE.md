# 🔄 Anonymous User → Authenticated User Flow Guide

**Author:** Justin Linzan  
**Date:** July 2025  

---

## 🎯 **OVERVIEW**

This guide explains how to handle the transition from anonymous users to authenticated users in the Dynable platform.

---

## 🔍 **CURRENT ISSUES IDENTIFIED**

### **1. Role Enum Problem**
```
Error: invalid input value for enum "enum_Users_role": "authenticated"
```

**Valid Role Values:**
- `'admin'` - System administrator
- `'end_user'` - Regular customer (default for new users)
- `'seller'` - Product seller

**Invalid Values:**
- `'authenticated'` - This is NOT a valid role

### **2. Database Schema Issues**
- `Orders.user_email` column doesn't exist (should be `userId`)
- RLS policies blocking access to Users table

### **3. User Creation Strategy**
- Anonymous users need proper conversion flow
- Google OAuth users need profile completion

---

## 🛠️ **SOLUTIONS IMPLEMENTED**

### **1. Fixed Role Values**
```javascript
// ❌ WRONG
role: 'authenticated'

// ✅ CORRECT
role: 'end_user'
```

### **2. Fixed Database Queries**
```javascript
// ❌ WRONG
.eq('user_email', user.email)

// ✅ CORRECT
.eq('userId', user.id)
```

### **3. User Creation Logic**
```javascript
// Create new user with correct role
const { data: newUser, error: createError } = await supabase
    .from('Users')
    .insert({
        email: user.email,
        name: user.user_metadata?.name || '',
        role: 'end_user', // ✅ Correct role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    })
    .select()
    .single();
```

---

## 🔄 **RECOMMENDED USER FLOW**

### **Scenario 1: Anonymous User → Google OAuth**

1. **User browses anonymously** (no authentication)
2. **User clicks "Sign in with Google"**
3. **Google OAuth completes**
4. **Check if user exists in Users table**
   - ✅ **User exists** → Continue to app
   - ❌ **User doesn't exist** → Redirect to signup with pre-filled email

### **Scenario 2: Anonymous User → Email Signup**

1. **User browses anonymously**
2. **User clicks "Sign up"**
3. **User fills out form**
4. **Create user with `end_user` role**
5. **Transfer anonymous cart data**

### **Scenario 3: Existing User Login**

1. **User clicks "Login"**
2. **User enters credentials**
3. **Verify user exists in Users table**
4. **Load user data and cart**

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Option A: Automatic User Creation (Recommended)**

**Pros:**
- Seamless user experience
- No interruption in flow
- Automatic cart transfer

**Cons:**
- Limited user profile data
- May need profile completion later

**Implementation:**
```javascript
// In GoogleCallback.js or Login.js
const handleUserCreation = async (user) => {
    try {
        // Check if user exists
        const { data: existingUser, error } = await supabase
            .from('Users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (error && error.code === 'PGRST116') {
            // User doesn't exist - create them
            const { data: newUser, error: createError } = await supabase
                .from('Users')
                .insert({
                    email: user.email,
                    name: user.user_metadata?.name || '',
                    role: 'end_user',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                // Redirect to signup for manual completion
                navigate('/signup', { 
                    state: { 
                        email: user.email,
                        fromGoogle: true 
                    }
                });
                return;
            }
        }

        // Continue with normal flow
        dispatch(setCredentials({
            user: existingUser || newUser,
            token: session.access_token,
            isAuthenticated: true
        }));
    } catch (error) {
        console.error('User creation error:', error);
    }
};
```

### **Option B: Redirect to Signup**

**Pros:**
- Complete user profile data
- Explicit user consent
- Better data quality

**Cons:**
- Interrupts user flow
- May cause abandonment

**Implementation:**
```javascript
// In GoogleCallback.js
const handleGoogleCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Check if user exists in Users table
        const { data: userData, error } = await supabase
            .from('Users')
            .select('*')
            .eq('email', session.user.email)
            .single();

        if (error && error.code === 'PGRST116') {
            // User doesn't exist - redirect to signup
            navigate('/signup', { 
                state: { 
                    email: session.user.email,
                    fromGoogle: true,
                    message: 'Please complete your profile to continue'
                }
            });
            return;
        }

        // User exists - continue normally
        dispatch(setCredentials({
            user: userData,
            token: session.access_token,
            isAuthenticated: true
        }));
        navigate('/');
    }
};
```

---

## 🧪 **TESTING CHECKLIST**

### **Anonymous User Tests**
- [ ] Can browse products without login
- [ ] Can add items to cart (localStorage)
- [ ] Cannot checkout (redirected to login)
- [ ] Cart persists during session

### **Google OAuth Tests**
- [ ] Google login works
- [ ] New users are created with `end_user` role
- [ ] Existing users can login
- [ ] Cart data transfers correctly

### **Email Signup Tests**
- [ ] Signup creates user with `end_user` role
- [ ] Profile completion works
- [ ] Cart data transfers from anonymous

### **Database Tests**
- [ ] Users table accepts correct role values
- [ ] Orders table uses correct column names
- [ ] RLS policies allow proper access
- [ ] Cart data stores correctly

---

## 🚨 **TROUBLESHOOTING**

### **Error: "invalid input value for enum"**
**Solution:** Change `'authenticated'` to `'end_user'`

### **Error: "column Orders.user_email does not exist"**
**Solution:** Use `userId` instead of `user_email`

### **Error: "JSON object requested, multiple (or no) rows returned"**
**Solution:** User doesn't exist in Users table - create them

### **Error: "406 Not Acceptable"**
**Solution:** RLS policy blocking access - check user permissions

---

## 📋 **NEXT STEPS**

1. **Test the fixes** with your current setup
2. **Choose implementation strategy** (A or B)
3. **Implement cart transfer logic** for anonymous users
4. **Add profile completion flow** for new users
5. **Test all user scenarios** thoroughly

**Which approach would you prefer for handling new Google OAuth users?** 