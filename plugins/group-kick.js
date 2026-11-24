// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'kick',
  command: ['kick', '-'],
  tags: 'group',
  desc: 'Kick member dari grup (tag/reply/nomor)',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock, db, settings, func } = ctx
    const targets = func.resolveTargets(m, ctx.args)
    if (!targets.length) return m.reply('Tag/reply orang yang mau dikick!')
    const results = []
    for (const t of targets) {
      const digits = func.extractDigits(t)
      if (db.isOwnerPhone(digits) || (settings.owners || []).map((o) => func.extractDigits(o)).includes(digits)) {
        results.push(`@${digits} — owner gua, gak bisa dikick 🥺`)
        continue
      }
      if (t === m.senderLid || t === m.sender) {
        results.push(`@${digits} — itu lu sendiri woy 😑`)
        continue
      }
      try {
        const res = await sock.groupParticipantsUpdate(m.chat, [t], 'remove')
        const status = res?.[0]?.status
        results.push(`@${digits} — ${status === 200 ? 'terkick 🔪' : `gagal (kode ${status})`}`)
      } catch (e) {
        results.push(`@${digits} — error: ${String(e?.message || e).slice(0, 60)}`)
      }
    }
    await m.reply(results.join('\n'), { mentions: targets })
  }
}
