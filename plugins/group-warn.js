// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'warn',
  command: ['warn', 'resetwarn', 'listwarn'],
  tags: 'group',
  desc: 'Warning member (3x warn = auto kick)',
  group: true,
  admin: true,
  async run(m, ctx) {
    const { db, sock, func, settings } = ctx
    if (ctx.command === 'listwarn') {
      const rows = db.listWarnsByChat(m.chat)
      if (!rows.length) return m.reply('Gak ada yang kena warn di grup ini 😇')
      let text = `*「 LIST WARN 」*\n\n`
      for (const r of rows) text += `- @${func.extractDigits(r.jid)} : ${r.count}x\n`
      return m.reply(text + '\n' + settings.footer, { mentions: rows.map((r) => r.jid) })
    }
    const targets = func.resolveTargets(m, ctx.args)
    if (!targets.length) return m.reply('Tag/reply orang yang mau diwarn!')
    const target = targets[0]
    if (ctx.command === 'resetwarn') {
      const ok = db.clearWarns(target, m.chat)
      return m.reply(ok ? `Warn @${func.extractDigits(target)} direset! ✅` : `@${func.extractDigits(target)} gak punya warn.`, { mentions: [target] })
    }
    if (db.isOwnerPhone(func.extractDigits(target))) return m.reply('Gua gak berani warn owner gua 🥺')
    db.addWarn(target, m.chat, ctx.text || 'tanpa alasan')
    const count = db.getWarns(target, m.chat).length
    if (count >= 3) {
      db.clearWarns(target, m.chat)
      if (m.isBotAdmin) {
        await sock.groupParticipantsUpdate(m.chat, [target], 'remove').catch(() => {})
        return m.reply(`@${func.extractDigits(target)} dikick karena udah 3x warn! 🔪\nAlasan terakhir: ${ctx.text || 'tanpa alasan'}`, { mentions: [target] })
      }
      return m.reply(`@${func.extractDigits(target)} udah 3x warn tapi gua belum admin, gak bisa kick 😔`, { mentions: [target] })
    }
    await m.reply(`⚠️ Warning ${count}/3 untuk @${func.extractDigits(target)}\nAlasan: ${ctx.text || 'tanpa alasan'}\n3x warn = auto kick!`, { mentions: [target] })
  }
}
