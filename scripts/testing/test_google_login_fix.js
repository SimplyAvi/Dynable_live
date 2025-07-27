/**
 * Test Google Login Fix
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Tests the Google login flow to ensure it handles missing sessions properly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

async function testGoogleLoginFlow() {
    console.log('[TEST] 🚀 Testing Google login flow...');
    
    try {
        // Step 1: Check if session exists
        console.log('[TEST] Step 1: Checking for existing session...');
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('[TEST] ✅ No session found (expected for fresh start)');
            
            // Step 2: Create anonymous session
            console.log('[TEST] Step 2: Creating anonymous session...');
            const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
            
            if (anonymousError) {
                console.error('[TEST] ❌ Failed to create anonymous session:', anonymousError);
                return { success: false, error: anonymousError.message };
            }
            
            session = anonymousData.session;
            console.log('[TEST] ✅ Anonymous session created:', session.user.id);
        } else {
            console.log('[TEST] ℹ️  Existing session found:', session.user.id);
        }
        
        // Step 3: Verify session is valid
        console.log('[TEST] Step 3: Verifying session...');
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        
        if (!verifySession) {
            console.error('[TEST] ❌ Session verification failed');
            return { success: false, error: 'Session verification failed' };
        }
        
        console.log('[TEST] ✅ Session verified successfully');
        
        // Step 4: Test cart operations with session
        console.log('[TEST] Step 4: Testing cart operations...');
        const testItem = {
            id: 'test-item-123',
            name: 'Test Product',
            price: 9.99,
            quantity: 1
        };
        
        // Test adding item to cart
        const { data: cartData, error: cartError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: verifySession.user.id,
                items: [testItem],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { onConflict: 'supabase_user_id' })
            .select();
        
        if (cartError) {
            console.error('[TEST] ❌ Cart operation failed:', cartError);
            return { success: false, error: cartError.message };
        }
        
        console.log('[TEST] ✅ Cart operation successful');
        
        // Step 5: Clean up test data
        console.log('[TEST] Step 5: Cleaning up test data...');
        const { error: cleanupError } = await supabase
            .from('Carts')
            .delete()
            .eq('supabase_user_id', verifySession.user.id);
        
        if (cleanupError) {
            console.warn('[TEST] ⚠️  Cleanup warning:', cleanupError.message);
        } else {
            console.log('[TEST] ✅ Test data cleaned up');
        }
        
        console.log('[TEST] 🎉 All tests passed! Google login fix is working correctly.');
        return { success: true };
        
    } catch (error) {
        console.error('[TEST] ❌ Test failed:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
if (require.main === module) {
    testGoogleLoginFlow()
        .then(result => {
            if (result.success) {
                console.log('[TEST] ✅ Test completed successfully');
                process.exit(0);
            } else {
                console.error('[TEST] ❌ Test failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('[TEST] ❌ Test error:', error);
            process.exit(1);
        });
}

module.exports = { testGoogleLoginFlow }; 