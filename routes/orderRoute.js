const express = require('express');
const jwt = require('jsonwebtoken');
const orderController = require('../controllers/orderController');

const router = express.Router();

/** Middleware: Kiểm tra token hợp lệ */
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/** Middleware: Kiểm tra quyền admin */
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

//
// 🟩 ROUTES — tương thích Firebase structure: orders/{userId}/{orderId}
//

// 🔹 Lấy toàn bộ đơn hàng (Admin)
router.get("/", requireAdmin, orderController.getAllOrders);

// 🔹 Lấy chi tiết 1 đơn hàng (theo userId + orderId)
router.get("/:userId/:orderId", requireAuth, orderController.getOrderById);

// 🔹 Lấy lịch sử đơn hàng theo user
router.get("/history/:userId", requireAuth, orderController.getOrderHistory);

// 🔹 Tạo đơn hàng mới
router.post("/", requireAuth, orderController.createOrder);

// 🔹 Cập nhật trạng thái đơn hàng
router.patch("/:userId/:orderId/status", requireAdmin, orderController.updateOrderStatus);

// 🔹 Xoá đơn hàng
router.delete("/:userId/:orderId", requireAdmin, orderController.deleteOrder);

// 🔸 Tạo hóa đơn PDF (nếu bạn cần refactor hàm Firebase)
router.get("/:userId/:orderId/invoice", requireAuth, orderController.generateInvoice);

module.exports = router;
