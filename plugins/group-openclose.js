// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'openclose',
  command: ['open', 'buka', 'close', 'tutup'],
  tags: 'group',
  desc: 'Buka/tutup grup (open/close)',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock } = ctx
    const isOpen = ['open', 'buka'].includes(ctx.command)
    await sock.groupSettingUpdate(m.chat, isOpen ? 'not_announcement' : 'announcement')
    await m.reply(isOpen ? 'Grup dibuka! Semua member bisa chat sekarang 🔓' : 'Grup ditutup! Cuma admin yang bisa chat 🔒')
  }
}
