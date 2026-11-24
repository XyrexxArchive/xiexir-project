// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'tagall',
  command: ['tagall'],
  tags: 'group',
  desc: 'Tag semua member grup',
  group: true,
  admin: true,
  async run(m, ctx) {
    const { sock, settings } = ctx
    const mentions = m.participants.map((p) => p.id)
    const list = mentions.map((j, i) => `${i + 1}. @${String(j).split('@')[0]}`).join('\n')
    await sock.sendMessage(m.chat, { text: `${ctx.text ? ctx.text + '\n\n' : ''}*「 TAG ALL 」*\n${list}\n\n${settings.footer}`, mentions }, { quoted: m.raw })
  }
}
