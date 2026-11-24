// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import sharp from 'sharp'

export default {
  name: 'sticker',
  command: ['sticker', 's'],
  tags: 'main',
  desc: 'Jadikan foto jadi sticker (kirim/reply foto dengan caption .s)',
  async run(m, ctx) {
    const { sock, settings, func } = ctx
    const isDirect = ['imageMessage'].includes(m.type)
    const isQuoted = m.quoted && ['imageMessage'].includes(m.quoted.type)
    if (!isDirect && !isQuoted) return m.reply('Kirim/reply foto dengan caption .s untuk jadi sticker!')
    await m.react('⏳')
    try {
      const media = isQuoted ? await m.quoted.download() : await m.download()
      const webp = await sharp(media).resize(512, 512, { fit: 'inside' }).webp({ quality: 85 }).toBuffer()
      await sock.sendMessage(m.chat, { sticker: webp, packname: settings.packname, author: settings.author }, { quoted: m.raw })
      await m.react('✅')
    } catch (e) {
      await m.react('❌')
      await m.reply(`Gagal bikin sticker: ${String(e?.message || e).slice(0, 200)}\n\n${settings.footer}`)
    }
  }
}
