// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'menu',
  command: ['menu', 'help', 'allmenu'],
  tags: 'main',
  desc: 'Melihat daftar semua perintah bot',
  async run(m, ctx) {
    const { db, settings, func, plugins } = ctx
    const prefix = db.getSetting('prefix', settings.prefix)
    const mode = db.getSetting('mode', settings.mode)
    const pfx = prefix === '' ? '(none)' : prefix
    let text = `╭─❑ *${settings.botName}*\n`
    text += `│ ✇ Prefix : ${pfx}\n`
    text += `│ ✇ Mode : ${mode}\n`
    text += `│ ✇ Owner : ${settings.ownerName}\n`
    text += `│ ✇ Plugin : ${plugins.length}\n`
    text += `│ ✇ Uptime : ${func.msToTime(process.uptime() * 1000)}\n`
    text += `│ ✇ Waktu : ${func.formatDate()}\n`
    text += `╰──────────────\n`
    for (const tag of ['main', 'group', 'owner']) {
      if (tag === 'owner' && !m.isOwner) continue
      const list = plugins.filter((p) => p.tags === tag)
      if (!list.length) continue
      text += `\n*「 ${tag.toUpperCase()} 」*\n`
      for (const p of list) {
        text += `• ${p.commands.map((c) => (prefix === '' ? c : prefix + c)).join(' / ')}\n  _${p.desc}_\n`
      }
    }
    text += `\n${settings.footer}`
    await m.reply(text)
  }
}
