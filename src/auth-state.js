// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import { initAuthCreds, BufferJSON, proto } from '@rexxhayanasi/elaina-baileys'
import { db } from './database.js'

export function useSQLiteAuthState() {
  const raw = db.getAuthCreds()
  let creds
  if (raw) {
    try {
      creds = JSON.parse(raw, BufferJSON.reviver)
    } catch {
      creds = initAuthCreds()
    }
  } else {
    creds = initAuthCreds()
  }
  if (!raw) db.saveAuthCreds(JSON.stringify(creds, BufferJSON.replacer))

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {}
          for (const id of ids) {
            const value = db.getAuthKey(`${type}:${id}`)
            if (!value) continue
            try {
              let parsed = JSON.parse(value, BufferJSON.reviver)
              if (type === 'app-state-sync-key' && parsed) parsed = proto.Message.AppStateSyncKeyData.fromObject(parsed)
              data[id] = parsed
            } catch {}
          }
          return data
        },
        set: async (data) => {
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id]
              if (!value) {
                db.deleteAuthKey(`${category}:${id}`)
                continue
              }
              db.saveAuthKey(`${category}:${id}`, JSON.stringify(value, BufferJSON.replacer))
            }
          }
        }
      }
    },
    saveCreds: () => {
      db.saveAuthCreds(JSON.stringify(creds, BufferJSON.replacer))
    },
    clear: () => {
      db.clearAuth()
    }
  }
}
