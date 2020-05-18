const prettysize = require('prettysize');
const humanizeDuration = require('humanize-duration')

const formatTime = humanizeDuration.humanizer({
  language: 'shortRu',
  languages: {
    shortRu: {
      d: () => 'д',
      h: () => 'ч',
      m: () => 'м',
      s: () => 'с',
      ms: () => 'мс',
    }
  },
  largest: 2,
  delimiter: ' ',
  spacer: '',
  maxDecimalPoints: 0
})

function getStatus (status, error) {
  if (error) return '🛑'
  if (status == 0) return '⏸'
  if (status <= 4) return '🔄'
  if (status >  4) return '✅'
}

function getProgressBar (percentDone) {
  let progressBar = ""
  const completedBlocks = Math.round(percentDone * 13)
  const percent = Math.floor(percentDone * 100)

  for (let i = 0; i<13; i++) {
    progressBar += i < completedBlocks ? "🟦" : "⬜️"
  }
  return `${progressBar} <i>(${percent}%)</i>`
}

function getSize (left, total) {
  return `💾 ${prettysize(total - left)} / ${prettysize(total)}`
}

function getTotalSize (total) {
  return `💾 ${prettysize(total)}`
}

function getETA (eta) {
  if (eta > 60*60*24*30 || eta < 0) return '⏳ ∞'
  return `⏳ ${formatTime(eta * 1000)}`
}

function getSpeed (speed) {
  return `📈 ${prettysize(speed)}/s` 
}

function getName(name, length = 20) {
  name = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
  if (name.length < length + 10) return name
  return name.substring(0, length) + '...'
}

function getFolder (base, name) {
  const src = '/' + base.replace('D:\\', '').replace(/\\/g, '/') + '/' + getName(name)
  return `📂 <i>${src}</i>`
}

function format (torrent) {
  const status = getStatus(torrent.status, torrent.error)
  const name = `<b><u>${getName(torrent.name, 100)}</u></b>`
  const progress = getProgressBar(torrent.percentDone)
  const size = getSize(torrent.leftUntilDone, torrent.sizeWhenDone)
  const totalSize = getTotalSize(torrent.sizeWhenDone)
  const time = getETA(torrent.eta)
  const speed = getSpeed(torrent.rateDownload)
  const folder = getFolder(torrent.downloadDir, torrent.name)

  if (torrent.status > 4) {
    return `${status} ${name}\n\n${folder}\n🏁 Готово!\n${totalSize}`
  }
  return `${status} ${name}\n\n${folder}\n${progress}\n${size}\n${speed}\n${time}`
}

module.exports = format