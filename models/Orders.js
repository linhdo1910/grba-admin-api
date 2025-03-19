// models/orderModel.js
const mongoose = require('mongoose');

// Thông tin từng sản phẩm trong đơn hàng
const orderProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 }
});

// Thông tin giao hàng
const shipToSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  note: { type: String }
});

// Lịch sử giao dịch (transaction history)
const transactionSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE_ORDER', 'UPDATE_STATUS', 'UPDATE_SHIPPING', 'CANCEL_ORDER']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Processing', 'Delivering', 'Finished', 'Cancelled']
  }
});

// Schema chính cho Order
const orderSchema = new mongoose.Schema({
  // Nếu muốn để MongoDB tự sinh _id dạng ObjectId, bỏ _id: { type: String, required: true } đi
  // Hoặc nếu bạn cần custom ID, giữ _id: String
  // _id: { type: String, required: true },

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  
  userName: { 
    type: String, 
    required: true 
  }, // Có thể bỏ nếu bạn luôn dùng userId, hoặc giữ để hiển thị nhanh

  products: {
    type: [orderProductSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Order must have at least one product']
  },

  shipTo: {
    type: shipToSchema,
    required: true
  },

  shippingFee: {
    type: Number,
    required: true,
    min: 0
  },
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value === this.subTotal + this.shippingFee - this.discountPrice;
      },
      message: 'Total price must equal subTotal + shippingFee - discountPrice'
    }
  },

  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'Banking', 'Momo', 'ZaloPay']
  },

  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Processing', 'Delivering', 'Finished', 'Cancelled'],
    default: 'Pending'
  },

  staffNote: { type: String },

  transactionHistory: [transactionSchema]

}, { timestamps: true });

// Tạo index để hỗ trợ tìm kiếm
orderSchema.index({ userName: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
