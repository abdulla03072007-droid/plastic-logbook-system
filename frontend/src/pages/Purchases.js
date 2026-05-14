import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
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
    if (formData.items.length === 1) return;
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
    try {
      if (editingId) {
        await purchaseAPI.updatePurchase(editingId, formData);
        addToast("Purchase bill updated!", "success");
      } else {
        const res = await purchaseAPI.addPurchase(formData);
        addToast("Purchase bill saved!", "success");
        if (res.data && res.data.purchase) generatePDF(res.data.purchase);
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
    }
  };

  const generatePDF = (bill) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;

      doc.setFillColor(30, 58, 138); 
      doc.rect(0, 0, pageW, 38, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("PURCHASE INVOICE", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 200, 255);
      doc.text("Smart Logbook System", 15, 29);
      doc.text(`Date: ${bill.purchaseDate || ""}`, pageW - 15, 20, { align: "right" });

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, 44, 190, 20, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`BILLED TO: ${bill.companyName}`, 15, 56);

      const tableColumn = ["#", "Product Name", "Qty", "Price (Rs.)", "Total (Rs.)"];
      const tableRows = bill.items.map((item, idx) => [
        (idx + 1).toString(),
        item.productName || "-",
        item.quantity || "0",
        Number(item.price || 0).toFixed(2),
        (Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2),
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 5 }
      });

      const finalY = doc.lastAutoTable.finalY;
      doc.setFont("helvetica", "bold");
      doc.text(`Grand Total: Rs. ${Number(bill.grandTotal).toFixed(2)}`, 140, finalY + 15);
      doc.text(`Paid Amount: Rs. ${Number(bill.paidAmount || 0).toFixed(2)}`, 140, finalY + 22);
      doc.setTextColor(220, 38, 38);
      doc.text(`Due Amount: Rs. ${Number(bill.dueAmount || 0).toFixed(2)}`, 140, finalY + 29);

      doc.save(`Invoice_${bill.companyName}.pdf`);
      addToast("PDF generated!", "success");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content">
        <div className="container-fluid">
          <PageHeader title="Company Purchases" icon="🛒" />

          <div className="page-body-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="form-card" style={{ marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>{editingId ? "✏️ Edit Purchase Bill" : "➕ Create Purchase Bill"}</h3>

              <div className="form-row" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#64748b' }}>Company Name</label>
                  <input
                    name="companyName"
                    placeholder="Supplier or company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#64748b' }}>Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ margin: 0, color: "#1e293b" }}>Bill Items</h4>
                  <button className="btn btn-secondary btn-sm" onClick={addItem}>➕ Add Item</button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "#64748b" }}>PRODUCT NAME</th>
                        <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "#64748b", width: "120px" }}>QTY</th>
                        <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "#64748b", width: "150px" }}>PRICE (₹)</th>
                        <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "#64748b", width: "150px" }}>TOTAL (₹)</th>
                        <th style={{ width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px" }}>
                            <input name="productName" placeholder="Product name" value={item.productName} onChange={(e) => handleItemChange(index, e)} style={{ width: "100%", border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }} />
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} style={{ width: "100%", border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }} />
                          </td>
                          <td style={{ padding: "10px" }}>
                            <input type="number" name="price" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, e)} style={{ width: "100%", border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }} />
                          </td>
                          <td style={{ padding: "10px", fontWeight: 700, color: '#1e293b' }}>
                            ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <button className="btn btn-danger btn-sm" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-row purchase-summary-grid" style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "20px", 
                padding: "20px", 
                background: "#f0f9ff", 
                borderRadius: "15px", 
                marginBottom: 20, 
                border: "1px solid #bae6fd" 
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0369a1" }}>GRAND TOTAL: ₹{calculateGrandTotal()}</div>
                <div>
                  <input type="number" name="paidAmount" placeholder="Paid Amount" value={formData.paidAmount} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '16px' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#b45309" }}>DUE: ₹{(parseFloat(calculateGrandTotal()) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={handleSubmit} style={{ padding: '12px 30px', borderRadius: '12px', fontWeight: 700 }}>
                  {editingId ? "💾 Update Bill" : "➕ Save & Generate PDF"}
                </button>
              </div>
            </div>

            <div className="list-card" style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Purchase History ({purchases.length})</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Company</th><th>Date</th><th>Items</th><th>Total</th><th>Paid</th><th>Due</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {purchases.map(bill => (
                      <tr key={bill._id}>
                        <td style={{ fontWeight: 700 }}>{bill.companyName}</td>
                        <td>{bill.purchaseDate}</td>
                        <td><span className="badge badge-info">{bill.items.length} items</span></td>
                        <td style={{ color: "#059669", fontWeight: 700 }}>₹{Number(bill.grandTotal).toFixed(2)}</td>
                        <td>₹{Number(bill.paidAmount || 0).toFixed(2)}</td>
                        <td style={{ color: "#dc2626", fontWeight: 700 }}>₹{Number(bill.dueAmount || 0).toFixed(2)}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(bill)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(bill._id)}>🗑</button>
                            <button className="btn btn-primary btn-sm" onClick={() => generatePDF(bill)}>📄 PDF</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Purchases;
