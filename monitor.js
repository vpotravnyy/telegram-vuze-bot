const format = require('./format')

module.exports = (bot, vuze) => class Monitor {
  static instances = {}

  constructor (chatId, torrentId) {
    if (Monitor.instances[`${chatId}/${torrentId}`]) 
      return Monitor.instances[`${chatId}/${torrentId}`]

    console.log('constructor', `${chatId}/${torrentId}`)
    this.chatId = chatId
    this.torrentId = torrentId
    this.status = 0
    this.shouldNotify = true
    this.showRemovalDialog = false
    this.messageId = null
    this.interval = null
    this.currentText = ""

    Monitor.instances[`${chatId}/${torrentId}`] = this

    this.init()
  }

  async init () {
    const torrent = await this.getTorrent()
    this.status = torrent.status
    console.log('init', torrent)
    if (torrent) {
      this.createMessage(torrent)
      this.interval = setInterval(this.tick.bind(this), 10000)
    } else {
      bot.sendMessage(this.chatId, "404: Торрент не найден")
    }
  }

  async tick () {
    const torrent = await this.getTorrent()
    if (!torrent) { // Has been removed remotely
      return this.dispose()
    }
    this.status = torrent.status
    console.log(torrent.rateDownload)
    this.updateMessage(torrent)
    if (torrent.status > 4) {
      this.shouldNotify && this.notify(torrent)
      this.dispose() // I don't need to monitor anymore
    }
  }

  dispose () {
    clearInterval(this.interval)
    this.interval = null
    this.messageId && bot.editMessageReplyMarkup(
      '{}',
      {
        message_id: this.messageId,
        chat_id: this.chatId
      }
    )
    delete Monitor.instances[`${this.chatId}/${this.torrentId}`]
  }

  async getTorrent() {
    return (await vuze.checkStatus(this.torrentId)).arguments.torrents[0]
  }

  async createMessage(torrent) {
    this.currentText = format(torrent)

    const message = await bot.sendMessage(this.chatId, this.currentText, {
      parse_mode: "HTML",
      reply_markup: this.getButtons()
    })
    this.messageId = message.message_id
  }

  async updateMessage(torrent) {
    if (!this.messageId) return
    const newText = format(torrent)

    if (newText != this.currentText) {
      this.currentText = newText
      bot.editMessageText(newText, {
        message_id: this.messageId,
        chat_id: this.chatId,
        parse_mode: "HTML",
        reply_markup: this.getButtons()
      })
    }
  }

  async deleteMessage() {
    if (!this.messageId) return
    bot.deleteMessage(this.chatId, this.messageId)
    this.messageId = null
  }

  async notify(torrent) {
    this.deleteMessage()

    await bot.sendMessage(this.chatId, format(torrent), {
      parse_mode: "HTML"
    })
  }

  getButtons () {
    const mainRow = [
      {
        text: this.status == 0 ? '▶️ Старт' : '⏸ Стоп',
        callback_data: `${this.chatId}/${this.torrentId}:${this.status == 0 ? 'start' : 'stop'}`
      },
      {
        text: '❌ Удалить',
        callback_data: `${this.chatId}/${this.torrentId}:toggleRemovalDialog`
      },
      {
        text: (this.shouldNotify ? '🔔' : '🔕'),
        callback_data: `${this.chatId}/${this.torrentId}:toggleNotify`
      },
    ]
    const removalDialog = [{
      text: '❌ Данные',
      callback_data: `${this.chatId}/${this.torrentId}:removeFiles`
    },
    {
      text: '🗑 Торрент',
      callback_data: `${this.chatId}/${this.torrentId}:removeTorrent`
    },
    {
      text: '↩️ Отмена',
      callback_data: `${this.chatId}/${this.torrentId}:toggleRemovalDialog`
    },]

    return JSON.stringify({
      inline_keyboard: this.showRemovalDialog ? [removalDialog] : [mainRow]
    })
  }

  updateButtons () {
    this.messageId && bot.editMessageReplyMarkup(
      this.getButtons(),
      {
        message_id: this.messageId,
        chat_id: this.chatId
      }
    )
  }

  toggleNotify () {
    this.shouldNotify = !this.shouldNotify

    this.updateButtons()

    if (this.shouldNotify) return { text: 'Я пришлю тебе уведомление когда торрент скачается' }
    else return { text: 'Я не буду присылать уведомления про этот торрент' }
  }

  start () {
    // TODO request start
  }

  stop () {
    // TODO request stop
  }

  toggleRemovalDialog () {
    this.showRemovalDialog = !this.showRemovalDialog
    this.updateButtons()
  }

  removeFiles () {

  }

  removeTorrent () {

  }

}