// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'join',
  command: ['join'],
  tags: 'owner',
  desc: 'Join grup via link invite',
  owner: true,
  async run(m, ctx) {
    const { text, sock } = ctx
    const match = String(text || '').match(/chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]+)/)
    if (!match) return m.reply('Kirim link invite grupnya!\nContoh: .join https://chat.whatsapp.com/xxxxx')
    try {
      const res = await sock.groupAcceptInvite(match[1])
      await m.reply('Berhasil join grup ' + (res?.id || ''))
    } catch (e) {
      await m.reply('Gagal join: ' + (e?.message || e))
    }
  }
}
