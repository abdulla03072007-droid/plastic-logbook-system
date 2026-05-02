const express = require("express");
const router = express.Router();
const { login, register, getCurrentAdmin, updateProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST /api/auth/register
router.post("/register", register);

// @route   POST /api/auth/login
router.post("/login", login);

// @route   GET /api/auth/me
router.get("/me", authMiddleware, getCurrentAdmin);

// @route   PUT /api/auth/profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;