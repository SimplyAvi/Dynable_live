# How to Check Edge Function Logs

## 🔍 The Issue

The browser console shows the Edge Function is being called, but we can't see the internal logs (`[MATCHING]`, `[SEMANTIC]`, etc.). These logs only appear in Supabase's server logs.

## 📋 How to View Edge Function Logs

### **Method 1: Supabase Dashboard (Real-time)**

1. Go to: https://app.supabase.com
2. Select your project
3. Click **Edge Functions** in left sidebar
4. Click on **recipe-processor**
5. Click the **Logs** tab
6. You'll see real-time logs when recipes are opened

**Look for:**
```
✅ If semantic is working:
[MATCHING] Using SEMANTIC matching for: egg
[SEMANTIC] ✅ Resolved "egg" → ID 182930 (protein/poultry)
[SEMANTIC] ✅ Found 5 products for "egg" via semantic mapping

❌ If still using legacy:
[MATCHING] Using LEGACY text-based matching for: egg
[EDGE FUNCTION] Using direct search for: egg
```

### **Method 2: Supabase CLI**

```bash
# Real-time log streaming
supabase functions serve recipe-processor --env-file .env --debug

# Or view recent logs
supabase functions logs recipe-processor
```

---

## 🎯 **Quick Diagnosis Questions:**

### **1. Did you check "30 total products" shown?**

The log shows: `30 total products`

- If semantic is working: Should be mostly/only egg products
- If legacy is working: Will include eggplant products

**Can you tell me:**
- Do you see eggplant products in the ingredient list?
- What specific products are shown under the "egg" ingredient?

### **2. Check Supabase Edge Function Logs**

Go to Supabase Dashboard → Edge Functions → recipe-processor → Logs

**Share the logs** from when you opened the recipe. This will show us if:
- ✅ Semantic matching is active
- ❌ Legacy matching is being used
- ⚠️ Errors causing fallback

---

## 🔧 Possible Issues

### **Issue A: Environment Variable Not Applied**

The `USE_SEMANTIC_MATCHING` might not be picked up by the Edge Function.

**Check:**
1. Supabase Dashboard → Edge Functions → recipe-processor
2. Settings/Secrets tab
3. Verify: `USE_SEMANTIC_MATCHING = true`
4. **Might need to redeploy** after adding the secret

### **Issue B: Deployment Didn't Update Code**

The deployment might have failed silently.

**Fix:**
```bash
# Redeploy with verbose output
supabase functions deploy recipe-processor --debug
```

### **Issue C: Using Cached Version**

Browser might be using cached Edge Function response.

**Fix:**
- Hard refresh (Cmd+Shift+R)
- Clear all browser cache
- Try incognito window

---

## 🎯 **What to Do Next:**

1. **Check Supabase Edge Function logs** (Dashboard → Edge Functions → Logs)
2. **Share those server logs** with me
3. **Tell me** what products you see under the "egg" ingredient (are there eggplant products?)

This will help me diagnose exactly what's happening! 🚀

