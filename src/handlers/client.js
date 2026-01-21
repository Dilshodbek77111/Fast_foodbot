const User = require('../models/User');
const Product = require('../models/Product');
const keyboards = require('../keyboards');

module.exports = (bot) => {
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    
    if (msg.contact.user_id === msg.from.id) {
      try {
        const user = await User.findOne({ telegramId: chatId });
        
        if (user) {
          user.phone = msg.contact.phone_number;
          user.state = 'main_menu';
          await user.save();
          
          const successMessage = '✅ Rahmat! Telefon raqamingiz qabul qilindi.\n\n' +
            'Endi bemalol bizning mahsulotlarimizni buyurtma qilsangiz bo\'ladi!';
          
          bot.sendMessage(chatId, successMessage, keyboards.mainMenu());
        }
      } catch (error) {
        console.error('Contact handler xatosi:', error);
      }
    }
  });

  bot.onText(/🍔 Mahsulotlar/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const products = await Product.find({ isActive: true });
      
      if (products.length === 0) {
        bot.sendMessage(chatId, '😔 Hozircha mahsulotlar mavjud emas.');
        return;
      }
      
      const inlineKeyboard = products.map(product => {
        return [{
          text: `${product.name} - ${product.price} so'm`,
          callback_data: `product_${product._id}`
        }];
      });
      
      bot.sendMessage(chatId, '🍔 Bizning mahsulotlarimiz:', {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });
      
    } catch (error) {
      console.error('Mahsulotlar ko\'rsatish xatosi:', error);
      bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  });

  bot.onText(/🛒 Savat/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || user.cart.length === 0) {
        bot.sendMessage(chatId, '📭 Savatingiz bo\'sh.', keyboards.mainMenu());
        return;
      }
      
      let message = '🛒 Sizning savatingiz:\n\n';
      let total = 0;
      
      user.cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   ${item.quantity} x ${item.price} = ${itemTotal} so'm\n\n`;
        total += itemTotal;
      });
      
      message += `💰 Umumiy summa: ${total} so'm`;
      
      bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Buyurtma berish', callback_data: 'checkout_order' }],
            [{ text: '🗑 Savatni tozalash', callback_data: 'clear_cart' }],
            [{ text: '⬅️ Ortga', callback_data: 'back_to_main' }]
          ]
        }
      });
      
    } catch (error) {
      console.error('Savat ko\'rsatish xatosi:', error);
      bot.sendMessage(chatId, 'Xatolik yuz berdi.');
    }
  });

  bot.onText(/📞 Aloqa/, (msg) => {
    const chatId = msg.chat.id;
    const contactInfo = '📞 Aloqa uchun:\n\n' +
      'Telefon: +998932977711\n' +
      'Ish vaqti: 09:00 - 25:00\n' +
      'Manzil: Yer sayyorasi';
    
    bot.sendMessage(chatId, contactInfo, keyboards.mainMenu());
  });
};