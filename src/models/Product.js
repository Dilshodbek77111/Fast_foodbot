const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mahsulot nomi majburiy'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Narx majburiy'],
    min: [0, 'Narx 0 dan katta bo\'lishi kerak']
  },
  description: {
    type: String,
    default: ''  
  },
  category: {
    type: String,
    default: 'fast-food'
  },
  imageId: {
    type: String,
    required: [true, 'Rasm majburiy'],  
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;