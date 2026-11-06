const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServerInstance = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Strict Rule: In-memory MongoDB is permitted ONLY during automated test runs
    if (process.env.NODE_ENV === 'test') {
      if (!mongoUri || process.env.USE_MEMORY_DB === 'true' || mongoUri.includes('memory')) {
        if (!memoryServerInstance) {
          memoryServerInstance = await MongoMemoryServer.create();
        }
        mongoUri = memoryServerInstance.getUri();
        console.log('[DB] Connected to isolated in-memory test database');
      }
    }

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined. Please configure a valid MongoDB connection string.');
    }

    // Safety guard: Reject memory servers or invalid URIs in production
    if (process.env.NODE_ENV === 'production') {
      if (mongoUri.includes('memory') || !mongoUri.startsWith('mongodb')) {
        throw new Error('Production environment cannot use an in-memory database. A persistent MongoDB URI is required.');
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Connection error: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('[DB] MongoDB disconnected cleanly');
  } catch (error) {
    console.error('[DB] Disconnection error:', error.message);
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
