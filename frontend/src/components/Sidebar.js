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

const safeParseAdmin = () => {
  try {
    const raw = localStorage.getItem("admin");
    if (!raw || raw === "undefined" || raw === "null") return {};
    return JSON.parse(raw);
  } catch { return {}; }
};

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const admin     = safeParseAdmin();
  const initials  = (admin.username || "A").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* ── MOBILE TOP HEADER ──────────────────────────────── */}
      <div className="mobile-header">
        {/* Brand left */}
        <div className="mobile-brand">
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)"
          }}>
            <img src="/logo_premium.png?v=3" alt="Logo"
              style={{ width: 28, height: 28, borderRadius: 6 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Smart Logbook</span>
        </div>

        {/* Logout right — bold & prominent */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.12))",
            border: "1.5px solid rgba(239,68,68,0.35)",
            color: "#fca5a5",
            padding: "8px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 0.3,
            transition: "all 0.2s",
            backdropFilter: "blur(10px)"
          }}
          onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.96)"}
          onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          🚪 <span>Logout</span>
        </button>
      </div>

      {/* ── DESKTOP SIDEBAR ────────────────────────────────── */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <div className="sidebar-brand-icon" style={{
              background: "white", padding: "6px", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}>
              <img src="/logo_premium.png?v=3" alt="Logo" style={{ width: 40, height: 40 }} />
            </div>
            <div className="sidebar-brand-text">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Smart Logbook</h2>
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Business Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`nav-link${isActive ? " active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
          {admin?.isSuperAdmin && (
            <Link to="/system-admin"
              className={`nav-link${location.pathname === "/system-admin" ? " active" : ""}`}
              style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
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
              <Link to="/profile" className="profile-edit-link"
                style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none" }}>
                Edit Profile
              </Link>
            </div>
          </div>
          <button id="logout-btn" className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ───────────────────────── */}
      <div className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to}
              className={`mobile-nav-link${isActive ? " active" : ""}`}>
              {isActive && <div className="mobile-nav-active-dot" />}
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
