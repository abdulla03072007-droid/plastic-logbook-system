/**
 * Test Setup - In-Memory MongoDB
 * Uses mongodb-memory-server so tests run without a real database
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean all collections between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and stop the in-memory server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
