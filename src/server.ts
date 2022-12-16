import { removeFromArray } from "./lib/utils/utils";
import { TwitchBot } from "./extendedClient";
import { botRunning, startBot, unModded, viewerList } from "./index";
import {
  BotConfig,
  TwitchToken,
  TwitchUser,
} from "./lib/utils/twitchAPI-types";
import {
  banUser,
  deleteBannedUser,
  getAllBanned,
  getConfig,
  getSavedAccessToken,
  getUserData,
  modifyWordBank,
  saveAccessToken,
  saveConfig,
  saveUserData,
  unBanUser,
} from "./lib/utils/database";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
dotenvExpand.expand(
  dotenv.config({
    path: path.resolve(__dirname, "../.env.website"),
  })
);

export var client: TwitchBot | undefined;
export var bot_settings: BotConfig;
let tokenInfo = {};
getConfig().then((db) => {
  if (db.length == 0) return;
  db.map((entry) => {
    bot_settings = entry.value;
  });
});
loadAccessToken();

import bodyParser from "body-parser";

import express, { Response } from "express";

import * as crypto from "crypto";
// got is used for HTTP/API requests

import axios, { AxiosError, AxiosResponse } from "axios";
import Logger from "./lib/utils/logger";
import { humanizeMS } from "./lib/utils/utils";

// Express basics
const app = express();

const http = require("http").Server(app);
http.listen(process.env.PORT, function () {
  Logger.info("Dashboard loaded");
  Logger.info(
    `${process.env.REDIRECT_URI?.replace(
      "/token",
      ""
    ).trim()} open in a private browser tab`
  );
});

var tokens: TwitchToken = {
  access_token: "",
  refresh_token: "",
  scope: [""],
  expires_in: 0,
  token_type: "",
};
export var dryRun = true;
var botInfo: TwitchUser;
var userInfo: TwitchUser;
var user: TwitchUser | undefined;
var isValidToken: boolean = false;
var state = crypto.randomBytes(16).toString("base64");

app.set("views", path.join(__dirname, "../www/views"));
app.set("view engine", "pug");
app.locals.basedir = path.join(__dirname, "../www/views");

app.set("view options", {
  debug: false,
  compileDebug: false,
});

