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
  cart: {
    type: Array,
    default: []
  },
  state: {
    type: String,
    default: ''
  },
  tempData: {
    type: mongoose.Schema.Types.Mixed, // 🔴 Har qanday turdagi ma'lumot
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;