const Product = require('../models/Products');

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
    if (Array.isArray(req.body)) {
      // Nếu body là một danh sách sản phẩm → Chèn tất cả vào database
      const products = await Product.insertMany(req.body);
      return res.status(201).json({
        message: "Products added successfully",
        productIds: products.map(p => p._id),
      });
    } else {
      // Nếu chỉ có một sản phẩm → Thêm vào database như cũ
      const { productName, productPrice } = req.body;

      if (!productName || !productPrice) {
        return res.status(400).json({ message: "Please provide productName and productPrice." });
      }

      const newProduct = new Product(req.body);
      await newProduct.save();

      return res.status(201).json({
        message: "Product added successfully",
        productId: newProduct._id,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

/**
 * Cập nhật sản phẩm theo ID
 */
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found or no changes made" });
    }

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
