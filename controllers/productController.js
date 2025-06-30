const db = require('../firebase.config'); // Firebase Realtime Database instance

/**
 * Lấy danh sách sản phẩm (phân trang và lọc theo danh mục)
 */
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.category_id || "";

    const snapshot = await db.ref('products').once('value');
    const allProducts = snapshot.val() || {};
    let productsArray = Object.keys(allProducts).map(id => ({
      id,
      ...allProducts[id],
    }));

    if (categoryId && categoryId !== 'all') {
      productsArray = productsArray.filter(p => p.category_id === categoryId);
    }

    const total = productsArray.length;
    const start = (page - 1) * limit;
    const paginated = productsArray.slice(start, start + limit);

    res.status(200).json({
      products: paginated,
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
    const snapshot = await db.ref(`products/${req.params.id}`).once('value');
    const product = snapshot.val();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ id: req.params.id, ...product });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Tạo sản phẩm mới
 */
exports.createProduct = async (req, res) => {
  try {
    const data = req.body;
    const requiredFields = ['product_id', 'product_name', 'category_id', 'product_price', 'product_description'];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    const snapshot = await db.ref(`products/${data.product_id}`).once('value');
    if (snapshot.exists()) {
      return res.status(400).json({ message: "Product with this ID already exists" });
    }

    await db.ref(`products/${data.product_id}`).set(data);
    res.status(201).json({ message: "Product added successfully", productId: data.product_id });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

/**
 * Cập nhật sản phẩm theo ID
 */
exports.updateProduct = async (req, res) => {
  try {
    const product_id = req.params.id;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu cập nhật." });
    }

    const snapshot = await db.ref(`products/${product_id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    const existingData = snapshot.val();

    // Chỉ giữ lại trường hợp thay đổi
    const finalUpdates = {};
    for (const key in updates) {
      if (JSON.stringify(existingData[key]) !== JSON.stringify(updates[key])) {
        finalUpdates[key] = updates[key];
      }
    }

    if (Object.keys(finalUpdates).length === 0) {
      return res.status(400).json({ message: "Không có thay đổi nào." });
    }

    await db.ref(`products/${product_id}`).update(finalUpdates);
    return res.status(200).json({ message: "Cập nhật thành công", product_id });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
  }
};



/**
 * Xóa sản phẩm theo ID
 */
exports.deleteProduct = async (req, res) => {
  try {
    const snapshot = await db.ref(`products/${req.params.id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Product not found" });
    }

    await db.ref(`products/${req.params.id}`).remove();
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

    const updates = {};
    productIds.forEach(id => {
      updates[`products/${id}`] = null;
    });

    await db.ref().update(updates);
    res.status(200).json({ message: "Products deleted successfully", deletedCount: productIds.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete products", error: error.message });
  }
};
