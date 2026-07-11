/**
 * Integration Tests: Products API Routes
 * Matches the ACTUAL productRoutes.js:
 *   POST   /api/products/add
 *   GET    /api/products/           → returns plain array
 *   PUT    /api/products/update/:id
 *   DELETE /api/products/delete/:id
 */
process.env.JWT_SECRET = 'test_jwt_secret_integration';
require('../setup');

const request = require('supertest');
const app = require('../../app');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async (username = 'prodadmin', password = 'Prod@123') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password });
  return res.body.token;
};

const validProduct = {
  productName: 'PET Bottle 500ml',
  productType: 'Bottle',
  size: '500ml',
  price: 12.5,
  quantity: 200,
  stockAvailable: 150
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Products API - Integration Tests', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  // ── POST /api/products/add ────────────────────────────────────────────────

  describe('POST /api/products/add', () => {
    it('should add a product and return 200 with success message', async () => {
      const res = await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product added successfully');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .post('/api/products/add')
        .send(validProduct);

      expect(res.statusCode).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ productName: 'Incomplete' }); // missing productType, size, quantity, price, stockAvailable

      expect(res.statusCode).toBe(400);
    });

    it('should accept an array of products (bulk insert)', async () => {
      const products = [
        { ...validProduct, productName: 'Bulk A' },
        { ...validProduct, productName: 'Bulk B' }
      ];

      const res = await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(products);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Multiple products added');
    });
  });

  // ── GET /api/products/ ────────────────────────────────────────────────────

  describe('GET /api/products/', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/products/add')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validProduct, productName: `Product ${i}` });
      }
    });

    it('should return all products for the logged-in admin as an array', async () => {
      const res = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
    });

    it('should enforce multi-tenancy — admin2 sees 0 products', async () => {
      const token2 = await registerAndLogin('admin2prod', 'Admin2@123');

      const res = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token2}`);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/products/');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PUT /api/products/update/:id ──────────────────────────────────────────

  describe('PUT /api/products/update/:id', () => {
    it('should update a product and return success message', async () => {
      // Add a product first
      await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct);

      // Get its ID from the list
      const listRes = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);
      const productId = listRes.body[0]._id;

      const res = await request(app)
        .put(`/api/products/update/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productName: 'Updated Bottle', price: 99 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product updated successfully');
    });

    it('should return 404 for updating another admin\'s product', async () => {
      // Admin1 adds product
      await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct);

      const listRes = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);
      const productId = listRes.body[0]._id;

      // Admin2 tries to update it
      const token2 = await registerAndLogin('admin2upd', 'Admin2@123');
      const res = await request(app)
        .put(`/api/products/update/${productId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ productName: 'Stolen Update' });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /api/products/delete/:id ───────────────────────────────────────

  describe('DELETE /api/products/delete/:id', () => {
    it('should delete a product and return 200', async () => {
      await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct);

      const listRes = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);
      const productId = listRes.body[0]._id;

      const deleteRes = await request(app)
        .delete(`/api/products/delete/${productId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Product deleted successfully');

      // Confirm deleted
      const listAfter = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);
      expect(listAfter.body).toHaveLength(0);
    });

    it('should not allow deleting another admin\'s product (returns 404)', async () => {
      await request(app)
        .post('/api/products/add')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct);

      const listRes = await request(app)
        .get('/api/products/')
        .set('Authorization', `Bearer ${token}`);
      const productId = listRes.body[0]._id;

      const token2 = await registerAndLogin('admin3del', 'Admin3@123');
      const res = await request(app)
        .delete(`/api/products/delete/${productId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(404);
    });
  });

});
