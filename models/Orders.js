// file: models/Order.js
const { v4: uuidv4 } = require('uuid');

class Order {
  constructor({
    userId,
    userName,
    order_items,
    shipping_info,
    payment_info,
    staffNote = '',
    status = 'preparing'
  }) {
    this.orderId = uuidv4();
    this.userId = userId;
    this.userName = userName;
    this.createdAt = Date.now();

    // Sản phẩm trong đơn
    this.order_items = order_items; // { productId: { productName, price, quantity, imageUrl } }

    // Thông tin giao hàng
    this.shipping_info = {
      name: shipping_info.name || '',
      phone: shipping_info.phone || '',
      email: shipping_info.email || '',
      address: shipping_info.address || ''
    };

    // Thông tin thanh toán
    this.payment_info = {
      method: payment_info.method || 'COD',
      status: payment_info.status || 'unpaid',
      discount: payment_info.discount || 0,
      shippingFee: payment_info.shippingFee || 0,
      total: payment_info.total || 0
    };

    this.totalAmount = this.payment_info.total;
    this.status = status;
    this.staffNote = staffNote;
  }

  // Trả về dữ liệu phù hợp lưu Firebase
  toJSON() {
    return {
      orderId: this.orderId,
      userId: this.userId,
      userName: this.userName,
      createdAt: this.createdAt,
      order_items: this.order_items,
      shipping_info: this.shipping_info,
      payment_info: this.payment_info,
      status: this.status,
      totalAmount: this.totalAmount,
      staffNote: this.staffNote
    };
  }
}

module.exports = Order;
