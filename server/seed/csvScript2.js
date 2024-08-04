const fs = require('fs');
const readline = require('readline');

// Define keywords for deatiledCategories
const deatiledCategories = require('./Data/DetailedCategories')

// Function to categorize ingredients
function categorizeIngredient(ingredient) {
  for (const [category, keywords] of Object.entries(deatiledCategories)) {
    for (const keyword of keywords) {
      if (ingredient.toLowerCase().includes(keyword)) {
        return category;
      }
    }
  }
  return 'Other';
}

// Read ingredients from CSV, categorize, and save to new CSV
async function processCSV(inputFile, outputFile, otherFile) {
    const ingredients = [];
    const otherItems = [];
    const fileStream = fs.createReadStream(inputFile);
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
  
    for await (const line of rl) {
        const [name] = line.split(','); // Adjust index based on CSV structure
        const category = categorizeIngredient(name);
        const entry = { Name: name, Subcategory: category };
        ingredients.push(entry);
        if (category === 'Other') {
        otherItems.push(entry);
        }
    }
  
    // Function to convert JSON to CSV
    function convertToCSV(data) {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [header, ...rows].join('\n');
  }
  const csvData = convertToCSV(ingredients);
  const otherCsvData = convertToCSV(otherItems);
    fs.writeFileSync(otherFile, otherCsvData, 'utf8');
    console.log(`Items in 'Other' category saved to '${otherFile}'.`);
    fs.writeFileSync(outputFile, csvData, 'utf8');
    console.log(`Subcategories assigned and saved to '${outputFile}'.`);
  }
  
  processCSV('./unique_names.csv', 'categorized_ingredients.csv', 'other_ingredients.csv');