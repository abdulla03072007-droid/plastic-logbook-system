import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "../styles/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  // ── Auto-redirect if already logged in ───────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // ── Submit handler ────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(username, password);

      // Save credentials so ProtectedRoute & Sidebar can use them
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* ── Left: Branding ─────────────────────────────── */}
      <div className="login-branding">
        <div className="login-brand-content">
          <span className="login-logo">🏪</span>
          <h1 className="login-brand-title">Plastic&nbsp;Logbook</h1>
          <p className="login-brand-desc">
            A professional business management system built for
            plastic product suppliers — manage inventory, customers,
            and payments all in one place.
          </p>
          <div className="login-features">
            <div className="login-feature">✓ Product Inventory Management</div>
            <div className="login-feature">✓ Customer Tracking &amp; History</div>
            <div className="login-feature">✓ Payment &amp; Due Management</div>
            <div className="login-feature">✓ Business Reports &amp; Analytics</div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-box">
          <div className="login-header">
            <h2 className="login-title">Welcome Back 👋</h2>
            <p className="login-subtitle">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-btn"
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className="login-footer" style={{ marginTop: "20px" }}>
            Don't have an account? <Link to="/register" style={{ color: "var(--primary)", fontWeight: "600" }}>Register</Link>
          </p>
          <p className="login-footer" style={{ marginTop: "10px" }}>Smart Logbook System © 2025</p>
        </div>
      </div>
    </div>
  );
}

export default Login;