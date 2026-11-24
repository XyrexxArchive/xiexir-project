// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'sc',
  command: ['sc', 'script', 'source'],
  tags: 'main',
  desc: 'Info source code bot',
  async run(m, ctx) {
    const { settings } = ctx
    let text = `*「 SOURCE CODE 」*\n\n`
    text += `Repo : ${settings.repoUrl}\n`
    text += `Developer : ${settings.author}\n`
    text += `Library : @rexxhayanasi/elaina-baileys\n`
    text += `Database : better-sqlite3\n`
    text += `Base : ESM Plugin System\n\n`
    text += settings.footer
    await m.reply(text)
  }
}
