const express = require('express');
const jwt = require('jsonwebtoken');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Middleware kiểm tra token
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Lấy token từ header "Authorization: Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    req.user = decoded; // Lưu thông tin user từ token vào req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    req.user = decoded; // Lưu thông tin user từ token
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Routes
router.get("/", requireAdmin, orderController.getAllOrders);
router.get("/:id", requireAuth, orderController.getOrderById);
router.post("/", requireAuth, orderController.createOrder);
router.patch("/:id/status", requireAdmin, orderController.updateOrderStatus);
router.delete("/:id", requireAdmin, orderController.deleteOrder);
router.get("/:orderId/invoice", requireAuth, orderController.generateInvoice);

module.exports = router;