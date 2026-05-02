import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Common.css";

function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h2 className="logo">📘 Logbook</h2>

      <div className="nav-links">
        <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
        <button onClick={() => navigate("/products")}>📦 Products</button>
        <button onClick={() => navigate("/customers")}>👥 Customers</button>
        <button onClick={() => navigate("/payments")}>💳 Payments</button>
        <button onClick={() => navigate("/reports")}>📈 Reports</button>
      </div>

      <button className="logout-btn" onClick={() => navigate("/")}>
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;