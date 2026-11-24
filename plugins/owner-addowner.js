// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'addowner',
  command: ['addowner', 'delowner'],
  tags: 'owner',
  desc: 'Tambah/hapus owner bot (tag/reply/nomor)',
  owner: true,
  async run(m, ctx) {
    const { args, db, func, settings } = ctx
    let number = ''
    if (m.mentioned.length) number = func.extractDigits(m.mentioned[0])
    else if (m.quoted) number = func.extractDigits(m.quoted.sender || m.quoted.lid)
    else number = func.extractDigits(args[0] || '')
    if (number.length < 8) return m.reply('Format: .addowner <nomor> atau tag/reply orangnya')
    const isDel = ctx.command === 'delowner'
    if (isDel) {
      const ok = db.delOwner(number)
      return m.reply(ok ? `Nomor ${number} dihapus dari daftar owner!` : `Nomor ${number} gak ada di daftar owner!`)
    }
    if (db.isOwnerPhone(number)) return m.reply(`Nomor ${number} udah jadi owner!`)
    db.addOwner(number, m.pushName || 'Owner')
    await m.reply(`Nomor ${number} sekarang jadi owner!\n\n${settings.footer}`)
  }
}
