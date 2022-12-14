import { setNoticeMessage } from "./index";
import { TwitchBot } from "./extendedClient";
import { BotConfig, DBToken, StreamData, TwitchUser } from "./twitchAPI-types";
import { QuickDB } from "quick.db";

import Logger from "./logger";
import { getNoticeMessage, noticeMessages } from ".";
// import { client } from "./server";
// import { bot_settings } from "./server";

const db = new QuickDB();
const banned_users = db.table("banned_users");
const permitted_users = db.table("permitted_users");
const botInfo = db.table("botInfo");
const userDB = db.table("users");
const config = db.table("config");
const wordBank = db.table("wordBank");
const stream = db.table("stream_data");

export const saveConfig = async (data: BotConfig) => {
  await config.set(data.bot_login, data);
};

export const getConfig = async () => {
  return await config.all();
};

export const banUser = async (
  client: TwitchBot,
  username: string,
  channel: string,
  reason?: string
) => {
  return new Promise(async (resolve, reject) => {
    if (!client) return reject("Bot Client is not ready");

    if (client.wantedChannels.has(username.toLowerCase())) {
      Logger.warn("Can't ban " + username + " Lol");
      return reject("Error: Can't ban " + username + " Lol");
    }

    const user = await client.twitch.api.getUser({
      login: username.replace("@", ""),
      token: client.twitch?.auth.api.access_token,
    });
    if (!user) {
      Logger.error("Unable to find: " + user);
      return reject("Unable to find: " + user);
    }

    let cmd;

    if (!reason) {
      cmd = `/ban ${username.replace("@", "")}`;
    } else {
      cmd = `/ban ${username.replace("@", "")} ${reason}`;
    }
    await client.privmsg(channel, cmd);

    setTimeout(async () => {
      if (getNoticeMessage().id.endsWith("success")) {
        client.twitch.banned_users = [];
        await saveBannedUser(user.login, user);
        await getAllBanned(client);

        client.twitch.permitted_users = [];
        await deletePermittedUser(user.login);
        await getAllPermitted(client);
        setNoticeMessage("", "");
        resolve(`Banned: ${username}`);
      } else if (
        getNoticeMessage().message.endsWith(
          "is already banned in this channel."
        )
      ) {
        client.twitch.banned_users = [];
        await saveBannedUser(user.login, user);
        await getAllBanned(client);

        client.twitch.permitted_users = [];
        await deletePermittedUser(user.login);
        await getAllPermitted(client);
        setNoticeMessage("", "");
        resolve(`Banned: ${username}`);
      } else {
        const errMsg = getNoticeMessage();
        Logger.error("Failed to ban " + username, errMsg.message);
        setNoticeMessage("", "");
        return reject(errMsg.message);
      }
    }, 250);
  });
};

export const unBanUser = async (
  client: TwitchBot,
  username: string,
  channel: string
) => {
  return new Promise(async (resolve, reject) => {
    if (!client) return reject("Bot Client is not ready");
    if (client.wantedChannels.has(username.toLowerCase())) {
      Logger.warn("Can't Unban " + username + " Lol");
      return reject(
        "Error: Can't Unban " + username + " they are not bannable LOL"
      );
    }

    const user = await client.twitch.api.getUser({
      login: username.replace("@", ""),
      token: client.twitch?.auth.api.access_token,
    });
    if (!user) {
      Logger.error("Unable to find: " + username);
      // await client.say(channel, "Unable to find: " + user);
      return reject("Unable to find: " + username);
    }

    await client.privmsg(channel, `/unban ${username.replace("@", "")}`);

    setTimeout(async () => {
      if (getNoticeMessage().id.endsWith("success")) {
        client.twitch.banned_users = [];
        await deleteBannedUser(user.login);
        await getAllBanned(client);

        client.twitch.permitted_users = [];
        await savePermittedUser(user.login, user);
        await getAllPermitted(client);
        setNoticeMessage("", "");
        resolve(`UnBanned: ${username}`);
      } else {
        const errMsg = getNoticeMessage();
        Logger.error("Failed to unBan " + username, errMsg.message);
        setNoticeMessage("", "");
        return reject(errMsg.message);
      }
    }, 250);
  });
};

