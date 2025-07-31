const fs = require('fs');
const readline = require('readline');

// Define the directory where you want to save the split files
const outputDirectory = "./splitFiles4";

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

// Define the maximum number of lines (objects) in each split file
const maxLinesPerFile = 10000; // Adjust as needed

function splitJson(inputFile, outputDirectory, maxLinesPerFile) {
    try {
        let input = fs.createReadStream(inputFile, { encoding: 'utf8' });
        let reader = readline.createInterface({ input });

        let outputFile;
        let lineCount = 0;
        let fileIndex = 33;

        reader.on('line', (line) => {
            if (lineCount % maxLinesPerFile === 0) {
                if (outputFile) {
                    outputFile.write("\n];"); // End of previous array
                    outputFile.end();
                }
                outputFile = fs.createWriteStream(`${outputDirectory}/split_${fileIndex}.js`, { flags: 'a', encoding: 'utf8' });
                fileIndex++;
                outputFile.write("const data = [\n"); // Start of new array
            }

            outputFile.write(line + '\n'); // Write line without extra comma separator

            lineCount++;
        });

        reader.on('close', () => {
            if (outputFile) {
                outputFile.write("\n]\nmodule.exports=data"); // End of last array
                outputFile.end();
            }
            console.log(`Splitting of ${inputFile} completed successfully.`);
        });
    } catch (error) {
        console.error(`Error occurred while splitting ${inputFile}:`, error);
    }
}

// Usage example
const inputFile = "./part3.json";
splitJson(inputFile, outputDirectory, maxLinesPerFile);
