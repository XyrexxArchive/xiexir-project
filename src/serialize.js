// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import { jidNormalizedUser, downloadMediaMessage } from '@rexxhayanasi/elaina-baileys'
import { db } from './database.js'
import settings from '../settings.js'
import func from './func.js'

const WRAPPERS = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'documentWithCaptionMessage', 'editedMessage', 'deviceSentMessage', 'futureProofMessage']

function unwrapMessage(message) {
  let cur = message || {}
  for (let i = 0; i < 10; i++) {
    const wrapper = WRAPPERS.find((k) => cur[k])
    if (!wrapper) break
    cur = cur[wrapper]?.message || {}
  }
  return cur
}

function msgType(message) {
  if (!message) return ''
  const keys = Object.keys(message)
  return keys.find((k) => k === 'conversation' || k.endsWith('Message')) || ''
}

function getText(message) {
  if (!message) return ''
  if (typeof message.conversation === 'string') return message.conversation
  const content = message[msgType(message)] || {}
  return String(content.text || content.caption || content.selectedDisplayText || content.selectedId || content.title || '')
}

function quotedFrom(content) {
  const type = msgType(content)
  const ctx = content[type]?.contextInfo || {}
  const qm = ctx.quotedMessage
  if (!qm || typeof qm !== 'object') return null
  const inner = unwrapMessage(qm)
  const qkey = {
    remoteJid: ctx.remoteJid || '',
    fromMe: false,
    id: ctx.stanzaId || '',
    participant: ctx.participant || '',
    participantAlt: ctx.participantPn || ctx.participantAlt || ''
  }
  return {
    key: qkey,
    content: inner,
    type: msgType(inner),
    text: getText(inner),
    sender: func.normJid(ctx.participantPn || ctx.participantAlt || ctx.participant || ''),
    lid: func.normJid(ctx.participant || ''),
    download: () => downloadMediaMessage({ key: qkey, message: inner }, 'buffer', {}, null)
  }
}

export async function serialize(sock, msg) {
  const key = msg.key || { remoteJid: '', id: '' }
  const chat = func.normJid(key.remoteJid)
  const isGroup = chat.endsWith('@g.us')
  const fromMe = !!key.fromMe
  const content = unwrapMessage(msg.message)
  const type = msgType(content)
  const typeContent = content[type] || {}
  const quoted = quotedFrom(content)
  const mentioned = typeContent.contextInfo?.mentionedJid || []

  const senderRaw = isGroup ? (key.participantAlt || key.participantPn || key.participant || chat) : (fromMe ? (sock.user?.id || chat) : chat)
  const sender = func.normJid(senderRaw)
  const senderPhone = func.normJid(key.participantAlt || key.participantPn || senderRaw)
  const senderLid = isGroup ? func.normJid(key.participant || '') : func.normJid(sock.user?.lid || '')

  const m = {
    raw: msg,
    key,
    id: key.id,
    chat,
    isGroup,
    fromMe,
    sender,
    senderPhone,
    senderLid,
    pushName: msg.pushName || 'Anonim',
    content,
    type,
    text: getText(content),
    quoted,
    mentioned,
    user: db.getUser(sender) || {},
    botNumber: func.normJid(sock.user?.id || ''),
    botLid: func.normJid(sock.user?.lid || ''),
    reply: async (text, extra = {}) => await sock.sendMessage(chat, { text: String(text), ...(extra || {}) }, { quoted: msg }),
    react: async (emoji) => await sock.sendMessage(chat, { react: { text: emoji, key } }).catch(() => {}),
    download: () => downloadMediaMessage(msg, 'buffer', {}, sock)
  }

  if (isGroup) {
    let metadata = null
    try {
      metadata = await sock.groupMetadata(chat)
    } catch {}
    m.metadata = metadata
    m.participants = metadata?.participants || []
    m.groupName = metadata?.subject || ''
    m.groupDesc = metadata?.desc || ''
    m.groupOwner = metadata?.owner || ''

    const senderIds = [...new Set([sender, senderPhone, senderLid, key.participant].filter(Boolean).map((j) => func.normJid(j)))]
    const senderDigits = new Set(senderIds.map((j) => func.extractDigits(j)).filter((d) => d.length > 7))
    const matchSender = (jid) => {
      if (!jid) return false
      const nj = func.normJid(jid)
      return senderIds.includes(nj) || senderDigits.has(func.extractDigits(nj))
    }
    const isSenderAdmin = m.participants.some((p) => matchSender(p.id) || matchSender(p.jid) || matchSender(p.phoneNumber))
    const botIds = [sock.user?.id, sock.user?.lid].filter(Boolean).map((j) => func.normJid(j))
    const botDigits = new Set(botIds.map((j) => func.extractDigits(j)).filter((d) => d.length > 7))
    const matchBot = (jid) => {
      if (!jid) return false
      const nj = func.normJid(jid)
      return botIds.includes(nj) || botDigits.has(func.extractDigits(nj))
    }
    m.isBotAdmin = m.participants.some((p) => matchBot(p.id) || matchBot(p.jid) || matchBot(p.phoneNumber))
    m.admins = m.participants.filter((p) => p.admin).map((p) => p.id)
    m.isAdmin = isSenderAdmin || (fromMe && m.isBotAdmin)
  } else {
    m.metadata = null
    m.participants = []
    m.admins = []
    m.groupName = ''
    m.groupDesc = ''
    m.groupOwner = ''
    m.isAdmin = false
    m.isBotAdmin = false
  }

  const selfIds = new Set([m.botNumber, m.botLid, senderLid].filter(Boolean))
  const phoneDigits = [...new Set([func.extractDigits(senderPhone), func.extractDigits(sender), func.extractDigits(m.botNumber)].filter((d) => d.length > 7))]
  const ownerDigits = new Set((settings.owners || []).map((o) => func.extractDigits(o)).filter((d) => d.length > 7))
  m.isOwner = fromMe || selfIds.has(func.normJid(sender)) || phoneDigits.some((d) => db.isOwnerPhone(d)) || phoneDigits.some((d) => ownerDigits.has(d))

  return m
}
