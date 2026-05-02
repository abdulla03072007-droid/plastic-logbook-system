import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Common.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/products",  icon: "📦", label: "Products"  },
  { to: "/customers", icon: "👥", label: "Customers" },
  { to: "/payments",  icon: "💳", label: "Payments"  },
  { to: "/purchases", icon: "🛒", label: "Purchases" },
  { to: "/reports",   icon: "📈", label: "Reports"   },
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
  const navigate  = useNavigate();
  const location  = useLocation();
  const admin     = safeParseAdmin();

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
    <div className="sidebar">
      {/* ── Brand ──────────────────────────────────────── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-brand-icon">🏪</div>
          <div className="sidebar-brand-text">
            <h2>Plastic Logbook</h2>
            <span>Business Management</span>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
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
            style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">System Admin</span>
          </Link>
        )}
      </nav>

      {/* ── Admin Profile + Logout ──────────────────────── */}
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
          🚪 <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
