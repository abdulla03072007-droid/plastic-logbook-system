import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { superAdminAPI } from "../services/api";
import "../styles/SuperAdminDashboard.css";
import useToast from "../components/useToast";

function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getTenants();
      setTenants(res.data.tenants);
      setError(null);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setError("Access denied. You do not have Super Admin privileges.");
      } else {
        setError("Failed to fetch tenants.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuperAdmin = async () => {
    try {
      const res = await superAdminAPI.setupSuperAdmin();
      addToast(res.data.message, "success");
      
      // Update local storage to reflect Super Admin status
      const adminData = JSON.parse(localStorage.getItem("admin"));
      adminData.isSuperAdmin = true;
      localStorage.setItem("admin", JSON.stringify(adminData));
      
      fetchTenants(); // Re-fetch
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to setup Super Admin", "error");
    }
  };

  const handleDeleteTenant = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete tenant "${username}"? All their data (customers, products, purchases) will be permanently deleted.`)) {
      try {
        const res = await superAdminAPI.deleteTenant(id);
        addToast(res.data.message, "success");
        fetchTenants(); // Refresh list
      } catch (err) {
        addToast(err.response?.data?.message || "Failed to delete tenant", "error");
      }
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1>System Administration</h1>
            <p className="subtitle">Manage and monitor all registered tenants (Admins).</p>
          </div>
          {!JSON.parse(localStorage.getItem("admin"))?.isSuperAdmin && (
            <button className="btn btn-primary" onClick={handleSetupSuperAdmin}>
              Claim Super Admin (Run Once)
            </button>
          )}
        </header>

        {error ? (
          <div className="alert alert-danger" style={{ margin: "20px" }}>
            {error}
          </div>
        ) : loading ? (
          <div className="loading-state">Loading tenants...</div>
        ) : (
          <div className="card" style={{ margin: "20px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Joined Date</th>
                  <th>Customers</th>
                  <th>Products</th>
                  <th>Purchases</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <strong>{tenant.username}</strong>
                      {tenant.isSuperAdmin && (
                        <span className="badge badge-success" style={{ marginLeft: "8px" }}>Super Admin</span>
                      )}
                    </td>
                    <td>{tenant.email || "N/A"}</td>
                    <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td>{tenant.stats?.customers || 0}</td>
                    <td>{tenant.stats?.products || 0}</td>
                    <td>{tenant.stats?.purchases || 0}</td>
                    <td>
                      <span className="badge badge-primary">Active</span>
                    </td>
                    <td>
                      {!tenant.isSuperAdmin && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeleteTenant(tenant._id, tenant.username)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
