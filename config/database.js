const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ga ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err));

module.exports = mongoose;