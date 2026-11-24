// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'ping',
  command: ['ping', 'botstatus', 'runtime'],
  tags: 'main',
  desc: 'Cek kecepatan dan status bot',
  async run(m, ctx) {
    const { db, settings, func } = ctx
    const t0 = Date.now()
    await m.react('⚡')
    const t1 = Date.now()
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
    let text = `*「 STATUS BOT 」*\n\n`
    text += `⚡ Kecepatan respons : ${t1 - t0} ms\n`
    text += `⏱️ Uptime : ${func.msToTime(process.uptime() * 1000)}\n`
    text += `💾 RAM : ${ram} MB\n`
    text += `🖥️ Platform : ${process.platform} (node ${process.version})\n`
    text += `💬 Total pesan tersimpan : ${db.countMessages()}\n\n`
    text += settings.footer
    await m.reply(text)
  }
}
