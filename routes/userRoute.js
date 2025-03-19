const express = require('express');
const userController = require('../controllers/userController');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.get("/profile", requireAuth, userController.getProfile);
router.patch("/update/:userId", requireAdmin, userController.updateUser);
router.delete("/delete/:userId", requireAdmin, userController.deleteUser);
router.get("/user-management", requireAdmin, userController.getAllUsers);

module.exports = router;
