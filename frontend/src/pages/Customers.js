import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { customerAPI } from "../services/api";
import "../styles/Common.css";

const EMPTY_FORM = {
  customerName: "",
  shopName:     "",
  phoneNumber:  "",
  address:      "",
};

function Customers() {
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search,    setSearch]    = useState("");
  const [deleteId,  setDeleteId]  = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAllCustomers(search);
      setCustomers(Array.isArray(res.data.customers) ? res.data.customers : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error(err);
      setCustomers([]);
    }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const clearForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const { customerName, shopName, phoneNumber, address } = formData;
    if (!customerName || !shopName || !phoneNumber || !address) {
      addToast("Please fill all fields.", "warning");
      return;
    }
    try {
      if (editingId) {
        await customerAPI.updateCustomer(editingId, formData);
        addToast("Customer updated successfully!", "success");
      } else {
        await customerAPI.createCustomer(formData);
        addToast("Customer added successfully!", "success");
      }
      clearForm();
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleEdit = (c) => {
    setFormData({
      customerName: c.customerName || "",
      shopName:     c.shopName     || "",
      phoneNumber:  c.phoneNumber  || "",
      address:      c.address      || "",
    });
    setEditingId(c._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await customerAPI.deleteCustomer(deleteId);
      addToast("Customer deleted.", "success");
      setDeleteId(null);
      fetchCustomers();
    } catch {
      addToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const filtered = customers;

  const initials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="container-fluid">
          {/* ── UNIFIED MODERN HEADER ──────────────────────────── */}
          <PageHeader 
            title="Customers" 
            icon="👥" 
            search={search} 
            setSearch={setSearch} 
            placeholder="Search by name or shop..."
          />

          <div className="page-body">
            <div className="form-card">
              <h3>{editingId ? "✏️ Edit Customer" : "➕ Add Customer"}</h3>
              <div className="form-group">
                <label>Customer Name</label>
                <input name="customerName" placeholder="Full name" value={formData.customerName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Shop Name</label>
                <input name="shopName" placeholder="Shop / business name" value={formData.shopName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phoneNumber" placeholder="e.g. 9876543210" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="address" placeholder="City / area" value={formData.address} onChange={handleChange} />
              </div>
              <div className="form-actions">
                <button id="customer-submit-btn" className="btn btn-primary" onClick={handleSubmit}>
                  {editingId ? "💾 Update" : "➕ Add Customer"}
                </button>
                {editingId && (
                  <button className="btn btn-secondary" onClick={clearForm}>Cancel</button>
                )}
              </div>
            </div>

            <div className="list-card">
              <div className="list-card-header">
                <h3>All Customers ({filtered.length})</h3>
              </div>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p>No customers found</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Customer</th><th>Shop</th><th>Phone</th><th>Address</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {initials(item.customerName)}
                              </div>
                              <span style={{ fontWeight: 600 }}>{item.customerName}</span>
                            </div>
                          </td>
                          <td>{item.shopName}</td>
                          <td>{item.phoneNumber}</td>
                          <td>{item.address}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>✏️ Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item._id)}>🗑 Delete</button>
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
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>🗑 Delete Customer</h3>
            <p>Are you sure? This will permanently remove the customer record.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;