var session = require("express-session");
app.use(
  session({
    secret: crypto.randomBytes(4).toString("base64"),
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: false,
    },
    rolling: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../www/public")));
app.use("/static", express.static(path.join(__dirname, "../www/static")));
app.use(bodyParser.json());

app.use(function (req: any, res, next) {
  var flash = {
    error: req.session.error ? req.session.error : false,
    warning: req.session.warning ? req.session.warning : false,
    success: req.session.success ? req.session.success : false,
  };
  res.locals.flash = flash;

  if (req.session.error) {
    req.session.error = "";
  }
  if (req.session.warning) {
    req.session.warning = "";
  }
  if (req.session.success) {
    req.session.success = "";
  }

  next();
});

app.get("/", (req, res) => {
  res.render("index", {
    user,
    bot_settings,
    redirect_uri: process.env.REDIRECT_URI,
  });
});

app.get("/data", async (req: any, res) => {
  if (!isValidToken) {
    req.session.error = "Token is Invalid, acquire a new one.";
    res.redirect("token");
    return;
  }
  if (!botRunning) {
    if (isValidToken == true) {
      client = new TwitchBot(tokens.access_token);
      client.twitch.auth.tmi = tokens;
      await startBot(client);
    }
  }

  res.render("data", {
    user,
    bannedUsers: client?.twitch?.banned_users ?? [],
    viewerList,
    unModded: unModded,
    success: isValidToken,
    parent: process.env.REDIRECT_URI?.replace("/token", "")
      .replace(`:${process.env.PORT}`, "")
      .replace("http://", "")
      .replace("https://", ""),
    channel: bot_settings?.channel_to_moderate!,
    permittedUsers: client?.twitch?.permitted_users ?? [],
  });
  return;
});
app.get("/banned", async (req: any, res) => {
  if (!isValidToken) {
    req.session.error = "Token is invalid, acquire a new one.";
    res.redirect("token");
    return;
  }
  if (!botRunning) {
    if (isValidToken == true) {
      client = new TwitchBot(tokens.access_token);
      client.twitch.auth.tmi = tokens;
      await startBot(client);
    }
  }

  res.render("bannedList", {
    user,
    bannedUsers: client?.twitch?.banned_users ?? [],
    unModded: unModded,
    success: isValidToken,
    channel: bot_settings?.channel_to_moderate!,
  });
  return;
});

app.get("/permitted", async (req: any, res) => {
  if (!isValidToken) {
    req.session.error = "Token is invalid, acquire a new one.";
    res.redirect("token");
    return;
  }
  if (!botRunning) {
    if (isValidToken == true) {
      client = new TwitchBot(tokens.access_token);
      client.twitch.auth.tmi = tokens;
      await startBot(client);
    }
  }

  res.render("permittedList", {
    user,
    unModded: unModded,
    success: isValidToken,
    channel: bot_settings?.channel_to_moderate!,
    permittedUsers: client?.twitch?.permitted_users ?? [],
  });
  return;
});
app.post("/data", async (req: any, res, next) => {
  if (!client) {
    req.session.error = "Bot is not currently running, please sign in";
    return res.redirect("back");
  }
  const action = req.body;
  if (action.ban) {
    req.session.success = "Banned: " + action.unBan;
    await banUser(client!, action.ban, bot_settings.channel_to_moderate).catch(
      (error) => {
        Logger.error(`Failed to save user "${action.ban}" to banned list.`);
        req.session.error = error;
        req.session.success = false;
        return; // res.redirect("back");
      }
    );

    return res.redirect("back");
  } else if (action.unBan) {
    req.session.success = "unBanned: " + action.unBan;
    await unBanUser(
      client,
      action.unBan,
      bot_settings.channel_to_moderate
    ).catch(async (error: string) => {
      if (error.endsWith("is not banned from this channel.")) {
        await deleteBannedUser(action.unBan);

        await getAllBanned(client!);
        req.session.error = error + "\n removed from database";
      } else {
        Logger.error(
          `Failed to save user "${action.unBan}" to permitted list.`,
          error
        );
        req.session.error = error;
      }
      req.session.success = false;

      return; // res.redirect("back");
    });

    return res.redirect("back");
  } else if (action.removeWord) {
    const tempArray: string[] = removeFromArray(
      client.twitch.wordBank.blocked!,
      action.removeWord
    );
    await modifyWordBank(action.removeWord, true, true).catch((error) => {
      Logger.error(
        `Failed to remove "${action.removeWord}" from Word Bank.`,
        error
      );
      req.session.error = error;
      return res.redirect("back");
    });
    client.twitch.wordBank.blocked = tempArray;
    req.session.success = action.removeWord + " was removed from Word Bank.";
    return res.redirect("back");
  } else if (action.addWord) {
    if (!client.twitch.wordBank.blocked.includes(action.addWord)) {
      await modifyWordBank(action.addWord, false, true).catch((error) => {
        Logger.error(`Failed to add "${action.addWord}" to Word Bank.`, error);
        req.session.error = error;
        return res.redirect("back");
      });
      client.twitch.wordBank.blocked.push(action.addWord);
      req.session.success = action.addWord + " was added to Word Bank.";
      return res.redirect("back");
    } else {
      req.session.error = action.addWord + " is already in the Word Bank.";
      return res.redirect("back");
    }
  }
  req.session.error = "What are you trying to do?";
  return res.redirect("back");
});

app.get("/stream", (req: any, res, next) => {
  if (!botRunning || !client) {
    req.session.error = "Token is invalid, acquire a new one.";
    res.redirect("token");
    return;
  }
  const liveData = client.twitch.stream_data;
  const streamDataLength =
    Object.keys(liveData.subs).length +
    Object.keys(liveData.gifters).length +
    Object.keys(liveData.cheerers).length +
    Object.keys(liveData.raiders).length +
    Object.keys(liveData.reSubs).length +
    Object.keys(liveData.binxRaids).length;
  const liveStatus = client.twitch.stream ? "online" : "offline";
  const stream = client.twitch.stream;
  let uptime = `${new Date().valueOf()}`;
  let startTimeRaw = new Date().valueOf();
  if (stream) {
    stream.started_at = new Date(stream.started_at).toLocaleTimeString("en-US");
    uptime = humanizeMS(Date.now() - new Date(stream.started_at).valueOf());
    startTimeRaw = new Date(stream.started_at).valueOf();
  }

  res.render("stream", {
    user,
    streamData: liveData,
    stream,
    streamDataLength,
    liveStatus,
    uptime,
    viewerList,
    startTimeRaw,
  });
});

app.post("/save", async (req: any, res) => {
  const inputs = req.body;
  await saveConfig({
    owner_login: inputs.owner_login,
    bot_login: inputs.bot_login,
    channel_to_moderate: inputs.channel_to_moderate,
    client_id: inputs.client_id,
    client_secret: inputs.client_secret,
  }).catch((err) => {
    req.session.error = "Failed to Save your setting, Please try again.";
    return;
  });
  req.session.success = "Configuration has been saved.";
  if (
    inputs.client_id !== bot_settings.client_id ||
    inputs.client_secret !== bot_settings.client_secret ||
    inputs.channel_to_moderate !== bot_settings.channel_to_moderate
  ) {
    if (client && botRunning) {
      client.destroy({
        name: "Configuration has been changed",
        message: "Client is shutting down",
      });
      // client = undefined;
    }

    req.session.success =
      "Configuration has been saved.\nPlease authorize a new token with your new config settings";
    bot_settings = inputs;
    res.redirect("/token");
    return;
  }
  bot_settings = inputs;

  return res.redirect("back");
});
app.get("/viewer", async (req: any, res) => {
  if (!isValidToken) {
    req.session.error = "Token is invalid, acquire a new one.";
    res.redirect("token");
    return;
  }
  if (!req.query.username)
    return res.render("error", { message: "Invalid Request", status: 500 });
  try {
    const userAPI = await client!.twitch.api.getUsers({
      logins: [req.query.username],
      token: client!.twitch.auth.api.access_token,
    });
    const ageHumanized = humanizeMS(
      Date.now() - new Date(userAPI[0].created_at).valueOf()
    );
    res.render("userInfo", { userAPI: userAPI[0], ageHumanized, user });
  } catch (err) {
    Logger.error(err);
  }
});
app.post("/token", async (req: any, res) => {
  const token = req.query.access_token;
  const response = await axios.get("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: "Bearer " + token,
    },
    responseType: "json",
  });
  if (response.data.login != bot_settings.bot_login) {
    const err = {
      message: `Open ${process.env.REDIRECT_URI} in a Private Tab and log in with the Bot Account`,
      status: "Whoops: Incorrect Login.",
    };

    res.render("error", err);
    return;
  }
  isValidToken = true;
  tokens = { ...response.data, access_token: token };

  if (!botRunning) {
    client = new TwitchBot(token);
    client.twitch.auth.tmi.access_token = token;
    await startBot(client);
  }
  if (!user) {
    const userAPI = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Accept: "application/json",
        "Client-ID": bot_settings.client_id,
        Authorization: "Bearer " + token,
      },
      responseType: "json",
    });
    user = userAPI.data.data[0] as TwitchUser;
    botInfo = userAPI.data[0] as TwitchUser;
    if (client) client!.twitch.bot = userAPI.data[0] as TwitchUser;
  }
  await saveAccessToken({
    access_token: tokens.access_token,
    expires: response.data.expires,
    scopes: response.data.scopes,
  });
  await saveUserData(user.id, user);

  if (user.id == "") return res.redirect("/token");
  res.redirect("stream");
});

