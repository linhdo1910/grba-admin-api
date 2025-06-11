const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../firebase.config');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address, profilePicture, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (snapshot.exists()) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = usersRef.push();
    const newUser = {
      name, email, password: hashedPassword, phoneNumber, address, profilePicture, role: role || 'user'
    };

    await newUserRef.set(newUser);
    res.status(201).json({ message: "User registered successfully", userId: newUserRef.key });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const userId = Object.keys(snapshot.val())[0];
    const user = snapshot.val()[userId];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId, role: user.role },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({ userId, role: user.role, token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

exports.getProfile = async (req, res) => {
  try {
    const snapshot = await db.ref(`users/${req.user.userId}`).once('value');
    if (!snapshot.exists()) return res.status(404).json({ message: "User not found" });
    const user = snapshot.val();
    delete user.password;
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.ref(`users/${userId}`).once('value');
    if (!snapshot.exists()) return res.status(404).json({ message: "User not found" });

    const updateData = { ...req.body };
    delete updateData.email;
    delete updateData.password;

    await db.ref(`users/${userId}`).update(updateData);
    const updatedSnapshot = await db.ref(`users/${userId}`).once('value');
    const updatedUser = updatedSnapshot.val();
    delete updatedUser.password;

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.ref(`users/${userId}`).once('value');
    if (!snapshot.exists()) return res.status(404).json({ message: "User not found" });

    await db.ref(`users/${userId}`).remove();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val() || {};

    let users = Object.entries(usersData).map(([id, user]) => {
      delete user.password;
      return { id, ...user };
    });

    if (search) {
      users = users.filter(user => user.name?.toLowerCase().includes(search.toLowerCase()));
    }

    const total = users.length;
    const start = (page - 1) * limit;
    const paginatedUsers = users.slice(start, start + parseInt(limit));

    res.status(200).json({ users: paginatedUsers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Please provide an email." });

    const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) return res.status(404).json({ success: false, message: "Email not found." });

    const userId = Object.keys(snapshot.val())[0];
    res.status(200).json({
      success: true,
      message: "Reset password link has been sent to your email.",
      userId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: "Please provide userId and password." });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const snapshot = await db.ref(`users/${userId}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.ref(`users/${userId}`).update({ password: hashedPassword });
    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
