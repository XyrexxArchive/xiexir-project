# Xiexir-Bot

WhatsApp Multi-Device Bot dengan sistem plugin ESM, dibangun di atas [@rexxhayanasi/elaina-baileys](https://github.com/rexxzyid/elaina-baileys) dan database [better-sqlite3](https://github.com/WiseLibs/better-sqlite3).

**Developer:** xyrcodex - dapsKikir

## Fitur

- Login **Pairing Code** (tanpa QR scan) + auto reconnect
- Browser kustom: `Browsers.ubuntu("Chrome")`
- Sistem **plugin ESM** + plugin database (tambah/hapus plugin langsung dari chat)
- **Semua data masuk database** better-sqlite3: settings, owners, users, chats, groups, plugins, products, orders, messages, warns, sampai auth/session WhatsApp
- Penanganan **LID-aware** (participant/participantAlt/lid) biar fitur admin & owner gak salah deteksi
- Footer otomatis `*_Powered By Xiexir-Bot_*`

## Kebutuhan

- Node.js >= 20
- NPM

## Instalasi

```bash
git clone https://github.com/XyrexxArchive/xiexir-project
cd xiexir-project
npm install
npm start
```

## Pairing

1. Jalankan `npm start`
2. Masukkan nomor WA bot format internasional (contoh `6281234567890`, bukan `08xxx`)
3. Muncul pairing code di console
4. Buka WhatsApp > Perangkat Tertaut > Tautkan dengan Nomor Telepon > masukkan kode

Session tersimpan di database (`session/xiexir.db`), jadi restart tanpa pairing ulang. Kalau sesi logout, auth otomatis dibersihkan dan bot minta pairing baru.

## Konfigurasi

Edit `settings.js`:

| Key | Deskripsi |
|---|---|
| `botName` | Nama bot |
| `ownerName` | Nama owner |
| `owners` | Nomor owner awal (format internasional, bisa kosong) |
| `prefix` | Prefix default |
| `mode` | Mode default (`public` / `self`) |
| `footer` | Footer pesan bot |
| `packname` / `author` | Watermark sticker |

Bisa juga diatur runtime pakai perintah `.setprefix` dan `.setmode` (tersimpan di database).

## Struktur Folder

```
├── index.js              entry point
├── settings.js           konfigurasi bot
├── src/
│   ├── connection.js     koneksi WhatsApp, pairing code, auto reconnect
│   ├── handler.js        plugin loader + command handler
│   ├── serialize.js      message serializer (LID-aware)
│   ├── database.js       better-sqlite3 (semua data)
│   ├── auth-state.js     auth state adapter (session di database)
│   ├── func.js           helper
│   └── logger.js         pino logger
├── plugins/              semua plugin (general, group, owner)
├── assets/               banner & file pendukung
└── session/              database sqlite (di-gitignore)
```

## Format Plugin

Buat file `.js` di folder `plugins/`:

```js
export default {
  name: 'halo',
  command: ['halo', 'hi'],
  tags: 'main',
  desc: 'Balas halo',
  group: false,
  admin: false,
  botAdmin: false,
  owner: false,
  async run(m, ctx) {
    await m.reply('Halo juga!')
  }
}
```

`m` berisi: `chat, sender, senderPhone, senderLid, text, args via ctx, quoted, mentioned, isGroup, isOwner, isAdmin, isBotAdmin, metadata, participants, reply(), react(), download()`.

`ctx` berisi: `sock, db, settings, func, text, args, command, prefix, body, plugins`.

Plugin juga bisa ditambah langsung dari chat pakai `.addplugin <nama>` + reply kode (tersimpan di database, auto aktif tanpa restart).

## Perintah

### Main

- `.menu` — daftar perintah
- `.ping` — kecepatan & status bot
- `.owner` — kontak owner
- `.sc` — source code
- `.s` — sticker dari foto

### Group

- `.kick` / `.-` — kick member
- `.add` / `.+` — add member via nomor
- `.promote` / `.demote` — kelola admin grup
- `.tagall` — tag semua member
- `.hidetag` — tag tanpa daftar nama
- `.open` / `.close` — buka/tutup grup
- `.setname` / `.setdesc` — nama & deskripsi grup
- `.linkgc` — ambil link grup
- `.revoke` — reset link grup
- `.groupinfo` — info grup
- `.welcome on/off` + `.setwelcome <teks>` — pesan selamat datang
- `.bye on/off` + `.setbye <teks>` — pesan perpisahan
- `.antilink on/off` — auto kick pengirim link
- `.warn` / `.resetwarn` / `.listwarn` — sistem warning (3x = kick)

### Owner

- `.addplugin <nama>` + reply kode — tambah plugin (database)
- `.delplugin <nama>` — hapus plugin
- `.listplugin` — daftar plugin
- `.getplugin <nama>` — kode plugin utuh (file, gak terpotong)
- `.eval <kode>` — eksekusi JavaScript
- `.exec <cmd>` — perintah terminal
- `.crm` — CRM Store: kelola produk, order, capture pesan
- `.setprefix <simbol|none>` — ganti prefix
- `.setmode <self|public>` — ganti mode
- `.addowner` / `.delowner` — kelola owner
- `.bc <teks>` — broadcast
- `.join <link>` — join grup via invite

## Catatan Teknis

- **Admin check LID-aware**: WhatsApp sekarang pakai `@lid` identifier. Serializer mencocokkan `key.participant` (LID), `key.participantAlt` (nomor), `participants[].id`, dan `participants[].jid` sekaligus, jadi fitur admin tetap jalan di grup yang pakai LID.
- **Owner check**: nomor owner dicocokkan dari `senderPhone` (bukan cuma LID), plus `fromMe` dan nomor bot sendiri selalu dianggap owner.
- **Plugin database**: kode dieval lewat file temporer di `tmp/`, jadi plugin dari database boleh import package (sharp, dll). Folder `tmp/` otomatis dibersihkan.
- **antilink & warn**: admin grup dan owner kebal auto-kick.
- `LOG_LEVEL=info npm start` untuk log baileys yang lebih verbose.

## Credits

- Library: [@rexxhayanasi/elaina-baileys](https://github.com/rexxzyid/elaina-baileys)
- Database: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Developer: **xyrcodex - dapsKikir**

*_Powered By Xiexir-Bot_*
