/**
 * Integration Tests: Health Check & General API
 * Smoke tests for server health and 404 handling.
 */
process.env.JWT_SECRET = 'test_jwt_secret_integration';
require('../setup');

const request = require('supertest');
const app = require('../../app');

describe('General API - Integration Tests', () => {

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route-that-does-not-exist');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected routes without token', () => {
    const protectedRoutes = [
      { method: 'get',  path: '/api/products/' },
      { method: 'get',  path: '/api/customers/' },
      { method: 'get',  path: '/api/payments/' },
      { method: 'get',  path: '/api/auth/me' }
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} should return 401 without token`, async () => {
        const res = await request(app)[method](path);
        expect(res.statusCode).toBe(401);
      });
    });
  });

});
