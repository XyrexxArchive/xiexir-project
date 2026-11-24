// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'owner',
  command: ['owner', 'creator'],
  tags: 'main',
  desc: 'Mengirim kontak owner bot',
  async run(m, ctx) {
    const { sock, db, settings } = ctx
    const owners = db.getOwners()
    const number = owners[0]?.jid || ctx.func.extractDigits(settings.owners?.[0] || '')
    if (!number) return m.reply('Owner belum diatur! Edit settings.js atau pakai perintah addowner')
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.ownerName}\nORG:${settings.botName}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`
    await sock.sendMessage(m.chat, { contacts: { displayName: settings.ownerName, contacts: [{ vcard }] } }, { quoted: m.raw })
  }
}
