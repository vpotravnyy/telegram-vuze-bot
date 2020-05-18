const sa = require('superagent')

module.exports = class Vuze {
  static fields = [
    "id","name","eta","isFinished","leftUntilDone","percentDone","rateDownload","sizeWhenDone","status","downloadDir"
  ]
  constructor (host, token) {
    this.host = host
    this.cookie = ""
    this.connect(token)
  }

  async connect (token) {
    try {
      const res = await sa.get(`${this.host}/?vuze_pairing_ac=${token}`);
      this.setCookie(res.header['set-cookie'])

      this.checkStatus(20)
      
      
    } catch (err) {
      console.error(err);
    }
  }

  setCookie (headers) {
    this.cookie = headers.map(h => h.split(";")[0]).join("; ")
  }

  async checkStatus (id) {
    const response = await sa
      .post(`${this.host}/transmission/rpc`)
      .send({
        "method":"torrent-get",
        "arguments":{
          "fields": Vuze.fields,
          "ids":[id]
        },
        "math": Math.random()
      })
      .set('Cookie', this.cookie)
    return response.body
  }

  async add (torrent, folder) {
    const response = await sa
      .post(`${this.host}/transmission/rpc`)
      .send({
        "method":"torrent-add",
        "arguments": {
          "paused":false,
          "download-dir": `D:\\${folder}`,
          "metainfo": torrent
        },
        "math": Math.random()
      })
      .set('Cookie', this.cookie)
    return response.body
  }
}