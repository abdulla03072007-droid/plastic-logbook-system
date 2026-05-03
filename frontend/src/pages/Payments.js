import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { paymentAPI, customerAPI } from "../services/api";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";

  const [customers, setCustomers] = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [formData,  setFormData]  = useState(getEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [search,    setSearch]    = useState(initialSearch);
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
        totalBill:    cus.totalDue     || "", // Pre-fill with current due balance
      });
    } else {
      setFormData({ ...formData, customerId: "", customerName: "", shopName: "", totalBill: "" });
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
        const res = await paymentAPI.createPayment(formData);
        addToast("Payment recorded successfully!", "success");
        
        // AUTOMATICALLY GENERATE PDF AFTER ADDING
        if (res.data && res.data.payment) {
          generatePDF(res.data.payment);
        }
      }
      clearForm();
      fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleQuickPay = async (item) => {
    if (item.dueAmount <= 0) {
      addToast("Balance is already zero!", "info");
      return;
    }

    try {
      addToast("Processing full payment...", "info");
      
      const quickData = {
        customerId:   item.customerId,
        customerName: item.customerName,
        shopName:     item.shopName,
        totalBill:    item.dueAmount,
        paidAmount:   item.dueAmount, // Pay everything
        paymentDate:  new Date().toISOString().split("T")[0],
      };

      const res = await paymentAPI.createPayment(quickData);
      addToast("Full payment recorded!", "success");
      
      // DOWNLOAD STATEMENT AUTOMATICALLY
      if (res.data && res.data.payment) {
        generatePDF(res.data.payment);
      }

      fetchPayments(); // Refresh list
    } catch (err) {
      console.error(err);
      addToast("Quick pay failed.", "error");
    }
  };

  const handlePayRemaining = (item) => {
    setFormData({
      customerId:   item.customerId   || "",
      customerName: item.customerName || "",
      shopName:     item.shopName     || "",
      totalBill:    item.dueAmount    || "", // New bill starts with the remaining balance
      paidAmount:   "",                  // Clear for fresh payment
      paymentDate:  new Date().toISOString().split("T")[0],
    });
    setEditingId(null); // Create a NEW record
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (item) => {
    setFormData({
      customerId:   item.customerId   || "",
      customerName: item.customerName || "",
      shopName:     item.shopName     || "",
      totalBill:    item.dueAmount    || "", // Use remaining due as the bill for editing
      paidAmount:   "",                  // Clear paid for new entry
      paymentDate:  new Date().toISOString().split("T")[0],
    });
    setEditingId(item._id); // Update THIS record
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

  const generatePDF = async (item) => {
    try {
      addToast("Generating Statement...", "info");
      
      // Fetch all payments for this customer to show history
      const res = await paymentAPI.getAllPayments(item.customerName);
      let allHistory = [];
      
      if (res.data && res.data.payments) {
        allHistory = res.data.payments.filter(p => {
          const nameMatch = p.customerName?.trim().toLowerCase() === item.customerName?.trim().toLowerCase();
          const shopMatch = p.shopName?.trim().toLowerCase() === item.shopName?.trim().toLowerCase();
          return p.customerId === item.customerId || (nameMatch && shopMatch);
        });
      } else if (Array.isArray(res.data)) {
        allHistory = res.data.filter(p => {
          const nameMatch = p.customerName?.trim().toLowerCase() === item.customerName?.trim().toLowerCase();
          const shopMatch = p.shopName?.trim().toLowerCase() === item.shopName?.trim().toLowerCase();
          return p.customerId === item.customerId || (nameMatch && shopMatch);
        });
      }

      // Sort by date (oldest first) for the table
      allHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      addToast(`Found ${allHistory.length} history records.`, "info");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;

      // ── Header Section ──────────────────────────────────────────
      doc.setFillColor(30, 58, 138); // Deep Navy
      doc.rect(0, 0, pageW, 35, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("STATEMENT OF ACCOUNT", 15, 22);
      
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 255);
      doc.text("PLASTIC LOGBOOK SYSTEM - BUSINESS MANAGEMENT", 15, 30);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageW - 15, 22, { align: "right" });

      // ── Customer Info Box ────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, 45, 190, 30, 2, 2, "F");
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("BILL TO:", 15, 54);
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.customerName} - ${item.shopName}`, 15, 64);
      
      // Status Badge
      const statusColor = item.dueAmount <= 0 ? [22, 163, 74] : [220, 38, 38];
      doc.setFillColor(...statusColor);
      doc.roundedRect(160, 52, 30, 10, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(item.dueAmount <= 0 ? "PAID" : "DUE", 175, 58.5, { align: "center" });

      // ── Ledger Section ───────────────────────────────────────────
      let currentY = 105;
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text("TRANSACTION LEDGER", 15, currentY - 8);
      doc.line(15, currentY - 4, pageW - 15, currentY - 4);

      if (allHistory && allHistory.length > 0) {
        // Initial Starting Point
        const first = allHistory[0];
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Opening Balance / First Bill", 15, currentY);
        doc.text(`Rs. ${Number(first.totalBill || 0).toFixed(2)}`, 195, currentY, { align: "right" });
        currentY += 15;

        // History Steps
        let lastDue = Number(first.totalBill || 0);

        allHistory.forEach((p, idx) => {
          const currentBill = Number(p.totalBill || 0);
          
          // If a new bill was added (Current Bill > Last Due), show the addition
          if (idx > 0 && currentBill > lastDue) {
            const addedAmount = currentBill - lastDue;
            doc.setFont("helvetica", "italic");
            doc.setTextColor(15, 23, 42);
            doc.text(`+ New Bill Added`, 25, currentY);
            doc.text(`+ ${addedAmount.toFixed(2)}`, 195, currentY, { align: "right" });
            currentY += 8;
            
            doc.setFont("helvetica", "bold");
            doc.text(`Subtotal: ${currentBill.toFixed(2)}`, 195, currentY, { align: "right" });
            currentY += 12;
          }

          // Pay Line
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`Payment received on ${p.paymentDate}`, 25, currentY);
          doc.setTextColor(15, 23, 42);
          doc.text(`- ${Number(p.paidAmount || 0).toFixed(2)}`, 195, currentY, { align: "right" });
          
          currentY += 6;
          
          // Subtotal/Remaining Line
          doc.setFillColor(241, 245, 249);
          doc.rect(130, currentY, 70, 8, "F");
          doc.setFont("helvetica", "bold");
          
          const due = Number(p.dueAmount || 0);
          const label = due < 0 ? "Advanced:" : "Remaining:";
          const displayDue = Math.abs(due).toFixed(2);

          doc.text(label, 135, currentY + 6);
          doc.text(`${due < 0 ? "-" : ""}${displayDue}`, 195, currentY + 6, { align: "right" });
          
          lastDue = due;
          currentY += 15;

          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }
        });
      }

      // ── Final Total Highlighting ────────────────────────────────
      const finalDue = Number(item.dueAmount || 0);
      const finalLabel = finalDue < 0 ? "ADVANCE" : "DUE";

      doc.setFillColor(30, 58, 138);
      doc.roundedRect(120, currentY, 70, 15, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`${finalLabel}: Rs. ${Math.abs(finalDue).toFixed(2)}`, 165, currentY + 9.5, { align: "center" });

      // ── Footer ──────────────────────────────────────────────────
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("This is a computer-generated statement. No signature required.", pageW / 2, 285, { align: "center" });
      doc.text("Thank you for your business!", pageW / 2, 290, { align: "center" });

      // Save
      doc.save(`Statement_${(item.customerName || "Customer").replace(/\s+/g, "_")}.pdf`);
      addToast("PDF generated successfully!", "success");
    } catch (err) {
      console.error("PDF Error:", err);
      addToast("Failed to generate PDF. Please try again.", "error");
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
              <label>{editingId ? "Edit Bill Amount (₹)" : "Opening Balance / New Bill (₹)"}</label>
              <input
                type="number"
                name="totalBill"
                placeholder="Enter amount"
                value={formData.totalBill}
                onChange={handleChange}
              />
            </div>

            {formData.customerId && (
              <div style={{ marginBottom: 15, fontSize: 13 }}>
                <span style={{ color: "var(--text-light)" }}>Current Outstanding: </span>
                <span style={{ fontWeight: 700, color: "var(--error)" }}>
                  ₹{customers.find(c => c._id === formData.customerId)?.totalDue || 0}
                </span>
              </div>
            )}

             {/* Only one bill amount field needed */}

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
                              title="Edit Record"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteId(item._id)}
                              title="Delete"
                            >
                              🗑
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => generatePDF(item)}
                              title="Download Statement"
                            >
                              📄 PDF
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