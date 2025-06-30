// controllers/blogController.js

const { Blog } = require('../models/Blog');
const { getDatabase } = require('firebase-admin/database');

// Firebase reference
const db = getDatabase();
const newsRef = db.ref('newsDetails');

// 📌 Create or Update blog
const createOrUpdateBlog = async (req, res) => {
  try {
    const { slug, title, author, date, image, content } = req.body;

    if (!slug || !title || !author || !date || !image || !Array.isArray(content)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const blog = new Blog({ slug, title, author, date, image, content });
    await newsRef.child(slug).set(blog);

    res.status(200).json({ message: 'Blog saved successfully', blog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save blog', detail: error.message });
  }
};

// 📌 Get single blog by slug
const getBlog = async (req, res) => {
  try {
    const slug = req.params.slug;

    const snapshot = await newsRef.child(slug).get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog', detail: error.message });
  }
};

// 📌 Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const snapshot = await newsRef.get();
    const data = snapshot.val() || {};
    res.status(200).json(Object.values(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs', detail: error.message });
  }
};

// 📌 Delete blog by slug
const deleteBlog = async (req, res) => {
  try {
    const slug = req.params.slug;

    const snapshot = await newsRef.child(slug).get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await newsRef.child(slug).remove();
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog', detail: error.message });
  }
};

module.exports = {
  createOrUpdateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog,
};
