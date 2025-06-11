const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  product_stock: { type: Number, default: 0 },
  category_id: { type: String, required: true },
  sub_category_id: { type: String, required: true },
  product_price: { type: Number, required: true },
  product_description: { type: String },
  product_instruction: { type: String },
  product_images: {
    image1: { type: String },
    image2: { type: String },
    image3: { type: String }
  },
  product_rating: { type: String },
  product_discount: { type: Number, default: 0 },
  product_reviews: {
    review1: { type: String },
    review2: { type: String },
    review3: { type: String }
  },
  product_level: { type: String },
  water_demand: { type: String },
  conditions: { type: String },
  status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);