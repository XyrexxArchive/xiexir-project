// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import { jidNormalizedUser } from '@rexxhayanasi/elaina-baileys'

const normJid = (jid) => {
  try {
    return jidNormalizedUser(String(jid || '')) || String(jid || '')
  } catch {
    return String(jid || '')
  }
}

const extractDigits = (value) => String(value || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const msToTime = (ms) => {
  if (!ms || ms < 0) ms = 0
  const s = Math.floor((ms / 1000) % 60)
  const mnt = Math.floor((ms / (1000 * 60)) % 60)
  const h = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const d = Math.floor(ms / (1000 * 60 * 60 * 24))
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (mnt) parts.push(`${mnt} menit`)
  parts.push(`${s} detik`)
  return parts.join(' ')
}

const formatDate = (date = new Date()) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(date)

const parseMention = (text = '') => [...String(text).matchAll(/@(\d{8,15})/g)].map((mt) => mt[1] + '@s.whatsapp.net')

const stripFences = (text = '') => String(text || '').replace(/^\s*```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()

const resolveTargets = (m, args = []) => {
  const targets = []
  for (const j of m.mentioned || []) targets.push(j)
  if (m.quoted) targets.push(m.quoted.lid || m.quoted.sender)
  for (const a of args) {
    const d = extractDigits(a)
    if (d.length >= 8) targets.push(d + '@s.whatsapp.net')
  }
  return [...new Set(targets.filter(Boolean))]
}

export default { normJid, extractDigits, sleep, pickRandom, msToTime, formatDate, parseMention, stripFences, resolveTargets }
