// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'hidetag',
  command: ['hidetag', 'h'],
  tags: 'group',
  desc: 'Kirim pesan dengan tag semua member tanpa daftar nama',
  group: true,
  admin: true,
  async run(m, ctx) {
    const { sock, settings } = ctx
    if (!ctx.text) return m.reply('Teksnya mana? Contoh: .hidetag rapat sekarang!')
    await sock.sendMessage(m.chat, { text: ctx.text + '\n\n' + settings.footer, mentions: m.participants.map((p) => p.id) }, { quoted: m.raw })
  }
}
