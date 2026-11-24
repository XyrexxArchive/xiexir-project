// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import settings from '../settings.js'
import { db } from './database.js'
import func from './func.js'
import { serialize } from './serialize.js'

const pluginList = []
const rootDir = process.cwd()
const pluginsDir = path.join(rootDir, 'plugins')
const tmpDir = path.join(rootDir, 'tmp')

function resolvePlugin(mod, file, source) {
  const p = mod?.default
  if (!p || typeof p.run !== 'function') throw new Error('plugin harus export default { run(m, ctx) }')
  const commands = (Array.isArray(p.command) ? p.command : [p.command]).filter(Boolean).map((c) => String(c).toLowerCase().trim())
  if (!commands.length) throw new Error('plugin tidak punya command')
  return {
    name: p.name || commands[0],
    commands,
    tags: String(p.tags || 'main').toLowerCase(),
    desc: p.desc || '',
    owner: !!p.owner,
    admin: !!p.admin,
    botAdmin: !!p.botAdmin,
    group: !!p.group,
    run: p.run,
    file,
    source
  }
}

async function importDbCode(name, code) {
  fs.mkdirSync(tmpDir, { recursive: true })
  const file = path.join(tmpDir, `${name.replace(/[^a-z0-9_-]/gi, '_')}-${Date.now()}.js`)
  fs.writeFileSync(file, code, 'utf8')
  try {
    return await import(pathToFileURL(file).href + '?v=' + Date.now())
  } finally {
    fs.unlinkSync(file)
  }
}

export async function loadPlugins() {
  pluginList.length = 0
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true })
  for (const f of fs.readdirSync(pluginsDir).filter((x) => x.endsWith('.js')).sort()) {
    try {
      const mod = await import(pathToFileURL(path.join(pluginsDir, f)).href + '?v=' + Date.now())
      pluginList.push(resolvePlugin(mod, f, 'folder'))
    } catch (e) {
      console.error(`[PLUGIN] gagal load ${f}: ${e.message}`)
    }
  }
  for (const row of db.listPlugins()) {
    try {
      const mod = await importDbCode(row.name, row.code)
      pluginList.push(resolvePlugin(mod, `${row.name} (database)`, 'database'))
    } catch (e) {
      console.error(`[PLUGIN] gagal load ${row.name}: ${e.message}`)
    }
  }
  console.log(`[PLUGIN] ${pluginList.length} plugin dimuat`)
  return pluginList
}

export const getPlugins = () => pluginList

export const findPlugin = (cmd) => pluginList.find((p) => p.commands.includes(cmd)) || null

export async function addDbPlugin(name, code, author = 'owner') {
  const mod = await importDbCode(name, code)
  const resolved = resolvePlugin(mod, `${name} (database)`, 'database')
  const clash = resolved.commands.find((c) => findPlugin(c))
  if (clash) throw new Error(`command « ${clash} » sudah dipakai plugin lain`)
  db.addPlugin(name, code, author)
  pluginList.push(resolved)
  return resolved
}

const PREFIX_SYMBOLS = /^[._#!/~*>,]+/

function parseCommand(text, prefix) {
  const body = String(text || '').trim()
  if (!body) return null
  if (prefix && body.startsWith(prefix)) {
    const rest = body.slice(prefix.length).trim()
    if (!rest) return null
    const [command, ...args] = rest.split(/\s+/)
    return { command: command.toLowerCase(), args, text: rest.slice(command.length).trim(), prefix }
  }
  if (!prefix) {
    const first = body.split(/\s+/)[0]
    const stripped = first.replace(PREFIX_SYMBOLS, '')
    if (!stripped) return null
    return { command: stripped.toLowerCase(), args: body.split(/\s+/).slice(1), text: body.slice(first.length).trim(), prefix: '' }
  }
  return null
}

export async function processMessage(sock, msg) {
  if (!msg.message) return
  const jid = msg.key?.remoteJid || ''
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return
  const m = await serialize(sock, msg)
  if (!m.id) return
  if (m.content.protocolMessage || m.content.reactionMessage) return

  const ts = Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000)
  try {
    db.saveMessage(m.id, m.chat, m.sender, m.text.slice(0, 500), m.type, ts, JSON.stringify(JSON.parse(JSON.stringify(msg.message))))
  } catch {}

  db.upsertChat(m.chat, m.isGroup ? m.groupName : m.pushName, m.isGroup)
  if (m.isGroup) db.upsertGroup(m.chat, m.groupName)
  db.upsertUser(m.sender, m.pushName)

  const group = m.isGroup ? (db.getGroup(m.chat) || {}) : null
  if (group?.antilink && !m.isAdmin && !m.isOwner && /(chat\.whatsapp\.com|https?:\/\/|wa\.me\/)/i.test(m.text)) {
    await m.react('🗑️')
    if (m.isBotAdmin) {
      await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})
      await sock.groupParticipantsUpdate(m.chat, [m.senderLid || m.sender], 'remove').catch(() => {})
      return m.reply(`Link terdeteksi! Pesan dihapus dan @${func.extractDigits(m.senderPhone || m.sender)} dikick 🚀`, { mentions: [m.sender] })
    }
    return m.reply('Link terdeteksi! Tapi gua belum jadi admin, gak bisa kick 😔')
  }

  const prefix = db.getSetting('prefix', settings.prefix)
  const parsed = parseCommand(m.text, prefix)
  if (!parsed) return
  const plugin = findPlugin(parsed.command)
  if (!plugin) return

  const mode = db.getSetting('mode', settings.mode)
  if (mode === 'self' && !m.isOwner) return
  if (m.user?.banned) return m.reply('Kamu lagi dibanned owner 🚫')

  if (plugin.owner && !m.isOwner) return m.reply('Fitur ini khusus owner bot 🚫')
  if (plugin.group && !m.isGroup) return m.reply('Fitur ini hanya bisa dipakai di dalam grup 👥')
  if ((plugin.admin || plugin.botAdmin) && !m.isGroup) return m.reply('Fitur ini hanya bisa dipakai di dalam grup 👥')
  if (plugin.admin && !m.isAdmin && !m.isOwner) return m.reply('Fitur ini khusus admin grup! Kamu bukan admin 👀')
  if (plugin.botAdmin && !m.isBotAdmin) return m.reply('Gua belum jadi admin di grup ini, promote gua dulu ya 😅')

  await sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
  db.incUserHit(m.sender)

  const ctx = {
    sock,
    db,
    settings,
    func,
    text: parsed.text,
    args: parsed.args,
    command: parsed.command,
    prefix: parsed.prefix,
    body: m.text,
    plugins: pluginList
  }

  try {
    await plugin.run(m, ctx)
  } catch (e) {
    console.error(`[PLUGIN:${plugin.name}]`, e)
    await m.reply(`*ERROR!*
${String(e?.message || e).slice(0, 500)}`)
  }
}
