// Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  createDate: { type: Date, default: Date.now }, // Ngày tạo
  title: { type: String, required: true }, // Tiêu đề
  content: { type: String, required: true }, // Nội dung
  image: { type: String, required: true },
  author:{type:String, required:true} // Đường dẫn đến hình ảnh
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
