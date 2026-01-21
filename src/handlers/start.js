const User = require('../models/User');
const keyboards = require('../keyboards');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from;
    
    try {
      let user = await User.findOne({ telegramId: chatId });
      
      if (!user) {
        user = new User({
          telegramId: chatId,
          firstName: from.first_name,
          username: from.username,
          isAdmin: chatId.toString() === process.env.ADMIN_ID
        });
        await user.save();
      }
      
      if (user.isAdmin) {
        bot.sendMessage(chatId, `👨‍💼 Admin paneliga xush kelibsiz!`, keyboards.adminMenu());
        return;
      }
      
      if (!user.phone) {
        const welcomeMessage = `Assalomu alaykum ${from.first_name}! 👋\n\n` +
          `Bizning fast food botimizga xush kelibsiz!\n` +
          `Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:`;
        
        bot.sendMessage(chatId, welcomeMessage, keyboards.phoneRequest());
        
        user.state = 'awaiting_phone';
        await user.save();
      } else {
        const welcomeBack = `Xush kelibsiz ${user.firstName}! 🍔\n\n` +
          `Endi bemalol bizning mahsulotlarimizni buyurtma qilishingiz mumkin!`;
        
        bot.sendMessage(chatId, welcomeBack, keyboards.mainMenu());
      }
      
    } catch (error) {
      console.error('Start handler xatosi:', error);
      bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  });
};