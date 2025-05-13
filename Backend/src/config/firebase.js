const admin = require('firebase-admin');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');

dotenv.config();

let auth, storage, firestore;

// Initialize Firebase Admin
try {
  // Check if credentials file path is provided
  if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is not set');
  }

  try {
    const serviceAccount = require(process.env.FIREBASE_ADMIN_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    auth = admin.auth();
    storage = admin.storage();
    firestore = admin.firestore();

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    // If in development, initialize with application default credentials
    if (process.env.NODE_ENV === 'development') {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

      auth = admin.auth();
      storage = admin.storage();
      firestore = admin.firestore();

      logger.info('Firebase Admin SDK initialized with application default credentials');
    } else {
      throw error;
    }
  }
} catch (error) {
  logger.error('Error initializing Firebase Admin SDK:', error.message);
  
  // In development, create mock Firebase services
  if (process.env.NODE_ENV === 'development') {
    auth = {
      verifyIdToken: () => Promise.resolve({
        uid: 'test-uid',
        email: 'test@example.com'
      })
    };
    
    storage = {
      bucket: () => ({
        upload: () => Promise.resolve(),
        file: () => ({
          delete: () => Promise.resolve()
        })
      })
    };
    
    firestore = {
      collection: () => ({
        doc: () => ({
          set: () => Promise.resolve(),
          get: () => Promise.resolve({ exists: false }),
          delete: () => Promise.resolve()
        }),
        where: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] })
        })
      })
    };

    logger.warn('Using mock Firebase services for development');
  } else {
    process.exit(1);
  }
}

module.exports = {
  auth,
  storage,
  firestore
}; 