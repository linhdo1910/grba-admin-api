const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Đăng ký người dùng mới
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address, profilePicture, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      profilePicture,
      role: role || 'user'
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Đăng nhập
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '1d' } // Token hết hạn sau 1 ngày
    );

    res.status(200).json({
      userId: user._id,
      role: user.role,
      token, // Trả về token cho client
      message: "Login successful"
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Đăng xuất
 */
exports.logout = (req, res) => {
  // Với JWT, logout sẽ được xử lý ở client (xóa token), server không cần làm gì
  res.status(200).json({ message: "Logout successful" });
};

/**
 * Lấy thông tin cá nhân của user (profile)
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Cập nhật thông tin user (không cho phép đổi email & password trực tiếp)
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };

    delete updateData.email;
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

/**
 * Xóa user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

/**
 * Lấy danh sách tất cả user có phân trang và tìm kiếm theo tên
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(filter);

    res.status(200).json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};