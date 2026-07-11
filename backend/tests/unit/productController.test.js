/**
 * Unit Tests: Product Controller
 * Tests CRUD operations for products in isolation.
 */
process.env.JWT_SECRET = 'test_jwt_secret_unit';
require('../setup');

const mongoose = require('mongoose');
const Product = require('../../models/Product');
const productController = require('../../controllers/productController');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const ADMIN_ID = new mongoose.Types.ObjectId().toString();

const mockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
  admin: { id: ADMIN_ID }
});

const validProduct = {
  productName: 'PET Bottle',
  productType: 'Bottle',
  size: '500ml',
  price: 15.5,
  quantity: 100,
  stockAvailable: 80
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Product Controller - Unit Tests', () => {

  // ── createProduct ──────────────────────────────────────────────────────────

  describe('createProduct()', () => {
    it('should create a product and return 201', async () => {
      const req = mockReq(validProduct);
      const res = mockRes();

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.product.productName).toBe('PET Bottle');
      expect(json.product.adminId.toString()).toBe(ADMIN_ID);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockReq({ productName: 'Bottle' }); // missing productType, size, price
      const res = mockRes();

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].success).toBe(false);
    });

    it('should default quantity and stockAvailable to 0 if not provided', async () => {
      const req = mockReq({
        productName: 'HDPE Bag',
        productType: 'Bag',
        size: '1kg',
        price: 5
      });
      const res = mockRes();

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const json = res.json.mock.calls[0][0];
      expect(json.product.quantity).toBe(0);
      expect(json.product.stockAvailable).toBe(0);
    });
  });

  // ── getAllProducts ─────────────────────────────────────────────────────────

  describe('getAllProducts()', () => {
    beforeEach(async () => {
      await Product.create([
        { ...validProduct, adminId: ADMIN_ID, productName: 'Product A' },
        { ...validProduct, adminId: ADMIN_ID, productName: 'Product B' },
        { ...validProduct, adminId: new mongoose.Types.ObjectId(), productName: 'Other Admin Product' }
      ]);
    });

    it('should return only products belonging to the logged-in admin', async () => {
      const req = mockReq({}, {}, {});
      const res = mockRes();

      await productController.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.products).toHaveLength(2);
      expect(json.products.every(p => p.adminId.toString() === ADMIN_ID)).toBe(true);
    });

    it('should filter products by search query', async () => {
      const req = mockReq({}, {}, { search: 'Product A' });
      const res = mockRes();

      await productController.getAllProducts(req, res);

      const json = res.json.mock.calls[0][0];
      expect(json.products).toHaveLength(1);
      expect(json.products[0].productName).toBe('Product A');
    });
  });

  // ── getProductById ─────────────────────────────────────────────────────────

  describe('getProductById()', () => {
    it('should return a product by ID for the correct admin', async () => {
      const product = await Product.create({ ...validProduct, adminId: ADMIN_ID });

      const req = mockReq({}, { id: product._id.toString() });
      const res = mockRes();

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].product._id.toString()).toBe(product._id.toString());
    });

    it('should return 404 for a product belonging to another admin', async () => {
      const product = await Product.create({
        ...validProduct,
        adminId: new mongoose.Types.ObjectId()
      });

      const req = mockReq({}, { id: product._id.toString() });
      const res = mockRes();

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── updateProduct ─────────────────────────────────────────────────────────

  describe('updateProduct()', () => {
    it('should update a product and return updated data', async () => {
      const product = await Product.create({ ...validProduct, adminId: ADMIN_ID });

      const req = mockReq(
        { productName: 'Updated Name', price: 99 },
        { id: product._id.toString() }
      );
      const res = mockRes();

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.product.productName).toBe('Updated Name');
      expect(json.product.price).toBe(99);
    });

    it('should return 404 when updating a non-existent product', async () => {
      const req = mockReq(
        { productName: 'X' },
        { id: new mongoose.Types.ObjectId().toString() }
      );
      const res = mockRes();

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── deleteProduct ─────────────────────────────────────────────────────────

  describe('deleteProduct()', () => {
    it('should delete a product and return 200', async () => {
      const product = await Product.create({ ...validProduct, adminId: ADMIN_ID });

      const req = mockReq({}, { id: product._id.toString() });
      const res = mockRes();

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const inDb = await Product.findById(product._id);
      expect(inDb).toBeNull();
    });

    it('should return 404 when deleting a product from another admin', async () => {
      const product = await Product.create({
        ...validProduct,
        adminId: new mongoose.Types.ObjectId()
      });

      const req = mockReq({}, { id: product._id.toString() });
      const res = mockRes();

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

});
