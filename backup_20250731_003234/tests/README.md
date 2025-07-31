# Testing Structure

This directory contains all test files organized by type:

## 📁 Directory Structure

```
src/tests/
├── unit/           # Unit tests for individual components/functions
├── integration/    # Integration tests for component interactions
├── e2e/           # End-to-end tests for full user workflows
└── README.md      # This file
```

## 🧪 Test Types

### Unit Tests (`unit/`)
- Test individual functions and components in isolation
- Fast execution, focused on specific functionality
- Examples: `test_sugar_products.js`, `test_filtering_logic.js`

### Integration Tests (`integration/`)
- Test how components work together
- Test API integrations and data flow
- Examples: `test_comprehensive_coverage.js`

### End-to-End Tests (`e2e/`)
- Test complete user workflows
- Test full application functionality
- Examples: `test_frontend_recipe_display.js`

## 🚀 Running Tests

### Unit Tests
```bash
npm test src/tests/unit/
```

### Integration Tests
```bash
npm test src/tests/integration/
```

### E2E Tests
```bash
npm test src/tests/e2e/
```

### All Tests
```bash
npm test
```

## 📝 Test Guidelines

1. **Naming**: Use descriptive names that explain what is being tested
2. **Organization**: Group related tests together
3. **Documentation**: Add comments explaining complex test scenarios
4. **Maintenance**: Keep tests up to date with code changes 