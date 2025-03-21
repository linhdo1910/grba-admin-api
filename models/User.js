const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Giữ nguyên tên "name" hoặc đổi thành "profileName"
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String },
  birthDate: {
    day: { type: String },
    month: { type: String },
    year: { type: String }
  },
  marketing: { type: Boolean },
  phoneNumber: { type: String }, // Hoặc đổi thành "phone"
  address: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Dùng enum để giới hạn giá trị
  action: { type: String, enum: ['edit all', 'account ctrl', 'sales ctrl', 'just view'] },
  profilePicture: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;