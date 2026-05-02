const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log(`Auth Middleware: ${req.method} ${req.path}`);
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded.id);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
