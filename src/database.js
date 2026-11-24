// Xiexir-Bot | Developer: xyrcodex - dapsKikir
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import settings from '../settings.js'

const sessionDir = path.join(process.cwd(), 'session')
fs.mkdirSync(sessionDir, { recursive: true })

class DB {
  constructor() {
    this.sqlite = new Database(path.join(sessionDir, 'xiexir.db'))
    this.sqlite.pragma('journal_mode = WAL')
    this.init()
  }

  init() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS owners (jid TEXT PRIMARY KEY, name TEXT DEFAULT '', added_at INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS users (jid TEXT PRIMARY KEY, name TEXT DEFAULT '', hit INTEGER DEFAULT 0, banned INTEGER DEFAULT 0, premium INTEGER DEFAULT 0, last_chat INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS chats (jid TEXT PRIMARY KEY, name TEXT DEFAULT '', is_group INTEGER DEFAULT 0, last_chat INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS groups (jid TEXT PRIMARY KEY, name TEXT DEFAULT '', antilink INTEGER DEFAULT 0, welcome INTEGER DEFAULT 0, welcome_text TEXT DEFAULT '', bye INTEGER DEFAULT 0, bye_text TEXT DEFAULT '', mute INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS plugins (name TEXT PRIMARY KEY, code TEXT, author TEXT DEFAULT '', added_at INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER DEFAULT 0, stock INTEGER DEFAULT 0, desc TEXT DEFAULT '', added_at INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, buyer TEXT, buyer_name TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at INTEGER DEFAULT 0, updated_at INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS messages (id TEXT, chat TEXT, sender TEXT DEFAULT '', text TEXT DEFAULT '', type TEXT DEFAULT '', ts INTEGER DEFAULT 0, json TEXT DEFAULT '', PRIMARY KEY (id, chat));
      CREATE TABLE IF NOT EXISTS warns (id INTEGER PRIMARY KEY AUTOINCREMENT, jid TEXT, chat TEXT, reason TEXT DEFAULT '', ts INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS auth (id TEXT PRIMARY KEY, value TEXT);
    `)
    const seeds = { prefix: settings.prefix, mode: settings.mode }
    for (const [k, v] of Object.entries(seeds)) {
      if (this.getSetting(k) === null) this.setSetting(k, v)
    }
  }

  getSetting(key, fallback = null) {
    const row = this.sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    if (!row) return fallback
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  setSetting(key, value) {
    this.sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value))
  }

  getOwners() {
    return this.sqlite.prepare('SELECT * FROM owners ORDER BY added_at').all()
  }

  isOwnerPhone(digits) {
    return !!this.sqlite.prepare('SELECT 1 FROM owners WHERE jid = ? LIMIT 1').get(String(digits))
  }

  addOwner(jid, name = 'Owner') {
    this.sqlite.prepare('INSERT INTO owners (jid, name, added_at) VALUES (?, ?, ?) ON CONFLICT (jid) DO NOTHING').run(String(jid), String(name), Date.now())
  }

  delOwner(jid) {
    return this.sqlite.prepare('DELETE FROM owners WHERE jid = ?').run(String(jid)).changes
  }

  getUser(jid) {
    return this.sqlite.prepare('SELECT * FROM users WHERE jid = ?').get(String(jid)) || null
  }

  upsertUser(jid, name = '') {
    this.sqlite.prepare('INSERT INTO users (jid, name, last_chat) VALUES (?, ?, ?) ON CONFLICT (jid) DO UPDATE SET name = excluded.name, last_chat = excluded.last_chat').run(String(jid), String(name || ''), Date.now())
  }

  incUserHit(jid) {
    this.sqlite.prepare('UPDATE users SET hit = hit + 1 WHERE jid = ?').run(String(jid))
  }

  upsertChat(jid, name = '', isGroup = false) {
    this.sqlite.prepare('INSERT INTO chats (jid, name, is_group, last_chat) VALUES (?, ?, ?, ?) ON CONFLICT (jid) DO UPDATE SET name = excluded.name, is_group = excluded.is_group, last_chat = excluded.last_chat').run(String(jid), String(name || ''), isGroup ? 1 : 0, Date.now())
  }

  allChats() {
    return this.sqlite.prepare('SELECT * FROM chats').all()
  }

  getGroup(jid) {
    return this.sqlite.prepare('SELECT * FROM groups WHERE jid = ?').get(String(jid)) || null
  }

  upsertGroup(jid, name = '') {
    this.sqlite.prepare('INSERT INTO groups (jid, name) VALUES (?, ?) ON CONFLICT (jid) DO UPDATE SET name = excluded.name').run(String(jid), String(name || ''))
  }

  setGroupField(jid, field, value) {
    const allowed = ['name', 'antilink', 'welcome', 'welcome_text', 'bye', 'bye_text', 'mute']
    if (!allowed.includes(field)) throw new Error('field grup tidak dikenal: ' + field)
    this.sqlite.prepare(`UPDATE groups SET ${field} = ? WHERE jid = ?`).run(value, String(jid))
  }

  addPlugin(name, code, author = '') {
    this.sqlite.prepare('INSERT INTO plugins (name, code, author, added_at) VALUES (?, ?, ?, ?) ON CONFLICT (name) DO UPDATE SET code = excluded.code, author = excluded.author, added_at = excluded.added_at').run(String(name), String(code), String(author), Date.now())
  }

  getPlugin(name) {
    return this.sqlite.prepare('SELECT * FROM plugins WHERE name = ?').get(String(name)) || null
  }

  listPlugins() {
    return this.sqlite.prepare('SELECT name, author, added_at FROM plugins ORDER BY added_at').all()
  }

  delPlugin(name) {
    return this.sqlite.prepare('DELETE FROM plugins WHERE name = ?').run(String(name)).changes
  }

  addProduct(name, price, stock, desc = '') {
    const info = this.sqlite.prepare('INSERT INTO products (name, price, stock, desc, added_at) VALUES (?, ?, ?, ?, ?)').run(String(name), Number(price) || 0, Number(stock) || 0, String(desc || ''), Date.now())
    return info.lastInsertRowid
  }

  getProducts() {
    return this.sqlite.prepare('SELECT * FROM products ORDER BY id').all()
  }

  getProduct(id) {
    return this.sqlite.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) || null
  }

  delProduct(id) {
    return this.sqlite.prepare('DELETE FROM products WHERE id = ?').run(Number(id)).changes
  }

  decStock(id) {
    return this.sqlite.prepare('UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0').run(Number(id)).changes
  }

  incStock(id) {
    return this.sqlite.prepare('UPDATE products SET stock = stock + 1 WHERE id = ?').run(Number(id)).changes
  }

  addOrder(productId, buyer, buyerName = '') {
    const info = this.sqlite.prepare('INSERT INTO orders (product_id, buyer, buyer_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(Number(productId), String(buyer), String(buyerName || ''), 'pending', Date.now(), Date.now())
    return info.lastInsertRowid
  }

  getOrder(id) {
    return this.sqlite.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) || null
  }

  getOrders(status = null) {
    if (status) return this.sqlite.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(String(status))
    return this.sqlite.prepare('SELECT * FROM orders ORDER BY id DESC').all()
  }

  setOrderStatus(id, status) {
    return this.sqlite.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(String(status), Date.now(), Number(id)).changes
  }

  crmStats() {
    const products = this.sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n
    const pending = this.sqlite.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'").get().n
    const done = this.sqlite.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'done'").get().n
    const revenue = this.sqlite.prepare("SELECT COALESCE(SUM(p.price), 0) AS total FROM orders o JOIN products p ON p.id = o.product_id WHERE o.status = 'done'").get().total
    return { products, pending, done, revenue }
  }

  addWarn(jid, chat, reason = '') {
    this.sqlite.prepare('INSERT INTO warns (jid, chat, reason, ts) VALUES (?, ?, ?, ?)').run(String(jid), String(chat), String(reason || ''), Date.now())
  }

  getWarns(jid, chat) {
    return this.sqlite.prepare('SELECT * FROM warns WHERE jid = ? AND chat = ? ORDER BY ts').all(String(jid), String(chat))
  }

  listWarnsByChat(chat) {
    return this.sqlite.prepare('SELECT jid, COUNT(*) AS count FROM warns WHERE chat = ? GROUP BY jid ORDER BY count DESC').all(String(chat))
  }

  clearWarns(jid, chat) {
    return this.sqlite.prepare('DELETE FROM warns WHERE jid = ? AND chat = ?').run(String(jid), String(chat)).changes
  }

  saveMessage(id, chat, sender, text, type, ts, json) {
    this.sqlite.prepare('INSERT OR REPLACE INTO messages (id, chat, sender, text, type, ts, json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(String(id), String(chat), String(sender || ''), String(text || ''), String(type || ''), Number(ts) || 0, String(json || ''))
  }

  getMessage(chat, id) {
    return this.sqlite.prepare('SELECT json FROM messages WHERE chat = ? AND id = ?').get(String(chat), String(id)) || null
  }

  countMessages() {
    return this.sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n
  }

  getAuthCreds() {
    const row = this.sqlite.prepare("SELECT value FROM auth WHERE id = 'creds'").get()
    return row?.value || null
  }

  saveAuthCreds(json) {
    this.sqlite.prepare('INSERT INTO auth (id, value) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET value = excluded.value').run('creds', String(json))
  }

  getAuthKey(id) {
    const row = this.sqlite.prepare('SELECT value FROM auth WHERE id = ?').get(String(id))
    return row?.value || null
  }

  saveAuthKey(id, value) {
    this.sqlite.prepare('INSERT INTO auth (id, value) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET value = excluded.value').run(String(id), String(value))
  }

  clearAuth() {
    this.sqlite.prepare('DELETE FROM auth').run()
  }

  close() {
    this.sqlite.close()
  }
}

export const db = new DB()
