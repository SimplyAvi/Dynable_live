// generateProminenceReport.js
const fs = require('fs');
const path = require('path');
const { analyzeIngredientProminence, deduplicateProducts } = require('./analyzeIngredientProminence');

const allProductsPath = path.resolve(__dirname, 'allProducts.json');
let allProducts = [];
try {
    allProducts = require(allProductsPath);
} catch (err) {
    console.error('❌ Failed to load allProducts.json:', err.message);
    process.exit(1);
}

const testRecipeIngredients = ['egg', 'milk', 'sugar'];

async function generateFullReport() {
    const report = {};
    for (const ingredient of testRecipeIngredients) {
        console.log(`\n=== ${ingredient.toUpperCase()} ANALYSIS REPORT ===`);
        const products = allProducts.filter(p => p.canonicalTag === ingredient);
        // Deduplicate by description
        const uniqueProducts = deduplicateProducts(products);
        const classifications = {};
        uniqueProducts.forEach(product => {
            const analysis = analyzeIngredientProminence(product, ingredient);
            if (!classifications[analysis.classification]) {
                classifications[analysis.classification] = [];
            }
            classifications[analysis.classification].push({
                id: product.id,
                description: product.description,
                analysis
            });
        });
        // Print summary
        console.log('\n📊 Classification Summary:');
        Object.entries(classifications).forEach(([classification, prods]) => {
            console.log(`   ${classification}: ${prods.length} products`);
        });
        // Show examples of each classification
        console.log('\n📋 Sample Products by Classification:');
        Object.entries(classifications).forEach(([classification, prods]) => {
            console.log(`\n   ${classification.toUpperCase()}:`);
            prods.slice(0, 3).forEach(p => {
                console.log(`     - ${p.description.substring(0, 80)}`);
            });
        });
        // Save to report object
        report[ingredient] = {};
        Object.entries(classifications).forEach(([classification, prods]) => {
            report[ingredient][classification] = prods.slice(0, 10); // Save up to 10 samples per class
        });
    }
    // Optionally write to file
    const outPath = path.resolve(__dirname, 'prominence_report.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report written to ${outPath}`);
}

generateFullReport(); 