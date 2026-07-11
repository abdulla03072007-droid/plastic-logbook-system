/**
 * Unit Tests: Auth Controller
 * Tests login, register, and profile update logic in isolation using mocks.
 */
process.env.JWT_SECRET = 'test_jwt_secret_unit';
require('../setup');

const mongoose = require('mongoose');
const Admin = require('../../models/Admin');
const authController = require('../../controllers/authController');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body = {}, params = {}, query = {}, adminId = null) => ({
  body,
  params,
  query,
  admin: adminId ? { id: adminId } : undefined
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Controller - Unit Tests', () => {

  // ── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('should register a new admin and return 201 with token', async () => {
      const req = mockReq({ username: 'testadmin', password: 'Pass@123', email: 'test@example.com' });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.token).toBeDefined();
      expect(json.admin.username).toBe('testadmin');
    });

    it('should return 400 if username is missing', async () => {
      const req = mockReq({ password: 'Pass@123' });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].success).toBe(false);
    });

    it('should return 400 if password is missing', async () => {
      const req = mockReq({ username: 'admin2' });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if username already exists', async () => {
      // Create admin first
      await Admin.create({ username: 'duplicate', password: 'hashed123' });

      const req = mockReq({ username: 'duplicate', password: 'Pass@123' });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toContain('already exists');
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    beforeEach(async () => {
      await Admin.create({ username: 'loginuser', password: 'MySecret@1' });
    });

    it('should login with correct credentials and return a token', async () => {
      const req = mockReq({ username: 'loginuser', password: 'MySecret@1' });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const req = mockReq({ username: 'loginuser', password: 'WrongPass!' });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].success).toBe(false);
    });

    it('should return 401 for non-existent username', async () => {
      const req = mockReq({ username: 'nobody', password: 'anything' });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if username or password is missing', async () => {
      const req = mockReq({ username: 'loginuser' }); // no password
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── getCurrentAdmin ────────────────────────────────────────────────────────

  describe('getCurrentAdmin()', () => {
    it('should return the current admin without password', async () => {
      const admin = await Admin.create({ username: 'meadmin', password: 'Secret1!' });

      const req = mockReq({}, {}, {}, admin._id.toString());
      const res = mockRes();

      await authController.getCurrentAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.admin).toBeDefined();
      expect(json.admin.password).toBeUndefined();
    });
  });

});
