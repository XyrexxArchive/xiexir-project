// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import fs from 'fs'
import path from 'path'
import { db } from '../src/database.js'

export default {
  name: 'getplugin',
  command: ['getplugin'],
  tags: 'owner',
  desc: 'Ambil kode plugin utuh (dikirim sebagai file, gak terpotong)',
  owner: true,
  async run(m, ctx) {
    const { sock, args, settings } = ctx
    const name = (args[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!name) return m.reply('Contoh: .getplugin menu')
    const filePath = path.join(process.cwd(), 'plugins', name + '.js')
    let code = null
    let from = ''
    if (fs.existsSync(filePath)) {
      code = fs.readFileSync(filePath, 'utf8')
      from = 'folder'
    } else if (db.getPlugin(name)) {
      code = db.getPlugin(name).code
      from = 'database'
    }
    if (!code) return m.reply(`Plugin *${name}* gak ketemu!\nCek daftar: .listplugin`)
    await sock.sendMessage(m.chat, { document: Buffer.from(code, 'utf8'), fileName: name + '.js', mimetype: 'text/javascript', caption: `Kode lengkap *${name}* (${from})\n${code.length} karakter — utuh, gak ada yang kepotong!\n\n${settings.footer}` }, { quoted: m.raw })
  }
}
