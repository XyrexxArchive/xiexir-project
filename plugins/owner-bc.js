// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'bc',
  command: ['bc', 'broadcast'],
  tags: 'owner',
  desc: 'Broadcast pesan ke semua chat yang pernah kenal bot',
  owner: true,
  async run(m, ctx) {
    const { text, sock, db, settings, func } = ctx
    if (!text) return m.reply('Contoh: .bc Info penting nih!')
    const chats = db.allChats()
    await m.reply(`Mengirim broadcast ke ${chats.length} chat...`)
    let sent = 0
    for (const c of chats) {
      try {
        await sock.sendMessage(c.jid, { text: `*「 BROADCAST 」*\n\n${text}\n\n${settings.footer}` })
        sent++
      } catch {}
      await func.sleep(1500)
    }
    await m.reply(`Broadcast terkirim ke ${sent}/${chats.length} chat`)
  }
}
