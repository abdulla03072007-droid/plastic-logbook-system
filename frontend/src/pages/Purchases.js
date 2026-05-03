import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { purchaseAPI } from "../services/api";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "../styles/Common.css";

const getEmptyForm = () => ({
  companyName: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  items: [
    { productName: "", quantity: "", price: "" }
  ],
  paidAmount: ""
});

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState(getEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchPurchases = async () => {
    try {
      const res = await purchaseAPI.getPurchases();
      setPurchases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleItemChange = (index, e) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [e.target.name]: e.target.value 
    };
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: "", price: "" }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return; // Prevent removing the last item
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const clearForm = () => {
    setFormData(getEmptyForm());
    setEditingId(null);
  };

  const calculateGrandTotal = () => {
    const total = formData.items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return acc + (q * p);
    }, 0);
    return total.toFixed(2);
  };

  const handleSubmit = async () => {
    const { companyName, purchaseDate, items } = formData;
    
    if (!companyName || !purchaseDate) {
      addToast("Company name and date are required.", "warning");
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productName || !items[i].quantity || !items[i].price) {
        addToast(`Please fill all fields for item #${i + 1}.`, "warning");
        return;
      }
    }

    try {
      if (editingId) {
        await purchaseAPI.updatePurchase(editingId, formData);
        addToast("Purchase bill updated successfully!", "success");
      } else {
        const res = await purchaseAPI.addPurchase(formData);
        addToast("Purchase bill recorded successfully!", "success");

        // AUTOMATICALLY GENERATE PDF AFTER ADDING
        if (res.data && res.data.purchase) {
          generatePDF(res.data.purchase);
        }
      }
      clearForm();
      fetchPurchases();
    } catch (err) {
      addToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      companyName: item.companyName || "",
      purchaseDate: item.purchaseDate || "",
      items: item.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price
      })),
      paidAmount: item.paidAmount || ""
    });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    try {
      await purchaseAPI.deletePurchase(deleteId);
      addToast("Purchase bill deleted.", "success");
      setDeleteId(null);
      fetchPurchases();
    } catch {
      addToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const generatePDF = (bill) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;

      // ── Header Bar ──────────────────────────────────────────────
      doc.setFillColor(30, 58, 138);          // deep blue
      doc.rect(0, 0, pageW, 38, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("PURCHASE INVOICE", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 200, 255);
      doc.text("Plastic Logbook System", 15, 29);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, pageW - 15, 20, { align: "right" });
      doc.text(`Bill Date: ${bill.purchaseDate || ""}`, pageW - 15, 27, { align: "right" });

      // ── Divider ──────────────────────────────────────────────────
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.8);
      doc.line(0, 38, pageW, 38);

      // ── Company Info Block ───────────────────────────────────────
      const safeCompanyName = bill.companyName ? bill.companyName.toString() : "Unknown";

      doc.setFillColor(241, 245, 249);        // light slate background
      doc.roundedRect(10, 44, 90, 26, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("BILLED TO", 15, 52);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(safeCompanyName, 15, 61);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(110, 44, 90, 26, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("PURCHASE DATE", 115, 52);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(bill.purchaseDate || "", 115, 61);

      // ── Items Table ──────────────────────────────────────────────
      const tableColumn = ["#", "Product Name", "Qty", "Unit Price (Rs.)", "Total (Rs.)"];
      const tableRows = bill.items.map((item, idx) => [
        (idx + 1).toString(),
        item.productName || "-",
        item.quantity ? item.quantity.toString() : "0",
        Number(item.price || 0).toFixed(2),
        Number(item.itemTotal || 0).toFixed(2),
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 76,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          font: "helvetica",
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "right", cellWidth: 38 },
          4: { halign: "right", cellWidth: 38 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      });

      const finalY = doc.lastAutoTable?.finalY || 76;

      // ── Grand Total Box ──────────────────────────────────────────
      doc.setFillColor(30, 58, 138);
      doc.roundedRect(120, finalY + 8, 80, 16, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(`Grand Total: Rs. ${Number(bill.grandTotal || 0).toFixed(2)}`, 160, finalY + 19, { align: "center" });

      // ── Billing Summary ──────────────────────────────────────────
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Paid Amount: Rs. ${Number(bill.paidAmount || 0).toFixed(2)}`, 120, finalY + 34);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38); // red
      doc.text(`Due Amount: Rs. ${Number(bill.dueAmount || 0).toFixed(2)}`, 120, finalY + 41);

      // ── Footer Bar ───────────────────────────────────────────────
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 282, pageW, 15, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(180, 200, 255);
      doc.text("Thank you for your business!  |  Plastic Logbook System", 105, 290, { align: "center" });

      // ── Save ─────────────────────────────────────────────────────
      const cleanFileName = safeCompanyName.replace(/[^a-z0-9]/gi, "_");
      doc.save(`Invoice_${cleanFileName}_${bill.purchaseDate || "Date"}.pdf`);

      addToast("PDF generated successfully!", "success");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      addToast("Failed to generate PDF. Check console for details.", "error");
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="page-header">
          <h1>🛒 Company Purchases</h1>
          <p>Create multi-item bills and generate PDF invoices</p>
        </div>

        <div className="page-body">
          {/* ── Form Panel ─────────────────────────────── */}
          <div className="form-card">
            <h3>{editingId ? "✏️ Edit Purchase Bill" : "➕ Create Purchase Bill"}</h3>

            <div className="form-row" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Supplier or company name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px", borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h4 style={{ margin: 0, color: "var(--text)" }}>Bill Items</h4>
                <button className="btn btn-secondary btn-sm" onClick={addItem}>
                  ➕ Add Item
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "12px", color: "var(--text-light)", fontSize: "12px", textTransform: "uppercase" }}>Product Name</th>
                      <th style={{ textAlign: "left", padding: "12px", color: "var(--text-light)", fontSize: "12px", textTransform: "uppercase", width: "120px" }}>Quantity</th>
                      <th style={{ textAlign: "left", padding: "12px", color: "var(--text-light)", fontSize: "12px", textTransform: "uppercase", width: "150px" }}>Price (₹)</th>
                      <th style={{ textAlign: "left", padding: "12px", color: "var(--text-light)", fontSize: "12px", textTransform: "uppercase", width: "150px" }}>Total (₹)</th>
                      <th style={{ width: "50px", padding: "12px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="text"
                            name="productName"
                            placeholder="e.g., Carry Covers"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, e)}
                            style={{ width: "100%", marginBottom: 0 }}
                          />
                        </td>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="number"
                            name="quantity"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            style={{ width: "100%", marginBottom: 0 }}
                          />
                        </td>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="number"
                            name="price"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, e)}
                            style={{ width: "100%", marginBottom: 0 }}
                          />
                        </td>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="text"
                            readOnly
                            value={`₹${((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}`}
                            style={{ width: "100%", background: "var(--background)", color: "var(--text-light)", fontWeight: 600, marginBottom: 0 }}
                          />
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: "8px 12px", margin: 0 }}
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                            title="Remove Item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
                padding: "15px",
                background: "var(--info-light)",
                borderRadius: "var(--radius-sm)",
                marginBottom: 20,
                border: "1px solid #bae6fd"
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0369a1" }}>
                Total: ₹{calculateGrandTotal()}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  name="paidAmount"
                  placeholder="Amount Paid"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  style={{ marginBottom: 0, padding: "8px" }}
                />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#92400e" }}>
                Due: ₹{(parseFloat(calculateGrandTotal()) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)}
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                {editingId ? "💾 Update Bill" : "➕ Save Bill"}
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
              <h3>Purchase History ({purchases.length})</h3>
            </div>

            {purchases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧾</div>
                <p>No purchase bills found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Company</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Grand Total</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((bill, i) => (
                      <tr key={bill._id}>
                        <td style={{ color: "var(--text-light)", fontWeight: 500 }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{bill.companyName}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {bill.purchaseDate}
                        </td>
                        <td>
                          <span className="badge badge-info">{bill.items.length} items</span>
                        </td>
                         <td style={{ color: "var(--success)", fontWeight: 700 }}>
                          ₹{Number(bill.grandTotal).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Number(bill.paidAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ color: "var(--error)", fontWeight: 700 }}>
                          ₹{Number(bill.dueAmount || 0).toFixed(2)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(bill)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteId(bill._id)}
                              title="Delete"
                            >
                              🗑
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => generatePDF(bill)}
                              title="Download PDF Invoice"
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
            <h3>🗑 Delete Purchase Bill</h3>
            <p>Are you sure you want to delete this entire bill and all its items?</p>
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

export default Purchases;
