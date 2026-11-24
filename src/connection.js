// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import readline from 'readline'
import makeWASocket, { fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, DisconnectReason, proto } from '@rexxhayanasi/elaina-baileys'
import logger from './logger.js'
import { db } from './database.js'
import { useSQLiteAuthState } from './auth-state.js'
import { processMessage } from './handler.js'
import settings from '../settings.js'
import func from './func.js'

let reconnectAttempts = 0

function askPhoneNumber() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question('Masukkan nomor WA bot (contoh 6281234567890): ', (answer) => {
    rl.close()
    resolve(String(answer || ''))
  }))
}

function normalizePhone(input) {
  let num = String(input || '').replace(/[^0-9]/g, '')
  if (num.startsWith('0')) num = '62' + num.slice(1)
  else if (num.startsWith('8')) num = '62' + num
  return num
}

async function handleGroupUpdate(sock, { id, participants, action }) {
  if (action !== 'add' && action !== 'remove') return
  const group = db.getGroup(id)
  const enabled = action === 'add' ? group?.welcome : group?.bye
  const template = action === 'add' ? group?.welcome_text : group?.bye_text
  if (!enabled || !template) return
  let name = group?.name || ''
  if (!name) {
    const meta = await sock.groupMetadata(id).catch(() => null)
    name = meta?.subject || id
  }
  for (const p of participants) {
    const num = func.extractDigits(p) || 'user'
    const text = template.replaceAll('@user', '@' + num).replaceAll('@group', name) + '\n\n' + settings.footer
    await sock.sendMessage(id, { text, mentions: [p] }).catch(() => {})
  }
}

export async function start() {
  const { state, saveCreds, clear } = await useSQLiteAuthState()
  const { version } = await fetchLatestBaileysVersion()
  const phone = state.creds.registered ? null : normalizePhone(await askPhoneNumber())

  const sock = makeWASocket({
    version,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    markOnlineOnConnect: true,
    syncFullHistory: false,
    getMessage: async (key) => {
      const row = db.getMessage(key.remoteJid, key.id)
      if (!row) return undefined
      try {
        return proto.Message.fromObject(JSON.parse(row.json))
      } catch {
        return undefined
      }
    }
  })

  if (phone) {
    try {
      const code = await sock.requestPairingCode(phone)
      console.log('\n╔═══════════════════════════════════╗')
      console.log(`║  PAIRING CODE : ${code}   `)
      console.log('╚═══════════════════════════════════╝')
      console.log('Buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon > masukkan kode di atas\n')
    } catch (e) {
      console.error('[PAIRING] gagal:', e?.message || e)
      process.exit(1)
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'connecting') console.log('[BOT] Menghubungkan ke WhatsApp...')
    if (connection === 'open') {
      reconnectAttempts = 0
      console.log(`[BOT] Tersambung sebagai ${sock.user?.name || 'WhatsApp'} (${func.extractDigits(sock.user?.id)})`)
      console.log(`[BOT] Mode : ${db.getSetting('mode', settings.mode)} | Prefix : « ${db.getSetting('prefix', settings.prefix) || 'none'} »`)
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.error?.output?.statusCode
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('[BOT] Sesi logout, menghapus sesi dari database...')
        clear()
        setTimeout(() => start().catch(console.error), 3000)
        return
      }
      reconnectAttempts++
      const delay = Math.min(reconnectAttempts * 3000, 30000)
      console.log(`[BOT] Koneksi terputus (${statusCode || 'unknown'}), reconnect dalam ${delay / 1000} detik...`)
      setTimeout(() => start().catch(console.error), delay)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      try {
        await processMessage(sock, msg)
      } catch (e) {
        console.error('[HANDLER]', e)
      }
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    try {
      await handleGroupUpdate(sock, update)
    } catch (e) {
      console.error('[GROUP]', e)
    }
  })

  sock.ev.on('groups.update', (updates) => {
    for (const u of updates || []) {
      if (u?.id) db.upsertGroup(u.id, u.subject)
    }
  })

  return sock
}