app.route("/config").get((req, res) => {
  res.render("config", { user, bot_settings });
});

app.route("/chat").get((req, res) => {
  res.render("chat", {
    user,
    unModded,
    channel: bot_settings.channel_to_moderate,
    parent: process.env
      .REDIRECT_URI!.replace("/token", "")
      .replace("http://", "")
      .replace(":8000", ""),
  });
});

app.route("/token").get((req: any, res: Response) => {
  if (tokens.access_token) {
    axios
      .get("https://id.twitch.tv/oauth2/validate", {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
        responseType: "json",
      })
      .then(async (response) => {
        if (response.data.login != bot_settings.bot_login) {
          const err = {
            message: `Open ${process.env.REDIRECT_URI} in a Private Tab and log in with the Bot Account`,
            status: "Incorrect Login.",
          };
          req.session.token = "";
          tokenInfo = {
            client_id: "",
            login: "",
            user_id: "",
            expires_in: 0,
            scopes: [],
          };
          res.render("error", err);
          return;
        }
        isValidToken = true;
        req.session.success = "Token Is Valid";
        tokenInfo = response.data;
      })
      .catch((err) => {
        isValidToken = false;
        // res.render("error", err);
        return;
      });
  }
  req.session.state = crypto.randomBytes(16).toString("base64");
  res.render("token", {
    user,
    client_id: bot_settings.client_id,
    redirect_uri: process.env.REDIRECT_URI,
    state: state,
    tokenInfo,
    scopes: JSON.parse(
      `${fs.readFileSync(path.join(__dirname, "../www/scopes.json"))} `
    ),
  });
});
app.route("/filtering").get((req: any, res) => {
  if (client) {
    const badWords = client.twitch.wordBank.blocked;
    res.render("filtering", { user, badWords, viewerList });
  } else res.redirect("/token");
});

