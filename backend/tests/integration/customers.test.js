/**
 * Integration Tests: Customer API Routes
 * Matches the ACTUAL customerRoutes.js:
 *   POST   /api/customers/add        → { message: "Customer added successfully" }
 *   GET    /api/customers/           → plain array of customer objects
 *   PUT    /api/customers/update/:id
 *   DELETE /api/customers/delete/:id → { message: "Customer deleted successfully" }
 *
 * Customer fields: customerName, shopName, phoneNumber, address
 */
process.env.JWT_SECRET = 'test_jwt_secret_integration';
require('../setup');

const request = require('supertest');
const app = require('../../app');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async (username = 'custadmin', password = 'Cust@123') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password });
  return res.body.token;
};

// Valid payload matching the REAL Customer schema
const validCustomer = {
  customerName: 'Rajan Plastics',
  shopName: 'Rajan & Co',
  phoneNumber: '9876543210',
  address: '12, Industrial Area, Chennai'
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Customers API - Integration Tests', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  // ── POST /api/customers/add ───────────────────────────────────────────────

  describe('POST /api/customers/add', () => {
    it('should add a customer and return success message', async () => {
      const res = await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validCustomer);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Customer added successfully');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/customers/add')
        .send(validCustomer);

      expect(res.statusCode).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerName: 'Only Name' }); // missing shopName, phoneNumber, address

      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /api/customers/ ───────────────────────────────────────────────────

  describe('GET /api/customers/', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validCustomer);

      await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validCustomer, customerName: 'Kumar Industries', phoneNumber: '9111111111' });
    });

    it('should return all customers as a plain array', async () => {
      const res = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it('should enforce multi-tenancy — admin2 sees 0 customers', async () => {
      const token2 = await registerAndLogin('custadmin2', 'Cust2@123');

      const res = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token2}`);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/customers/');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PUT /api/customers/update/:id ─────────────────────────────────────────

  describe('PUT /api/customers/update/:id', () => {
    it('should update a customer and return the updated data', async () => {
      await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validCustomer);

      const listRes = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token}`);
      const customerId = listRes.body[0]._id;

      const res = await request(app)
        .put(`/api/customers/update/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ customerName: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Customer updated successfully');
      expect(res.body.updatedCustomer.customerName).toBe('Updated Name');
    });
  });

  // ── DELETE /api/customers/delete/:id ──────────────────────────────────────

  describe('DELETE /api/customers/delete/:id', () => {
    it('should delete a customer and return 200', async () => {
      await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validCustomer);

      const listRes = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token}`);
      const customerId = listRes.body[0]._id;

      const deleteRes = await request(app)
        .delete(`/api/customers/delete/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Customer deleted successfully');

      // Confirm deleted
      const listAfter = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token}`);
      expect(listAfter.body).toHaveLength(0);
    });

    it('should return 404 when deleting another admin\'s customer', async () => {
      await request(app)
        .post('/api/customers/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validCustomer);

      const listRes = await request(app)
        .get('/api/customers/')
        .set('Authorization', `Bearer ${token}`);
      const customerId = listRes.body[0]._id;

      const token2 = await registerAndLogin('custadmin3', 'Cust3@123');
      const res = await request(app)
        .delete(`/api/customers/delete/${customerId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(404);
    });
  });

});
