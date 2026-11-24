// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'crm',
  command: ['crm'],
  tags: 'owner',
  desc: 'CRM Store: kelola produk, order, capture pesan (semua data masuk database)',
  async run(m, ctx) {
    const { args, db, settings, func } = ctx
    const sub = (args[0] || '').toLowerCase()
    const rest = args.slice(1)
    const footer = `\n\n${settings.footer}`

    if (!sub) {
      let help = `*「 CRM STORE 」*\n\n`
      help += `- .crm add <nama>|<harga>|<stok>|<deskripsi>\n`
      help += `- .crm list\n`
      help += `- .crm del <id>\n`
      help += `- .crm buy <id>\n`
      help += `- .crm order\n`
      help += `- .crm done <id>\n`
      help += `- .crm cancel <id>\n`
      help += `- .crm stats\n`
      help += `- reply pesan + .crm capture (simpan pesan ke database)`
      return m.reply(help + footer)
    }

    if (!['buy', 'capture'].includes(sub) && !m.isOwner) return m.reply('Sub command ini khusus owner!')

    if (sub === 'add') {
      const [nama, harga, stok, ...deskArr] = rest.join(' ').split('|').map((x) => x.trim())
      if (!nama || !harga) return m.reply('Format: .crm add <nama>|<harga>|<stok>|<deskripsi>')
      const id = db.addProduct(nama, Number(harga.replace(/[^0-9]/g, '')) || 0, Number(stok) || 0, deskArr.join('|'))
      return m.reply(`Produk ditambahkan!\nID : ${id}\nNama : ${nama}\nHarga : ${harga}\nStok : ${stok || 0}${footer}`)
    }

    if (sub === 'list') {
      const items = db.getProducts()
      if (!items.length) return m.reply('Belum ada produk di CRM store.' + footer)
      let text = `*「 DAFTAR PRODUK 」*\n\n`
      for (const it of items) text += `#${it.id} — *${it.name}*\n  💵 Rp${it.price}\n  📦 Stok : ${it.stock}\n  📝 ${it.desc || '-'}\n\n`
      return m.reply(text + footer)
    }

    if (sub === 'del') {
      const id = Number(rest[0])
      if (!id) return m.reply('Format: .crm del <id>')
      const ok = db.delProduct(id)
      return m.reply(ok ? `Produk #${id} dihapus!` : `Produk #${id} gak ketemu!`)
    }

    if (sub === 'buy') {
      const id = Number(rest[0])
      const produk = db.getProduct(id)
      if (!produk) return m.reply(`Produk #${id} gak ada!`)
      if (produk.stock <= 0) return m.reply(`Stok *${produk.name}* habis!`)
      const dec = db.decStock(id)
      if (!dec) return m.reply('Gagal, stok udah habis!')
      const orderId = db.addOrder(id, m.sender, m.pushName)
      return m.reply(`*ORDER BERHASIL!*\n\nOrder : #${orderId}\nProduk : ${produk.name}\nHarga : Rp${produk.price}\nSisa stok : ${produk.stock - 1}\n\nTunggu owner proses ya!${footer}`)
    }

    if (sub === 'order') {
      const orders = db.getOrders('pending')
      if (!orders.length) return m.reply('Tidak ada order pending.' + footer)
      let text = `*「 ORDER PENDING 」*\n\n`
      for (const o of orders) {
        const p = db.getProduct(o.product_id)
        text += `#${o.id} — ${p?.name || '?'}\n  👤 ${o.buyer_name || ''} (${func.extractDigits(o.buyer)})\n  ⏰ ${new Date(o.created_at).toLocaleString('id-ID')}\n\n`
      }
      return m.reply(text + footer)
    }

    if (sub === 'done' || sub === 'cancel') {
      const id = Number(rest[0])
      const order = db.getOrder(id)
      if (!order) return m.reply(`Order #${id} gak ketemu!`)
      if (sub === 'cancel') db.incStock(order.product_id)
      db.setOrderStatus(id, sub)
      return m.reply(`Order #${id} di-*${sub}*${sub === 'cancel' ? ', stok dikembalikan' : ''}!${footer}`)
    }

    if (sub === 'stats') {
      const s = db.crmStats()
      return m.reply(`*「 CRM STATS 」*\n\n📦 Produk : ${s.products}\n⏳ Pending : ${s.pending}\n✅ Selesai : ${s.done}\n💰 Revenue : Rp${s.revenue}${footer}`)
    }

    if (sub === 'capture') {
      if (!m.quoted) return m.reply('Reply pesan yang mau di-capture!')
      const payload = { key: m.quoted.key, message: m.quoted.content, capturedAt: Date.now(), from: m.quoted.sender || m.quoted.lid }
      const fileBody = `const capture = ${JSON.stringify(payload, null, 2)};\n\nawait sock.relayMessage(m.chat, capture.message, {})\n`
      const id8 = String(m.quoted.key.id || Date.now().toString(36)).slice(-8)
      await ctx.sock.sendMessage(m.chat, { document: Buffer.from(fileBody, 'utf8'), fileName: `crm_${id8}.js`, mimetype: 'application/javascript', caption: `Capture pesan berhasil!\nJalankan file ini di plugin buat nge-relay ulang pesannya utuh.${footer}` }, { quoted: m.raw })
      return
    }

    return m.reply('Sub command gak dikenal! Ketik .crm')
  }
}
