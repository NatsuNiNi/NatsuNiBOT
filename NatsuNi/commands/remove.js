const { MessageEmbed } = require("discord.js");
const { TrackUtils } = require("erela.js");

module.exports = {
  name: "remove",
  description: `Remove a song from the queue`,
  usage: "[number]",
  permissions: {
    channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
    member: [],
  },
  aliases: ["rm"],

  /**
   *
   * @param {import("../structures/DiscordMusicBot")} client
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {*} param3
   */
  run: async (client, message, args, { GuildDB }) => {
    let player = await client.Manager.players.get(message.guild.id);
    const song = player.queue.slice(args[0] - 1, 1);
    if (!player)
      return client.sendTime(
        message.channel,
        "❌ | **沒有音樂正在播放...**"
      );
    if (!message.member.voice.channel)
      return client.sendTime(
        message.channel,
        "❌ | **你必須要在語音頻道才能使用此指令!**"
      );
    if (
      message.guild.me.voice.channel &&
      message.member.voice.channel.id !== message.guild.me.voice.channel.id
    )
      return client.sendTime(
        message.channel,
        "❌ | **你必須要在相同的語音頻道才能使用此指令!**"
      );

    if (!player.queue || !player.queue.length || player.queue.length === 0)
      return message.channel.send("序列中沒有要刪除的內容");
    let rm = new MessageEmbed()
      .setDescription(
        `✅ **|** 從序列中移除曲目 **\`${Number(args[0])}\`** !`
      )
      .setColor("GREEN");
    if (isNaN(args[0]))
      rm.setDescription(
        `**使用方法 - **${client.botconfig.prefix}\`remove [track]\``
      );
    if (args[0] > player.queue.length)
      rm.setDescription(`此序列只有 ${player.queue.length} 首歌!`);
    await message.channel.send(rm);
    player.queue.remove(Number(args[0]) - 1);
  },

  SlashCommand: {
    options: [
      {
        name: "track",
        value: "[track]",
        type: 4,
        required: true,
        description: "Remove a song from the queue",
      },
    ],
    /**
     *
     * @param {import("../structures/DiscordMusicBot")} client
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     * @param {*} param3
     */
    run: async (client, interaction, args, { GuildDB }) => {
      let player = await client.Manager.get(interaction.guild_id);
      const guild = client.guilds.cache.get(interaction.guild_id);
      const member = guild.members.cache.get(interaction.member.user.id);
      const song = player.queue.slice(args[0] - 1, 1);
      if (!player)
        return client.sendTime(
          interaction,
          "❌ | **沒有音樂正在播放...**"
        );
      if (!member.voice.channel)
        return client.sendTime(
          interaction,
          "❌ | **你必須要在語音頻道才能使用此指令!**"
        );
      if (
        guild.me.voice.channel &&
        !guild.me.voice.channel.equals(member.voice.channel)
      )
        return client.sendTime(
          interaction,
          "❌ | **你必須要在相同的語音頻道才能使用此指令!**"
        );

      if (!player.queue || !player.queue.length || player.queue.length === 0)
        return client.sendTime("❌ | **沒有音樂正在播放...**");
      let rm = new MessageEmbed()
        .setDescription(
          `✅ | **從序列中移除曲目** \`${Number(args[0])}\` !`
        )
        .setColor("GREEN");
      if (isNaN(args[0]))
        rm.setDescription(`**使用方法:** \`${GuildDB.prefix}remove [track]\``);
      if (args[0] > player.queue.length)
        rm.setDescription(`此序列只有 ${player.queue.length} 首歌!`);
      await interaction.send(rm);
      player.queue.remove(Number(args[0]) - 1);
    },
  },
};
