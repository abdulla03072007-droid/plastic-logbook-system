import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { reportAPI } from "../services/api";
import "../styles/Common.css";

const safeParseAdmin = () => {
  try {
    const raw = localStorage.getItem("admin");
    if (!raw || raw === "undefined" || raw === "null") return {};
    return JSON.parse(raw);
  } catch { return {}; }
};

const STAT_CARDS = [
  { key: "totalProducts", label: "Total Products", icon: "📦", color: "indigo" },
  { key: "totalCustomers", label: "Total Customers", icon: "👥", color: "emerald" },
  { key: "todaysSales", label: "Today's Sales", icon: "💰", color: "violet" },
  { key: "creditPending", label: "Pending Dues", icon: "⏳", color: "amber" },
  { key: "totalPurchaseSpent", label: "Purchase Expense", icon: "🛒", color: "rose" },
];

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    todaysSales: 0,
    todaysPaid: 0,
    creditPending: 0,
    totalPurchaseSpent: 0,
    recentPayments: [],
    recentPurchases: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const admin = safeParseAdmin();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await reportAPI.getDashboardStats();
        if (res.data.success) setStats(res.data.stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(n || 0);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="layout" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ padding: '30px', background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif", flex: 1 }}>
        <div className="container-fluid">
          <PageHeader 
            title={`👋 Hello, ${admin.username || "Admin"}!`} 
            subtitle="Here's what's happening with your business today."
            icon="👋" 
            rightElement={<div className="welcome-date" style={{ 
              background: 'white', padding: '10px 20px', borderRadius: '15px', fontWeight: 700, color: '#1d4ed8', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '2px solid white'
            }}>{dateStr}</div>}
          />

          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {STAT_CARDS.map((card) => (
              <div key={card.key} className="stat-card">
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                <div className="stat-body">
                  <div className="stat-value">
                    {loading ? "—" : (card.key.includes("Sales") || card.key.includes("Pending") || card.key.includes("Spent") ? fmt(stats[card.key]) : stats[card.key])}
                  </div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "25px" }}>
            <div className="card-panel">
              <h3 className="panel-title">Recent Payments</h3>
              <div className="activity-list">
                {stats.recentPayments.length === 0 ? <p className="empty-msg">No recent payments.</p> : stats.recentPayments.map(p => (
                  <div key={p._id} className="activity-item">
                    <div className="activity-icon pay">💳</div>
                    <div className="activity-details">
                      <div className="activity-main">{p.customerName}</div>
                      <div className="activity-sub">{p.shopName} • {p.paymentStatus}</div>
                    </div>
                    <div className="activity-amount">+{fmt(p.paidAmount)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-panel">
              <h3 className="panel-title">⚠️ Low Stock Alerts</h3>
              <div className="activity-list">
                {stats.lowStockProducts.length === 0 ? <p className="empty-msg">All good! ✨</p> : stats.lowStockProducts.map(p => (
                  <div key={p._id} className="activity-item">
                    <div className="activity-icon stock">📉</div>
                    <div className="activity-details">
                      <div className="activity-main">{p.productName} ({p.size})</div>
                      <div className="activity-sub">{p.productType}</div>
                    </div>
                    <div className="activity-amount danger">{p.stockAvailable} left</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;