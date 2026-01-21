const User = require('../models/User');
const Product = require('../models/Product');
const keyboards = require('../keyboards');

module.exports = (bot) => {
  bot.onText(/➕ Yangi mahsulot/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || !user.isAdmin) {
        await bot.sendMessage(chatId, '⚠️ Bu funksiya faqat adminlar uchun!');
        return;
      }
      
      user.state = 'admin_add_name';
      user.tempData = {};
      await user.save();
      
      await bot.sendMessage(chatId, 
        '🆕 YANGI MAHSULOT QO\'SHISH\n\n' +
        '1. Mahsulot NOMINI kiriting:',
        {
          reply_markup: {
            keyboard: [[{ text: '❌ Bekor qilish' }]],
            resize_keyboard: true
          }
        }
      );
      
    } catch (error) {
      console.error('Admin start error:', error);
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
    }
  });

  
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    
    if (msg.photo) return;
    
    if (!text || text.startsWith('/')) return;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.isAdmin) return;
      
      console.log(`Admin ${user.state}: "${text}"`);
      
      
      if (text === '❌ Bekor qilish') {
        user.state = 'admin_menu';
        user.tempData = {};
        await user.save();
        await bot.sendMessage(chatId, '❌ Bekor qilindi.', keyboards.adminMenu());
        return;
      }
      
      
      if (user.state === 'admin_add_name') {
        if (text.length < 2) {
          await bot.sendMessage(chatId, '❌ Nom kamida 2 belgidan iborat bo\'lishi kerak!');
          return;
        }
        
        user.tempData.name = text.trim();
        user.state = 'admin_add_price';
        await user.save();
        
        await bot.sendMessage(chatId, 
          `✅ Nomi: "${user.tempData.name}"\n\n` +
          '2. Mahsulot NARXINI kiriting (raqamda):\n' +
          'Masalan: 25000',
          {
            reply_markup: {
              keyboard: [[{ text: '❌ Bekor qilish' }]],
              resize_keyboard: true
            }
          }
        );
      }
      
      
      else if (user.state === 'admin_add_price') {
        const price = parseInt(text.trim());
        
        if (isNaN(price) || price <= 0) {
          await bot.sendMessage(chatId, '❌ Iltimos, to\'g\'ri narx kiriting!');
          return;
        }
        
        user.tempData.price = price;
        user.state = 'admin_add_image';
        await user.save();
        
        await bot.sendMessage(chatId, 
          `✅ Narxi: ${price} so'm\n\n` +
          '3. 🔴 MAJBURIY: Mahsulot RASMINI yuboring!\n' +
          '(Rasm yuborishingiz kerak, skip qilib bo\'lmaydi)',
          {
            reply_markup: {
              keyboard: [[{ text: '❌ Bekor qilish' }]],
              resize_keyboard: true
            }
          }
        );
      }
      
      
      else if (user.state === 'admin_add_description') {
        
        user.tempData.description = text.trim();
        
        console.log('Mahsulot ma\'lumotlari:', user.tempData);
        
        if (!user.tempData.name || !user.tempData.price || !user.tempData.imageId) {
          console.error('Majburiy maydonlar yo\'q:', user.tempData);
          await bot.sendMessage(chatId, 
            '❌ Majburiy ma\'lumotlar yetishmayapti. Qaytadan boshlang.',
            keyboards.adminMenu()
          );
          
          user.state = 'admin_menu';
          user.tempData = {};
          await user.save();
          return;
        }
        
        try {
          
          const productData = {
            name: user.tempData.name,
            price: user.tempData.price,
            imageId: user.tempData.imageId, 
            description: user.tempData.description || '', 
            category: 'fast-food'
          };
          
          console.log('Saqlanayotgan ma\'lumotlar:', productData);
          
          const newProduct = new Product(productData);
          const savedProduct = await newProduct.save();
          
          console.log('✅ Mahsulot saqlandi:', savedProduct._id);
          
          let response = `✅ YANGI MAHSULOT SAQLANDI!\n\n` +
                        `🏷 Nomi: ${savedProduct.name}\n` +
                        `💰 Narxi: ${savedProduct.price} so'm\n` +
                        `🖼 Rasm: Majburiy (yuborildi)\n` +
                        `📝 Tavsif: ${savedProduct.description || 'Yo\'q (ixtiyoriy)'}`;
          
          
          await bot.sendPhoto(chatId, savedProduct.imageId, {
            caption: response
          });
          
        
          user.state = 'admin_menu';
          user.tempData = {};
          await user.save();
          
          await bot.sendMessage(chatId, 
            'Boshqa amal bajarishingiz mumkin.',
            keyboards.adminMenu()
          );
          
        } catch (error) {
          console.error('❌ Mahsulot saqlash xatosi:', error);
          
          let errorMessage = '❌ Mahsulot saqlashda xatolik:\n';
          
          if (error.errors) {
            Object.keys(error.errors).forEach(key => {
              errorMessage += `• ${error.errors[key].message}\n`;
            });
          } else {
            errorMessage += error.message;
          }
          
          await bot.sendMessage(chatId, errorMessage);
          
          user.state = 'admin_menu';
          user.tempData = {};
          await user.save();
        }
      }
      
    } catch (error) {
      console.error('Admin handler error:', error);
      await bot.sendMessage(chatId, '❌ Tizim xatosi yuz berdi.');
    }
  });

 
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || !user.isAdmin || user.state !== 'admin_add_image') {
        return;
      }
      
      
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;
      
      console.log('✅ Rasm qabul qilindi, fileId:', fileId);
      
     
      user.tempData.imageId = fileId;
      user.state = 'admin_add_description';
      await user.save();
      
      await bot.sendMessage(chatId, 
        '✅ Rasm qabul qilindi!\n\n' +
        '4. 🔵 IXTIYORIY: Mahsulot TAVSIFINI kiriting:\n' +
        '(Agar tavsif bermoqchi bo\'lmasangiz, "Tavsifsiz" deb yozing yoki har qanday matn yuboring)',
        {
          reply_markup: {
            keyboard: [
              [{ text: 'Tavsifsiz' }],
              [{ text: '❌ Bekor qilish' }]
            ],
            resize_keyboard: true
          }
        }
      );
      
    } catch (error) {
      console.error('Photo handler error:', error);
      await bot.sendMessage(chatId, '❌ Rasm qabul qilishda xatolik.');
    }
  });

  
  bot.onText(/🗑 Mahsulot o\'chirish/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || !user.isAdmin) {
        await bot.sendMessage(chatId, '⚠️ Bu funksiya faqat adminlar uchun!');
        return;
      }
      
      const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
      
      if (products.length === 0) {
        await bot.sendMessage(chatId, '❌ O\'chirish uchun mahsulot mavjud emas.');
        return;
      }
      
      const inlineKeyboard = products.map(product => {
        return [{
          text: `${product.name} - ${product.price} so'm`,
          callback_data: `admin_delete_${product._id}`
        }];
      });
      
      inlineKeyboard.push([{ text: '❌ Bekor qilish', callback_data: 'admin_cancel_delete' }]);
      
      await bot.sendMessage(chatId, '🗑 O\'chirish uchun mahsulot tanlang:', {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });
      
    } catch (error) {
      console.error('Delete product error:', error);
    }
  });

  
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (!user || !user.isAdmin) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Ruxsat yo\'q!' });
        return;
      }
      
      
      if (data.startsWith('admin_delete_')) {
        const productId = data.replace('admin_delete_', '');
        const product = await Product.findById(productId);
        
        if (product) {
          product.isActive = false;
          await product.save();
          
          await bot.editMessageText(`✅ "${product.name}" mahsuloti o'chirildi!`, {
            chat_id: chatId,
            message_id: messageId
          });
          
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Mahsulot o\'chirildi!' });
        }
      }
      
     
      else if (data === 'admin_cancel_delete') {
        await bot.editMessageText('❌ O\'chirish bekor qilindi.', {
          chat_id: chatId,
          message_id: messageId
        });
        
        await bot.answerCallbackQuery(callbackQuery.id);
      }
      
    } catch (error) {
      console.error('Callback handler error:', error);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Xatolik yuz berdi!' });
    }
  });

  
  bot.onText(/⬅️ Foydalanuvchi menyusi/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (user) {
        user.state = 'main_menu';
        user.tempData = {};
        await user.save();
      }
      
      await bot.sendMessage(chatId, 
        'Foydalanuvchi menyusiga qaytdingiz.',
        keyboards.mainMenu()
      );
      
    } catch (error) {
      console.error('Switch to user menu error:', error);
    }
  });

  
  bot.onText(/⬅️ Admin menyu/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const user = await User.findOne({ telegramId: chatId });
      
      if (user) {
        user.state = 'admin_menu';
        user.tempData = {};
        await user.save();
      }
      
      await bot.sendMessage(chatId, 
        'Admin paneliga qaytdingiz.',
        keyboards.adminMenu()
      );
      
    } catch (error) {
      console.error('Switch to admin menu error:', error);
    }
  });
};