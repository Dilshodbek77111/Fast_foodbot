const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

module.exports = (bot) => {
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user) return;
      
      
      if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        const product = await Product.findById(productId);
        
        if (!product) {
          bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot topilmadi' });
          return;
        }
        
        user.tempData = {
          selectedProduct: productId,
          quantity: 1
        };
        await user.save();
        
        let message = `🍔 ${product.name}\n\n`;
        message += `💰 Narxi: ${product.price} so'm\n`;
        
        if (product.description) {
          message += `📝 ${product.description}\n\n`;
        }
        
        message += `Miqdorni tanlang:`;
        
        if (product.imageId) {
          await bot.sendPhoto(chatId, product.imageId, {
            caption: message,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '➖', callback_data: `dec_${productId}` },
                  { text: '1', callback_data: `show_${productId}` },
                  { text: '➕', callback_data: `inc_${productId}` }
                ],
                [
                  { text: '🛒 Savatga qo\'shish', callback_data: `add_cart_${productId}_1` }
                ],
                [
                  { text: '⬅️ Ortga', callback_data: 'back_products' }
                ]
              ]
            }
          });
        } else {
          await bot.sendMessage(chatId, message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '➖', callback_data: `dec_${productId}` },
                  { text: '1', callback_data: `show_${productId}` },
                  { text: '➕', callback_data: `inc_${productId}` }
                ],
                [
                  { text: '🛒 Savatga qo\'shish', callback_data: `add_cart_${productId}_1` }
                ],
                [
                  { text: '⬅️ Ortga', callback_data: 'back_products' }
                ]
              ]
            }
          });
        }
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
     
      else if (data.startsWith('dec_')) {
        const productId = data.replace('dec_', '');
        let quantity = user.tempData?.quantity || 1;
        
        if (quantity > 1) {
          quantity--;
          user.tempData.quantity = quantity;
          await user.save();
          
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                { text: '➖', callback_data: `dec_${productId}` },
                { text: quantity.toString(), callback_data: `show_${productId}` },
                { text: '➕', callback_data: `inc_${productId}` }
              ],
              [
                { text: '🛒 Savatga qo\'shish', callback_data: `add_cart_${productId}_${quantity}` }
              ],
              [
                { text: '⬅️ Ortga', callback_data: 'back_products' }
              ]
            ]
          }, {
            chat_id: chatId,
            message_id: messageId
          });
        }
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('inc_')) {
        const productId = data.replace('inc_', '');
        let quantity = user.tempData?.quantity || 1;
        
        quantity++;
        user.tempData.quantity = quantity;
        await user.save();
        
        await bot.editMessageReplyMarkup({
          inline_keyboard: [
            [
              { text: '➖', callback_data: `dec_${productId}` },
              { text: quantity.toString(), callback_data: `show_${productId}` },
              { text: '➕', callback_data: `inc_${productId}` }
            ],
            [
              { text: '🛒 Savatga qo\'shish', callback_data: `add_cart_${productId}_${quantity}` }
            ],
            [
              { text: '⬅️ Ortga', callback_data: 'back_products' }
            ]
          ]
        }, {
          chat_id: chatId,
          message_id: messageId
        });
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('add_cart_')) {
        const parts = data.replace('add_cart_', '').split('_');
        const productId = parts[0];
        const quantity = parseInt(parts[1]);
        
        const product = await Product.findById(productId);
        
        if (!product) {
          bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot topilmadi' });
          return;
        }
        
        const existingItemIndex = user.cart.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
          user.cart[existingItemIndex].quantity += quantity;
        } else {
          user.cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: quantity
          });
        }
        
        user.tempData = null;
        await user.save();
        
        bot.answerCallbackQuery(callbackQuery.id, {
          text: `✅ ${product.name} savatga ${quantity} ta qo'shildi!`
        });
        
        bot.deleteMessage(chatId, messageId);
      }
      
      
      else if (data === 'checkout_order') {
        if (user.cart.length === 0) {
          bot.answerCallbackQuery(callbackQuery.id, { text: 'Savat bo\'sh!' });
          return;
        }
        
        let total = 0;
        user.cart.forEach(item => {
          total += item.price * item.quantity;
        });
        
        user.state = 'awaiting_payment';
        user.tempData = { checkoutTotal: total };
        await user.save();
        
        bot.sendMessage(chatId, 
          `💰 BUYURTMA SUMMASI: ${total} so'm\n\n` +
          `To'lov miqdorini kiriting (so'mda):\n` +
          `Masalan: ${total}`
        );
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data === 'clear_cart') {
        user.cart = [];
        await user.save();
        
        bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Savat tozalandi!' });
        
        await bot.editMessageText('🛒 Savatingiz tozalandi.', {
          chat_id: chatId,
          message_id: messageId
        });
      }
      
      
      else if (data === 'back_products' || data === 'back_to_main') {
        const products = await Product.find({ isActive: true });
        
        const inlineKeyboard = products.map(product => {
          return [{
            text: `${product.name} - ${product.price} so'm`,
            callback_data: `product_${product._id}`
          }];
        });
        
        await bot.editMessageText('🍔 Bizning mahsulotlarimiz:', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: inlineKeyboard
          }
        });
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('admin_delete_')) {
        if (!user.isAdmin) {
          bot.answerCallbackQuery(callbackQuery.id, { text: 'Ruxsat yo\'q!' });
          return;
        }
        
        const productId = data.replace('admin_delete_', '');
        const product = await Product.findByIdAndDelete(productId);
        
        if (product) {
          await bot.editMessageText(`✅ "${product.name}" o'chirildi!`, {
            chat_id: chatId,
            message_id: messageId
          });
        }
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data === 'admin_cancel') {
        await bot.editMessageText('❌ Amal bekor qilindi.', {
          chat_id: chatId,
          message_id: messageId
        });
        
        bot.answerCallbackQuery(callbackQuery.id);
      }
      
    } catch (error) {
      console.error('Callback handler xatosi:', error);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Xatolik yuz berdi!' });
    }
  });

  
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/') || isNaN(text)) return;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || user.state !== 'awaiting_payment') return;
      
      const paidAmount = parseInt(text);
      const total = user.tempData?.checkoutTotal || 0;
      
      if (paidAmount >= total) {
        const order = new Order({
          telegramId: chatId,
          userId: user._id,
          products: user.cart,
          totalAmount: total,
          paidAmount: paidAmount,
          phone: user.phone,
          status: 'paid'
        });
        
        await order.save();
        
        user.cart = [];
        user.state = 'main_menu';
        user.tempData = null;
        await user.save();
        
        const change = paidAmount - total;
        let message = '✅ BUYURTMA RASMIYLASHTIRILDI!\n\n';
        message += `💳 To'langan: ${paidAmount} so'm\n`;
        message += `💰 Jami: ${total} so'm\n`;
        
        if (change > 0) {
          message += `🔄 Qaytim: ${change} so'm\n`;
        }
        
        message += `\n📞 Kuryer siz bilan tez orada aloqaga chiqadi.\n`;
        message += `Buyurtmangiz uchun rahmat!`;
        
        bot.sendMessage(chatId, message, {
          reply_markup: {
            keyboard: [
              [{ text: '🍔 Mahsulotlar' }, { text: '🛒 Savat' }],
              [{ text: '📞 Aloqa' }]
            ],
            resize_keyboard: true
          }
        });
        
      } else {
        const remaining = total - paidAmount;
        user.tempData.checkoutTotal = remaining;
        await user.save();
        
        bot.sendMessage(chatId, 
          `❗ Yetarli emas. Qolgan summa: ${remaining} so'm\n\n` +
          `Qo'shimcha to'lov miqdorini kiriting:`
        );
      }
      
    } catch (error) {
      console.error('Payment handler xatosi:', error);
      bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  });
};