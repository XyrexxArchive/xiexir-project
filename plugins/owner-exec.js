// Xiexir-Bot Plugin | xyrcodex - dapsKikir
import { exec } from 'child_process'

export default {
  name: 'exec',
  command: ['exec', '$'],
  tags: 'owner',
  desc: 'Jalankan perintah terminal di server bot',
  owner: true,
  async run(m, ctx) {
    const { text } = ctx
    if (!text) return m.reply('Contoh: .exec ls -la')
    const out = await new Promise((resolve) => {
      exec(text, { timeout: 60000, maxBuffer: 1024 * 1024, cwd: process.cwd() }, (err, stdout, stderr) => {
        let res = (stdout || '') + (stderr || '')
        if (!res && err) res = String(err.message || err)
        resolve(res)
      })
    })
    await m.reply(out ? out.slice(0, 6000) : 'Selesai, tanpa output')
  }
}
