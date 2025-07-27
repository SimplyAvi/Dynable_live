# 🔧 FIX GOOGLE OAUTH REDIRECT URI ISSUE

## 🚨 **CRITICAL ISSUE FOUND:**

Your Google OAuth is configured to redirect to Supabase's callback URL instead of your app's callback URL.

**Current (WRONG):** `https://fdojimqdhuqhimgjpdai.supabase.co/auth/v1/callback`
**Should be (CORRECT):** `http://localhost:3000/auth/callback`

## 📋 **STEP-BY-STEP FIX:**

### **Step 1: Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **"Authorized redirect URIs"** section:
   - **REMOVE:** `http://localhost:5001/api/auth/google/callback` (if still there)
   - **ADD:** `http://localhost:3000/auth/callback`
5. Click **Save**

### **Step 2: Update Supabase Google Provider**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Google** provider (the ">" arrow)
4. Update these settings:
   - **Client ID:** Your Google Client ID
   - **Client Secret:** Your Google Client Secret
   - **Redirect URL:** `http://localhost:3000/auth/callback`
5. Click **Save**

### **Step 3: Verify Supabase Auth Settings**

1. Go to **Authentication** → **Configuration**
2. Under **"General"** section:
   - **Site URL:** `http://localhost:3000`
3. Under **"Redirect URLs"** section:
   - **Add:** `http://localhost:3000/auth/callback`
4. Click **Save**

## 🧪 **TEST THE FIX:**

1. Clear your browser cache/cookies
2. Go to `http://localhost:3000`
3. Click **Login** → **Sign in with Google**
4. You should be redirected to Google and back to your app
5. Check if you're properly logged in (Profile should show your email)

## 🔍 **DEBUGGING:**

If you still get errors, check:
- Browser console for exact redirect URI being used
- Supabase logs for authentication events
- Google Cloud Console for any remaining old redirect URIs

## 📝 **EXPECTED FLOW:**

1. User clicks "Sign in with Google"
2. Redirects to: `https://accounts.google.com/oauth/authorize?...`
3. After Google auth, redirects to: `http://localhost:3000/auth/callback`
4. Supabase handles the callback and creates a session
5. User is logged in and redirected to your app 