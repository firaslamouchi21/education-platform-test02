const { pool } = require('../config/database');
const { auth, firestore } = require('../config/firebase');

// Mock Firebase Auth
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn()
  },
  firestore: {
    collection: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn()
    }
  },
  storage: {
    bucket: jest.fn()
  }
}));

// Mock MySQL
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

// Setup function to run before tests
global.setupTestDB = async () => {
  // Clear all mocks
  jest.clearAllMocks();

  // Setup default Firebase Auth mock response
  auth.verifyIdToken.mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com'
  });

  // Setup default Firestore mock responses
  const mockFirestoreData = {
    data: () => ({
      message: 'Test message',
      sender_id: 1,
      timestamp: new Date()
    }),
    exists: true,
    id: 'test-doc-id'
  };

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(mockFirestoreData),
    set: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  };

  firestore.collection.mockReturnValue(mockCollection);

  // Setup default MySQL mock responses
  const mockDBConnection = {
    execute: jest.fn(),
    release: jest.fn()
  };

  pool.getConnection.mockResolvedValue(mockDBConnection);
  pool.execute.mockImplementation((query, params) => {
    // Mock different responses based on the query
    if (query.toLowerCase().includes('select')) {
      return Promise.resolve([[{ id: 1, email: 'test@example.com' }], []]);
    }
    if (query.toLowerCase().includes('insert')) {
      return Promise.resolve([{ insertId: 1 }]);
    }
    if (query.toLowerCase().includes('update')) {
      return Promise.resolve([{ affectedRows: 1 }]);
    }
    if (query.toLowerCase().includes('delete')) {
      return Promise.resolve([{ affectedRows: 1 }]);
    }
    return Promise.resolve([[], []]);
  });
};

// Cleanup function to run after tests
global.teardownTestDB = async () => {
  jest.clearAllMocks();
}; 