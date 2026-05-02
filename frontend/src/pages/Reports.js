import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
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
    }).format(n);

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
        <div className="page-header">
          <h1>📈 Reports</h1>
          <p>Business analytics and payment overview</p>
        </div>

        {/* ── KPI Cards ──────────────────────────────── */}
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="stat-card">
              <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              <div className="stat-body">
                <div className="stat-value">
                  {loading ? "—" : card.value}
                </div>
                <div className="stat-label">{card.label}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-light)",
                    marginTop: 2,
                    fontWeight: 500,
                  }}
                >
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pending Dues Table ──────────────────────── */}
        <div className="list-card">
          <div className="list-card-header">
            <h3>⚠️ Pending Dues ({pendingPayments.length})</h3>
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
                    <th>#</th>
                    <th>Customer</th>
                    <th>Shop</th>
                    <th>Total Bill</th>
                    <th>Paid</th>
                    <th>Due Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((item, i) => (
                    <tr
                      key={item._id}
                      style={{
                        background:
                          Number(item.dueAmount) > 1000
                            ? "rgba(239,68,68,0.04)"
                            : "transparent",
                      }}
                    >
                      <td style={{ color: "var(--text-light)", fontWeight: 500 }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.customerName}</td>
                      <td>{item.shopName}</td>
                      <td>₹{item.totalBill}</td>
                      <td style={{ color: "var(--success)", fontWeight: 600 }}>
                        ₹{item.paidAmount}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--error)",
                            fontSize: 14,
                          }}
                        >
                          ₹{item.dueAmount}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{item.paymentDate}</td>
                      <td>
                        <span className={`badge ${item.paymentStatus === "Pending" ? "badge-warning" : "badge-info"}`}>
                          {item.paymentStatus === "Pending" ? "⏳ Pending" : "🌓 Partial"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── All Transactions ────────────────────────── */}
        <div className="list-card" style={{ marginTop: 24 }}>
          <div className="list-card-header">
            <h3>📋 All Transactions ({payments.length})</h3>
          </div>

          {payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No transactions recorded yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
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
                      <td>
                        {item.paymentStatus === "Paid" ? (
                          <span className="badge badge-success">✓ Paid</span>
                        ) : (
                          <span className={`badge ${item.paymentStatus === "Pending" ? "badge-warning" : "badge-info"}`}>
                            {item.paymentStatus === "Pending" ? "⏳ Pending" : "🌓 Partial"}
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{item.paymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;