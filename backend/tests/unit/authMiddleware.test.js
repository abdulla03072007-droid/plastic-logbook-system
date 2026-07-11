/**
 * Unit Tests: Auth Middleware
 * Verifies JWT token verification behavior.
 */
process.env.JWT_SECRET = 'test_jwt_secret_unit';

const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Middleware - Unit Tests', () => {

  it('should call next() and attach decoded admin to req for a valid token', () => {
    const adminId = '64abc123456789012345abcd';
    const token = signToken({ id: adminId });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.admin).toBeDefined();
    expect(req.admin.id).toBe(adminId);
  });

  it('should return 401 when no Authorization header is provided', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toContain('No token provided');
  });

  it('should return 401 for an expired token', () => {
    const expiredToken = jwt.sign(
      { id: 'someId' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toContain('Invalid or expired token');
  });

  it('should return 401 for a tampered / invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer this.is.notvalid' }
    };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token is signed with a wrong secret', () => {
    const wrongToken = jwt.sign({ id: '123' }, 'wrong_secret');

    const req = { headers: { authorization: `Bearer ${wrongToken}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

});
