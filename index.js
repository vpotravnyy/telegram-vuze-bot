require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const Vuze = require('./vuze')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const vuze = new Vuze(process.env.VUZE_HOST + ':' + process.env.VUZE_PORT, process.env.VUZE_KEY)

const Monitor = require('./monitor')(bot, vuze)


bot.onText(/\/monitor (\d+)/, async (msg, match) => {
  new Monitor(msg.chat.id, parseInt(match[1]))
});

bot.on('callback_query', async (response) => {
  const [instanceKey, method] = response.data.split(':')
  if (Monitor.instances[instanceKey]) {
    const res = await Monitor.instances[instanceKey][method]()
    bot.answerCallbackQuery(response.id, res)
  }
});


bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const fileStream = bot.getFileStream(msg.document.file_id)
  const chunks = []
  fileStream.on('data', chunk => chunks.push(chunk));
  fileStream.on('end', () => {
    const file = Buffer.concat(chunks).toString('base64')
    bot.sendMessage(chatId, "Выбери папку", {
      reply_markup: JSON.stringify({
        one_time_keyboard: true,
        keyboard: [
          [ { text: 'Movies' }, { text: 'Movies - Kids' } ],
          [ { text: 'TV Shows' }, { text: 'TV Shows - Kids' } ],
          [ { text: 'Music' }, { text: 'Books' } ]
        ]
      })
    });

    bot.once('message', async (response) => {
      let result
      try {
        result = await vuze.add(file, response.text)
      } catch (e) {
        console.error(e)
        bot.sendMessage(chatId, "Упс! Что-то пошло не так...\nЯ не могу скачать этот торрент")
      }
      new Monitor(chatId, result.arguments['torrent-added'].id)
    })
  });
})

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  console.log(msg)
})