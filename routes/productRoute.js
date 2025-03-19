const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireAdmin, productController.createProduct);
router.patch("/:id", requireAdmin, productController.updateProduct);
router.delete("/:id", requireAdmin, productController.deleteProduct);
router.delete("/", requireAdmin, productController.deleteMultipleProducts);

module.exports = router;
