import {
  removeDash,
  removeUnderscore,
  fitText,
  removeAccents,
  hasNumber,
  keepSpace,
} from "./conversions";
const { unleetify } = require("./unleet.js");
import path from "path";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
dotenvExpand.expand(
  dotenv.config({
    path: path.resolve(__dirname, "../.env"),
  })
);
import {
  DBTwitchUser,
  MessageData,
  StreamData,
  TwitchViewers,
} from "./twitchAPI-types";
import { TwitchBot } from "./extendedClient";

import("./server");
import {
  unBanUser,
  banUser,
  modifyWordBank,
  saveStreamData,
  clearSavedStreamData,
  getWordBank,
} from "./DBHandler";
import Logger from "./logger";
import { bot_settings } from "./server";
import { invisibleChars } from "./regex";
import {
  PrivmsgMessage,
  SayError,
  UsernoticeMessage,
} from "@kararty/dank-twitch-irc";

var chatCheckTimer: NodeJS.Timer;
export var unModded: string[] = [];
export var botReady = false;
const regex = /su(1|i)c(1|i)d(3|e)/gi;
var isStreaming: boolean = false;
var clearedDB: boolean = false;
// const invisibleChars =
//   /[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu;
export var viewerList: TwitchViewers = {
  viewers: [],
  moderators: [],
  vips: [],
  broadcaster: [],
  global_mods: [],
  staff: [],
  admins: [],
};

