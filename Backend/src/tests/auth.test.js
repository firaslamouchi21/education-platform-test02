const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth.routes');
const User = require('../models/user.model');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(async () => {
    await global.setupTestDB();
  });

  afterEach(async () => {
    await global.teardownTestDB();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firebase_uid: 'test-uid',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('role', userData.role);
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        firebase_uid: 'test-uid',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        firebase_uid: 'test-uid',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('PUT /api/auth/me', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', updates.email);
    });

    it('should return 401 when not authenticated', async () => {
      const updates = {
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/auth/me')
        .send(updates)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/auth/users', () => {
    it('should return users list for admin', async () => {
      // Mock admin user
      jest.spyOn(User, 'findByFirebaseUid').mockResolvedValueOnce({
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      });

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      // Mock non-admin user
      jest.spyOn(User, 'findByFirebaseUid').mockResolvedValueOnce({
        id: 1,
        email: 'student@example.com',
        role: 'student'
      });

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });
}); 