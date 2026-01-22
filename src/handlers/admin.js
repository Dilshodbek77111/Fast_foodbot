const User = require('../models/User');
const Product = require('../models/Product');

module.exports = (bot) => {
  console.log('✅ Admin handler yuklandi');

  // Har bir admin uchun vaqtinchalik ma'lumotlar
  const adminTempData = new Map(); // chatId -> {name, price, step}

  // Admin menyu
  const adminMenu = {
    reply_markup: {
      keyboard: [
        [{ text: '➕ Yangi mahsulot' }, { text: '🗑 Mahsulot o\'chirish' }],
        [{ text: '⬅️ Asosiy menyu' }]
      ],
      resize_keyboard: true
    }
  };

  const cancelButton = {
    reply_markup: {
      keyboard: [[{ text: '❌ Bekor qilish' }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };

  // ==================== YANGI MAHSULOT QO'SHISH ====================
  bot.onText(/➕ Yangi mahsulot/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      console.log(`\n🆕 Admin: Yangi mahsulot (${chatId})`);
      
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) {
        return bot.sendMessage(chatId, '⚠️ Admin emas!');
      }
      
      // Map da yangi ma'lumotlar
      adminTempData.set(chatId, {
        step: 'name',
        name: '',
        price: 0
      });
      
      console.log('Map ma\'lumotlari:', adminTempData.get(chatId));
      
      bot.sendMessage(chatId, 
        '🆕 YANGI MAHSULOT\n\n1. Mahsulot NOMINI kiriting:',
        cancelButton
      );
      
    } catch (error) {
      console.error('Xato:', error);
      bot.sendMessage(chatId, '❌ Xatolik');
    }
  });

  // ==================== BEKOR QILISH ====================
  bot.onText(/❌ Bekor qilish/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      console.log(`🚫 Bekor qilish: ${chatId}`);
      
      // Map dan ma'lumotlarni o'chirish
      adminTempData.delete(chatId);
      
      // User holatini tozalash
      const user = await User.findOne({ telegramId: chatId });
      if (user) {
        user.state = '';
        user.tempData = null;
        await user.save();
      }
      
      bot.sendMessage(chatId, '❌ Bekor qilindi.', adminMenu);
      
    } catch (error) {
      console.error('Bekor qilish xatosi:', error);
    }
  });

  // ==================== ASOSIY MENYU ====================
  bot.onText(/⬅️ Asosiy menyu/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Map dan ma'lumotlarni o'chirish
      adminTempData.delete(chatId);
      
      bot.sendMessage(chatId, 'Asosiy menyuga qaytdingiz.', {
        reply_markup: {
          keyboard: [
            [{ text: '🍔 Mahsulotlar' }, { text: '🛒 Savat' }],
            [{ text: '📞 Aloqa' }]
          ],
          resize_keyboard: true
        }
      });
      
    } catch (error) {
      console.error('Asosiy menyu xatosi:', error);
    }
  });

  // ==================== MESSAGE HANDLER ====================
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/') || msg.photo) return;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) return;
      
      console.log(`\n📨 Admin xabari: "${text}"`);
      
      // Map dan ma'lumotlarni olish
      const tempData = adminTempData.get(chatId);
      console.log('Map tempData:', tempData);
      
      // 1. NOM QABUL QILISH
      if (tempData && tempData.step === 'name') {
        console.log(`📝 Nom qabul qilinmoqda...`);
        
        if (text.length < 2) {
          return bot.sendMessage(chatId, '❌ Nom kamida 2 belgi bo\'lishi kerak!');
        }
        
        // Map ni yangilash
        tempData.name = text.trim();
        tempData.step = 'price';
        adminTempData.set(chatId, tempData);
        
        console.log(`✅ Nom saqlandi: "${tempData.name}"`);
        
        bot.sendMessage(chatId, 
          `✅ Nomi: "${tempData.name}"\n\n2. Narx kiriting:\nMasalan: 25000`,
          cancelButton
        );
      }
      
      // 2. NARX QABUL QILISH
      else if (tempData && tempData.step === 'price') {
        console.log(`💰 Narx qabul qilinmoqda...`);
        
        const price = parseInt(text.trim());
        
        if (isNaN(price) || price <= 0) {
          return bot.sendMessage(chatId, '❌ Iltimos, to\'g\'ri narx kiriting!');
        }
        
        // Map ni yangilash
        tempData.price = price;
        tempData.step = 'image';
        adminTempData.set(chatId, tempData);
        
        console.log(`✅ Narx saqlandi: ${price}`);
        console.log('Hozirgi Map ma\'lumotlari:', tempData);
        
        bot.sendMessage(chatId, 
          `✅ Narxi: ${price} so'm\n\n3. 🔴 RASM YUBORING!`,
          cancelButton
        );
      }
      
    } catch (error) {
      console.error('Message handler xatosi:', error);
      bot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
    }
  });

  // ==================== RASM QABUL QILISH ====================
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      console.log(`\n📸 Rasm yuborildi: ${chatId}`);
      
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) return;
      
      // Map dan ma'lumotlarni olish
      const tempData = adminTempData.get(chatId);
      console.log('Rasm uchun Map ma\'lumotlari:', tempData);
      
      if (!tempData || tempData.step !== 'image') {
        console.log('❌ Noto\'g\'ri holat');
        return;
      }
      
      // Ma'lumotlarni tekshirish
      if (!tempData.name || !tempData.price) {
        console.log('❌ Ma\'lumotlar yetishmayapti');
        adminTempData.delete(chatId);
        return bot.sendMessage(chatId, 
          '❌ Ma\'lumotlar saqlanmagan. Qaytadan boshlang.',
          adminMenu
        );
      }
      
      // Rasmni olish
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;
      
      console.log(`✅ Rasm fileId: ${fileId}`);
      
      // MAHSULOT YARATISH
      try {
        const productData = {
          name: tempData.name,
          price: tempData.price,
          imageId: fileId,
          isActive: true
        };
        
        console.log('🎯 Mahsulot ma\'lumotlari:', productData);
        
        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();
        
        console.log('✅ Mahsulot saqlandi:', savedProduct._id);
        
        // NATIJANI KO'RSATISH
        const response = `✅ MAHSULOT SAQLANDI!\n\nNomi: ${savedProduct.name}\nNarxi: ${savedProduct.price} so'm`;
        
        await bot.sendPhoto(chatId, savedProduct.imageId, { 
          caption: response 
        });
        
        // Map dan ma'lumotlarni o'chirish
        adminTempData.delete(chatId);
        
        await bot.sendMessage(chatId, 
          'Boshqa amal bajarishingiz mumkin.',
          adminMenu
        );
        
        console.log('✅ Muvaffaqiyatli yakunlandi!');
        
      } catch (saveError) {
        console.error('❌ Saqlash xatosi:', saveError);
        
        let errorMessage = '❌ Saqlashda xato:\n';
        if (saveError.errors) {
          Object.keys(saveError.errors).forEach(key => {
            errorMessage += `• ${saveError.errors[key].message}\n`;
          });
        } else {
          errorMessage += saveError.message;
        }
        
        bot.sendMessage(chatId, errorMessage, adminMenu);
        
        // Map ni tozalash
        adminTempData.delete(chatId);
      }
      
    } catch (error) {
      console.error('❌ Photo handler xatosi:', error);
      bot.sendMessage(chatId, '❌ Rasmda xato.');
    }
  });

  // ==================== MAHSULOT O'CHIRISH ====================
  bot.onText(/🗑 Mahsulot o\'chirish/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) return;
      
      const products = await Product.find({ isActive: true });
      
      if (products.length === 0) {
        return bot.sendMessage(chatId, '❌ Mahsulotlar yo\'q.');
      }
      
      const keyboard = products.map(p => [
        { text: `${p.name} - ${p.price} so'm`, callback_data: `delete_${p._id}` }
      ]);
      
      keyboard.push([{ text: '❌ Bekor qilish', callback_data: 'cancel_delete' }]);
      
      bot.sendMessage(chatId, '🗑 O\'chirish uchun tanlang:', {
        reply_markup: { inline_keyboard: keyboard }
      });
      
    } catch (error) {
      console.error('Delete error:', error);
    }
  });

  // ==================== CALLBACK QUERY ====================
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) return;
      
      if (data.startsWith('delete_')) {
        const productId = data.replace('delete_', '');
        const product = await Product.findById(productId);
        
        if (product) {
          product.isActive = false;
          await product.save();
          
          await bot.editMessageText(`✅ "${product.name}" o'chirildi!`, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          });
        }
      } else if (data === 'cancel_delete') {
        await bot.editMessageText('❌ Bekor qilindi.', {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id
        });
      }
      
      await bot.answerCallbackQuery(callbackQuery.id);
      
    } catch (error) {
      console.error('Callback error:', error);
    }
  });
};