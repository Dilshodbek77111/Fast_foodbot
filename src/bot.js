require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

require('../config/database');

require('./handlers/start')(bot);
require('./handlers/admin')(bot);
require('./handlers/client')(bot);
require('./handlers/callback')(bot);

console.log('🍔 FastFood Bot ishga tushdi...');