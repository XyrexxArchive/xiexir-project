// Xiexir-Bot Plugin | xyrcodex - dapsKikir
export default {
  name: 'linkrevoke',
  command: ['linkgc', 'grouplink', 'revoke', 'resetlink'],
  tags: 'group',
  desc: 'Ambil link grup / reset link invite',
  group: true,
  admin: true,
  botAdmin: true,
  async run(m, ctx) {
    const { sock, settings } = ctx
    const isRevoke = ['revoke', 'resetlink'].includes(ctx.command)
    if (isRevoke) await sock.groupRevokeInvite(m.chat)
    const code = await sock.groupInviteCode(m.chat)
    await m.reply(`Link grup:\nhttps://chat.whatsapp.com/${code}${isRevoke ? '\n\n(link lama udah direset)' : ''}\n\n${settings.footer}`)
  }
}
