import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Common.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/products", icon: "📦", label: "Products" },
  { to: "/customers", icon: "👥", label: "Customers" },
  { to: "/payments", icon: "💳", label: "Payments" },
  { to: "/purchases", icon: "🛒", label: "Purchases" },
  { to: "/reports", icon: "📈", label: "Reports" },
];

// Safe parse — guards against null or the string "undefined"
const safeParseAdmin = () => {
  try {
    const raw = localStorage.getItem("admin");
    if (!raw || raw === "undefined" || raw === "null") return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = safeParseAdmin();

  // Get initials for avatar
  const initials = (admin.username || "A")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* ── Mobile Top Header ────────────────────────── */}
      <div className="mobile-header">
        <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            background: 'white', 
            padding: '4px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <img src="/logo_premium.png?v=3" alt="Logo" style={{ width: '30px', height: '30px' }} />
          </div>
          Smart Logbook
        </div>
        <button className="mobile-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* ── Desktop Sidebar ─────────────────────────── */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <div className="sidebar-brand-icon" style={{ 
              background: 'white', 
              padding: '6px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <img src="/logo_premium.png?v=3" alt="Logo" style={{ width: '40px', height: '40px' }} />
            </div>
            <div className="sidebar-brand-text">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Smart Logbook</h2>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Business Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>

          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link${isActive ? " active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}

          {admin?.isSuperAdmin && (
            <Link
              to="/system-admin"
              className={`nav-link${location.pathname === "/system-admin" ? " active" : ""}`}
              style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">System Admin</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">{initials}</div>
            <div className="admin-info">
              <p className="admin-name">{admin.username || "Admin"}</p>
              <p className="admin-email">{admin.email || ""}</p>
              <Link to="/profile" className="profile-edit-link" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none" }}>Edit Profile</Link>
            </div>
          </div>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────── */}
      <div className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-nav-link${isActive ? " active" : ""}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default Sidebar;
