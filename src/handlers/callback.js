const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

module.exports = (bot) => {
  
  const userQuantities = new Map(); 

  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    try {
      console.log(`\n📱 Callback query: ${data} (chatId: ${chatId})`);
      
      const user = await User.findOne({ telegramId: chatId });
      if (!user) {
        console.log('❌ Foydalanuvchi topilmadi');
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Xatolik yuz berdi' });
      }
      
      
      if (!userQuantities.has(chatId)) {
        userQuantities.set(chatId, {});
      }
      const quantities = userQuantities.get(chatId);
      
      
      if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        const product = await Product.findById(productId);
        
        if (!product) {
          return bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot topilmadi' });
        }
        
        
        quantities[productId] = 1;
        userQuantities.set(chatId, quantities);
        
       
        const message = `🍔 ${product.name}\n💰 ${product.price} so'm`;
        
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
                  { text: '🛒 Savatga', callback_data: `add_cart_${productId}_1` }
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
                  { text: '🛒 Savatga', callback_data: `add_cart_${productId}_1` }
                ],
                [
                  { text: '⬅️ Ortga', callback_data: 'back_products' }
                ]
              ]
            }
          });
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('dec_')) {
        const productId = data.replace('dec_', '');
        const currentQty = quantities[productId] || 1;
        
        if (currentQty > 1) {
          quantities[productId] = currentQty - 1;
          userQuantities.set(chatId, quantities);
          
          console.log(`Miqdor kamaydi: ${productId} -> ${quantities[productId]}`);
          
          
          try {
            await bot.editMessageReplyMarkup({
              inline_keyboard: [
                [
                  { text: '➖', callback_data: `dec_${productId}` },
                  { text: quantities[productId].toString(), callback_data: `show_${productId}` },
                  { text: '➕', callback_data: `inc_${productId}` }
                ],
                [
                  { text: '🛒 Savatga', callback_data: `add_cart_${productId}_${quantities[productId]}` }
                ],
                [
                  { text: '⬅️ Ortga', callback_data: 'back_products' }
                ]
              ]
            }, {
              chat_id: chatId,
              message_id: messageId
            });
          } catch (editError) {
            
            if (!editError.message.includes('message is not modified')) {
              console.error('Keyboard yangilash xatosi:', editError);
            }
          }
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('inc_')) {
        const productId = data.replace('inc_', '');
        const currentQty = quantities[productId] || 1;
        
        quantities[productId] = currentQty + 1;
        userQuantities.set(chatId, quantities);
        
        console.log(`Miqdor oshdi: ${productId} -> ${quantities[productId]}`);
        
        
        try {
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                { text: '➖', callback_data: `dec_${productId}` },
                { text: quantities[productId].toString(), callback_data: `show_${productId}` },
                { text: '➕', callback_data: `inc_${productId}` }
              ],
              [
                { text: '🛒 Savatga', callback_data: `add_cart_${productId}_${quantities[productId]}` }
              ],
              [
                { text: '⬅️ Ortga', callback_data: 'back_products' }
              ]
            ]
          }, {
            chat_id: chatId,
            message_id: messageId
          });
        } catch (editError) {
          
          if (!editError.message.includes('message is not modified')) {
            console.error('Keyboard yangilash xatosi:', editError);
          }
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
    
      else if (data.startsWith('add_cart_')) {
        const parts = data.replace('add_cart_', '').split('_');
        const productId = parts[0];
        const quantity = parseInt(parts[1]) || 1;
        
        const product = await Product.findById(productId);
        
        if (!product) {
          return bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot topilmadi' });
        }
        
        
        if (!user.cart) {
          user.cart = [];
        }
        
        
        const existingIndex = user.cart.findIndex(item => item.productId === productId);
        
        if (existingIndex !== -1) {
          
          user.cart[existingIndex].quantity += quantity;
        } else {
          
          user.cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: quantity
          });
        }
        
        await user.save();
        
        
        delete quantities[productId];
        userQuantities.set(chatId, quantities);
        
        
        try {
          await bot.deleteMessage(chatId, messageId);
        } catch (deleteError) {
          console.log('Xabarni o\'chirishda xato:', deleteError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id, {
          text: `✅ ${product.name} savatga ${quantity} ta qo'shildi!`
        });
      }
      
      
      else if (data === 'back_products') {
        const products = await Product.find({ isActive: true });
        
        const inlineKeyboard = products.map(product => [
          {
            text: `${product.name} - ${product.price} so'm`,
            callback_data: `product_${product._id}`
          }
        ]);
        
        try {
          await bot.editMessageText('🍔 Mahsulotlar:', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: inlineKeyboard
            }
          });
        } catch (editError) {
          console.error('Ortga qaytish xatosi:', editError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data === 'view_cart') {
        if (!user.cart || user.cart.length === 0) {
          return bot.answerCallbackQuery(callbackQuery.id, { text: '📭 Savatingiz bo\'sh' });
        }
        
        let message = '🛒 Savatingiz:\n\n';
        let total = 0;
        
        user.cart.forEach((item, index) => {
          const itemTotal = item.price * item.quantity;
          message += `${index + 1}. ${item.name}\n   ${item.quantity} x ${item.price} = ${itemTotal} so'm\n\n`;
          total += itemTotal;
        });
        
        message += `💰 Umumiy summa: ${total} so'm`;
        
        
        try {
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Buyurtma berish', callback_data: 'checkout_order' }],
                [{ text: '🗑 Savatni tozalash', callback_data: 'clear_cart' }],
                [{ text: '⬅️ Ortga', callback_data: 'back_to_main' }]
              ]
            }
          });
        } catch (editError) {
          console.error('Savatni ko\'rsatish xatosi:', editError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data === 'checkout_order') {
        if (!user.cart || user.cart.length === 0) {
          return bot.answerCallbackQuery(callbackQuery.id, { text: 'Savat bo\'sh!' });
        }
        
        let total = 0;
        user.cart.forEach(item => {
          total += item.price * item.quantity;
        });
        
        user.state = 'awaiting_payment';
        user.tempData = { checkoutTotal: total };
        await user.save();
        
        
        try {
          await bot.deleteMessage(chatId, messageId);
        } catch (deleteError) {
          console.log('Xabarni o\'chirishda xato:', deleteError);
        }
        
        bot.sendMessage(chatId, 
          `💰 BUYURTMA SUMMASI: ${total} so'm\n\n` +
          `To'lov miqdorini kiriting (so'mda):\n` +
          `Masalan: ${total}`
        );
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data === 'clear_cart') {
        user.cart = [];
        await user.save();
        
        try {
          await bot.editMessageText('🛒 Savatingiz tozalandi.', {
            chat_id: chatId,
            message_id: messageId
          });
        } catch (editError) {
          console.error('Savat tozalash xatosi:', editError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Savat tozalandi!' });
      }
      
    
      else if (data === 'back_to_main') {
        try {
          await bot.editMessageText('Asosiy menyuga qaytdingiz.', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              keyboard: [
                [{ text: '🍔 Mahsulotlar' }, { text: '🛒 Savat' }],
                [{ text: '📞 Aloqa' }]
              ],
              resize_keyboard: true
            }
          });
        } catch (editError) {
          console.error('Asosiy menyuga qaytish xatosi:', editError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else if (data.startsWith('delete_product_')) {
        if (!user.isAdmin) {
          return bot.answerCallbackQuery(callbackQuery.id, { text: 'Ruxsat yo\'q!' });
        }
        
        const productId = data.replace('delete_product_', '');
        const product = await Product.findById(productId);
        
        if (product) {
          product.isActive = false;
          await product.save();
          
          try {
            await bot.editMessageText(`✅ "${product.name}" o'chirildi!`, {
              chat_id: chatId,
              message_id: messageId
            });
          } catch (editError) {
            console.error('Mahsulot o\'chirish xatosi:', editError);
          }
        }
        
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot o\'chirildi!' });
      }
      
      
      else if (data === 'cancel_delete') {
        try {
          await bot.editMessageText('❌ Bekor qilindi.', {
            chat_id: chatId,
            message_id: messageId
          });
        } catch (editError) {
          console.error('Bekor qilish xatosi:', editError);
        }
        
        return bot.answerCallbackQuery(callbackQuery.id);
      }
      
      
      else {
        console.log(`Noma'lum callback: ${data}`);
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Noma\'lum amal' });
      }
      
    } catch (error) {
      console.error('❌ Callback handler xatosi:', error.message);
      
     
      if (error.message.includes('message is not modified')) {
        console.log('⚠️ Xuddi shu keyboard, xato e\'tiborsiz qoldirildi');
        try {
          await bot.answerCallbackQuery(callbackQuery.id);
        } catch (answerError) {
          console.log('Answer callback xatosi:', answerError);
        }
      } else {
        try {
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Xatolik yuz berdi!' });
        } catch (answerError) {
          console.log('Answer callback xatosi:', answerError);
        }
      }
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
        user.state = '';
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