export const saveBannedUser = async (username: string, data: any) => {
  return await banned_users.set(username, data);
};
export const deleteBannedUser = async (username: string) => {
  return await banned_users.delete(username);
};

export const savePermittedUser = async (username: string, data: any) => {
  return await permitted_users.set(username, data);
};
export const deletePermittedUser = async (username: string) => {
  return await permitted_users.delete(username);
};

export const getAllBanned = async (client: TwitchBot) => {
  const users = await banned_users
    .all()
    .then((result) => {
      result.map((data) => {
        client.twitch.banned_users.push(data.value);
      });
    })
    .catch((err) => {
      Logger.error(err);
    });
  return users;
};

export const getAllPermitted = async (client: TwitchBot) => {
  const users = await permitted_users
    .all()
    .then((result) => {
      result.map((data) => {
        client.twitch.permitted_users.push(data.value);
      });
    })
    .catch((err) => {
      Logger.error(err);
    });
  return users;
};

export const saveAccessToken = async (config: DBToken) => {
  await botInfo.set("config", config);
};

export const getSavedAccessToken = async () => {
  return await botInfo.all();
};

export const saveUserData = async (id: string, user: TwitchUser) => {
  await userDB.set(id, user);
};

export const getUserData = async () => {
  return await userDB.all();
};
export const modifyWordBank = async (
  str: string,
  // allow?: boolean,
  remove?: boolean,
  block?: boolean
) => {
  try {
    if (block && remove) {
      // await wordBank.push("allowed", str);

      await wordBank.pull("blocked", str);
      return;
    }
    if (block) {
      // await wordBank.pull("allowed", str);
      await wordBank.push("blocked", str);
      return;
    }
  } catch (error) {
    return Logger.error("Failed to Modify the Word Bank - ", error);
  }
};

export const getWordBank = async (client: TwitchBot) => {
  return await wordBank
    .all()
    .then((result) => {
      result.map((data) => {
        client.twitch.wordBank.blocked = data.value;
      });
    })
    .catch((err) => {
      Logger.error(err);
    });
};

export const saveStreamData = async (eventName: string, streamData: any) => {
  switch (eventName) {
    case "raiders":
      {
        await stream.set("raiders", streamData);
      }
      break;
    case "subs":
      {
        await stream.set("subs", streamData);
      }
      break;
    case "reSubs":
      {
        await stream.set("reSubs", streamData);
      }
      break;
    case "gifters":
      {
        await stream.set("gifters", streamData);
      }
      break;
    case "welcomeList":
      {
        await stream.set("welcomeList", streamData);
      }
      break;
    case "cheerers":
      {
        await stream.set("cheerers", streamData);
      }
      break;
    case "binxRaids":
      {
        await stream.set("binxRaid", streamData);
      }
      break;
    default:
      break;
  }
};

export const clearSavedStreamData = async () => {
  await stream.deleteAll();
  return {
    subs: [],
    reSubs: [],
    raiders: [],
    binxRaids: [],
    gifters: {},
    welcomeList: [],
    cheerers: [],
  } as StreamData;
};
export const getSavedStreamData = async () => {
  let response: StreamData = {
    raiders: [],
    subs: [],
    reSubs: [],
    gifters: {},
    welcomeList: [],
    cheerers: [],
    binxRaids: [],
  };

  const db = await stream.all();
  db.forEach((data) => {
    switch (data.id) {
      case "raiders":
        {
          response.raiders = data.value;
        }
        break;
      case "subs":
        {
          response.subs = data.value;
        }
        break;
      case "reSubs":
        {
          response.reSubs = data.value;
        }
        break;
      case "gifters":
        {
          response.gifters = data.value;
        }
        break;
      case "welcomeList":
        {
          response.welcomeList = data.value;
        }
        break;
      case "cheerers":
        {
          response.cheerers = data.value;
        }
        break;
      case "binxRaids":
        {
          response.binxRaids = data.value;
        }
        break;
      default:
        break;
    }
  });
  return response;
};
