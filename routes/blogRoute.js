// routes/blogRoute.js

const express = require('express');
const router = express.Router();
const {
  createOrUpdateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog
} = require('../controllers/blogController');

// 🔸 POST: Tạo hoặc cập nhật bài viết
router.post('/', createOrUpdateBlog);

// 🔸 GET: Lấy tất cả bài viết
router.get('/', getAllBlogs);

// 🔸 GET: Lấy một bài viết theo slug
router.get('/:slug', getBlog);

// 🔸 DELETE: Xóa bài viết theo slug
router.delete('/:slug', deleteBlog);

module.exports = router;
