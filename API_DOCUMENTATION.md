# 🛍️ Plastic Carry Business Logbook System - API Documentation

## **Base URL**
```
http://localhost:5000/api
```

---

## **📝 Authentication Endpoints**

### **1. Admin Login**
- **Endpoint:** `POST /auth/login`
- **Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Response:** 
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "admin": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

### **2. Admin Register**
- **Endpoint:** `POST /auth/register`
- **Request Body:**
```json
{
  "username": "newadmin",
  "password": "password123",
  "email": "newadmin@example.com"
}
```

### **3. Get Current Admin**
- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Returns admin details (password excluded)

---

## **📦 Product Endpoints** (All require authentication)

### **1. Create Product**
- **Endpoint:** `POST /products`
- **Request Body:**
```json
{
  "productName": "Plastic Bags",
  "productType": "Carry Bags",
  "size": "Large",
  "quantity": 100,
  "price": 25.50,
  "stock": 200
}
```

### **2. Get All Products**
- **Endpoint:** `GET /products?search=bags`
- **Query Params:** `search` (optional)
- **Response:** Array of products

### **3. Get Single Product**
- **Endpoint:** `GET /products/:id`

### **4. Update Product**
- **Endpoint:** `PUT /products/:id`
- **Request Body:** (same as create, all fields optional)

### **5. Delete Product**
- **Endpoint:** `DELETE /products/:id`

---

## **👥 Customer Endpoints** (All require authentication)

### **1. Create Customer**
- **Endpoint:** `POST /customers`
- **Request Body:**
```json
{
  "customerName": "John Doe",
  "shopName": "ABC Shop",
  "phoneNumber": "9876543210",
  "address": "123 Main St",
  "purchasedProduct": "Plastic Bags",
  "purchaseDate": "2026-04-27",
  "totalAmount": 1500
}
```

### **2. Get All Customers**
- **Endpoint:** `GET /customers?search=John`
- **Query Params:** `search` (optional)

### **3. Get Single Customer**
- **Endpoint:** `GET /customers/:id`

### **4. Update Customer**
- **Endpoint:** `PUT /customers/:id`

### **5. Delete Customer**
- **Endpoint:** `DELETE /customers/:id`

---

## **💳 Payment Endpoints** (All require authentication)

### **1. Create Payment**
- **Endpoint:** `POST /payments`
- **Request Body:**
```json
{
  "customerName": "John Doe",
  "shopName": "ABC Shop",
  "totalBill": 5000,
  "paidAmount": 3000,
  "creditAmount": 0
}
```

### **2. Get All Payments**
- **Endpoint:** `GET /payments?search=John&status=Pending`
- **Query Params:** 
  - `search` (optional)
  - `status` (optional): Pending, Partial, Paid

### **3. Get Single Payment**
- **Endpoint:** `GET /payments/:id`

### **4. Update Payment**
- **Endpoint:** `PUT /payments/:id`
- **Request Body:**
```json
{
  "paidAmount": 5000,
  "creditAmount": 0,
  "paymentStatus": "Paid"
}
```

### **5. Delete Payment**
- **Endpoint:** `DELETE /payments/:id`

---

## **📊 Report Endpoints** (All require authentication)

### **1. Daily Sales Report**
- **Endpoint:** `GET /reports/daily-sales`
- **Response:** Today's sales statistics

### **2. Monthly Sales Report**
- **Endpoint:** `GET /reports/monthly-sales`
- **Response:** Current month's sales statistics

### **3. Credit Pending Report**
- **Endpoint:** `GET /reports/credit-pending`
- **Response:** All pending and partial payments

### **4. Dashboard Statistics**
- **Endpoint:** `GET /reports/dashboard-stats`
- **Response:** Quick stats (products, customers, sales, credit)

---

## **🔐 Authentication**

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Token expires in 7 days.

---

## **📍 Status Codes**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## **Test Credentials**

```
Username: admin
Password: admin123
```

---

## **💡 Example API Calls using cURL**

### **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **Create Product:**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productName":"Bags","productType":"Carry","size":"Large","price":25.50,"quantity":100,"stock":200}'
```

### **Get All Products:**
```bash
curl -X GET "http://localhost:5000/api/products?search=bags" \
  -H "Authorization: Bearer <token>"
```

---

## **🛠️ Technologies Used**

- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend:** React.js, React Router, Axios
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Password Encryption:** bcryptjs

---
