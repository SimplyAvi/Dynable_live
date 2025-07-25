# 🎯 Supabase Auth Setup - New Interface

## **You're in the right place! The settings have moved to Configuration.**

Based on what you're seeing, follow these steps:

## 🚀 **STEP-BY-STEP CONFIGURATION:**

### **Step 1: Go to Configuration**
1. In **Authentication** → **Configuration**
2. You should see all the settings you listed

### **Step 2: Configure General User Signup**
1. Find **General user signup** section
2. Set **Site URL**: `http://localhost:3000`
3. Enable user signups if not already enabled

### **Step 3: Configure Email Provider**
1. Find **Password settings in email provider**
2. Enable email provider
3. Set **Enable email confirmations**: OFF (for testing)
4. Set **Enable secure email change**: ON

### **Step 4: Configure Third Party Authentication**
1. Find **Third party authentication**
2. Enable **Google** provider
3. You'll need to create a Google OAuth app first

### **Step 5: Configure User Sessions**
1. Find **User sessions** section
2. Set **Access token expiry**: 3600 (1 hour) or your preference
3. Set **Refresh token expiry**: 604800 (7 days) or your preference

### **Step 6: Configure Redirect URLs**
Look for a section about redirect URLs or OAuth settings and add:
```
http://localhost:3000/auth/callback
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/signup
```

## 🔧 **IF YOU CAN'T FIND SPECIFIC SETTINGS:**

### **For CORS/Allowed Origins:**
- Look in **General user signup** section
- Or in **Third party authentication** section
- Or check if there's a separate **API** section

### **For Redirect URLs:**
- Look in **Third party authentication** section
- Or in **General user signup** section
- Or in a separate **OAuth** section

## 🧪 **TEST THE CONFIGURATION:**

1. Save all your settings
2. Test your app: `npm start`
3. Go to `http://localhost:3000/login`
4. Try creating an account
5. Try logging in

## 🚨 **COMMON ISSUES:**

### **If you get "redirect_uri_mismatch":**
- Make sure `http://localhost:3000/auth/callback` is in your redirect URLs
- Check both Google OAuth app and Supabase settings

### **If you get "Access blocked":**
- Look for CORS or allowed origins settings
- Add `http://localhost:3000` to allowed origins

### **If email auth doesn't work:**
- Make sure email provider is enabled
- Check that email confirmations are OFF for testing

## ✅ **WHAT TO CONFIGURE:**

1. **Site URL**: `http://localhost:3000`
2. **Email Provider**: Enabled
3. **Google Provider**: Enabled (after OAuth setup)
4. **Redirect URLs**: Add the URLs above
5. **Email Confirmations**: OFF (for testing)

**Let me know what specific settings you see in each section!** 