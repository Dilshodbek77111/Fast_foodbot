const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  telegramId: Number,
  products: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  phone: String,
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'completed', 'cancelled']
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;