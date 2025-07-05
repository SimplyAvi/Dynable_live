// Test setup file for Jest
const sequelize = require('../db/database');

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Sync database for tests (use force: false to avoid dropping tables)
  await sequelize.sync({ force: false });
});

// Global test teardown
afterAll(async () => {
  await sequelize.close();
});

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}; 