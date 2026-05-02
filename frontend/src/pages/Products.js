import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { productAPI } from "../services/api";
import "../styles/Common.css";

const EMPTY_FORM = {
  productName:    "",
  productType:    "",
  size:           "",
  quantity:       "",
  price:          "",
  stockAvailable: "",
};

function Products() {
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [products,   setProducts]   = useState([]);
  const [editingId,  setEditingId]  = useState(null);
  const [search,     setSearch]     = useState("");
  const [deleteId,   setDeleteId]   = useState(null); // confirm modal
  const { toasts, addToast, removeToast } = useToast();

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAllProducts(search);
      setProducts(Array.isArray(res.data.products) ? res.data.products : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const clearForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const { productName, productType, size, quantity, price, stockAvailable } = formData;
    if (!productName || !productType || !size || !quantity || !price || !stockAvailable) {
      addToast("Please fill all fields.", "warning");
      return;
    }
    try {
      if (editingId) {
        await productAPI.updateProduct(editingId, formData);
        addToast("Product updated successfully!", "success");
      } else {
        await productAPI.createProduct(formData);
        addToast("Product added successfully!", "success");
      }
      clearForm();
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      productName:    product.productName    || "",
      productType:    product.productType    || "",
      size:           product.size           || "",
      quantity:       product.quantity       || "",
      price:          product.price          || "",
      stockAvailable: product.stockAvailable || "",
    });
    setEditingId(product._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await productAPI.deleteProduct(deleteId);
      addToast("Product deleted.", "success");
      setDeleteId(null);
      fetchProducts();
    } catch {
      addToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const filtered = products; // Filtering is handled by backend search param in fetchProducts

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="page-header">
          <h1>📦 Products</h1>
          <p>Manage your plastic product inventory</p>
        </div>

        <div className="page-body">
          {/* ── Form Panel ─────────────────────────────── */}
          <div className="form-card">
            <h3>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h3>

            <div className="form-group">
              <label>Product Name</label>
              <input
                name="productName"
                placeholder="e.g. PVC Pipe"
                value={formData.productName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Product Type</label>
              <input
                name="productType"
                placeholder="e.g. Pipe / Container"
                value={formData.productType}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Size</label>
              <input
                name="size"
                placeholder="e.g. 10mm / 1 litre"
                value={formData.size}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                name="quantity"
                type="number"
                placeholder="e.g. 100"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Price (₹)</label>
              <input
                name="price"
                type="number"
                placeholder="e.g. 250"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Stock Available</label>
              <input
                name="stockAvailable"
                type="number"
                placeholder="e.g. 80"
                value={formData.stockAvailable}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button
                id="product-submit-btn"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                {editingId ? "💾 Update" : "➕ Add Product"}
              </button>
              {editingId && (
                <button
                  className="btn btn-secondary"
                  onClick={clearForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* ── List Panel ─────────────────────────────── */}
          <div className="list-card">
            <div className="list-card-header">
              <h3>All Products ({filtered.length})</h3>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  id="product-search"
                  placeholder="Search by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>No products found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr key={item._id}>
                        <td style={{ color: "var(--text-light)", fontWeight: 500 }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                        <td>{item.productType}</td>
                        <td>{item.size}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>
                          <span
                            className={`badge ${
                              Number(item.stockAvailable) > 10
                                ? "badge-success"
                                : Number(item.stockAvailable) > 0
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {item.stockAvailable}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(item)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteId(item._id)}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Modal ─────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>🗑 Delete Product</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;