const checkChat = async (client: TwitchBot) => {
  // console.log(await unleetify("this is a normal string"));
  if (!client) return;

  const channel = bot_settings.channel_to_moderate.toLowerCase();
  try {
    const stream = await client.twitch.api.getStream({
      login: bot_settings.channel_to_moderate,
      token: client.twitch.auth.api.access_token,
    });
    client.twitch.stream = stream;
    if (stream) {
      isStreaming = true;
      clearedDB = false;
    } else {
      if (!clearedDB) {
        client.twitch.stream_data = await clearSavedStreamData();
        clearedDB = true;
      }
      isStreaming = false;
    }
  } catch (error) {
    isStreaming = false;
  }

  let chat = await client.twitch.api.getChatters({
    channel: channel,
  });
  viewerList = chat.chatters;
  const susChatters: string[] = [];
  const okUsers: string[] = [
    bot_settings.bot_login,
    bot_settings.channel_to_moderate,
    bot_settings.owner_login,
  ];
  client.twitch.permitted_users.map((val: DBTwitchUser) => {
    okUsers.push(val.login);
  });
  for (let i = 0; i < chat.chatters.viewers.length; i++) {
    if (okUsers.includes(chat.chatters.viewers[i])) return;
    const badWords = client.twitch.wordBank.blocked;
    let username = removeAccents(chat.chatters.viewers[i]);

    badWords.forEach(async (searchTerm) => {
      if (!searchTerm) return;
      if (/(_)/gi.test(username)) username = removeUnderscore(username);
      if (/(-)/gi.test(username)) username = removeDash(username);

      const nameIterations = (await unleetify(username)) as string[];
      // Basic Compare - see if the username iteration matches the search term directly
      if (nameIterations.includes(searchTerm)) {
        Logger.info(
          `*********\nBad Name: ${chat.chatters.viewers[i]}\nTrigger: ${searchTerm} \n`
        );
        return susChatters.push(username);
      }
      // console.log(
      //   viewerList.viewers[i],
      //   searchTerm,
      //   new RegExp(searchTerm, "gi").test(username)
      // );
      if (new RegExp(searchTerm, "gi").test(username)) {
        Logger.info(
          `*********\nBad Name: ${chat.chatters.viewers[i]} \nTrigger: ${searchTerm}`
        );
        return susChatters.push(username);
      }
      // Advanced Compare - see if a section of the username iterations match the search term
      if (hasNumber(username)) {
        for (i = 0; i < nameIterations.length; ++i) {
          if (new RegExp(searchTerm, "gi").test(nameIterations[i])) {
            Logger.info(
              `*********\nBad Name: ${username}\nTrigger: ${searchTerm}\nUnleet: ${nameIterations[i]}`
            );
            susChatters.push(username);
            break;
          }
        }
      }
    });
  }
  // get suspicious chatters profile data
  if (susChatters.length == 0 || !susChatters) return;
  const users = await client.twitch.api.getUsers({
    logins: susChatters,
    token: client.twitch.auth.api.access_token,
  });

  users.forEach(async (user) => {
    const accountAge = Date.now() - new Date(user.created_at).valueOf();
    if (accountAge < 24 * 60 * 60 * 1000) {
      if (!unModded.includes(channel))
        await banUser(
          client,
          user.login,
          channel,
          "Mod-Bot Inappropriate Username"
        );
    }
  });

  return susChatters;
};
export var botRunning: boolean = false;
export var noticeMessages = {
  id: "",
  message: "",
};
export const startBot = async (client: TwitchBot) => {
  clearInterval(chatCheckTimer);

  client.on("close", (error) => {
    botRunning = false;
    if (error != null) {
      Logger.error("Client closed due to error", error);
    }

    clearInterval(chatCheckTimer);
  });
  client.on("connecting", () => {
    Logger.info("Connecting.....");
  });
  client.on("NOTICE", async (msg) => {
    // Logger.debug(
    //   `Notice Message ${msg.channelName}: ${
    //     msg.messageID ?? msg.ircTags["msg-id"] ?? ""
    //   }\n Message: ${msg.messageText}`
    // );
    setNoticeMessage(
      msg.messageID ?? msg.ircTags["msg-id"] ?? "",
      msg.messageText
    );
  });
  client.on("", (msg) => {
    console.log(msg.ircTags);
  });
  client.on("error", (err) => {
    Logger.error(err.message);
  });

  client.on("ready", async () => {
    // Logger.debug("API: " + JSON.stringify(client.twitch.auth.api));
    // Logger.debug("TMI: " + JSON.stringify(client.twitch.auth.tmi));
    botRunning = true;
    Logger.info(
      `Successfully Connected Twitch Chat Services`,
      new Date().toLocaleString()
    );
  });

  client.on("PRIVMSG", async (msg) => {
    let msgData: MessageData = {
      user: {
        id: msg.senderUserID,
        name: msg.displayName,
        login: msg.senderUsername,
        colorRaw: msg.colorRaw,
        badges: msg.badges,
        badgesRaw: msg.badgesRaw,
        color: msg.color,
        perms: {
          mod: msg.isMod,
          broadcaster: msg.badges.hasBroadcaster,
          vip: msg.badges.hasVIP,
          owner:
            msg.senderUsername.toLowerCase() ==
            bot_settings.owner_login.toLowerCase()
              ? true
              : false,
        },
      },
      channel: {
        id: msg.channelID,
        login: msg.channelName,
      },
      messageID: msg.messageID,
      isAction: msg.isAction,
      raw: msg.rawSource,
      text: msg.messageText.replace(invisibleChars, ""),
      timestamp: msg.serverTimestampRaw,
      emotes: msg.emotes,
      tags: msg.ircTags,
      bits: msg.bits,
      prefix: "^",

      send: async function (message: string, messageId?: string) {
        try {
          await client.say(this.channel.login, fitText(message, 400));
        } catch {
          try {
            await client.me(this.channel.login, fitText(message, 400));
          } catch (error) {
            Logger.error(
              `Error while sending reply message in ${this.channel.login}: ${error}`
            );
          }
        }
      },
    };

    if (msgData.isAction) return;
    (msgData.args = msg.messageText
      .slice(msgData.prefix?.length)
      .trim()
      .split(/ +/)),
      (msgData.commandName = msgData.args?.shift()?.toLowerCase()),
      (msgData.user.name =
        msgData.user.name.toLowerCase() === msgData.user.login
          ? msgData.user.name
          : msgData.user.login);

    if (msgData.user.login !== bot_settings.bot_login) {
      if (
        msgData.text.indexOf(msgData.prefix) == 0 &&
        msgData.commandName &&
        msgData.args.length
      ) {
        if (unModded.includes(msgData.channel.login))
          return await msgData.send(`❌ I'm not a mod in this channel`);

        const user = msgData.args[0];

        if (msgData.commandName == "ban") {
          let found = false;
          client.twitch.banned_users.map((person) => {
            if (person.login == msgData.args![0].toLowerCase()) {
              found = true;
            }
          });
          if (!found) {
            await banUser(
              client,
              user,
              msgData.channel.login,
              msgData.args.join(" ").replace(user, "").trim()
            )
              .then(
                async () =>
                  await msgData.send(`✅ "${msgData.args![0]}" has been banned`)
              )
              .catch(async (err) => {
                if (err.includes("moderator"))
                  return await msgData.send(
                    `❌ ${msgData.args![0]} is a moderator`
                  );
                return Logger.error(err);
              });

            return;
          } else {
            return await msgData.send(
              `❌ "${msgData.args[0]}" has already been Banned.`
            );
          }
        }

        if (msgData.commandName == "unban") {
          let found = false;
          client.twitch.banned_users.map((person) => {
            if (person.login == msgData.args![0].toLowerCase()) {
              found = true;
            }
          });
          if (found) {
            await unBanUser(client, user, msgData.channel.login)
              .then(
                async () =>
                  await msgData.send(
                    `✅ "${msgData.args![0]}" has been unbanned.`
                  )
              )
              .catch(async (err) => {
                if (err.includes("moderator"))
                  return await msgData.send(
                    `❌ ${msgData.args![0]} is a moderator`
                  );
                return Logger.error(err);
              });

            return;
          } else {
            return await msgData.send(
              `❌ "${msgData.args[0]}" has not been Banned.`
            );
          }
        }

        if (msgData.commandName == "ban-term") {
          if (!client.twitch.wordBank.blocked.includes(msgData.args[0])) {
            client.twitch.wordBank.blocked.push(msgData.args[0]);
            await modifyWordBank(msgData.args[0].trim(), false, true);
            return msgData.send(
              `✅ "${msgData.args[0]}" was added to the Word Bank.`
            );
          } else {
            return await msgData.send(
              `❌ "${msgData.args[0]}" already in the Word Bank.`
            );
          }
        }

        if (msgData.commandName == "unban-term") {
          console.log(
            client.twitch.wordBank.blocked.includes(msgData.args[0]),
            msgData.args
          );
          if (client.twitch.wordBank.blocked.includes(msgData.args[0])) {
            await modifyWordBank(msgData.args[0].trim(), true, true);
            client.twitch.wordBank.blocked = [];
            await getWordBank(client);
            return msgData.send(
              `✅ "${msgData.args[0]}" was removed to the Word Bank.`
            );
          } else {
            return await msgData.send(
              `❌ "${msgData.args[0]}" is not in the Word Bank.`
            );
          }
        }
      }
    }
    if (msgData.commandName == "banned-users") {
      return console.log(
        await client.twitch.api
          .getBannedUsers({
            access_token: client.twitch.auth.api.access_token,
            broadcaster_id: msgData.channel.id,
          })
          .catch((err) => console.log(err))
      );
    }
    if (
      msg.messageText === "!binxraid" &&
      client.twitch.stream_data.binxRaids
        .toString()
        .includes(msg.displayName.toString()) === false
    ) {
      client.twitch.stream_data.binxRaids.push(`${msg.displayName}`);
      await saveStreamData("binxRaids", client.twitch.stream_data.binxRaids);
    }
    if (msg.messageText === "!test") {
      console.log(client.twitch.auth);
      console.log(
        await client.twitch.api
          .getBannedUsers({
            access_token: client.twitch.auth.api.access_token,
            broadcaster_id: msg.channelID,
          })
          .catch((err) => {
            console.log(err);
          })
      );
      return;
    }

    if (msg.senderUsername == bot_settings.bot_login) return;
    if (msg.bits) {
      if (
        client.twitch.stream_data.cheerers
          .toString()
          .includes(msg.displayName.toString()) === false
      ) {
        client.twitch.stream_data.cheerers.push(`${msg.displayName}`);
        await saveStreamData("cheerers", client.twitch.stream_data.cheerers);
      }
    }

    // test username is bad
    const followAge = await client.twitch.api.followAge({
      channel: msg.channelName,
      user: msg.senderUsername,
    });
    const difference = Date.now() - followAge;
    const okUsers: string[] = [];
    client.twitch.permitted_users.map((Value) => {
      okUsers.push(Value.login);
    });

    const susChatters: string[] = [];
    if (
      msgData.user.perms.broadcaster ||
      msgData.user.perms.mod ||
      msgData.user.perms.vip
    )
      return;
    if (okUsers.includes(msgData.user.login)) return;
    const badWords = client.twitch.wordBank.blocked;
    let username = removeAccents(msgData.user.login);

    badWords.forEach(async (searchTerm) => {
      if (!searchTerm) return;
      if (/(_)/gi.test(username)) username = removeUnderscore(username);
      if (/(-)/gi.test(username)) username = removeDash(username);

      const nameIterations = (await unleetify(username)) as string[];
      // Basic Compare - see if the username iteration matches the search term directly
      if (nameIterations.includes(searchTerm)) {
        Logger.info(
          `*********\nBad Name: ${msgData.user.name}\nTrigger: ${searchTerm} \n`
        );
        return susChatters.push(msgData.user.name);
      }
      if (new RegExp(searchTerm, "gi").test(username)) {
        Logger.info(
          `*********\nBad Name: ${msgData.user.name} \nTrigger: ${searchTerm}`
        );
        return susChatters.push(msgData.user.name);
      }
      // Advanced Compare - see if a section of the username iterations match the search term
      if (hasNumber(username)) {
        for (let i = 0; i < nameIterations.length; ++i) {
          if (new RegExp(searchTerm, "gi").test(nameIterations[i])) {
            Logger.info(
              `*********\nBad Name: ${msgData.user.name}\nTrigger: ${searchTerm}\nUnleet: ${nameIterations[i]}`
            );
            susChatters.push(msgData.user.name);
            break;
          }
        }
      }
      if (susChatters.length == 0 || !susChatters) return;
      const users = await client.twitch.api.getUsers({
        logins: susChatters,
        token: client.twitch.auth.api.access_token,
      });

      users.forEach(async (user) => {
        const accountAge = Date.now() - new Date(user.created_at).valueOf();
        if (accountAge < 24 * 60 * 60 * 1000) {
          if (!unModded.includes(msgData.channel.login))
            await banUser(
              client,
              user.login,
              msgData.channel.login,
              "Mod-Bot Inappropriate Username"
            );
        }
      });
      // if (regex.test(msg.senderUsername)) {
      //   Logger.info(msg.senderUsername + " triggered username check");
      // ignore user if they have a badge

      // ignore user if they are followed to the channel
      //   const followAge = await client.twitch.api.followAge({
      //     channel: msg.channelName,
      //     user: msg.senderUsername,
      //   });
      //   const difference = Date.now() - followAge;

      //   console.log(msToTime(followAge));
      //   if (
      //     await client.twitch.api.isFollowed({
      //       channel: msg.channelName,
      //       user: msg.senderUsername,
      //     })
      //   )
      //     return;
      // }

      if (msg.messageText) {
        const filteredText = keepSpace(msg.messageText)
          .toString()
          .toLowerCase();

        if (
          filteredText.includes("follower") &&
          filteredText.includes("viewer")
        ) {
          try {
            await isFollowBot(msg);
          } catch (err) {
            Logger.error(err);
          }
        }
        if (
          filteredText.includes("Get") &&
          filteredText.includes("prime-subs") &&
          filteredText.includes("viewer")
        )
          try {
            await isFollowBot(msg);
          } catch (err) {
            Logger.error(err);
          }
      }
    });
  });
  const connected: string[] = [];
  const tmiConnect: string[] = [];
  tmiConnect.push(bot_settings.owner_login.toLowerCase());
  if (!tmiConnect.includes(bot_settings.bot_login.toLowerCase()))
    tmiConnect.push(bot_settings.bot_login.toLowerCase());
  if (!tmiConnect.includes(bot_settings.channel_to_moderate.toLowerCase()))
    tmiConnect.push(bot_settings.channel_to_moderate.toLowerCase());
  unModded = [];

  client.on("USERSTATE", async (msg) => {
    // console.log(msg);
    // check mod status on message or state change
    if (msg.displayName.toLowerCase() == bot_settings.bot_login.toLowerCase()) {
      if (!connected.includes(msg.channelName)) connected.push(msg.channelName);
      if (!msg.badges.hasModerator && !msg.badges.hasBroadcaster) {
        if (!unModded.includes(msg.channelName)) unModded.push(msg.channelName);
      }

      if (connected.length == tmiConnect.length) {
        botReady = true;
        if (!botRunning) return;
        await checkChat(client);
        chatCheckTimer = setInterval(() => {
          if (!botRunning) return clearInterval(chatCheckTimer);
          checkChat(client);
        }, 60 * 1000);
      }
    }
  });
  client.on("JOIN", async ({ channelName }) => {
    Logger.info(`connected to: ${channelName}'s channel`);
  });
  client.on("PART", async ({ channelName }) => {
    Logger.info(`disconnected from: ${channelName}'s channel`);
  });

  client.on("USERNOTICE", async (msg) => {
    if (msg.channelName.toLowerCase() != bot_settings.channel_to_moderate)
      return;

    let liveData = client.twitch.stream_data;

    if (
      msg.messageTypeID === "resub" &&
      liveData.reSubs.toString().includes(msg.displayName.toString()) === false
    ) {
      liveData.reSubs.push(`${msg.displayName}`);
      await saveStreamData("reSubs", liveData.reSubs);
    }
    if (
      msg.messageTypeID === "sub" &&
      liveData.subs.toString().includes(msg.displayName.toString()) === false
    ) {
      liveData.subs.push(`${msg.displayName}`);
      await saveStreamData("subs", liveData.subs);
    }

    if (msg.messageTypeID === "subgift") {
      if (liveData.gifters[msg.displayName] == null) {
        liveData.gifters[msg.displayName] = 1;
      } else {
        liveData.gifters[msg.displayName] += 1;
      }
      await saveStreamData("gifters", liveData.gifters);
    }

    if (msg.messageTypeID === "anonsubgift") {
      if (liveData.gifters["Anonymous"] == null) {
        liveData.gifters["Anonymous"] = 1;
      } else {
        liveData.gifters["Anonymous"] += 1;
      }
      await saveStreamData("gifters", liveData.gifters);
    }

    if (
      msg.messageTypeID === "raid" &&
      liveData.raiders.toString().includes(msg.displayName.toString()) === false
    ) {
      liveData.raiders.push(`${msg.displayName}`);
      await saveStreamData("raiders", liveData.raiders);
    }

    const streamData: StreamData = {
      raiders: liveData.raiders ?? [],
      subs: liveData.subs ?? [],
      reSubs: liveData.reSubs ?? [],
      gifters: liveData.gifters ?? {},
      welcomeList: liveData.welcomeList ?? [],
      cheerers: liveData.cheerers ?? [],
      binxRaids: liveData.binxRaids ?? [],
    };
    client.twitch.stream_data = streamData;
  });

  client.on("rawCommand", (cmd) => {
    Logger.info(cmd);
  });

  // Connect
  await client.connect();
  await client.joinAll(tmiConnect);
  async function isFollowBot(msg: PrivmsgMessage) {
    const timeStart = Date.now();
    Logger.info("Follow bot message an action: " + msg.isAction);
    Logger.info(
      `Follow Bot Triggered:(${msg.channelName}) ${msg.senderUsername} | "${msg.messageText}"`
    );
    // Times-out Bots that are not subbed, mod, or broadcaster when trigger is detected
    if (
      (await client.twitch.api.isFollowed({
        user: msg.senderUserID,
        channel: msg.channelID,
      })) == false
    ) {
      const reactionTime = `${Date.now() - timeStart}`;
      Logger.info(
        `Not Followed Bot Triggered:(${msg.channelName}) ${msg.senderUsername} | "${msg.messageText} - ${reactionTime}ms"`
      );
      await client
        .me(
          msg.channelName,
          `‼️ Follow Bot - ${msg.senderUsername} message removed. - ${reactionTime}ms`
        )
        .catch(async (error) => {
          if (error instanceof SayError) {
            await client.say(
              msg.channelName,
              `‼️ Follow Bot - ${msg.senderUsername} message removed. - ${reactionTime}ms`
            );
          }
        });
      await client.deleteMsg(msg.channelName, msg.messageID);

      await client.timeout(
        msg.channelName,
        msg.senderUsername,
        60,
        "Possible Follow Bot."
      );
    }
    return;
  }
};

function msToTime(query: number) {
  let duration = Date.now() - query;
  let milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const time = `${hours > 0 ? hours + "h " : ""}${
    minutes > 0 ? minutes + "m " : ""
  }${seconds}s`;

  return time;
}

export const getNoticeMessage = (notice = noticeMessages) => {
  return notice;
};

export const setNoticeMessage = (id: string, message: string) => {
  noticeMessages = { id: id, message: message };
};
