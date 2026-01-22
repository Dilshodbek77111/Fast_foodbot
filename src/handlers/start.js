
const User = require('../models/User');

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
        bot.sendMessage(chatId, 
          `👨‍💼 Admin paneliga xush kelibsiz, ${user.firstName}!`,
          {
            reply_markup: {
              keyboard: [
                [{ text: '➕ Yangi mahsulot' }, { text: '🗑 Mahsulot o\'chirish' }],
                [{ text: '⬅️ Asosiy menyu' }]
              ],
              resize_keyboard: true
            }
          }
        );
      } else {
        
      }
      
    } catch (error) {
      console.error('Start handler error:', error);
    }
  });
};