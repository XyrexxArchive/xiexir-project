// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import readline from 'readline'
import makeWASocket, { fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, DisconnectReason, proto } from '@rexxhayanasi/elaina-baileys'
import logger from './logger.js'
import { db } from './database.js'
import { useSQLiteAuthState } from './auth-state.js'
import { processMessage } from './handler.js'
import settings from '../settings.js'
import func from './func.js'

const PAIRING_MAX_TRIES = 8
let reconnectAttempts = 0
let pairingRequested = false
let pairingTries = 0
let cachedPhone = null

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function askPhoneNumber() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question('Masukkan nomor WA bot (contoh 6281234567890): ', (answer) => {
    rl.close()
    resolve(String(answer || ''))
  }))
}

function normalizePhone(input) {
  let num = String(input || '').replace(/\D/g, '')
  if (num.startsWith('62')) return num
  if (num.startsWith('0')) num = '62' + num.slice(1)
  else if (num.startsWith('8')) num = '62' + num
  if (num.length < 6 || num.length > 15) throw new Error('nomor harus format internasional, contoh: 6281234567890')
  return num
}

async function resolvePhoneNumber() {
  if (cachedPhone) return cachedPhone
  const configured = String(settings.phoneNumber || '').replace(/\D/g, '')
  if (configured) {
    cachedPhone = normalizePhone(configured)
    console.log(`[PAIRING] Memakai nomor dari settings.js : ${cachedPhone}`)
    return cachedPhone
  }
  console.log('[PAIRING] settings.phoneNumber kosong, masukkan nomor di terminal:')
  for (let i = 0; i < 3; i++) {
    const answer = await askPhoneNumber()
    if (!answer.trim()) {
      console.log('[PAIRING] Nomor kosong, coba lagi:')
      continue
    }
    cachedPhone = normalizePhone(answer)
    return cachedPhone
  }
  throw new Error('nomor WA tidak didapat, isi phoneNumber di settings.js atau jalankan bot di terminal interaktif')
}

async function requestPairingCode(sock, number) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await sock.requestPairingCode(number)
      return String(raw || '').match(/.{1,4}/g)?.join('-') || String(raw)
    } catch (e) {
      lastError = e
      console.error(`[PAIRING] percobaan ${attempt}/3 gagal : ${e?.message || e}`)
      if (attempt < 3) await sleep(5000)
    }
  }
  throw lastError
}

async function runPairing(sock, state) {
  if (pairingRequested || state.creds.registered) return
  if (pairingTries >= PAIRING_MAX_TRIES) {
    console.error('[PAIRING] Batas percobaan pairing habis, restart bot untuk coba lagi')
    return
  }
  pairingRequested = true
  try {
    await sleep(settings.pairingDelay || 2500)
    if (state.creds.registered) return
    const number = await resolvePhoneNumber()
    const code = await requestPairingCode(sock, number)
    pairingTries++
    console.log('\n╔═══════════════════════════════════╗')
    console.log(`║  PAIRING CODE : ${code}`)
    console.log('╚═══════════════════════════════════╝')
    console.log('Buka WhatsApp > Perangkat Tertaut > Tautkan dengan Nomor Telepon > masukkan kode di atas\n')
  } catch (e) {
    pairingTries++
    pairingRequested = false
    console.error('[PAIRING] Gagal:', e?.message || e)
    console.error('[PAIRING] Isi phoneNumber di settings.js (contoh 6281234567890) lalu restart, atau tunggu retry otomatis')
  }
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

  let version
  try {
    version = (await fetchLatestBaileysVersion()).version
  } catch {
    console.log('[BOT] Gagal ambil versi WA terbaru, pakai versi bawaan library')
  }

  const sock = makeWASocket({
    version,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    fireInitQueries: true,
    generateHighQualityLinkPreview: false,
    emitOwnEvents: true,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 3,
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

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !state.creds.registered) {
      console.log('[BOT] Koneksi siap, minta pairing code...')
      await runPairing(sock, state)
    }

    if (connection === 'connecting' && !state.creds.registered) {
      console.log('[BOT] Menghubungkan ke WhatsApp...')
      await runPairing(sock, state)
    }

    if (connection === 'open') {
      reconnectAttempts = 0
      pairingRequested = false
      pairingTries = 0
      console.log(`[BOT] Tersambung sebagai ${sock.user?.name || 'WhatsApp'} (${func.extractDigits(sock.user?.id)})`)
      console.log(`[BOT] Mode : ${db.getSetting('mode', settings.mode)} | Prefix : « ${db.getSetting('prefix', settings.prefix) || 'none'} »`)
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.error?.output?.statusCode
      if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.forbidden) {
        console.log('[BOT] Sesi logout, menghapus sesi dari database...')
        clear()
        pairingRequested = false
        pairingTries = 0
        setTimeout(() => start().catch(console.error), 3000)
        return
      }
      reconnectAttempts++
      const delay = statusCode === DisconnectReason.restartRequired ? 1000 : Math.min(reconnectAttempts * 3000, 30000)
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
