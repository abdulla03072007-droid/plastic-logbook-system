/**
 * Integration Tests: Auth API Routes
 * Tests the full HTTP request → route → controller → DB cycle using supertest.
 */
process.env.JWT_SECRET = 'test_jwt_secret_integration';
require('../setup');

const request = require('supertest');
const app = require('../../app');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth API - Integration Tests', () => {

  // ── POST /api/auth/register ───────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should register a new admin and return 201 with a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newadmin', password: 'Secret@123', email: 'admin@test.com' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.admin.username).toBe('newadmin');
      expect(res.body.admin).not.toHaveProperty('password');
    });

    it('should return 400 if username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'Secret@123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for a duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', password: 'Pass@123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', password: 'Another@123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ── POST /api/auth/login ──────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', password: 'MyPass@456' });
    });

    it('should login successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'MyPass@456' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'WrongPass!' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for a non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ghost', password: 'whatever' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/auth/me ──────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'meuser', password: 'Me@12345' });
      token = res.body.token;
    });

    it('should return current admin profile with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.admin.username).toBe('meuser');
      expect(res.body.admin).not.toHaveProperty('password');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(401);
    });
  });

});
