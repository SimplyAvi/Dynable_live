# 🎯 Supabase Auth Setup - Based on Your Interface

## **You're in the right place, but looking at the wrong section!**

You're currently in **Data API Settings**, but we need **Authentication Settings** for CORS.

## 🚀 **CORRECT STEPS:**

### **Step 1: Go to Authentication**
1. In the left sidebar, click **Authentication** (not Settings)
2. You should see tabs: **Users**, **Templates**, **Settings**, etc.
3. Click **Settings** tab

### **Step 2: Configure Auth Settings**
In the **Settings** tab, you should see:

#### **Site URL:**
```
http://localhost:3000
```

#### **Redirect URLs:**
```
http://localhost:3000/auth/callback
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/signup
```

### **Step 3: Enable Email Provider**
1. In **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure:
   - **Enable email confirmations**: OFF (for testing)
   - **Enable secure email change**: ON

### **Step 4: Enable Google Provider**
1. In **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You'll need to create a Google OAuth app first (see below)

## 🔧 **IF YOU CAN'T FIND CORS SETTINGS:**

The CORS settings might be in a different location. Try:

### **Option 1: Settings → API**
1. Go to **Settings** (gear icon)
2. Click **API** (not Data API)
3. Look for **Additional Allowed Origins**

### **Option 2: Settings → General**
1. Go to **Settings** (gear icon)
2. Click **General**
3. Look for CORS or allowed origins

### **Option 3: It might be automatic**
Some Supabase projects have CORS automatically configured for common development URLs.

## 🧪 **TEST WITHOUT CORS CONFIG:**

Try this first:
1. Configure the **Authentication Settings** above
2. Test your app: `npm start`
3. Try to login/signup
4. Check browser console for errors

**If it works without CORS errors, you don't need to configure CORS manually!**

## 🚨 **IF YOU GET CORS ERRORS:**

Then we need to find the CORS settings. Look for:
- **Settings** → **API** → **Additional Allowed Origins**
- **Settings** → **General** → **CORS**
- **Project Settings** → **API**

## ✅ **WHAT TO CONFIGURE RIGHT NOW:**

1. **Authentication** → **Settings** → **Site URL**: `http://localhost:3000`
2. **Authentication** → **Settings** → **Redirect URLs**: Add the URLs above
3. **Authentication** → **Providers** → **Email**: Enable
4. **Authentication** → **Providers** → **Google**: Enable (after creating OAuth app)

**Try these settings first and let me know if you get any errors!** 