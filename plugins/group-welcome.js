// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'welcomebye',
  command: ['welcome', 'setwelcome', 'bye', 'setbye'],
  tags: 'group',
  desc: 'Setting pesan welcome & bye grup (variable: @user @group)',
  group: true,
  admin: true,
  async run(m, ctx) {
    const { db } = ctx
    const g = db.getGroup(m.chat) || {}
    if (ctx.command === 'welcome' || ctx.command === 'bye') {
      const field = ctx.command === 'welcome' ? 'welcome' : 'bye'
      const arg = (ctx.args[0] || '').toLowerCase()
      if (['on', 'aktif'].includes(arg)) {
        db.setGroupField(m.chat, field, 1)
        return m.reply(`${field.toUpperCase()} diaktifkan! ${field === 'welcome' ? 'Teks: .setwelcome <teks>' : 'Teks: .setbye <teks>'}`)
      }
      if (['off', 'mati'].includes(arg)) {
        db.setGroupField(m.chat, field, 0)
        return m.reply(`${field.toUpperCase()} dimatikan!`)
      }
      const teks = field === 'welcome' ? g.welcome_text : g.bye_text
      return m.reply(`Status ${field.toUpperCase()} : ${g[field] ? 'ON' : 'OFF'}\nTeks : ${teks || '-'}\n\nGanti teks: .set${field} <teks>\nVariable: @user @group`)
    }
    if (!ctx.text) return m.reply(`Contoh: .${ctx.command} Halo @user, selamat datang di @group!`)
    const textField = ctx.command === 'setwelcome' ? 'welcome_text' : 'bye_text'
    const flagField = ctx.command === 'setwelcome' ? 'welcome' : 'bye'
    db.setGroupField(m.chat, textField, ctx.text)
    db.setGroupField(m.chat, flagField, 1)
    await m.reply(`Teks ${ctx.command === 'setwelcome' ? 'welcome' : 'bye'} tersimpan & diaktifkan!\n\n${ctx.text}`)
  }
}
