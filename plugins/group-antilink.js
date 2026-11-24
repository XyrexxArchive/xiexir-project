// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'antilink',
  command: ['antilink'],
  tags: 'group',
  desc: 'Anti link: member yang kirim link langsung dikick',
  group: true,
  admin: true,
  async run(m, ctx) {
    const { db } = ctx
    const arg = (ctx.args[0] || '').toLowerCase()
    if (['on', 'aktif'].includes(arg)) {
      db.setGroupField(m.chat, 'antilink', 1)
      return m.reply('Antilink ON! Member yang kirim link bakal langsung dikick 🔗🚫')
    }
    if (['off', 'mati'].includes(arg)) {
      db.setGroupField(m.chat, 'antilink', 0)
      return m.reply('Antilink OFF!')
    }
    const g = db.getGroup(m.chat) || {}
    await m.reply(`Status antilink : ${g.antilink ? 'ON' : 'OFF'}\n\nContoh: .antilink on | .antilink off\nCatatan: admin & owner kebal antilink`)
  }
}
