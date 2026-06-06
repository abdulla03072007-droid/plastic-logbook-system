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
  profileImage: "",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #ec4899, #f43f5e)",
  "linear-gradient(135deg, #f59e0b, #f97316)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #14b8a6, #0ea5e9)",
  "linear-gradient(135deg, #a855f7, #ec4899)",
  "linear-gradient(135deg, #84cc16, #16a34a)",
  "linear-gradient(135deg, #f43f5e, #fb923c)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
];

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast("Image must be under 2MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

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
      profileImage: c.profileImage || "",
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

  const getInitials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  const getAvatarGradient = (name = "") =>
    AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

  const filtered = customers.filter(c =>
    !search ||
    c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    c.shopName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="container-fluid">
          <PageHeader
            title="Customers"
            icon="👥"
            search={search}
            setSearch={setSearch}
            placeholder="Search by name or shop..."
          />

          <div className="page-body">
            {/* ── ADD / EDIT FORM ─────────────────────────────── */}
            <div className="form-card" style={{
              borderRadius: 24, border: 'none',
              boxShadow: '0 10px 40px rgba(0,0,0,0.07)',
              background: 'white', padding: '28px 30px'
            }}>
              {/* Live Avatar Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                {/* Clickable avatar = file upload trigger */}
                <label htmlFor="profile-image-input" style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: formData.profileImage
                      ? 'transparent'
                      : (formData.customerName
                        ? getAvatarGradient(formData.customerName)
                        : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 22,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    border: '3px solid white', flexShrink: 0,
                    overflow: 'hidden', transition: 'box-shadow 0.2s'
                  }}>
                    {formData.profileImage
                      ? <img src={formData.profileImage} alt="preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (formData.customerName ? getInitials(formData.customerName) : "?")
                    }
                  </div>
                  {/* Camera icon overlay */}
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#6366f1', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11
                  }}>📷</div>
                </label>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.15rem' }}>
                    {editingId ? "✏️ Edit Customer" : "➕ Add New Customer"}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
                    {formData.customerName || "Fill in the details below"}
                  </p>
                  {!formData.profileImage && (
                    <p style={{ margin: '2px 0 0', color: '#a5b4fc', fontSize: 11 }}>
                      📷 Click avatar to upload photo
                    </p>
                  )}
                  {formData.profileImage && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, profileImage: "" }))}
                      style={{
                        marginTop: 4, background: 'none', border: 'none',
                        color: '#e11d48', fontSize: 11, cursor: 'pointer', padding: 0
                      }}
                    >
                      ✕ Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Customer Name</label>
                  <input name="customerName" placeholder="Full name" value={formData.customerName} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Shop Name</label>
                  <input name="shopName" placeholder="Shop / business name" value={formData.shopName} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Phone Number</label>
                  <input name="phoneNumber" placeholder="e.g. 9876543210" value={formData.phoneNumber} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Address</label>
                  <input name="address" placeholder="City / area" value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button id="customer-submit-btn" className="btn btn-primary" onClick={handleSubmit}
                  style={{ borderRadius: 12, padding: '12px 28px', fontWeight: 800 }}>
                  {editingId ? "💾 Update Customer" : "➕ Add Customer"}
                </button>
                {editingId && (
                  <button className="btn btn-secondary" onClick={clearForm}
                    style={{ borderRadius: 12, padding: '12px 20px' }}>Cancel</button>
                )}
              </div>
            </div>

            {/* ── CUSTOMER PROFILE CARDS ───────────────────────── */}
            <div style={{
              background: 'white', borderRadius: 24,
              boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 26px', borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(to right, #ffffff, #f8fafc)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>
                  👥 All Customers
                </h3>
                <span style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', borderRadius: 20, padding: '4px 14px',
                  fontSize: 13, fontWeight: 700
                }}>
                  {filtered.length} total
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '60px 20px' }}>
                  <div className="empty-icon">👥</div>
                  <p>No customers found</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: 20, padding: 24
                }}>
                  {filtered.map((item) => (
                    <div key={item._id} style={{
                      borderRadius: 20,
                      border: editingId === item._id ? '2px solid #6366f1' : '1px solid #f1f5f9',
                      background: editingId === item._id ? '#f5f3ff' : '#fafbfc',
                      boxShadow: editingId === item._id
                        ? '0 8px 28px rgba(99,102,241,0.18)'
                        : '0 4px 16px rgba(0,0,0,0.05)',
                      transition: 'all 0.25s ease',
                      overflow: 'hidden'
                    }}>
                      {/* Gradient top strip */}
                      <div style={{
                        height: 7,
                        background: getAvatarGradient(item.customerName),
                      }} />

                      <div style={{ padding: '20px 20px 18px' }}>
                        {/* Avatar + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <div style={{
                            width: 58, height: 58, borderRadius: '50%',
                            background: item.profileImage ? 'transparent' : getAvatarGradient(item.customerName),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 900, fontSize: 20,
                            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                            border: '3px solid white', flexShrink: 0,
                            overflow: 'hidden', letterSpacing: 1
                          }}>
                            {item.profileImage
                              ? <img src={item.profileImage} alt={item.customerName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : getInitials(item.customerName)
                            }
                          </div>
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{
                              fontWeight: 800, color: '#0f172a',
                              fontSize: '1rem', whiteSpace: 'nowrap',
                              overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {item.customerName}
                            </div>
                            <div style={{
                              fontSize: 12, color: '#6366f1',
                              fontWeight: 600, marginTop: 3,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              🏪 {item.shopName}
                            </div>
                          </div>
                        </div>

                        {/* Info Pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: '#f8fafc', borderRadius: 10, padding: '8px 12px'
                          }}>
                            <span style={{ fontSize: 14 }}>📞</span>
                            <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                              {item.phoneNumber}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: '#f8fafc', borderRadius: 10, padding: '8px 12px'
                          }}>
                            <span style={{ fontSize: 14 }}>📍</span>
                            <span style={{
                              fontSize: 13, color: '#334155', fontWeight: 600,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {item.address}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{
                              flex: 1, borderRadius: 12, padding: '9px 0',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              background: '#f1f5f9', color: '#475569', border: 'none',
                              transition: 'background 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(item._id)}
                            style={{
                              flex: 1, borderRadius: 12, padding: '9px 0',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              background: '#fff1f2', color: '#e11d48', border: 'none',
                              transition: 'background 0.2s'
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 24, padding: '40px' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px' }}>Delete Customer?</h3>
            <p style={{ color: '#64748b', marginBottom: 30 }}>
              This will permanently remove the customer record.
            </p>
            <div style={{ display: 'flex', gap: 15 }}>
              <button className="btn btn-danger"
                style={{ flex: 1, height: 45, borderRadius: 12 }}
                onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="btn btn-secondary"
                style={{ flex: 1, height: 45, borderRadius: 12 }}
                onClick={() => setDeleteId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;