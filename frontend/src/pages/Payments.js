import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { paymentAPI, customerAPI } from "../services/api";
import "../styles/Common.css";

const getEmptyForm = () => ({
  customerId:   "",
  customerName: "",
  shopName:     "",
  totalBill:    "",
  paidAmount:   "",
  paymentDate:  new Date().toISOString().split("T")[0],
});

function Payments() {
  const [customers, setCustomers] = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [formData,  setFormData]  = useState(getEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [search,    setSearch]    = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAllCustomers();
      setCustomers(Array.isArray(res.data.customers) ? res.data.customers : (Array.isArray(res.data) ? res.data : []));
    } catch (err) { console.error(err); }
  };

  const fetchPayments = async () => {
    try {
      const res = await paymentAPI.getAllPayments(search);
      setPayments(Array.isArray(res.data.payments) ? res.data.payments : (Array.isArray(res.data) ? res.data : []));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCustomers();
    fetchPayments();
  }, [search]);

  const handleCustomerSelect = (e) => {
    const id  = e.target.value;
    const cus = customers.find((c) => c._id === id);
    if (cus) {
      setFormData({
        ...formData,
        customerId:   id,
        customerName: cus.customerName || "",
        shopName:     cus.shopName     || "",
      });
    } else {
      setFormData({ ...formData, customerId: "", customerName: "", shopName: "" });
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const clearForm = () => {
    setFormData(getEmptyForm());
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const { customerName, shopName, totalBill, paidAmount, paymentDate } = formData;
    if (!customerName || !shopName || !totalBill || !paidAmount || !paymentDate) {
      addToast("Please fill all fields.", "warning");
      return;
    }
    try {
      if (editingId) {
        await paymentAPI.updatePayment(editingId, formData);
        addToast("Payment updated successfully!", "success");
      } else {
        await paymentAPI.createPayment(formData);
        addToast("Payment recorded successfully!", "success");
      }
      clearForm();
      fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      customerId:   item.customerId   || "",
      customerName: item.customerName || "",
      shopName:     item.shopName     || "",
      totalBill:    item.totalBill    || "",
      paidAmount:   item.paidAmount   || "",
      paymentDate:  item.paymentDate  || "",
    });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await paymentAPI.deletePayment(deleteId);
      addToast("Payment deleted.", "success");
      setDeleteId(null);
      fetchPayments();
    } catch {
      addToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const statusBadge = (status) => {
    if (status === "Paid")    return <span className="badge badge-success">✓ Paid</span>;
    if (status === "Pending") return <span className="badge badge-warning">⏳ Pending</span>;
    if (status === "Partial") return <span className="badge badge-info">🌓 Partial</span>;
    return <span className="badge badge-info">{status}</span>;
  };

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="page-header">
          <h1>💳 Payments</h1>
          <p>Track bills, collections, and outstanding dues</p>
        </div>

        <div className="page-body">
          {/* ── Form Panel ─────────────────────────────── */}
          <div className="form-card">
            <h3>{editingId ? "✏️ Edit Payment" : "➕ Record Payment"}</h3>

            <div className="form-group">
              <label>Select Customer</label>
              <select value={formData.customerId} onChange={handleCustomerSelect}>
                <option value="">— Choose a customer —</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerName} — {c.shopName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Customer Name</label>
              <input
                value={formData.customerName}
                placeholder="Auto-filled"
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Shop Name</label>
              <input
                value={formData.shopName}
                placeholder="Auto-filled"
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Total Bill (₹)</label>
              <input
                type="number"
                name="totalBill"
                placeholder="Enter total amount"
                value={formData.totalBill}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input
                type="number"
                name="paidAmount"
                placeholder="Amount received"
                value={formData.paidAmount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
              />
            </div>

            {/* Live due preview */}
            {formData.totalBill && formData.paidAmount && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--warning-light)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#92400e",
                  marginBottom: 14,
                }}
              >
                Due Amount: ₹
                {Math.max(
                  0,
                  Number(formData.totalBill) - Number(formData.paidAmount)
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                id="payment-submit-btn"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                {editingId ? "💾 Update" : "➕ Add Payment"}
              </button>
              {editingId && (
                <button className="btn btn-secondary" onClick={clearForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* ── List Panel ─────────────────────────────── */}
          <div className="list-card">
            <div className="list-card-header">
              <h3>Payment History ({payments.length})</h3>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  id="payment-search"
                  placeholder="Search by name or shop…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💳</div>
                <p>No payment records found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Shop</th>
                      <th>Total Bill</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item, i) => (
                      <tr key={item._id}>
                        <td style={{ color: "var(--text-light)", fontWeight: 500 }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.customerName}</td>
                        <td>{item.shopName}</td>
                        <td>₹{item.totalBill}</td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>
                          ₹{item.paidAmount}
                        </td>
                        <td
                          style={{
                            color:
                              Number(item.dueAmount) > 0
                                ? "var(--error)"
                                : "var(--text-light)",
                            fontWeight: Number(item.dueAmount) > 0 ? 700 : 400,
                          }}
                        >
                          ₹{item.dueAmount}
                        </td>
                        <td>{statusBadge(item.paymentStatus)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {item.paymentDate}
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
                              🗑
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
            <h3>🗑 Delete Payment</h3>
            <p>Are you sure you want to delete this payment record?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;