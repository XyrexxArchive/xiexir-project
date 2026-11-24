// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'setprefix',
  command: ['setprefix'],
  tags: 'owner',
  desc: 'Ganti prefix bot (setprefix none buat tanpa prefix)',
  owner: true,
  async run(m, ctx) {
    const { args, db, settings } = ctx
    const val = (args[0] || '').toLowerCase()
    if (!val) return m.reply(`Prefix sekarang : « ${db.getSetting('prefix', settings.prefix) || '(none)'} »\nContoh : .setprefix # | .setprefix none`)
    if (val === 'none') {
      db.setSetting('prefix', '')
      return m.reply('Prefix dihapus! Bot sekarang jalan TANPA prefix.')
    }
    const clean = val.slice(0, 3)
    db.setSetting('prefix', clean)
    await m.reply(`Prefix diganti ke « ${clean} »\n\n${settings.footer}`)
  }
}
