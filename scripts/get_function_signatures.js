// 🔍 GET FUNCTION SIGNATURES
// Get actual function signatures to create correct migration
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

async function getFunctionSignatures() {
    console.log('🔍 GETTING FUNCTION SIGNATURES');
    console.log('==============================');
    console.log('');

    // Read the existing functions from our previous check
    const fs = require('fs');
    let existingFunctions = [];
    
    try {
        const functionData = JSON.parse(fs.readFileSync('existing_functions.json', 'utf8'));
        existingFunctions = functionData.existing_functions;
        console.log(`📊 Found ${existingFunctions.length} existing functions to analyze`);
    } catch (error) {
        console.error('❌ Error reading existing_functions.json:', error);
        return;
    }

    const functionSignatures = [];

    for (const funcName of existingFunctions) {
        try {
            console.log(`🔍 Analyzing signature for: ${funcName}`);
            
            // Try different common parameter combinations
            const testSignatures = [
                '()', // No parameters
                '(TEXT)',
                '(TEXT, TEXT)',
                '(UUID)',
                '(UUID, UUID)',
                '(INTEGER)',
                '(INTEGER, INTEGER)',
                '(JSONB)',
                '(JSONB, JSONB)',
                '(TEXT[])',
                '(NUMERIC)',
                '(BOOLEAN)',
                '(TIMESTAMP)',
                '(DATE)',
                '(INTEGER, UUID)',
                '(UUID, JSONB)',
                '(TEXT, UUID)',
                '(JSONB, TEXT)',
                '(TEXT, INTEGER)',
                '(INTEGER, TEXT)'
            ];

            let foundSignature = null;
            let foundError = null;

            for (const signature of testSignatures) {
                try {
                    // Try to alter the function with this signature
                    const alterQuery = `ALTER FUNCTION public.${funcName}${signature} SET search_path = public`;
                    
                    // We'll use a test approach - try to get function info
                    const { data, error } = await supabase.rpc('pg_get_functiondef', {
                        func_name: `${funcName}${signature}`
                    });
                    
                    if (!error) {
                        foundSignature = signature;
                        break;
                    }
                } catch (error) {
                    // Continue to next signature
                }
            }

            if (foundSignature) {
                functionSignatures.push({
                    name: funcName,
                    signature: foundSignature,
                    full_name: `${funcName}${foundSignature}`,
                    status: 'Found'
                });
                console.log(`   ✅ ${funcName}${foundSignature}`);
            } else {
                // Try a different approach - use information_schema
                try {
                    const { data, error } = await supabase
                        .from('information_schema.routines')
                        .select('routine_name, data_type, parameter_name, parameter_mode, parameter_default, is_result')
                        .eq('routine_name', funcName)
                        .eq('routine_schema', 'public');

                    if (data && data.length > 0) {
                        const params = data.filter(row => row.parameter_name !== null);
                        const signature = params.length > 0 ? 
                            `(${params.map(p => p.data_type).join(', ')})` : '()';
                        
                        functionSignatures.push({
                            name: funcName,
                            signature: signature,
                            full_name: `${funcName}${signature}`,
                            status: 'Found via information_schema',
                            parameters: params
                        });
                        console.log(`   ✅ ${funcName}${signature} (via information_schema)`);
                    } else {
                        functionSignatures.push({
                            name: funcName,
                            signature: 'UNKNOWN',
                            full_name: funcName,
                            status: 'Signature unknown'
                        });
                        console.log(`   ⚠️  ${funcName} - Signature unknown`);
                    }
                } catch (error) {
                    functionSignatures.push({
                        name: funcName,
                        signature: 'UNKNOWN',
                        full_name: funcName,
                        status: 'Error getting signature',
                        error: error.message
                    });
                    console.log(`   ❌ ${funcName} - Error: ${error.message}`);
                }
            }

        } catch (error) {
            console.log(`❌ Error processing ${funcName}: ${error.message}`);
        }
    }

    console.log('');
    console.log('📊 FUNCTION SIGNATURE ANALYSIS:');
    console.log('================================');
    
    const foundSignatures = functionSignatures.filter(f => f.status.includes('Found'));
    const unknownSignatures = functionSignatures.filter(f => f.status.includes('unknown') || f.status.includes('Error'));
    
    console.log(`✅ Functions with known signatures: ${foundSignatures.length}`);
    console.log(`⚠️  Functions with unknown signatures: ${unknownSignatures.length}`);
    console.log(`📋 Total functions analyzed: ${functionSignatures.length}`);
    console.log('');

    if (foundSignatures.length > 0) {
        console.log('✅ FUNCTIONS WITH KNOWN SIGNATURES:');
        foundSignatures.forEach(f => console.log(`   - ${f.full_name}`));
        console.log('');
    }

    if (unknownSignatures.length > 0) {
        console.log('⚠️  FUNCTIONS WITH UNKNOWN SIGNATURES:');
        unknownSignatures.forEach(f => console.log(`   - ${f.name} (${f.status})`));
        console.log('');
    }

    // Save detailed analysis
    const analysisData = {
        timestamp: new Date().toISOString(),
        total_functions: functionSignatures.length,
        functions_with_signatures: foundSignatures.length,
        functions_without_signatures: unknownSignatures.length,
        function_details: functionSignatures,
        summary: {
            with_signatures: foundSignatures.map(f => f.full_name),
            without_signatures: unknownSignatures.map(f => f.name)
        }
    };

    fs.writeFileSync('function_signatures.json', JSON.stringify(analysisData, null, 2));
    console.log('💾 Function signatures saved to function_signatures.json');
    console.log('');

    if (foundSignatures.length > 0) {
        console.log('🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. Review function_signatures.json');
        console.log('2. Create migration with correct signatures');
        console.log('3. Handle unknown signatures separately');
        console.log('');
        console.log('✅ Ready to create accurate migration!');
    } else {
        console.log('⚠️  No function signatures found - manual review needed');
    }
}

getFunctionSignatures().catch(error => {
    console.error('❌ Error:', error);
});
