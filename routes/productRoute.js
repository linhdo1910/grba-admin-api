const express = require('express');
const jwt = require('jsonwebtoken');
const productController = require('../controllers/productController');

const router = express.Router();

// Middleware kiểm tra admin dựa trên JWT
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Lấy token từ header "Authorization: Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    req.user = decoded; // Lưu thông tin user từ token vào req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireAdmin, productController.createProduct);
router.patch("/:id", requireAdmin, productController.updateProduct);
router.delete("/:id", requireAdmin, productController.deleteProduct);
router.delete("/", requireAdmin, productController.deleteMultipleProducts);

module.exports = router;