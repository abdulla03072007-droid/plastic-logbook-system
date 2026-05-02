import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "../styles/Login.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail]       = useState("");
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
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !email) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register(username, password, email);

      // Save credentials so ProtectedRoute & Sidebar can use them
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
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
            <h2 className="login-title">Create Account ✨</h2>
            <p className="login-subtitle">Register a new admin account</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              id="register-btn"
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Register →"}
            </button>
          </form>

          <p className="login-footer" style={{ marginTop: "20px" }}>
            Already have an account? <Link to="/" style={{ color: "var(--primary)", fontWeight: "600" }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
