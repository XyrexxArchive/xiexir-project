// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'add',
  command: ['add', '+'],
  tags: 'group',
  desc: 'Add member ke grup via nomor',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock, args, settings } = ctx
    const numbers = []
    for (const a of args) {
      let d = ctx.func.extractDigits(a)
      if (d.startsWith('0')) d = '62' + d.slice(1)
      else if (d.startsWith('8') && d.length >= 10) d = '62' + d
      if (d.length >= 8) numbers.push(d)
    }
    if (!numbers.length) return m.reply('Kirim nomornya! Contoh: .add 628xxxxxxxxxx')
    const results = []
    for (const d of numbers) {
      try {
        const res = await sock.groupParticipantsUpdate(m.chat, [d + '@s.whatsapp.net'], 'add')
        const st = res?.[0]?.status
        if (st === 200) results.push(`+${d} — berhasil masuk 🎉`)
        else if (st === 403) results.push(`+${d} — gagal, privacy settings user (coba invite manual)`)
        else if (st === 408) results.push(`+${d} — gagal, dia baru aja keluar grup`)
        else results.push(`+${d} — gagal (kode ${st})`)
      } catch (e) {
        results.push(`+${d} — error: ${String(e?.message || e).slice(0, 60)}`)
      }
    }
    await m.reply(results.join('\n') + `\n\n${settings.footer}`)
  }
}
