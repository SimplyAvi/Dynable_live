const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path')

// Step 1: Initialize Sequelize
const sequelize = require('../db/database')

// Step 2: Define the Model
const Ingredients = require('../db/models/Recipe/Ingredients')

// Step 3: Fetch and Filter Names, then Get Unique Names
async function fetchUniqueNames() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const allNames = await Ingredients.findAll({
            attributes: ['name'],
        });

        // Filter names to only include strings with letters
        const filteredNames = allNames
            .map(record => record.get('name'))
            .map(name => name.replace(/[^A-Za-z\s]/g, '').trim())
            .filter(name => name.length > 0);

        // Get unique names
        const uniqueNames = [...new Set(filteredNames)];

        return uniqueNames;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

// Step 4: Write to CSV
async function writeToCsv(names) {
    const csvWriter = createCsvWriter({
        path: path.resolve(__dirname, 'unique_names.csv'),
        header: [
            { id: 'name', title: 'Name' }
        ]
    });

    const records = names.map(name => ({ name }));
    await csvWriter.writeRecords(records);
    console.log('CSV file was written successfully');
}

// Main function
async function main() {
    const uniqueNames = await fetchUniqueNames();
    if (uniqueNames.length > 0) {
        await writeToCsv(uniqueNames);
        console.log('code written in csv', `${uniqueNames.length} unique names were added`)
    } else {
        console.log('No unique names found.');
    }
}

main().catch(console.error);
