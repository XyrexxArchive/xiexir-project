// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import util from 'util'

export default {
  name: 'eval',
  command: ['eval', '>'],
  tags: 'owner',
  desc: 'Eksekusi kode JavaScript langsung di bot',
  owner: true,
  async run(m, ctx) {
    const { text } = ctx
    if (!text) return m.reply('Contoh: .eval return m.sender\nVariabel tersedia: m, ctx, ctx.sock, ctx.db, ctx.settings')
    try {
      const body = /\breturn\b/.test(text) ? text : `return (${text})`
      let result = await eval(`(async () => { ${body} })()`)
      if (typeof result !== 'string') result = util.inspect(result, { depth: null, breakLength: 100, maxArrayLength: 50 })
      await m.reply(String(result).slice(0, 6000))
    } catch (e) {
      await m.reply('Error!\n' + String(e).slice(0, 1000))
    }
  }
}
