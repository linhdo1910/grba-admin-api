const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('../firebase.config');
const { v4: uuidv4 } = require('uuid');

// Helper: Get all orders across all users
const getAllOrdersFlat = async () => {
  const snapshot = await db.ref('orders').once('value');
  const allData = snapshot.val() || {};
  const result = [];

  for (const userId in allData) {
    const userOrders = allData[userId];
    for (const orderId in userOrders) {
      const order = userOrders[orderId] || {};
result.push({
  ...order,
  userId,
  orderId,
  userName: order.shipping_info?.name || order.userName || 'Anonymous',
  createdAt: order.createdAt || Date.now(),
  payment_info: order.payment_info || { total: 0 },
  shipping_info: order.shipping_info || {},
  order_items: order.order_items || {}
});
    }
  }
  return result;
  console.log('[DEBUG] Flattened order:', {
    orderId,
    ...order
  });
};

/**
 * Lấy danh sách đơn hàng (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    let allOrders = await getAllOrdersFlat();

    // Lọc theo search hoặc status nếu có
    if (search) {
      allOrders = allOrders.filter(o =>
        o.userName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      allOrders = allOrders.filter(o => o.status === status);
    }

    const total = allOrders.length;
    const start = (page - 1) * limit;
    const paginated = allOrders.slice(start, start + parseInt(limit));

    res.status(200).json({
      orders: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

/**
 * Lấy đơn hàng theo ID (Firebase không có _id, nên cần userId và orderId)
 */
exports.getOrderById = async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const snapshot = await db.ref(`orders/${userId}/${orderId}`).once('value');
    const order = snapshot.val();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own orders' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
console.log('Orders from backend:', this.orders);

/**
 * Tạo đơn hàng mới
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      order_items,
      shipping_info,
      payment_info
    } = req.body;

    if (!order_items || Object.keys(order_items).length === 0) {
      return res.status(400).json({ message: 'Order must have at least one product.' });
    }

    const userId = req.user.userId;
    const orderId = uuidv4();
    const userName = shipping_info.name || 'Guest';

    const newOrder = {
      userId,
      orderId,
      userName,
      order_items,
      shipping_info,
      payment_info,
      createdAt: Date.now(),
      status: 'preparing',
      totalAmount: payment_info.total || 0
    };

    await db.ref(`orders/${userId}/${orderId}`).set(newOrder);
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};

/**
 * Cập nhật trạng thái đơn hàng
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['preparing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const orderRef = db.ref(`orders/${userId}/${orderId}`);
    const snapshot = await orderRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await orderRef.update({ status });
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

/**
 * Xoá đơn hàng
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    const ref = db.ref(`orders/${userId}/${orderId}`);
    const snapshot = await ref.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await ref.remove();
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

/**
 * Lịch sử đơn hàng theo người dùng
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.ref(`orders/${userId}`).once('value');
    const orders = snapshot.val() || {};

    const result = Object.keys(orders).map(orderId => ({
      orderId,
      ...orders[orderId]
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

/**
 * Generate Invoice PDF - vẫn dùng file local, không đổi
 */
exports.generateInvoice = async (req, res) => {
  res.status(501).json({ message: 'PDF generation not implemented for Firebase yet' });
  // Nếu bạn cần, mình có thể viết lại phần đọc dữ liệu Firebase và render PDF tương tự
};
