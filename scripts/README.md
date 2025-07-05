# Scripts Directory

This directory contains utility and data processing scripts organized by purpose.

## 📁 Directory Structure

```
scripts/
├── utilities/           # General utility scripts
├── data-processing/     # Data analysis and processing scripts
└── README.md           # This file
```

## 🛠️ Utilities (`utilities/`)

General purpose scripts for project maintenance and development:

- `debug_product_matching.js` - Debug product matching logic
- `organize_project.js` - Project organization and cleanup utilities

## 📊 Data Processing (`data-processing/`)

Scripts for analyzing and processing data:

- `add_basic_ingredients.js` - Add basic ingredients to database
- `analyze_common_ingredients.js` - Analyze ingredient frequency and patterns
- `check_basic_ingredients.js` - Verify basic ingredient data
- `check_canonical_ingredients.js` - Validate canonical ingredient mappings
- `print_pizza_ingredients.js` - Extract and analyze pizza recipe ingredients

## 🚀 Usage

### Running Data Processing Scripts
```bash
# From project root
node scripts/data-processing/analyze_common_ingredients.js
```

### Running Utility Scripts
```bash
# From project root
node scripts/utilities/debug_product_matching.js
```

## 📝 Guidelines

1. **Documentation**: Each script should have clear comments explaining its purpose
2. **Error Handling**: Include proper error handling and logging
3. **Configuration**: Use environment variables or config files for settings
4. **Output**: Provide clear output and progress indicators 