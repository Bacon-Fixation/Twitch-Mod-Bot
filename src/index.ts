import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
import path from "path";

import { SayError } from "@kararty/dank-twitch-irc";

import { TwitchBot } from "./extendedClient";
import { commandHandler } from "./lib/misc/handler";
import {
  banUser,
  clearSavedStreamData,
  savePermittedUser,
  saveStreamData,
} from "./lib/utils/database";
import Logger from "./lib/utils/logger";
import { invisibleChars } from "./lib/utils/regex";
import {
  DBTwitchUser,
  MessageData,
  StreamData,
  TwitchViewers,
} from "./lib/utils/twitchAPI-types";
import {
  fitText,
  hasNumber,
  keepSpace,
  removeAccents,
  removeDash,
  removeUnderscore,
} from "./lib/utils/utils";
import { bot_settings } from "./server";

const { unleetify } = require("./unleet.js");
dotenvExpand.expand(
  dotenv.config({
    path: path.resolve(__dirname, "../.env"),
  })
);
import("./server");
var chatCheckTimer: NodeJS.Timer;
export var unModded: string[] = [];
export var botReady = false;

var isStreaming: boolean = false;
var clearedDB: boolean = false;

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

  if (!client.twitch.okUsers.includes(bot_settings.bot_login))
    client.twitch.okUsers.push(bot_settings.bot_login);
  if (!client.twitch.okUsers.includes(bot_settings.owner_login))
    client.twitch.okUsers.push(bot_settings.owner_login);
  if (!client.twitch.okUsers.includes(bot_settings.channel_to_moderate))
    client.twitch.okUsers.push(bot_settings.channel_to_moderate);

  client.twitch.permitted_users.map((val: DBTwitchUser) => {
    if (!client.twitch.okUsers.includes(val.login))
      client.twitch.okUsers.push(val.login);
  });
  for (let i = 0; i < chat.chatters.viewers.length; i++) {
    if (client.twitch.okUsers.includes(chat.chatters.viewers[i])) return;
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

  client.on("close", (error?: Error) => {
    botRunning = false;
    if (error) {
      Logger.error("Client closed due to error ", error);
    }

    clearInterval(chatCheckTimer);
  });
  client.on("connecting", () => {
    Logger.info("Connecting.....");
  });
  client.on("NOTICE", async (msg) => {
    setNoticeMessage(
      msg.messageID ?? msg.ircTags["msg-id"] ?? "",
      msg.messageText
    );
  });
  client.on("error", (err) => {
    Logger.error(err.message);
  });

  client.on("ready", async () => {
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

      send: async function (message: string, reply?: boolean) {
        if (reply) {
          try {
            await client.reply(
              this.channel.login,
              this.messageID,
              fitText(message, 400)
            );
            return;
          } catch {
            this.send(message);
          }
        }
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
    (msgData.args = msg.messageText
      .slice(msgData.prefix?.length)
      .trim()
      .split(/ +/)),
      (msgData.commandName = msgData.args?.shift()?.toLowerCase()),
      (msgData.user.name =
        msgData.user.name.toLowerCase() === msgData.user.login
          ? msgData.user.name
          : msgData.user.login);

    if (
      msgData.text.toLowerCase() === "!binxraid" &&
      client.twitch.stream_data.binxRaids
        .toString()
        .includes(msg.displayName.toString()) === false
    ) {
      client.twitch.stream_data.binxRaids.push(`${msg.displayName}`);
      await saveStreamData("binxRaids", client.twitch.stream_data.binxRaids);
    }

    if (msgData.bits) {
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
    // const followAge = await client.twitch.api.followAge({
    //   channel: msg.channelName,
    //   user: msg.senderUsername,
    // });
    // const difference = Date.now() - followAge;
    if (msgData.user.perms.mod) {
      if (!client.twitch.modded_users.includes(msgData.user.login))
        client.twitch.modded_users.push(msgData.user.login);
    }
    if (msgData.user.perms.vip) {
      if (!client.twitch.vip_users.includes(msgData.user.login))
        client.twitch.vip_users.push(msgData.user.login);
    }
    if (msgData.user.perms.mod || msgData.user.perms.vip) {
      if (!client.twitch.okUsers.includes(msgData.user.login))
        client.twitch.okUsers.push(msgData.user.login);
    }
    // console.log(
    //   await client.twitch.api.getBannedUsers({
    //     access_token: client.twitch.auth.api.access_token,
    //     broadcaster_id: msgData.channel.id,
    //   })
    // );
    commandHandler(client, msgData);
    // Follow Bot Ad Removal

    if (
      msgData.user.perms.broadcaster ||
      msgData.user.perms.mod ||
      msgData.user.perms.vip ||
      msgData.user.perms.owner
    )
      return;

    if (msgData.text) {
      const filteredText = keepSpace(msg.messageText).toString().toLowerCase();

      if (
        filteredText.includes("follower") &&
        filteredText.includes("viewer")
      ) {
        try {
          await isFollowBot(client, msgData);
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
          await isFollowBot(client, msgData);
        } catch (err) {
          Logger.error(err);
        }
    }
    const susChatters: string[] = [];

    if (client.twitch.okUsers.includes(msgData.user.login)) return;
    const badWords = client.twitch.wordBank.blocked;
    let username = removeAccents(msgData.user.login);

    badWords.forEach(async (searchTerm) => {
      if (!searchTerm) return;
      if (/(_)/gi.test(username)) username = removeUnderscore(username);
      if (/(-)/gi.test(username)) username = removeDash(username);

      const nameIterations = (await unleetify(username)) as string[];
      // Basic Compare - see if the username iteration matches the search term directly
      if (nameIterations.includes(searchTerm)) {
        Logger.warn(
          `*********\nBad Name: ${msgData.user.name}\nTrigger: ${searchTerm} \n`
        );
        return susChatters.push(msgData.user.name);
      }
      if (new RegExp(searchTerm, "gi").test(username)) {
        Logger.warn(
          `*********\nBad Name: ${msgData.user.name} \nTrigger: ${searchTerm}`
        );
        return susChatters.push(msgData.user.name);
      }
      // Advanced Compare - see if a section of the username iterations match the search term
      if (hasNumber(username)) {
        for (let i = 0; i < nameIterations.length; ++i) {
          if (new RegExp(searchTerm, "gi").test(nameIterations[i])) {
            Logger.warn(
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
          return;
        } else {
          await savePermittedUser(user.login, user);
          return;
        }
      });
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
    // check mod status on message or state change
    if (msg.displayName.toLowerCase() == bot_settings.bot_login.toLowerCase()) {
      if (!connected.includes(msg.channelName)) connected.push(msg.channelName);
      if (!msg.badges.hasModerator && !msg.badges.hasBroadcaster) {
        if (!unModded.includes(msg.channelName)) unModded.push(msg.channelName);
      }

      if (connected.length == tmiConnect.length && !botReady) {
        botReady = true;
        if (!botRunning) return;
        const VIPList = await client
          .getVips(bot_settings.channel_to_moderate.toLowerCase())
          .catch((err) => {
            Logger.error(err);
            return [];
          });
        client.twitch.vip_users = [...VIPList];
        const ModList = await client
          .getMods(bot_settings.channel_to_moderate.toLowerCase())
          .catch((err) => {
            Logger.error(err);
            return [];
          });
        client.twitch.modded_users = [...ModList];
        client.twitch.okUsers = [...ModList];
        VIPList.forEach((user) => {
          if (!client.twitch.okUsers.includes(user))
            client.twitch.okUsers.push(user);
        });
        await checkChat(client);
        chatCheckTimer = setInterval(() => {
          if (!botRunning) return clearInterval(chatCheckTimer);
          checkChat(client);
        }, 60 * 1000);
      }
    }
  });
  client.on("JOIN", async ({ channelName }) => {
    Logger.info(`Connected to: ${channelName}'s channel`);
  });
  client.on("PART", async ({ channelName }) => {
    Logger.info(`Disconnected from: ${channelName}'s channel`);
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
  client.on("WHISPER", (msg) => {
    console.log(msg.badges.length);
    client.whisper(msg.senderUsername, "hello world");
  });
  // Connect
  await client.connect();
  await client.joinAll(tmiConnect);
  async function isFollowBot(client: TwitchBot, msg: MessageData) {
    if (
      msg.user.perms.broadcaster ||
      msg.user.perms.mod ||
      msg.user.perms.vip ||
      msg.user.perms.owner ||
      msg.user.badges.length > 0
    )
      return;
    const timeStart = Date.now();
    Logger.info("Follow bot message an action: " + msg.isAction);
    Logger.info(
      `Follow Bot Triggered:(${msg.channel.login}) ${msg.user.name} | "${msg.text}"`
    );
    // Times-out Bots that are not subbed, mod, or broadcaster when trigger is detected
    if (
      (await client.twitch.api.isFollowedAPI({
        userID: msg.user.id,
        channelID: msg.channel.id,
        access_token: client.twitch.auth.api.access_token,
      })) == false
    ) {
      const reactionTime = `${Date.now() - timeStart}`;
      Logger.info(
        `Not Followed Bot Triggered:(${msg.channel.login}) ${msg.user.name} | "${msg.text} - ${reactionTime}ms"`
      );
      await client.deleteMsg(msg.channel.login, msg.messageID);
      await msg.send(
        `‼️ Follow Bot - ${msg.user.name} message removed. - ${reactionTime}ms`
      );

      // await client.timeout(
      //   msg.channelName,
      //   msg.senderUsername,
      //   60,
      //   "Possible Follow Bot."
      // );
    }
    return;
  }
};

function msToTime(query: number) {
  let duration = Date.now() - query;
  let //milliseconds = Math.floor((duration % 1000) / 100),
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
