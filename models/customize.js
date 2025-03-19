const mongoose = require('mongoose');

const customizeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  layoutName: { type: String, default: '' },
  roomShape: { type: String, default: '' },
  roomLength: { type: Number, default: 0 },
  roomWidth: { type: Number, default: 0 },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      positionX: { type: Number, default: 0 },
      positionY: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Customize', customizeSchema);
