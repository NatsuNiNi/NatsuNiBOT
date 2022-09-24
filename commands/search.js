const { MessageEmbed, Message } = require("discord.js");
const { TrackUtils } = require("erela.js");
const _ = require("lodash");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
  name: "search",
  description: "Shows a result of songs based on the search query",
  usage: "[song]",
  permissions: {
    channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
    member: [],
  },
  aliases: ["se"],
  /**
   *
   * @param {import("../structures/DiscordMusicBot")} client
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   * @param {*} param3
   */
  run: async (client, message, args, { GuildDB }) => {
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

    let SearchString = args.join(" ");
    if (!SearchString)
      return client.sendTime(
        message.channel,
        `**Usage - **\`${GuildDB.prefix}search [query]\``
      );
    let CheckNode = client.Manager.nodes.get(client.botconfig.Lavalink.id);
    if (!CheckNode || !CheckNode.connected) {
      return client.sendTime(
        message.channel,
        "❌ | **Lavalink 節點未連接**"
      );
    }
    const player = client.Manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
      selfDeafen: client.botconfig.ServerDeafen,
      volume: client.botconfig.DefaultVolume,
    });

    if (player.state != "CONNECTED") await player.connect();

    let Searched = await player.search(SearchString, message.author);
    if (Searched.loadType == "NO_MATCHES")
      return client.sendTime(
        message.channel,
        "無相符的結果: " + SearchString
      );
    else {
      Searched.tracks = Searched.tracks.map((s, i) => {
        s.index = i;
        return s;
      });
      let songs = _.chunk(Searched.tracks, 10);
      let Pages = songs.map((songz) => {
        let MappedSongs = songz.map(
          (s) =>
            `\`${s.index + 1}.\` [${s.title}](${
              s.uri
            }) \nDuration: \`${prettyMilliseconds(s.duration, {
              colonNotation: true,
            })}\``
        );

        let em = new MessageEmbed()
          .setAuthor(
            "搜尋結果: " + SearchString,
            client.botconfig.IconURL
          )
          .setColor(client.botconfig.EmbedColor)
          .setDescription(MappedSongs.join("\n\n"));
        return em;
      });

      if (!Pages.length || Pages.length === 1)
        return message.channel.send(Pages[0]);
      else client.Pagination(message, Pages);

      let w = (a) => new Promise((r) => setInterval(r, a));
      await w(500); //waits 500ms cuz needed to wait for the above song search embed to send ._.
      let msg = await message.channel.send(
        "**輸入欲播放歌曲的號碼! 將在 `30 秒` 後逾時.**"
      );

      let er = false;
      let SongID = await message.channel
        .awaitMessages((msg) => message.author.id === msg.author.id, {
          max: 1,
          errors: ["time"],
          time: 30000,
        })
        .catch(() => {
          er = true;
          msg.edit(
            "**你回應太久了。如果要搜尋，請再次執行該指令!**"
          );
        });
      if (er) return;
      /**@type {Message} */
      let SongIDmsg = SongID.first();

      if (!parseInt(SongIDmsg.content))
        return client.sendTime(
          message.channel,
          "Please send correct song ID number"
        );
      let Song = Searched.tracks[parseInt(SongIDmsg.content) - 1];
      if (!Song)
        return client.sendTime(
          message.channel,
          "No song found for the given ID"
        );
      player.queue.add(Song);
      if (!player.playing && !player.paused && !player.queue.size)
        player.play();
      let SongAddedEmbed = new MessageEmbed();
      SongAddedEmbed.setAuthor(`Added to queue`, client.botconfig.IconURL);
      SongAddedEmbed.setThumbnail(Song.displayThumbnail());
      SongAddedEmbed.setColor(client.botconfig.EmbedColor);
      SongAddedEmbed.setDescription(`[${Song.title}](${Song.uri})`);
      SongAddedEmbed.addField("Author", `${Song.author}`, true);
      SongAddedEmbed.addField(
        "Duration",
        `\`${prettyMilliseconds(player.queue.current.duration, {
          colonNotation: true,
        })}\``,
        true
      );
      if (player.queue.totalSize > 1)
        SongAddedEmbed.addField(
          "Position in queue",
          `${player.queue.size - 0}`,
          true
        );
      message.channel.send(SongAddedEmbed);
    }
  },

  SlashCommand: {
    options: [
      {
        name: "song",
        value: "song",
        type: 3,
        required: true,
        description: "Enter the song name or url you want to search",
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
      const guild = client.guilds.cache.get(interaction.guild_id);
      const member = guild.members.cache.get(interaction.member.user.id);
      const voiceChannel = member.voice.channel;
      let awaitchannel = client.channels.cache.get(interaction.channel_id); /// thanks Reyansh for this idea ;-;
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
      let CheckNode = client.Manager.nodes.get(client.botconfig.Lavalink.id);
      if (!CheckNode || !CheckNode.connected) {
        return client.sendTime(
          interaction,
          "❌ | **Lavalink 節點未連接**"
        );
      }
      let player = client.Manager.create({
        guild: interaction.guild_id,
        voiceChannel: voiceChannel.id,
        textChannel: interaction.channel_id,
        selfDeafen: client.botconfig.ServerDeafen,
        volume: client.botconfig.DefaultVolume,
      });
      if (player.state != "CONNECTED") await player.connect();
      let search = interaction.data.options[0].value;
      let res;

      if (search.match(client.Lavasfy.spotifyPattern)) {
        await client.Lavasfy.requestToken();
        let node = client.Lavasfy.nodes.get(client.botconfig.Lavalink.id);
        let Searched = await node.load(search);

        switch (Searched.loadType) {
          case "LOAD_FAILED":
            if (!player.queue.current) player.destroy();
            return client.sendError(
              interaction,
              `❌ | **在搜尋時出現了錯誤**`
            );

          case "NO_MATCHES":
            if (!player.queue.current) player.destroy();
            return client.sendTime(
              interaction,
              "❌ | **無相符的結果**"
            );
          case "TRACK_LOADED":
            player.queue.add(TrackUtils.build(Searched.tracks[0], member.user));
            if (!player.playing && !player.paused && !player.queue.length)
              player.play();
            return client.sendTime(
              interaction,
              `**加入至序列:** \`[${Searched.tracks[0].info.title}](${Searched.tracks[0].info.uri}}\`.`
            );

          case "PLAYLIST_LOADED":
            let songs = [];
            for (let i = 0; i < Searched.tracks.length; i++)
              songs.push(TrackUtils.build(Searched.tracks[i], member.user));
            player.queue.add(songs);

            if (
              !player.playing &&
              !player.paused &&
              player.queue.totalSize === Searched.tracks.length
            )
              player.play();
            return client.sendTime(
              interaction,
              `**播放清單已加入序列**: \n**${Searched.playlist.name}** \n排隊中: **${Searched.playlistInfo.length} 首歌**`
            );
        }
      } else {
        try {
          res = await player.search(search, member.user);
          if (res.loadType === "LOAD_FAILED") {
            if (!player.queue.current) player.destroy();
            throw new Error(res.exception.message);
          }
        } catch (err) {
          return client.sendTime(
            interaction,
            `❌ | **在搜尋時出現了錯誤:** ${err.message}`
          );
        }
        switch (res.loadType) {
          case "NO_MATCHES":
            if (!player.queue.current) player.destroy();
            return client.sendTime(
              interaction,
              "❌ | **無相符的結果**"
            );
          case "TRACK_LOADED":
            player.queue.add(res.tracks[0]);
            if (!player.playing && !player.paused && !player.queue.length)
              player.play();
            return client.sendTime(
              interaction,
              `**加入至序列:** \`[${res.tracks[0].title}](${res.tracks[0].uri})\`.`
            );
          case "PLAYLIST_LOADED":
            player.queue.add(res.tracks);

            if (
              !player.playing &&
              !player.paused &&
              player.queue.size === res.tracks.length
            )
              player.play();
            return client.sendTime(
              interaction,
              `**播放清單已加入至序列**: \n**${res.playlist.name}** \n排隊中: **${res.playlistInfo.length} 首歌**`
            );
          case "SEARCH_RESULT":
            let max = 10,
              collected,
              filter = (m) =>
                m.author.id === interaction.member.user.id &&
                /^(\d+|end)$/i.test(m.content);
            if (res.tracks.length < max) max = res.tracks.length;

            const results = res.tracks
              .slice(0, max)
              .map(
                (track, index) =>
                  `\`${++index}\` - [${track.title}](${
                    track.uri
                  }) \n\t\`${prettyMilliseconds(track.duration, {
                    colonNotation: true,
                  })}\`\n`
              )
              .join("\n");

            const resultss = new MessageEmbed()
              .setDescription(
                `${results}\n\n\t**輸入欲播放歌曲的號碼!**\n`
              )
              .setColor(client.botconfig.EmbedColor)
              .setAuthor(
                `搜尋結果: ${search}`,
                client.botconfig.IconURL
              );
            interaction.send(resultss);
            try {
              collected = await awaitchannel.awaitMessages(filter, {
                max: 1,
                time: 30e3,
                errors: ["time"],
              });
            } catch (e) {
              if (!player.queue.current) player.destroy();
              return awaitchannel.send(
                "❌ | **你沒有提供選項**"
              );
            }

            const first = collected.first().content;

            if (first.toLowerCase() === "cancel") {
              if (!player.queue.current) player.destroy();
              return awaitchannel.send("取消搜尋.");
            }

            const index = Number(first) - 1;
            if (index < 0 || index > max - 1)
              return awaitchannel.send(
                `你提供的號碼大於或小於搜索總數. 使用方法 - \`(1-${max})\``
              );
            const track = res.tracks[index];
            player.queue.add(track);

            if (!player.playing && !player.paused && !player.queue.length) {
              player.play();
            } else {
              let SongAddedEmbed = new MessageEmbed();
              SongAddedEmbed.setAuthor(
                `加入至序列`,
                client.botconfig.IconURL
              );
              SongAddedEmbed.setThumbnail(track.displayThumbnail());
              SongAddedEmbed.setColor(client.botconfig.EmbedColor);
              SongAddedEmbed.setDescription(`[${track.title}](${track.uri})`);
              SongAddedEmbed.addField("作者", track.author, true);
              SongAddedEmbed.addField(
                "Duration",
                `\`${prettyMilliseconds(track.duration, {
                  colonNotation: true,
                })}\``,
                true
              );
              if (player.queue.totalSize > 1)
                SongAddedEmbed.addField(
                  "序列中的位置",
                  `${player.queue.size - 0}`,
                  true
                );
              awaitchannel.send(SongAddedEmbed);
            }
        }
      }
    },
  },
};
