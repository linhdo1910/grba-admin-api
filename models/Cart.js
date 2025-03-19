const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual để tính tổng giá trị giỏ hàng (nếu muốn)
CartSchema.virtual('totalPrice').get(function() {
  // Lưu ý: để tính được tổng, bạn cần đảm bảo rằng các sản phẩm đã được populate
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((sum, item) => {
    // Giả sử mỗi item có trường 'price' được lấy từ sản phẩm đã populate, nếu không, bạn có thể tính lại khi update giỏ hàng.
    return sum + (item.price || 0) * item.quantity;
  }, 0);
});

module.exports = mongoose.model('Cart', CartSchema);
