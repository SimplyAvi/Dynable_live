// 🔍 GET FUNCTION DEFINITIONS SAFELY
// Get actual function definitions to create safe migration
// Author: Justin Linzan
// Date: January 2025

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFunctionDefinitions() {
    console.log('🔍 GETTING FUNCTION DEFINITIONS SAFELY');
    console.log('=====================================');
    console.log('');

    // Read the existing functions from our previous check
    const fs = require('fs');
    let existingFunctions = [];
    
    try {
        const functionData = JSON.parse(fs.readFileSync('existing_functions.json', 'utf8'));
        existingFunctions = functionData.existing_functions;
        console.log(`📊 Found ${existingFunctions.length} existing functions to process`);
    } catch (error) {
        console.error('❌ Error reading existing_functions.json:', error);
        return;
    }

    const functionDefinitions = [];

    for (const funcName of existingFunctions) {
        try {
            console.log(`🔍 Getting definition for: ${funcName}`);
            
            // Use a direct SQL query to get function definition
            const { data, error } = await supabase
                .from('pg_proc')
                .select(`
                    proname,
                    proconfig,
                    prosecurity,
                    prolang,
                    proargtypes,
                    proargnames,
                    proargmodes,
                    prorettype
                `)
                .eq('proname', funcName)
                .eq('pronamespace', '(SELECT oid FROM pg_namespace WHERE nspname = \'public\')')
                .single();

            if (error) {
                console.log(`⚠️  Could not get definition for ${funcName}: ${error.message}`);
                continue;
            }

            if (data) {
                const hasSearchPath = data.proconfig && data.proconfig.includes('search_path');
                
                functionDefinitions.push({
                    name: funcName,
                    has_search_path: hasSearchPath,
                    security_definer: data.prosecurity === 'd',
                    needs_fix: !hasSearchPath
                });

                console.log(`   ${hasSearchPath ? '✅' : '🔧'} ${funcName} - ${hasSearchPath ? 'Has search_path' : 'Needs search_path fix'}`);
            }

        } catch (error) {
            console.log(`❌ Error processing ${funcName}: ${error.message}`);
        }
    }

    console.log('');
    console.log('📊 FUNCTION ANALYSIS:');
    console.log('=====================');
    
    const needsFix = functionDefinitions.filter(f => f.needs_fix);
    const alreadyFixed = functionDefinitions.filter(f => !f.needs_fix);
    
    console.log(`🔧 Functions needing search_path fix: ${needsFix.length}`);
    console.log(`✅ Functions already have search_path: ${alreadyFixed.length}`);
    console.log(`📋 Total functions analyzed: ${functionDefinitions.length}`);
    console.log('');

    if (needsFix.length > 0) {
        console.log('🔧 FUNCTIONS NEEDING SEARCH_PATH FIX:');
        needsFix.forEach(f => console.log(`   - ${f.name}`));
        console.log('');
    }

    if (alreadyFixed.length > 0) {
        console.log('✅ FUNCTIONS ALREADY HAVE SEARCH_PATH:');
        alreadyFixed.forEach(f => console.log(`   - ${f.name}`));
        console.log('');
    }

    // Save detailed analysis
    const analysisData = {
        timestamp: new Date().toISOString(),
        total_functions: functionDefinitions.length,
        functions_needing_fix: needsFix.length,
        functions_already_fixed: alreadyFixed.length,
        function_details: functionDefinitions,
        summary: {
            needs_fix: needsFix.map(f => f.name),
            already_fixed: alreadyFixed.map(f => f.name)
        }
    };

    fs.writeFileSync('function_analysis.json', JSON.stringify(analysisData, null, 2));
    console.log('💾 Function analysis saved to function_analysis.json');
    console.log('');

    if (needsFix.length > 0) {
        console.log('🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. Review function_analysis.json');
        console.log('2. Create safe migration for functions needing fix');
        console.log('3. Add SET search_path = public to existing functions');
        console.log('4. Preserve all existing function logic');
        console.log('');
        console.log('✅ Ready to create safe migration!');
    } else {
        console.log('🎉 All functions already have search_path set!');
        console.log('✅ No migration needed');
    }
}

getFunctionDefinitions().catch(error => {
    console.error('❌ Error:', error);
});
