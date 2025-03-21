const Product = require('../models/Products');
const mongoose = require('mongoose');


/**
 * Lấy danh sách sản phẩm (hỗ trợ phân trang & lọc theo danh mục)
 */
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const productDept = req.query.dept || "";

    const filter = productDept ? { productCategory: productDept } : {};

    const products = await Product.find(filter).skip(skip).limit(limit);
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Lấy thông tin sản phẩm theo ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Tạo sản phẩm mới
 */
exports.createProduct = async (req, res) => {
  try {
    const { productName, productCategory, productDescription, rating, discount, productPrice } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!productName || !productCategory || !productDescription || rating === undefined || discount === undefined || !productPrice) {
      return res.status(400).json({ message: "Missing required fields: productName, productCategory, productDescription, rating, discount, productPrice" });
    }

    // Kiểm tra xem sản phẩm đã tồn tại chưa (tránh trùng lặp)
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      return res.status(400).json({ message: "Product with this name already exists" });
    }

    const newProduct = new Product(req.body);
    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      productId: newProduct._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};


/**
 * Cập nhật sản phẩm theo ID
 */
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // So sánh dữ liệu cũ và dữ liệu mới
    const updates = req.body;
    let isChanged = false;
    
    Object.keys(updates).forEach(key => {
      if (existingProduct[key] !== updates[key]) {
        isChanged = true;
      }
    });

    if (!isChanged) {
      return res.status(400).json({ message: "No changes detected" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

/**
 * Xóa sản phẩm theo ID
 */
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

/**
 * Xóa nhiều sản phẩm
 */
exports.deleteMultipleProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({ message: "Products deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete products", error: error.message });
  }
};
