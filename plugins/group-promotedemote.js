// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'promotedemote',
  command: ['promote', 'demote'],
  tags: 'group',
  desc: 'Promote/demote member jadi admin grup',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock, settings, func } = ctx
    const action = ctx.command === 'demote' ? 'demote' : 'promote'
    const targets = func.resolveTargets(m, ctx.args)
    if (!targets.length) return m.reply(`Tag/reply member yang mau di-${action}!`)
    const results = []
    for (const t of targets) {
      try {
        const res = await sock.groupParticipantsUpdate(m.chat, [t], action)
        const status = res?.[0]?.status
        results.push(`@${func.extractDigits(t)} — ${status === 200 ? (action === 'promote' ? 'sekarang jadi admin 👑' : 'udah gak jadi admin 📉') : `gagal (kode ${status})`}`)
      } catch (e) {
        results.push(`@${func.extractDigits(t)} — error: ${String(e?.message || e).slice(0, 60)}`)
      }
    }
    await m.reply(results.join('\n') + `\n\n${settings.footer}`, { mentions: targets })
  }
}
