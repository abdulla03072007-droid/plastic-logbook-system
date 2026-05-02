import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  register: (username, password, email) =>
    api.post("/auth/register", { username, password, email }),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data)
};

// ==================== PRODUCT ENDPOINTS ====================
export const productAPI = {
  createProduct: (data) => api.post("/products/add", data),
  getAllProducts: (search = "") =>
    api.get("/products", { params: { search } }),
  getProductById: (id) => api.get(`/products/${id}`),
  updateProduct: (id, data) => api.put(`/products/update/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/delete/${id}`)
};

// ==================== CUSTOMER ENDPOINTS ====================
export const customerAPI = {
  createCustomer: (data) => api.post("/customers/add", data),
  getAllCustomers: (search = "") =>
    api.get("/customers", { params: { search } }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/customers/update/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/delete/${id}`)
};

// ==================== PAYMENT ENDPOINTS ====================
export const paymentAPI = {
  createPayment: (data) => api.post("/payments/add", data),
  getAllPayments: (search = "", status = "") =>
    api.get("/payments", { params: { search, status } }),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  updatePayment: (id, data) => api.put(`/payments/update/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/delete/${id}`)
};

// ==================== PURCHASE ENDPOINTS ====================
export const purchaseAPI = {
  addPurchase: (data) => api.post("/purchases/add", data),
  getPurchases: () => api.get("/purchases"),
  updatePurchase: (id, data) => api.put(`/purchases/update/${id}`, data),
  deletePurchase: (id) => api.delete(`/purchases/delete/${id}`)
};

// ==================== REPORT ENDPOINTS ====================
export const reportAPI = {
  getDailySalesReport: () => api.get("/reports/daily-sales"),
  getMonthlySalesReport: () => api.get("/reports/monthly-sales"),
  getCreditPendingReport: () => api.get("/reports/credit-pending"),
  getDashboardStats: () => api.get("/reports/dashboard-stats")
};

// ==================== SUPER ADMIN ENDPOINTS ====================
export const superAdminAPI = {
  getTenants: () => api.get("/superadmin/tenants"),
  setupSuperAdmin: () => api.put("/superadmin/setup"),
  deleteTenant: (id) => api.delete(`/superadmin/tenants/${id}`)
};

export default api;
