// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'listplugin',
  command: ['listplugin', 'plugins'],
  tags: 'owner',
  desc: 'Daftar semua plugin terpasang',
  owner: true,
  async run(m, ctx) {
    const { settings } = ctx
    const folder = ctx.plugins.filter((p) => p.source === 'folder')
    const database = ctx.plugins.filter((p) => p.source === 'database')
    let text = `*「 LIST PLUGIN 」*\n\n*Folder (${folder.length}):*\n`
    for (const p of folder) text += `- ${p.commands.map((c) => (ctx.prefix || '') + c).join(', ')} [${p.tags}]\n`
    text += `\n*Database (${database.length}):*\n`
    for (const p of database) text += `- ${p.name} → ${p.commands.join(', ')}\n`
    text += `\nTotal : ${ctx.plugins.length} plugin\n\n${settings.footer}`
    await m.reply(text)
  }
}
