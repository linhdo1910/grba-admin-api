const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Middleware kiểm tra quyền truy cập
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Routes
router.get("/", requireAdmin, orderController.getAllOrders);
router.get("/:id", requireAuth, orderController.getOrderById);
router.post("/", requireAuth, orderController.createOrder);
router.patch("/:id/status", requireAdmin, orderController.updateOrderStatus);
router.delete("/:id", requireAdmin, orderController.deleteOrder);
router.get("/:orderId/invoice", requireAuth, orderController.generateInvoice);


module.exports = router;
