// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'setnamedesc',
  command: ['setname', 'setsubject', 'setdesc', 'setdescription'],
  tags: 'group',
  desc: 'Ganti nama/deskripsi grup',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock } = ctx
    if (!ctx.text) return m.reply('Teksnya mana? Contoh: .setname Grup Xiexir | .setdesc Deskripsi grup')
    if (ctx.command.includes('name') || ctx.command.includes('subject')) {
      await sock.groupUpdateSubject(m.chat, ctx.text.slice(0, 100))
      await m.reply('Nama grup berhasil diubah! ✅')
    } else {
      await sock.groupUpdateDescription(m.chat, ctx.text.slice(0, 500))
      await m.reply('Deskripsi grup berhasil diubah! ✅')
    }
  }
}
