import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import useToast from "../components/useToast";
import { authAPI } from "../services/api";
import "../styles/Common.css";

function Profile() {
  const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
  const [formData, setFormData] = useState({
    username: adminData.username || "",
    email: adminData.email || "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    const updateData = {
      username: formData.username,
      email: formData.email
    };
    if (formData.password) {
      updateData.password = formData.password;
    }
    console.log("Submitting profile update:", updateData);
    try {
      const res = await authAPI.updateProfile(updateData);
      console.log("Update response:", res.data);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      addToast("Profile updated successfully", "success");
      setFormData({ ...formData, password: "", confirmPassword: "" });
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="main-content">
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p>Update your account credentials and settings</p>
        </div>

        <div className="page-body">
          <div className="form-card" style={{ maxWidth: "500px" }}>
            <h3>Account Settings</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <hr style={{ margin: "20px 0", borderColor: "var(--border)" }} />
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
