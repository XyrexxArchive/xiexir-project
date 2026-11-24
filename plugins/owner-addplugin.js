// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import { addDbPlugin } from '../src/handler.js'

export default {
  name: 'addplugin',
  command: ['addplugin'],
  tags: 'owner',
  desc: 'Tambah plugin baru (simpan di database)',
  owner: true,
  async run(m, ctx) {
    const { text, args, func, settings } = ctx
    const name = (args[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!name) return m.reply(`Contoh:\n.addplugin tagihanku\n<kode plugin>\n\nAtau reply pesan berisi kode lalu ketik .addplugin <nama>`)
    let code = m.quoted?.text || ''
    const rest = text.slice(args[0].length).trim()
    if (!code) code = rest
    code = func.stripFences(code)
    if (!code) return m.reply('Kode pluginnya mana? Kirim langsung setelah nama atau reply pesan berisi kode.')
    try {
      const saved = await addDbPlugin(name, code, m.sender)
      await m.reply(`Plugin *${saved.name}* tersimpan di database!\nCommand : ${saved.commands.join(', ')}\nTotal plugin : ${ctx.plugins.length}\n\n${settings.footer}`)
    } catch (e) {
      await m.reply(`Gagal nambah plugin:\n${String(e.message || e).slice(0, 400)}`)
    }
  }
}
