import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { paymentAPI } from "../services/api";
import "../styles/Common.css";

function Reports() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentAPI.getAllPayments();
        setPayments(Array.isArray(res.data.payments) ? res.data.payments : (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today        = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const dailyPayments   = payments.filter((p) => p.paymentDate === today);
  const monthlyPayments = payments.filter(
    (p) => p.paymentDate && p.paymentDate.startsWith(currentMonth)
  );
  const pendingPayments = payments.filter((p) => p.paymentStatus !== "Paid");

  const totalSales   = payments.reduce((s, p) => s + Number(p.paidAmount || 0), 0);
  const totalDues    = payments.reduce((s, p) => s + Number(p.dueAmount  || 0), 0);
  const dailySales   = dailyPayments.reduce((s, p) => s + Number(p.paidAmount || 0), 0);
  const monthlySales = monthlyPayments.reduce((s, p) => s + Number(p.paidAmount || 0), 0);

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(n || 0);

  const KPI_CARDS = [
    { label: "Today's Collections",  value: fmt(dailySales),    sub: `${dailyPayments.length} transactions`,   icon: "📅", color: "indigo"  },
    { label: "Monthly Collections",  value: fmt(monthlySales),  sub: `${monthlyPayments.length} transactions`,  icon: "📆", color: "emerald" },
    { label: "Total Collections",    value: fmt(totalSales),    sub: "All time",                               icon: "💰", color: "violet"  },
    { label: "Total Pending Dues",   value: fmt(totalDues),     sub: `${pendingPayments.length} customers`,     icon: "⏳", color: "amber"   },
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <div className="container-fluid">
          {/* ── UNIFIED MODERN HEADER ──────────────────────────── */}
          <PageHeader 
            title="Business Reports" 
            icon="📈" 
          />

          {/* ── KPI Cards ──────────────────────────────── */}
          <div className="stat-grid">
            {KPI_CARDS.map((card) => (
              <div key={card.label} className="stat-card">
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                <div className="stat-body">
                  <div className="stat-value">
                    {loading ? "—" : card.value}
                  </div>
                  <div className="stat-label">{card.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
                    {card.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pending Dues Table ──────────────────────── */}
          <div className="list-card" style={{ marginBottom: 30 }}>
            <div className="list-card-header">
              <h3 style={{ margin: 0, color: '#dc2626' }}>⚠️ Pending Dues ({pendingPayments.length})</h3>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No pending dues — all payments are cleared!</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Shop</th>
                      <th>Total Bill</th>
                      <th>Paid</th>
                      <th>Due Amount</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((item) => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 700 }}>{item.customerName}</td>
                        <td>{item.shopName}</td>
                        <td>₹{item.totalBill}</td>
                        <td style={{ color: "#059669", fontWeight: 600 }}>₹{item.paidAmount}</td>
                        <td style={{ color: "#dc2626", fontWeight: 800, fontSize: 15 }}>₹{item.dueAmount}</td>
                        <td>{item.paymentDate}</td>
                        <td>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <a href={`/payments?search=${item.customerName}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>💳 Pay Now</a>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.open(`https://wa.me/?text=Reminder: Pending balance ₹${item.dueAmount}`)}>💬 Remind</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── All Transactions ────────────────────────── */}
          <div className="list-card">
            <div className="list-card-header">
              <h3 style={{ margin: 0 }}>📋 All Transactions ({payments.length})</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Shop</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 700 }}>{item.customerName}</td>
                      <td>{item.shopName}</td>
                      <td>₹{item.totalBill}</td>
                      <td style={{ color: "#059669", fontWeight: 600 }}>₹{item.paidAmount}</td>
                      <td style={{ color: item.dueAmount > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>₹{item.dueAmount}</td>
                      <td>
                        <span className={`badge ${item.paymentStatus === "Paid" ? "badge-success" : "badge-warning"}`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td>{item.paymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;