const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: String,
  username: String,
  phone: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  cart: [{
    productId: String,
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  state: String,
  tempData: Object
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;