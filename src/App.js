/**
 * Main Application Component
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Updated for Anonymous Auth:
 * - Uses signInAnonymously() for unauthenticated users
 * - Cart persistence in Supabase Carts table
 * - Automatic cart transfer on login
 * - No localStorage required
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from './redux/authSlice';
import { initializeAuth, fetchCart, mergeAnonymousCartWithServer } from './redux/anonymousCartSlice';
import { fetchAllergensPure } from './redux/allergiesSlice';
import { loadSearchPreferencesAsync } from './redux/searchPreferencesSlice';
import { supabase } from './utils/supabaseClient';
import { isAnonymousUser } from './utils/anonymousAuth';
import Header from './components/Header/Header';
import Homepage from './pages/Homepage';
import ProductPage from './pages/ProductPage/ProductPage';
import RecipePage from './pages/RecipePage/RecipePage';
import CategoryPage from './pages/Catagory_Testing/CatagoryPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import GoogleCallback from './components/Auth/GoogleCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import CartPage from './pages/CartPage/CartPage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import DatabaseTest from './components/DatabaseTest';
import './App.css';
import { clearCartItems } from './redux/anonymousCartSlice';
import { clearSearchPreferencesLocal } from './redux/searchPreferencesSlice';
import { clearAllergies } from './redux/allergiesSlice';
import { runDatabaseTests } from './utils/supabaseQueries.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch allergens from Supabase database on app start
    dispatch(fetchAllergensPure());
  }, [dispatch]);

  useEffect(() => {
    // Check for existing session first
    const checkExistingSession = async () => {
      console.log('[APP] Starting checkExistingSession...');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[APP] Session check result:', session ? 'Session found' : 'No session');
      if (session) {
        console.log('[APP] Session user ID:', session.user.id);
        console.log('[APP] Session user:', session.user);
      }
      
      if (!session) {
        // Only initialize anonymous auth if no session exists
        console.log('[APP] No existing session, initializing anonymous auth...');
        dispatch(initializeAuth()).then((result) => {
          console.log('[APP] initializeAuth result:', result);
          if (result.meta.requestStatus === 'fulfilled') {
            console.log('[APP] Anonymous auth initialized successfully');
            // Fetch cart after auth is initialized
            dispatch(fetchCart());
          } else {
            console.error('[APP] Failed to initialize anonymous auth:', result.error);
          }
        });
      } else {
        // Check if this is an anonymous session using improved detection
        console.log('[APP] Checking if session is anonymous...');
        const isAnonymous = await isAnonymousUser(session);
        console.log('[APP] Is anonymous session:', isAnonymous);
        
        if (isAnonymous) {
          console.log('[APP] Anonymous session found, not setting authenticated state');
          // For anonymous sessions, don't set isAuthenticated to true
          // Just fetch cart
          dispatch(fetchCart());
        } else {
          console.log('[APP] Authenticated session found, setting credentials');
          // Set credentials for authenticated session
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token,
            isAuthenticated: true
          }));
          // Fetch cart for existing session
          dispatch(fetchCart());
          // Load search preferences for authenticated session
          dispatch(loadSearchPreferencesAsync({ userId: session.user.id }));
        }
      }
    };

    checkExistingSession();

    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SUPABASE AUTH] Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[SUPABASE AUTH] User signed in:', session.user);
          
          // Check if this is an anonymous session using improved detection
          const isAnonymous = await isAnonymousUser(session);
          
          if (isAnonymous) {
            console.log('[SUPABASE AUTH] Anonymous session signed in, not setting authenticated state');
            // For anonymous sessions, just fetch cart
            dispatch(fetchCart());
          } else {
            console.log('[SUPABASE AUTH] Authenticated user signed in, setting credentials');
            
            // Set credentials first
            dispatch(setCredentials({
              user: session.user,
              token: session.access_token,
              isAuthenticated: true
            }));
            
            // Fetch cart for authenticated user
            dispatch(fetchCart());
            
            // Load search preferences for authenticated user
            dispatch(loadSearchPreferencesAsync({ userId: session.user.id }));
            
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[SUPABASE AUTH] User signed out');
          
          // Clear auth state completely
          dispatch(logout());
          
          // Clear cart state on logout
          dispatch(clearCartItems());
          
          // Clear search preferences on logout
          dispatch(clearSearchPreferencesLocal());
          
          // Clear allergen toggles on logout
          dispatch(clearAllergies());
          
          // Create new anonymous session after logout
          console.log('[SUPABASE AUTH] Creating new anonymous session after logout...');
          setTimeout(async () => {
            try {
              const result = await dispatch(initializeAuth()).unwrap();
              console.log('[SUPABASE AUTH] Anonymous session creation result:', result);
              if (result.success) {
                console.log('[SUPABASE AUTH] ✅ Anonymous session created successfully after logout');
              } else {
                console.error('[SUPABASE AUTH] ❌ Failed to create anonymous session after logout:', result.error);
              }
            } catch (error) {
              console.error('[SUPABASE AUTH] ❌ Error creating anonymous session after logout:', error);
            }
          }, 100); // Small delay to ensure cleanup is complete
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[SUPABASE AUTH] Token refreshed');
          
          // Only update token if user is still authenticated
          // Don't automatically set isAuthenticated to true
          // This prevents interference with logout state
        }
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [dispatch]);

  // 🧪 Make database tests available globally for console access
  useEffect(() => {
    window.runDatabaseTests = runDatabaseTests;
    console.log('🔍 Database tests available globally: window.runDatabaseTests()');
  }, []);

  // 🔍 Make debug functions available globally for console access
  useEffect(() => {
    const loadDebugFunctions = async () => {
      try {
        const { 
          testCurrentCartMerge, 
          testCurrentAllergenPersistence, 
          analyzePostLoginFlow, 
          testCompleteLoginFlow, 
          checkCommonIssues, 
          runAllDiagnostics 
        } = await import('./utils/debugCartMerge.js');
        
        window.testCurrentCartMerge = testCurrentCartMerge;
        window.testCurrentAllergenPersistence = testCurrentAllergenPersistence;
        window.analyzePostLoginFlow = analyzePostLoginFlow;
        window.testCompleteLoginFlow = testCompleteLoginFlow;
        window.checkCommonIssues = checkCommonIssues;
        window.runAllDiagnostics = runAllDiagnostics;
        
        console.log('🔍 Debug functions available globally:');
        console.log('- window.testCurrentCartMerge()');
        console.log('- window.testCurrentAllergenPersistence()');
        console.log('- window.analyzePostLoginFlow()');
        console.log('- window.testCompleteLoginFlow()');
        console.log('- window.checkCommonIssues()');
        console.log('- window.runAllDiagnostics()');
      } catch (error) {
        console.error('❌ Failed to load debug functions:', error);
      }
    };
    
    loadDebugFunctions();
  }, []);

  useEffect(() => {
    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SUPABASE AUTH] Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[SUPABASE AUTH] User signed in:', session.user);
          
          // Check if this is an anonymous session using improved detection
          const isAnonymous = await isAnonymousUser(session);
          
          if (isAnonymous) {
            console.log('[SUPABASE AUTH] Anonymous session signed in, not setting authenticated state');
            // For anonymous sessions, just fetch cart
            dispatch(fetchCart());
          } else {
            console.log('[SUPABASE AUTH] Authenticated user signed in, setting credentials');
            
            // Set credentials first
            dispatch(setCredentials({
              user: session.user,
              token: session.access_token,
              isAuthenticated: true
            }));
            
            // Fetch cart for authenticated user
            dispatch(fetchCart());
            
            // Load search preferences for authenticated user
            dispatch(loadSearchPreferencesAsync({ userId: session.user.id }));
            
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[SUPABASE AUTH] User signed out');
          
          // Clear auth state completely
          dispatch(logout());
          
          // Clear cart state on logout
          dispatch(clearCartItems());
          
          // Clear search preferences on logout
          dispatch(clearSearchPreferencesLocal());
          
          // Clear allergen toggles on logout
          dispatch(clearAllergies());
          
          // Create new anonymous session after logout
          console.log('[SUPABASE AUTH] Creating new anonymous session after logout...');
          setTimeout(async () => {
            try {
              const result = await dispatch(initializeAuth()).unwrap();
              console.log('[SUPABASE AUTH] Anonymous session creation result:', result);
              if (result.success) {
                console.log('[SUPABASE AUTH] ✅ Anonymous session created successfully after logout');
              } else {
                console.error('[SUPABASE AUTH] ❌ Failed to create anonymous session after logout:', result.error);
              }
            } catch (error) {
              console.error('[SUPABASE AUTH] ❌ Error creating anonymous session after logout:', error);
            }
          }, 100); // Small delay to ensure cleanup is complete
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[SUPABASE AUTH] Token refreshed');
          
          // Only update token if user is still authenticated
          // Don't automatically set isAuthenticated to true
          // This prevents interference with logout state
        }
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Make pre-computed allergen system available globally
  useEffect(() => {
    const loadPrecomputedFunctions = async () => {
      try {
        const { runPrecomputedSystem } = await import('./utils/supabaseQueries.js');
        
        window.runPrecomputedSystem = runPrecomputedSystem;
        window.batchProcessAllergens = runPrecomputedSystem.batchProcess;
        window.verifyPrecomputedSystem = runPrecomputedSystem.verify;
        window.getProcessingStats = runPrecomputedSystem.stats;
        window.testProcessProduct = runPrecomputedSystem.testProduct;
        
        console.log('🏭 Pre-computed allergen system available globally:');
        console.log('- window.batchProcessAllergens() - Process all products');
        console.log('- window.verifyPrecomputedSystem() - Check system status');
        console.log('- window.getProcessingStats() - Get processing stats');
        console.log('- window.testProcessProduct(id) - Test single product');
      } catch (error) {
        console.error('❌ Failed to load pre-computed functions:', error);
      }
    };
    loadPrecomputedFunctions();
  }, []);

  // Make accuracy testing functions available globally
  useEffect(() => {
    const loadAccuracyFunctions = async () => {
      try {
        const { 
          testProcessingAccuracy,
          testProblematicCases,
          testWordBoundaries,
          runComprehensiveAccuracyTest,
          processSmallBatch
        } = await import('./utils/accuracyTesting.js');
        
        window.testProcessingAccuracy = testProcessingAccuracy;
        window.testProblematicCases = testProblematicCases;
        window.testWordBoundaries = testWordBoundaries;
        window.runComprehensiveAccuracyTest = runComprehensiveAccuracyTest;
        window.processSmallBatch = processSmallBatch;
        
        console.log('🧪 Accuracy testing functions available globally:');
        console.log('- window.testProcessingAccuracy() - Test basic accuracy');
        console.log('- window.testProblematicCases() - Test false positive cases');
        console.log('- window.testWordBoundaries() - Test word boundary matching');
        console.log('- window.runComprehensiveAccuracyTest() - Run all tests');
        console.log('- window.processSmallBatch(50) - Process small batch safely');
      } catch (error) {
        console.error('❌ Failed to load accuracy testing functions:', error);
      }
    };
    loadAccuracyFunctions();
  }, []);

  // Make automated testing system available globally
  useEffect(() => {
    const loadAutomatedTesting = async () => {
      try {
        const { 
          autoRunTests,
          quickStatusCheck,
          runAutomatedTests
        } = await import('./utils/automatedTesting.js');
        
        window.autoRunTests = autoRunTests;
        window.quickStatusCheck = quickStatusCheck;
        window.runAutomatedTests = runAutomatedTests;
        
        console.log('🤖 Automated testing system available globally:');
        console.log('- window.autoRunTests() - Run all tests automatically');
        console.log('- window.quickStatusCheck() - Quick system check');
        console.log('- window.runAutomatedTests() - Manual test runner');
        
        // Auto-run tests after a short delay
        setTimeout(async () => {
          console.log('\n🚀 AUTO-STARTING COMPREHENSIVE TESTS...');
          console.log('This will test the entire allergen processing system automatically');
          console.log('Results will be displayed below:');
          console.log('=====================================');
          
          const results = await autoRunTests();
          
          // Store results for later access
          window.lastTestResults = results;
          
          // If all tests pass, offer to run batch processing
          if (results.overallStatus?.ready) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('Would you like to proceed with batch processing?');
            console.log('Run: window.processAllProducts() to process all products');
          } else {
            console.log('\n❌ Some tests failed. Please review the recommendations above.');
          }
        }, 2000); // 2 second delay to let the app load
        
      } catch (error) {
        console.error('❌ Failed to load automated testing system:', error);
      }
    };
    loadAutomatedTesting();
  }, []);

  // Make batch processing functions available globally
  useEffect(() => {
    const loadBatchProcessing = async () => {
      try {
        // Create batch processing function
        window.processAllProducts = async () => {
          console.log('🔄 PROCESSING ALL PRODUCTS...');
          console.log('This will process all unprocessed products with allergen tags');
          console.log('=====================================');
          
          try {
            const result = await supabase.rpc('batch_process_allergens', {
              batch_size: 50
            });
            
            console.log('✅ Batch processing completed:', result.data);
            
            // Show summary
            if (result.data?.total_processed) {
              console.log(`📊 Processed ${result.data.total_processed} products`);
              console.log('🎉 All products now have pre-computed allergen tags!');
              console.log('✅ Lightning-fast allergen filtering is now available');
            }
            
            return result.data;
          } catch (error) {
            console.error('❌ Batch processing failed:', error);
            return { success: false, error: error.message };
          }
        };
        
        // Create small batch processing function
        window.processSmallBatch = async (batchSize = 50) => {
          console.log(`🔄 Processing small batch of ${batchSize} products...`);
          
          try {
            const { data: unprocessed } = await supabase
              .from('IngredientCategorized')
              .select('id, description')
              .eq('processed_for_allergens', false)
              .limit(batchSize);
            
            if (!unprocessed || unprocessed.length === 0) {
              console.log('✅ No unprocessed products found');
              return { success: true, processed: 0 };
            }
            
            console.log(`Found ${unprocessed.length} unprocessed products`);
            
            let processed = 0;
            let errors = 0;
            
            for (const product of unprocessed) {
              try {
                const result = await supabase.rpc('process_product_allergens_improved', {
                  product_id: product.id
                });
                
                if (result.data && !result.error) {
                  processed++;
                  console.log(`✅ Processed: ${product.description.substring(0, 50)}...`);
                } else {
                  errors++;
                  console.log(`❌ Error processing: ${product.description.substring(0, 50)}...`);
                }
              } catch (error) {
                errors++;
                console.log(`❌ Exception processing: ${product.description.substring(0, 50)}...`);
              }
            }
            
            console.log(`\n📊 BATCH RESULTS: ${processed} processed, ${errors} errors`);
            
            return {
              success: errors === 0,
              processed,
              errors,
              accuracy: processed / (processed + errors) * 100
            };
            
          } catch (error) {
            console.error('❌ Small batch processing failed:', error);
            return { success: false, error: error.message };
          }
        };
        
        console.log('🔄 Batch processing functions available globally:');
        console.log('- window.processAllProducts() - Process all products');
        console.log('- window.processSmallBatch(50) - Process small batch safely');
        
      } catch (error) {
        console.error('❌ Failed to load batch processing functions:', error);
      }
    };
    loadBatchProcessing();
  }, []);

  // Make enterprise allergen system functions globally available
  useEffect(() => {
    import('./utils/enterpriseAllergenQueries.js').then(module => {
      window.searchProductsWithAllergenFiltering = module.searchProductsWithAllergenFiltering;
      window.checkRecipeIngredientAllergens = module.checkRecipeIngredientAllergens;
      window.checkEnterpriseAllergenSystemStatus = module.checkEnterpriseAllergenSystemStatus;
      window.testEnterpriseAllergenPerformance = module.testEnterpriseAllergenPerformance;
      window.processAllProductsWithEnterpriseSystem = module.processAllProductsWithEnterpriseSystem;
      window.processExistingAllergenArrays = module.processExistingAllergenArrays;
      window.searchProductsFromSupabaseEnterprise = module.searchProductsFromSupabaseEnterprise;
      window.checkRecipeIngredientsEnterprise = module.checkRecipeIngredientsEnterprise;
      window.testEnterpriseSystem = module.testEnterpriseSystem;
      window.initializeEnterpriseAllergenSystem = module.initializeEnterpriseAllergenSystem;
      
      console.log('🏭 Enterprise allergen system functions available globally:');
      console.log('- window.testEnterpriseSystem() - Test the entire system');
      console.log('- window.checkEnterpriseAllergenSystemStatus() - Check system status');
      console.log('- window.testEnterpriseAllergenPerformance() - Test performance');
      console.log('- window.processAllProductsWithEnterpriseSystem() - Process all products');
      console.log('- window.processExistingAllergenArrays(100) - Process existing allergen arrays');
      console.log('- window.initializeEnterpriseAllergenSystem() - Initialize system');
      console.log('- window.searchProductsWithAllergenFiltering() - Enterprise search');
      console.log('- window.checkRecipeIngredientAllergens() - Enterprise ingredient checking');
    }).catch(error => {
      console.error('❌ Failed to load enterprise allergen functions:', error);
    });
  }, []);

  // Make accuracy verification functions globally available
  useEffect(() => {
    import('./utils/accuracyVerification.js').then(module => {
      window.testMinimalAccuracy = module.testMinimalAccuracy;
      window.testRealProductAllergens = module.testRealProductAllergens;
      window.testProblematicCases = module.testProblematicCases;
      window.testWithExistingTables = module.testWithExistingTables;
      window.runComprehensiveAccuracyTest = module.runComprehensiveAccuracyTest;
      window.processMinimalBatch = module.processMinimalBatch;
      window.checkUnprocessedCount = module.checkUnprocessedCount;
      
      // Create a simple count function that works in console
      window.checkCount = async () => {
        console.log('🔍 CHECKING UNPROCESSED PRODUCT COUNT');
        console.log('=====================================');
        
        try {
          const { count, error } = await supabase
            .from('IngredientCategorized')
            .select('*', { count: 'exact', head: true })
            .neq('brandName', 'generic')
            .eq('processed_for_allergens', false);
          
          if (error) {
            console.error('❌ Failed to count unprocessed products:', error);
            return { success: false, error: error.message };
          }
          
          console.log(`📊 Total unprocessed products: ${count}`);
          console.log(`📊 Supabase default limit: 1000`);
          
          if (count > 1000) {
            console.log(`⚠️  ${count - 1000} products will be skipped due to Supabase limit`);
            console.log(`💡 Solution: Process in chunks of 1000 or use pagination`);
          }
          
          return { success: true, count };
          
        } catch (error) {
          console.error('❌ Count check failed:', error);
          return { success: false, error: error.message };
        }
      };
      
      console.log('🧪 Accuracy verification functions available globally:');
      console.log('- window.testMinimalAccuracy(20) - Test minimal accuracy on 20 samples');
      console.log('- window.testRealProductAllergens() - Test real product allergen detection');
      console.log('- window.testProblematicCases() - Test problematic cases');
      console.log('- window.testWithExistingTables() - Test with existing tables');
      console.log('- window.runComprehensiveAccuracyTest() - Run comprehensive test');
      console.log('- window.processMinimalBatch(10) - Process small batch safely');
    }).catch(error => {
      console.error('❌ Failed to load accuracy verification functions:', error);
    });
  }, []);

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="App-main">
          <Routes>
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/about/team" element={<AboutUsPage />} />
            <Route path="/about/experience" element={<AboutUsPage />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/recipe/:id" element={<RecipePage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={<CartPage />}
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route path="/database-test" element={<DatabaseTest />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
