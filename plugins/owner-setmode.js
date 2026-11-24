// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'setmode',
  command: ['setmode'],
  tags: 'owner',
  desc: 'Ganti mode bot: self (owner saja) atau public (semua orang)',
  owner: true,
  async run(m, ctx) {
    const { args, db, settings } = ctx
    const val = (args[0] || '').toLowerCase()
    if (!['self', 'public'].includes(val)) return m.reply(`Mode sekarang : ${db.getSetting('mode', settings.mode)}\nContoh : .setmode self | .setmode public`)
    db.setSetting('mode', val)
    await m.reply(`Mode diganti ke *${val.toUpperCase()}*${val === 'self' ? '\nCuma owner yang bisa pakai bot sekarang' : '\nSemua orang bisa pakai bot sekarang'}\n\n${settings.footer}`)
  }
}
