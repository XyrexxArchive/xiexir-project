// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import fs from 'fs'
import path from 'path'
import { loadPlugins } from '../src/handler.js'
import { db } from '../src/database.js'

export default {
  name: 'delplugin',
  command: ['delplugin'],
  tags: 'owner',
  desc: 'Hapus plugin dari folder atau database',
  owner: true,
  async run(m, ctx) {
    const { args } = ctx
    const name = (args[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!name) return m.reply('Contoh: .delplugin tagihanku')
    const filePath = path.join(process.cwd(), 'plugins', name + '.js')
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      await loadPlugins()
      return m.reply(`Plugin *${name}* (folder) sudah dihapus!`)
    }
    if (db.getPlugin(name)) {
      db.delPlugin(name)
      await loadPlugins()
      return m.reply(`Plugin *${name}* (database) sudah dihapus!`)
    }
    await m.reply(`Plugin *${name}* gak ketemu. Cek daftar: .listplugin`)
  }
}
