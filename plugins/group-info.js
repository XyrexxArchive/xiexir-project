// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'groupinfo',
  command: ['groupinfo', 'infogc', 'infogroup'],
  tags: 'group',
  desc: 'Info lengkap grup',
  group: true,
  async run(m, ctx) {
    const { sock, db, settings } = ctx
    const meta = m.metadata || (await sock.groupMetadata(m.chat))
    const admins = (meta?.participants || []).filter((p) => p.admin)
    const g = db.getGroup(m.chat) || {}
    let text = `*「 INFO GRUP 」*\n\n`
    text += `📛 Nama : ${meta?.subject || '-'}\n`
    text += `🆔 ID : ${m.chat}\n`
    text += `📅 Dibuat : ${meta?.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : '-'}\n`
    text += `👥 Member : ${(meta?.participants || []).length}\n`
    text += `👮 Admin : ${admins.map((a) => '@' + String(a.id).split('@')[0]).join(', ') || '-'}\n`
    text += `🔗 Antilink : ${g.antilink ? 'ON' : 'OFF'}\n`
    text += `🎉 Welcome : ${g.welcome ? 'ON' : 'OFF'}\n`
    text += `👋 Bye : ${g.bye ? 'ON' : 'OFF'}\n`
    if (meta?.desc) text += `\n*Deskripsi:*\n${meta.desc}\n`
    await m.reply(text + '\n' + settings.footer, { mentions: admins.map((a) => a.id) })
  }
}
