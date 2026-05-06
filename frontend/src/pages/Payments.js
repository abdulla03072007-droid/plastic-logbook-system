import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { paymentAPI, customerAPI } from "../services/api";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "../styles/Common.css";

const Payments = () => {
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [quickEntries, setQuickEntries] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
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

  const handleEntryChange = (customerId, field, value) => {
    setQuickEntries({
      ...quickEntries,
      [customerId]: {
        ...(quickEntries[customerId] || { 
          bill: "", 
          paid: "", 
          date: new Date().toISOString().split("T")[0] 
        }),
        [field]: value
      }
    });
  };

  const handleEdit = (payment) => {
    setQuickEntries({
      ...quickEntries,
      [payment.customerId]: {
        bill: payment.dueAmount,
        paid: "",
        date: payment.paymentDate
      }
    });
    setEditingId(payment._id);
    addToast(`Editing record for ${payment.customerName}`, "info");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSave = async (customer) => {
    const entry = quickEntries[customer._id] || {};
    const billAmount = entry.bill === "" || entry.bill === undefined ? customer.totalDue : Number(entry.bill);
    const paidAmount = Number(entry.paid) || 0;

    if (paidAmount === 0 && entry.bill === "") {
      addToast("Nothing to save.", "warning");
      return;
    }

    try {
      const data = {
        customerId: customer._id,
        customerName: customer.customerName,
        shopName: customer.shopName,
        totalBill: billAmount,
        paidAmount: paidAmount,
        paymentDate: entry.date || new Date().toISOString().split("T")[0],
      };

      let res;
      if (editingId) {
        res = await paymentAPI.updatePayment(editingId, data);
        addToast("Record updated!", "success");
        setEditingId(null);
      } else {
        res = await paymentAPI.createPayment(data);
        addToast("Payment saved!", "success");
      }
      
      setQuickEntries({ ...quickEntries, [customer._id]: { bill: "", paid: "", date: new Date().toISOString().split("T")[0] } });
      fetchPayments();
      fetchCustomers();
      if (res.data && res.data.payment) generatePDF(res.data.payment);
    } catch (err) {
      addToast(err.response?.data?.message || "Save failed.", "error");
    }
  };

  const generatePDF = (item) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Receipt No: ${item._id?.slice(-6).toUpperCase()}`, 20, 40);
    doc.text(`Date: ${item.paymentDate}`, 150, 40);
    doc.line(20, 45, 190, 45);
    
    doc.text(`Customer Name: ${item.customerName}`, 20, 60);
    doc.text(`Shop Name: ${item.shopName}`, 20, 70);
    
    doc.autoTable({
      startY: 80,
      head: [["Description", "Amount (Rs.)"]],
      body: [
        ["Balance Before", (item.dueAmount + item.paidAmount - item.totalBill).toFixed(2)],
        ["New Bill (Debit)", item.totalBill.toFixed(2)],
        ["Payment (Credit)", item.paidAmount.toFixed(2)],
        ["Current Balance", item.dueAmount.toFixed(2)]
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175] } // Deep Bank Blue
    });
    
    doc.text("Thank you for your business!", 105, doc.lastAutoTable.finalY + 20, { align: "center" });
    doc.save(`Receipt_${item.customerName}.pdf`);
  };

  const confirmDelete = async () => {
    try {
      await paymentAPI.deletePayment(deleteId);
      addToast("Record deleted.", "success");
      setDeleteId(null);
      fetchPayments();
      fetchCustomers();
    } catch {
      addToast("Delete failed.", "error");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(search.toLowerCase()) || 
    c.shopName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="payments-page" style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 768px) {
          .main-content { padding: 15px !important; }
          .page-header { margin-bottom: 20px !important; }
          .page-header > div { flex-direction: column !important; align-items: flex-start !important; gap: 15px !important; }
          .search-box { max-width: 100% !important; width: 100% !important; }
          h1 { font-size: 1.6rem !important; }
          .list-card { border-radius: 16px !important; }
          .list-card-header { padding: 15px !important; }
          td, th { padding: 12px 10px !important; font-size: 12px !important; }
          .btn-primary { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="main-content" style={{ padding: '30px', background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif", flex: 1 }}>
      <div className="container-fluid">
        {/* ── UNIFIED MODERN HEADER ──────────────────────────── */}
        <PageHeader 
          title="Easy Payments" 
          icon="💳" 
          search={search} 
          setSearch={setSearch} 
          placeholder="Search by customer name or shop..."
        />

        {/* ── CUSTOMER SUMMARY (TABLE STYLE ON SEARCH) ──────────────── */}
        {search && filteredCustomers.length > 0 && (
          <div className="list-card" style={{ marginBottom: '20px', borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div className="list-card-header" style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: 'white', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18, fontWeight: 800 }}>Search Result: Pending Dues</h3>
            </div>
            <div style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '15px 20px', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Shop</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Outstanding Due</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 5).map(c => {
                    // CALCULATE TRUE TOTAL FROM HISTORY
                    const customerHistory = payments.filter(p => 
                      p.customerId === c._id || 
                      p.customerId === c._id.toString() || 
                      p.customerName.trim().toLowerCase() === c.customerName.trim().toLowerCase()
                    );
                    const trueTotalDue = customerHistory.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px 20px', fontWeight: 700, color: '#1e293b' }}>{c.customerName}</td>
                        <td style={{ padding: '15px', color: '#64748b' }}>{c.shopName}</td>
                        <td style={{ padding: '15px', fontWeight: 800, color: '#dc2626' }}>₹{trueTotalDue}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ 
                            background: trueTotalDue > 0 ? '#fef3c7' : '#d1fae5', 
                            color: trueTotalDue > 0 ? '#92400e' : '#065f46', 
                            padding: '6px 12px', 
                            borderRadius: '10px', 
                            fontSize: 12, 
                            fontWeight: 700
                          }}>
                            {trueTotalDue > 0 ? '⏳ PENDING' : '✅ PAID'}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button 
                              onClick={() => addToast(`Reminder sent to ${c.customerName}`, "info")}
                              style={{ 
                                background: '#f1f5f9', 
                                color: '#64748b', 
                                border: 'none', 
                                padding: '8px 15px', 
                                borderRadius: '10px', 
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                            >
                              💬 Remind
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* ── CUSTOMER LIST TABLE ────────────────────────────── */}
          <div className="list-card" style={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            background: 'white',
            overflow: 'hidden'
          }}>
            <div className="list-card-header" style={{ 
              background: 'linear-gradient(to right, #ffffff, #f8fafc)',
              padding: '20px 25px', 
              borderBottom: '1px solid #f1f5f9' 
            }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>🛒 Customer Collections</h3>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 5 }}>
                  <tr>
                    <th style={{ padding: '15px 25px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CUSTOMER / SHOP</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BILL (₹)</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PAYMENT (₹)</th>
                    <th style={{ padding: '15px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DATE</th>
                    <th style={{ padding: '15px 25px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => {
                    const entry = quickEntries[c._id] || { bill: "", paid: "", date: new Date().toISOString().split("T")[0] };
                    const isEditingThis = editingId && payments.find(p => p._id === editingId)?.customerId === c._id;

                    return (
                      <tr key={c._id} style={{ 
                        background: isEditingThis ? '#f0f7ff' : 'white',
                        transition: 'background 0.2s ease'
                      }}>
                        <td style={{ padding: '18px 25px' }}>
                          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{c.customerName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{c.shopName}</div>
                        </td>
                        <td>
                          <input 
                            type="number"
                            placeholder="0"
                            value={entry.bill === "" ? (isEditingThis ? entry.bill : c.totalDue || "") : entry.bill}
                            onChange={(e) => handleEntryChange(c._id, "bill", e.target.value)}
                            style={{ width: '100px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            placeholder="Amount"
                            value={entry.paid}
                            onChange={(e) => handleEntryChange(c._id, "paid", e.target.value)}
                            style={{ 
                              width: '120px', 
                              borderRadius: '12px', 
                              border: '1px solid #10b981', 
                              padding: '10px',
                              background: '#f0fdf4',
                              color: '#047857',
                              fontWeight: 700
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleEntryChange(c._id, "date", e.target.value)}
                            style={{ width: '140px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '8px' }}
                          />
                        </td>
                        <td style={{ padding: '18px 25px' }}>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleQuickSave(c)}
                            style={{ 
                              padding: '10px 20px', 
                              borderRadius: '12px', 
                              background: '#4f46e5',
                              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
                              border: 'none',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isEditingThis ? "✅ UPDATE" : "💾 SAVE"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}></div>

          {/* ── PROFESSIONAL PENDING DUES TABLE (INDIVIDUAL BILLS) ── */}
          {payments.filter(p => p.dueAmount > 0).length > 0 && (
            <div className="list-card" style={{ 
              marginBottom: '30px', 
              borderRadius: '24px', 
              border: 'none', 
              boxShadow: '0 20px 50px rgba(220, 38, 38, 0.08)',
              background: 'white',
              overflow: 'hidden'
            }}>
              <div className="list-card-header" style={{ 
                padding: '22px 25px', 
                borderBottom: '1px solid #fee2e2', 
                background: 'linear-gradient(to right, #fff5f5, #ffffff)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12 
              }}>
                <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '12px' }}>⚠️</div>
                <h3 style={{ margin: 0, color: '#991b1b', fontSize: 18, fontWeight: 900 }}>
                  Pending Dues ({payments.filter(p => p.dueAmount > 0).length})
                </h3>
              </div>
              <div style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
                    <tr>
                      <th style={{ padding: '15px 25px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>#</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Customer</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Bill</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Paid</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Due</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Date</th>
                      <th style={{ padding: '15px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '15px 25px', fontSize: 11, color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.filter(p => p.dueAmount > 0).map((p, idx) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #fef2f2' }}>
                        <td style={{ padding: '18px 25px', color: '#f87171', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 800, color: '#1e293b' }}>{p.customerName}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{p.shopName}</div>
                        </td>
                        <td style={{ padding: '15px', color: '#475569', fontWeight: 600 }}>₹{p.totalBill}</td>
                        <td style={{ padding: '15px', color: '#059669', fontWeight: 700 }}>₹{p.paidAmount}</td>
                        <td style={{ padding: '15px', fontWeight: 900, color: '#dc2626', fontSize: '1.1rem' }}>₹{p.dueAmount}</td>
                        <td style={{ padding: '15px', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{p.paymentDate}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ 
                            background: '#fef3c7', 
                            color: '#92400e', 
                            padding: '8px 16px', 
                            borderRadius: '12px', 
                            fontSize: 11, 
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 10px rgba(251, 191, 36, 0.2)'
                          }}>
                            ⏳ PENDING
                          </span>
                        </td>
                        <td style={{ padding: '18px 25px' }}>
                          <button 
                            onClick={() => handleEdit(p)}
                            style={{ 
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                              color: 'white', 
                              border: 'none', 
                              padding: '10px 20px', 
                              borderRadius: '14px', 
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                              boxShadow: '0 6px 15px rgba(79, 70, 229, 0.3)'
                            }}
                          >
                            💳 Pay Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RECENT HISTORY TABLE ────────────────────────────── */}
          <div className="list-card" style={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            background: 'white',
            overflow: 'hidden',
            marginBottom: '40px'
          }}>
            <div className="list-card-header" style={{ 
              background: 'linear-gradient(to right, #ffffff, #f8fafc)',
              padding: '22px 25px', 
              borderBottom: '1px solid #f1f5f9' 
            }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>📜 Recent History (Digital Passbook)</h3>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '15px 25px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</th>
                    <th style={{ padding: '15px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Bill (DR)</th>
                    <th style={{ padding: '15px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Paid (CR)</th>
                    <th style={{ padding: '15px', fontSize: 11, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance</th>
                    <th style={{ padding: '15px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                    <th style={{ padding: '15px 25px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '18px 25px' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{p.customerName}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{p.paymentDate}</div>
                      </td>
                      <td style={{ padding: '15px', color: '#64748b', fontWeight: 600 }}>₹{p.totalBill}</td>
                      <td style={{ padding: '15px', color: '#059669', fontWeight: 700 }}>₹{p.paidAmount}</td>
                      <td style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.03)' }}>
                        <span style={{ fontWeight: 900, color: '#1e40af', fontSize: '1rem' }}>₹{p.dueAmount}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          background: p.paymentStatus === 'Paid' ? '#d1fae5' : '#fee2e2', 
                          color: p.paymentStatus === 'Paid' ? '#065f46' : '#991b1b', 
                          padding: '6px 14px', 
                          borderRadius: '12px', 
                          fontSize: 10, 
                          fontWeight: 800,
                          letterSpacing: '0.5px'
                        }}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" onClick={() => handleEdit(p)} style={{ background: '#f1f5f9', borderRadius: '10px', padding: '6px 10px' }} title="Edit Record">✏️</button>
                          <button className="btn btn-sm" onClick={() => generatePDF(p)} style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', padding: '6px 10px' }} title="Print Receipt">📄</button>
                          <button className="btn btn-sm" onClick={() => setDeleteId(p._id)} style={{ background: '#fff1f2', color: '#e11d48', borderRadius: '10px', padding: '6px 10px' }} title="Delete Record">🗑</button>
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

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ borderRadius: '24px', padding: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0' }}>Delete Transaction?</h3>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Deleting this will recalculate the customer's balance.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn btn-danger" style={{ flex: 1, height: '45px', borderRadius: '12px' }} onClick={confirmDelete}>YES, DELETE</button>
              <button className="btn btn-secondary" style={{ flex: 1, height: '45px', borderRadius: '12px' }} onClick={() => setDeleteId(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;