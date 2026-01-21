const keyboards = {
  mainMenu: () => {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '🍔 Mahsulotlar' }, { text: '🛒 Savat' }],
          [{ text: '📞 Aloqa' }]
        ],
        resize_keyboard: true
      }
    };
  },

  phoneRequest: () => {
    return {
      reply_markup: {
        keyboard: [[{
          text: '📱 Telefon raqamimni yuborish',
          request_contact: true
        }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
  },

  adminMenu: () => {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '➕ Yangi mahsulot' }, { text: '🗑 Mahsulot o\'chirish' }],
          [{ text: '⬅️ Foydalanuvchi menyusi' }]
        ],
        resize_keyboard: true
      }
    };
  },

  cancelAction: () => {
    return {
      reply_markup: {
        keyboard: [[{ text: '❌ Bekor qilish' }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
  }
};

module.exports = keyboards;