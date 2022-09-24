const { MessageEmbed } = require("discord.js");
const { TrackUtils } = require("erela.js");
const levels = {
  none: 0.0,
  low: 0.2,
  medium: 0.3,
  high: 0.35,
};
module.exports = {
  name: "bassboost",
  description: "Enables bass boosting audio effect",
  usage: "<none|low|medium|high>",
  permissions: {
    channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
    member: [],
  },
  aliases: ["bb", "bass"],
  /**
   *
   * @param {import("../structures/DiscordMusicBot")} client
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {*} param3
   */
  run: async (client, message, args, { GuildDB }) => {
    let player = await client.Manager.get(message.guild.id);
    if (!player)
      return client.sendTime(
        message.channel,
        "❌ | **沒有歌曲正在播放...**"
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

    if (!args[0])
      return client.sendTime(
        message.channel,
        "**請提供低音增強等級 \n可用等級:** `none`, `low`, `medium`, `high`"
      );

    let level = "none";
    if (args.length && args[0].toLowerCase() in levels)
      level = args[0].toLowerCase();

    player.setEQ(
      ...new Array(3)
        .fill(null)
        .map((_, i) => ({ band: i, gain: levels[level] }))
    );

    return client.sendTime(
      message.channel,
      `✅ | **將低音增強等級設定為** \`${level}\``
    );
  },
  SlashCommand: {
    options: [
      {
        name: "level",
        description: `請提供低音增強等級。可用等級: low, medium, high, 或 none`,
        value: "[level]",
        type: 3,
        required: true,
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
      const levels = {
        none: 0.0,
        low: 0.2,
        medium: 0.3,
        high: 0.35,
      };

      let player = await client.Manager.get(interaction.guild_id);
      const guild = client.guilds.cache.get(interaction.guild_id);
      const member = guild.members.cache.get(interaction.member.user.id);
      const voiceChannel = member.voice.channel;
      if (!player)
        return client.sendTime(
          interaction,
          "❌ | **沒有歌曲正在播放...**"
        );
      if (!member.voice.channel)
        return client.sendTime(
          interaction,
          "❌ | **你必須要在語音頻道才能使用此指令.**"
        );
      if (
        guild.me.voice.channel &&
        !guild.me.voice.channel.equals(voiceChannel)
      )
        return client.sendTime(
          interaction,
          "❌ | **必須要在相同的語音頻道才能使用此指令!**"
        );
      if (!args)
        return client.sendTime(
          interaction,
          "**請提供低音增強等級。 \n可用等級:** `none`, `low`, `medium`, `high`"
        );

      let level = "none";
      if (args.length && args[0].value in levels) level = args[0].value;

      player.setEQ(
        ...new Array(3)
          .fill(null)
          .map((_, i) => ({ band: i, gain: levels[level] }))
      );

      return client.sendTime(
        interaction,
        `✅ | **將低音增強等級設定為** \`${level}\``
      );
    },
  },
};
