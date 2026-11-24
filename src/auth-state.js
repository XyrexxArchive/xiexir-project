// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import { initAuthCreds, BufferJSON } from '@rexxhayanasi/elaina-baileys'
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
              data[id] = JSON.parse(value, BufferJSON.reviver)
            } catch {}
          }
          return data
        },
        set: async (data) => {
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              db.saveAuthKey(`${category}:${id}`, JSON.stringify(data[category][id], BufferJSON.replacer))
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