app.route("/logout").get((req: any, res) => {
  Logger.info("Logging Out");
  isValidToken = false;
  if (client) {
    client.destroy();

    client.close();
    client = undefined;
  }
  user = undefined;
  req.session.success = `${bot_settings.bot_login} has left chat`;
  if (tokens.access_token.length == 0) {
    res.redirect("/token");
    return Logger.info("No Token to Revoke");
  }

  axios
    .post(
      "https://id.twitch.tv/oauth2/revoke" +
        "?client_id=" +
        bot_settings.client_id +
        "&token=" +
        tokens.access_token
    )

    .then((resp: AxiosResponse) => {
      req.session.success = "Log Out Successful Token has been disabled";
      Logger.info("Token has been disabled", JSON.stringify(resp.data));
    })
    .catch((err: AxiosError) => {
      req.session.error = "Log Out Unsuccessful: Error revoking token";
      Logger.error("Error revoking token", err);
    });

  res.redirect("/token");
});
app.use(function (req, res, next) {
  new Error("Not Found");
  const err = { message: "Not Found", status: 404 };
  next(err);
});

app.use(function (err: any, req: any, res: any, next: any) {
  res.status(err.status || 500);
  res.render("error", {
    user,
    message: err.message.replace(__dirname, ""),
    status: err.status,
  });
});

function loadAccessToken() {
  getSavedAccessToken().then((db) => {
    if (db.length == 0) return;
    Logger.info("Checking Token Status...");
    return db.map((data: any) => {
      axios
        .get("https://id.twitch.tv/oauth2/validate", {
          headers: {
            Authorization: "Bearer " + data.value.access_token,
          },
          responseType: "json",
        })
        .then(async (response: any) => {
          isValidToken = true;
          tokens = { ...response.data, access_token: data.value.access_token };
          await getUserData()
            .then((db) => {
              if (db.length == 0) return;
              return db.map(() => {
                axios
                  .get("https://api.twitch.tv/helix/users", {
                    headers: {
                      Accept: "application/json",
                      "Client-ID": bot_settings.client_id,
                      Authorization: "Bearer " + data.value.access_token,
                    },
                    responseType: "json",
                  })
                  .then((response) => {
                    user = response.data.data[0];
                  })
                  .catch((error) =>
                    Logger.error("Failed to fetch data:", error)
                  );
              });
            })
            .catch((error) =>
              Logger.error(`Failed to fetch User from DB:`, error)
            );
          if (!botRunning) {
            client = new TwitchBot(data.value.access_token);
            client.twitch.auth.tmi = tokens;
            Logger.info("Saved Token is Valid Auto Starting Mod-Bot");
            await startBot(client);
          }
        })
        .catch((error) => {
          isValidToken = false;
          Logger.warn("Stored Token is Invalid, Login to request a new Token");
        });
    });
  });
}
