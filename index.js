// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import { start } from './src/connection.js'
import { loadPlugins } from './src/handler.js'
import settings from './settings.js'

const banner = `
╔═══════════════════════════════════╗
║       X I E X I R   B O T         ║
║   WhatsApp Bot — ESM Plugins      ║
║   xyrcodex - dapsKikir            ║
╚═══════════════════════════════════╝
`

console.log(banner)
console.log(`${settings.botName} | Developer: ${settings.author}\n`)

await loadPlugins()
start().catch((e) => {
  console.error('[BOT] gagal start:', e)
  process.exit(1)
})

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
